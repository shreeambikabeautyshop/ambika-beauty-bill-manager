import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/** Smart product search suggestions using Groq */
export async function getSearchSuggestions(
  query: string,
  productNames: string[]
): Promise<string[]> {
  if (!query || productNames.length === 0) return [];

  const nameList = productNames.slice(0, 150).join(", ");
  const prompt   = `From this product list: ${nameList}
Find products matching the search query: "${query}"
Return ONLY a JSON array of matching product names (max 8): ["name1","name2"]
Consider partial matches, brand names, and common abbreviations.`;

  const completion = await groq.chat.completions.create({
    model:       "llama-3.3-70b-versatile",
    messages:    [{ role: "user", content: prompt }],
    temperature: 0.1,
    max_tokens:  512,
  });

  const text = completion.choices[0]?.message?.content || "[]";
  const clean = text.replace(/```.*?```/gs, "").trim();
  const start = clean.indexOf("[");
  const end   = clean.lastIndexOf("]");
  if (start === -1) return [];
  return JSON.parse(clean.substring(start, end + 1));
}

/** Analyze bill text extracted from PDF */
export async function analyzeBillText(rawText: string): Promise<{
  bill_no: string;
  bill_date: string;
  supplier_name: string;
  products: Array<{
    sr: number; name: string; qty: number;
    mrp: number; rate: number; disc: number; amount: number;
  }>;
}> {
  const prompt = `Parse this cosmetic wholesale bill text (tab-separated).
Row format: Sr | Product Name | Qty | MRP | (skip) | Rate | Disc% | Amount

Return ONLY valid JSON (no markdown):
{"bill_no":"XXXX","bill_date":"DD/MM/YYYY","supplier_name":"Name","products":[{"sr":1,"name":"NAME","qty":1,"mrp":100,"rate":60,"disc":40,"amount":60}]}

Bill text:
${rawText.slice(0, 6000)}`;

  const completion = await groq.chat.completions.create({
    model:       "llama-3.3-70b-versatile",
    messages:    [{ role: "user", content: prompt }],
    temperature: 0.1,
    max_tokens:  8192,
  });

  const text  = completion.choices[0]?.message?.content || "";
  const clean = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  const start = clean.indexOf("{");
  const end   = clean.lastIndexOf("}");
  return JSON.parse(clean.substring(start, end + 1));
}
