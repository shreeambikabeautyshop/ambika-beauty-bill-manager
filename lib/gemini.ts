import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Bill, Product, VerifyResult, BillVerification } from "@/types";

function getGenAI() {
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
}

const GEMINI_MODELS = [
  "gemini-1.5-flash",
  "gemini-1.5-flash-latest",
  "gemini-1.5-flash-001",
  "gemini-1.0-pro-vision-latest",
];

const EXTRACT_PROMPT = `You are an expert at reading cosmetic wholesale bill images.
Extract ALL product rows and return ONLY valid JSON (no markdown):

{"bill_no":"XXXX","bill_date":"DD/MM/YYYY","supplier_name":"Name","products":[{"sr":1,"name":"PRODUCT NAME","qty":2,"mrp":500,"rate":300.50,"disc":40,"amount":601.00}]}

Rules: sr=serial number, name=full product name, qty=quantity, mrp=MRP price, rate=selling rate, disc=discount%, amount=line total. Extract EVERY row. Numbers must be numbers not strings.`;

// ── Gemini with model fallback ─────────────────────────────────────────────
async function tryGemini(
  parts: Array<string | { inlineData: { data: string; mimeType: string } }>
): Promise<string> {
  const genAI = getGenAI();
  let lastErr: Error | null = null;
  for (const modelName of GEMINI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { temperature: 0.1, maxOutputTokens: 8192 },
      });
      const result = await model.generateContent(parts);
      return result.response.text().trim();
    } catch (e: unknown) {
      lastErr = e instanceof Error ? e : new Error(String(e));
      const msg = lastErr.message || "";
      // Only retry on "model not found" errors
      if (!msg.includes("404") && !msg.includes("not found") && !msg.includes("not supported") && !msg.includes("API version")) {
        throw lastErr;
      }
    }
  }
  throw lastErr ?? new Error("All Gemini models failed");
}

// ── Groq fallback for image (converts image to base64 text description) ────
async function tryGroqFallback(
  imageBase64: string,
  mimeType: string
): Promise<string> {
  // Groq llama can process images via vision
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Extract ALL product rows from this wholesale bill image and return ONLY valid JSON:
{"bill_no":"XXXX","bill_date":"DD/MM/YYYY","supplier_name":"Name","products":[{"sr":1,"name":"PRODUCT NAME","qty":2,"mrp":500,"rate":300.50,"disc":40,"amount":601.00}]}
Return numbers as numbers. Extract every single row.`,
            },
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${imageBase64}` },
            },
          ],
        },
      ],
      temperature: 0.1,
      max_tokens: 8192,
    }),
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq failed: ${err.slice(0, 200)}`);
  }
  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

// ── Parse JSON from AI response ───────────────────────────────────────────
function parseJSON(text: string): { bill_no: string; bill_date: string; supplier_name: string; products: Product[] } {
  const clean = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  const start = clean.indexOf("{");
  const end   = clean.lastIndexOf("}");
  if (start === -1) throw new Error("No JSON in response. Got: " + clean.slice(0, 300));
  return JSON.parse(clean.substring(start, end + 1));
}

// ── Main: Extract bill from image (Gemini → Groq fallback) ───────────────
export async function extractBillFromImage(
  imageBase64: string,
  mimeType: string
): Promise<{ bill: Partial<Bill>; products: Product[] }> {
  let rawText = "";

  // Try Gemini first
  try {
    rawText = await tryGemini([
      EXTRACT_PROMPT,
      { inlineData: { data: imageBase64, mimeType } },
    ]);
  } catch (geminiErr) {
    console.warn("Gemini failed, trying Groq:", geminiErr instanceof Error ? geminiErr.message : geminiErr);
    // Fallback to Groq
    rawText = await tryGroqFallback(imageBase64, mimeType);
  }

  const json = parseJSON(rawText);

  const products: Product[] = (json.products || []).map((p: Product) => ({
    sr:     Number(p.sr)     || 0,
    name:   String(p.name)   || "",
    qty:    Number(p.qty)    || 0,
    mrp:    Number(p.mrp)    || 0,
    rate:   Number(p.rate)   || 0,
    disc:   Number(p.disc)   || 0,
    amount: Number(p.amount) || 0,
  }));

  const totalQty    = products.reduce((s, p) => s + p.qty, 0);
  const totalAmount = products.reduce((s, p) => s + p.amount, 0);

  return {
    bill: {
      bill_no:       json.bill_no       || "UNKNOWN",
      bill_date:     json.bill_date     || new Date().toLocaleDateString("en-IN"),
      supplier_name: json.supplier_name || "Unknown",
      total_qty:     totalQty,
      total_amount:  Math.round(totalAmount * 100) / 100,
    },
    products,
  };
}

// ── Identify product from image ───────────────────────────────────────────
export async function identifyProductFromImage(
  imageBase64: string,
  mimeType: string
): Promise<string> {
  const prompt = "Read the product name and brand from this cosmetic product image. Return ONLY the product name — nothing else.";
  try {
    const text = await tryGemini([prompt, { inlineData: { data: imageBase64, mimeType } }]);
    return text.replace(/['"]/g, "").trim();
  } catch {
    // Groq fallback for product identification
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [{ role: "user", content: [
          { type: "text", text: "What is the product name shown in this image? Return ONLY the product name." },
          { type: "image_url", image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
        ]}],
        temperature: 0.1, max_tokens: 100,
      }),
    });
    const data = await res.json();
    return (data.choices?.[0]?.message?.content || "").replace(/['"]/g, "").trim();
  }
}

// ── Generate verification summary ─────────────────────────────────────────
export async function generateVerificationSummary(results: VerifyResult[]): Promise<string> {
  const wrong     = results.filter(r => !r.disc_match || !r.amount_match);
  const totalLoss = results.reduce((s, r) => s + (r.loss || 0), 0);
  const ctx = `${results.length} products checked. ${wrong.length} errors found. Total loss: Rs.${totalLoss.toFixed(2)}.`;

  try {
    return await tryGemini([`Summarize this bill verification in 2 sentences: ${ctx}`]);
  } catch {
    // Groq text fallback
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: `Summarize in 2 sentences: ${ctx}` }],
        temperature: 0.1, max_tokens: 150,
      }),
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content || ctx;
  }
}

// ── Verify products math ───────────────────────────────────────────────────
export function verifyBillProducts(products: Product[]): BillVerification {
  const results: VerifyResult[] = products.map(p => {
    const calcDisc   = p.mrp > 0 ? Math.round(((p.mrp - p.rate) / p.mrp) * 10000) / 100 : 0;
    const calcAmount = Math.round(p.rate * p.qty * 100) / 100;
    const discMatch  = Math.abs(calcDisc - p.disc) < 0.15;
    const amtMatch   = Math.abs(calcAmount - p.amount) < 0.02;
    return {
      sr: p.sr, name: p.name, qty: p.qty, mrp: p.mrp, rate: p.rate,
      bill_disc: p.disc, calc_disc: calcDisc, disc_match: discMatch,
      bill_amount: p.amount, calc_amount: calcAmount, amount_match: amtMatch,
      loss: !discMatch ? Math.abs(calcDisc - p.disc) / 100 * p.mrp * p.qty : 0,
    };
  });
  return {
    bill_no: "", bill_date: "",
    total_products: products.length,
    total_amount:   products.reduce((s, p) => s + p.amount, 0),
    discrepancies:  results.filter(r => !r.disc_match || !r.amount_match).length,
    total_loss:     Math.round(results.reduce((s, r) => s + (r.loss || 0), 0) * 100) / 100,
    results, summary: "",
  };
}
