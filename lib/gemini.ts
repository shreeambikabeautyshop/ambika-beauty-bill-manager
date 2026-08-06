import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Bill, Product, VerifyResult, BillVerification } from "@/types";

function getGenAI() {
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
}

// Try models in order — use first available
const MODEL_PRIORITY = [
  "gemini-1.5-flash",
  "gemini-1.5-flash-001",
  "gemini-pro-vision",
];

async function callGeminiWithFallback(
  parts: Array<string | { inlineData: { data: string; mimeType: string } }>
): Promise<string> {
  const genAI = getGenAI();
  let lastError: Error | null = null;

  for (const modelName of MODEL_PRIORITY) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { temperature: 0.1, maxOutputTokens: 8192 },
      });
      const result = await model.generateContent(parts);
      return result.response.text().trim();
    } catch (e: unknown) {
      lastError = e instanceof Error ? e : new Error(String(e));
      const msg = lastError.message || "";
      // If model not found, try next — otherwise throw immediately
      if (!msg.includes("404") && !msg.includes("not found") && !msg.includes("not supported")) {
        throw lastError;
      }
    }
  }
  throw lastError ?? new Error("All Gemini models failed");
}

const EXTRACT_PROMPT = `You are an expert at reading cosmetic wholesale bill images.
Extract ALL product rows and return ONLY valid JSON (no markdown, no extra text):

{"bill_no":"XXXX","bill_date":"DD/MM/YYYY","supplier_name":"Name","products":[{"sr":1,"name":"PRODUCT NAME","qty":2,"mrp":500,"rate":300.50,"disc":40,"amount":601.00}]}

Rules:
- sr=serial number, name=full product name, qty=quantity
- mrp=MRP price, rate=selling rate, disc=discount%, amount=total line amount
- Extract EVERY row without skipping any
- Return numbers as numbers not strings`;

const VERIFY_PROMPT = `You are a bill verification expert. Analyze and return a 2-3 sentence summary.`;

/** Extract products from a bill image using Gemini Vision */
export async function extractBillFromImage(
  imageBase64: string,
  mimeType: string
): Promise<{ bill: Partial<Bill>; products: Product[] }> {
  const text = await callGeminiWithFallback([
    EXTRACT_PROMPT,
    { inlineData: { data: imageBase64, mimeType } },
  ]);

  const clean = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  const start = clean.indexOf("{");
  const end   = clean.lastIndexOf("}");
  if (start === -1) throw new Error("Gemini returned no JSON. Response: " + clean.slice(0, 200));

  const json = JSON.parse(clean.substring(start, end + 1));

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
      bill_no:       json.bill_no    || "UNKNOWN",
      bill_date:     json.bill_date  || new Date().toLocaleDateString("en-IN"),
      supplier_name: json.supplier_name || "Unknown",
      total_qty:     totalQty,
      total_amount:  Math.round(totalAmount * 100) / 100,
    },
    products,
  };
}

/** Identify a product from its image */
export async function identifyProductFromImage(
  imageBase64: string,
  mimeType: string
): Promise<string> {
  const text = await callGeminiWithFallback([
    "Read the product name and brand from this cosmetic product image. Return ONLY the product name — nothing else. No explanation.",
    { inlineData: { data: imageBase64, mimeType } },
  ]);
  return text.replace(/['"]/g, "").trim();
}

/** Generate AI summary for bill verification */
export async function generateVerificationSummary(
  products: VerifyResult[]
): Promise<string> {
  const discrepancies = products.filter(p => !p.disc_match || !p.amount_match);
  const totalLoss     = products.reduce((s, p) => s + (p.loss || 0), 0);

  const context = `Bill: ${products.length} products, ${discrepancies.length} errors, Loss: Rs.${totalLoss.toFixed(2)}. Wrong: ${discrepancies.slice(0,3).map(p=>p.name).join(", ")}`;

  try {
    return await callGeminiWithFallback([VERIFY_PROMPT + "\n" + context]);
  } catch {
    return `Verified ${products.length} products. Found ${discrepancies.length} error(s). Total loss identified: ₹${totalLoss.toFixed(2)}.`;
  }
}

/** Verify bill products — calculate and cross-check */
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
    results,
    summary: "",
  };
}
