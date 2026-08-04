import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Bill, Product, VerifyResult, BillVerification } from "@/types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const EXTRACT_PROMPT = `You are an expert at reading cosmetic wholesale bill images.
Extract ALL product rows from this bill and return ONLY valid JSON (no markdown, no explanation):

{
  "bill_no": "XXXX",
  "bill_date": "DD/MM/YYYY",
  "supplier_name": "Supplier Name if visible",
  "products": [
    {"sr": 1, "name": "PRODUCT NAME", "qty": 2, "mrp": 500, "rate": 300.50, "disc": 40, "amount": 601.00}
  ]
}

Rules:
- sr = serial number
- name = full product name
- qty = quantity ordered
- mrp = Maximum Retail Price
- rate = actual charged rate (selling rate to retailer)
- disc = discount percentage shown
- amount = total line amount (rate × qty)
- Extract EVERY single product row without missing any
- Return numbers as numbers, not strings`;

const VERIFY_PROMPT = `You are a bill verification expert for cosmetic wholesale business.
Analyze this bill data and check:
1. Is disc% correct? Formula: ((MRP - Rate) / MRP × 100)
2. Is Amount correct? Formula: Rate × Qty
3. Are there any pricing errors or suspicious discrepancies?

Return a brief professional summary in 3-4 sentences highlighting key findings.`;

/** Extract products from a bill image using Gemini Vision */
export async function extractBillFromImage(
  imageBase64: string,
  mimeType: string
): Promise<{ bill: Partial<Bill>; products: Product[] }> {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const result = await model.generateContent([
    EXTRACT_PROMPT,
    { inlineData: { data: imageBase64, mimeType } },
  ]);

  const text = result.response.text().trim()
    .replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

  const start = text.indexOf("{");
  const end   = text.lastIndexOf("}");
  const json  = JSON.parse(text.substring(start, end + 1));

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
      bill_no:       json.bill_no || "UNKNOWN",
      bill_date:     json.bill_date || new Date().toLocaleDateString("en-IN"),
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
  const model  = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await model.generateContent([
    "Read the product name and brand from this cosmetic product image. Return ONLY the product name — nothing else.",
    { inlineData: { data: imageBase64, mimeType } },
  ]);
  return result.response.text().trim().replace(/['"]/g, "");
}

/** Generate AI summary for bill verification */
export async function generateVerificationSummary(
  products: VerifyResult[]
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const discrepancies = products.filter(p => !p.disc_match || !p.amount_match);
  const totalLoss     = products.reduce((s, p) => s + (p.loss || 0), 0);

  const context = `
Bill has ${products.length} products.
Discrepancies found: ${discrepancies.length}
Total financial loss identified: ₹${totalLoss.toFixed(2)}
Products with wrong discount: ${products.filter(p => !p.disc_match).map(p => p.name).slice(0, 5).join(", ")}
`;

  const result = await model.generateContent(VERIFY_PROMPT + "\n\n" + context);
  return result.response.text().trim();
}

/** Verify bill products — calculate and cross-check */
export function verifyBillProducts(products: Product[]): BillVerification {
  const results: VerifyResult[] = products.map(p => {
    const calcDisc   = p.mrp > 0 ? Math.round(((p.mrp - p.rate) / p.mrp) * 10000) / 100 : 0;
    const calcAmount = Math.round(p.rate * p.qty * 100) / 100;
    const discMatch  = Math.abs(calcDisc - p.disc) < 0.15;
    const amtMatch   = Math.abs(calcAmount - p.amount) < 0.02;

    return {
      sr:          p.sr,
      name:        p.name,
      qty:         p.qty,
      mrp:         p.mrp,
      rate:        p.rate,
      bill_disc:   p.disc,
      calc_disc:   calcDisc,
      disc_match:  discMatch,
      bill_amount: p.amount,
      calc_amount: calcAmount,
      amount_match: amtMatch,
      loss: !discMatch ? Math.abs(calcDisc - p.disc) / 100 * p.mrp * p.qty : 0,
    };
  });

  const discrepancies = results.filter(r => !r.disc_match || !r.amount_match).length;
  const totalLoss     = results.reduce((s, r) => s + (r.loss || 0), 0);
  const totalAmount   = products.reduce((s, p) => s + p.amount, 0);

  return {
    bill_no:        "",
    bill_date:      "",
    total_products: products.length,
    total_amount:   totalAmount,
    discrepancies,
    total_loss:     Math.round(totalLoss * 100) / 100,
    results,
    summary:        "",
  };
}
