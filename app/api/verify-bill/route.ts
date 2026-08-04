import { NextRequest, NextResponse } from "next/server";
import { extractBillFromImage, verifyBillProducts, generateVerificationSummary } from "@/lib/gemini";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const fd   = await req.formData();
    const file = fd.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

    const bytes  = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mime   = file.type;

    // Step 1: Extract products from bill image
    const { bill, products } = await extractBillFromImage(base64, mime);

    // Step 2: Verify each product
    const verification = verifyBillProducts(products);
    verification.bill_no   = bill.bill_no   || "—";
    verification.bill_date = bill.bill_date || "—";

    // Step 3: Generate AI summary
    try {
      verification.summary = await generateVerificationSummary(verification.results);
    } catch {
      verification.summary = `Verified ${verification.total_products} products. Found ${verification.discrepancies} discrepancy(ies). Total estimated loss: ₹${verification.total_loss.toFixed(2)}.`;
    }

    return NextResponse.json(verification);

  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Verification failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
