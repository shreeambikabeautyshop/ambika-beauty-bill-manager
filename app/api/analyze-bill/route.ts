import { NextRequest, NextResponse } from "next/server";
import { extractBillFromImage } from "@/lib/gemini";
import { uploadBillImage } from "@/lib/cloudinary";
import { createServiceClient } from "@/lib/supabase";
import type { Product, Bill } from "@/types";

export const dynamic   = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const ct = req.headers.get("content-type") || "";

    // ── Save action (JSON body) ────────────────────────────────────────────
    if (ct.includes("application/json")) {
      const body = await req.json();
      if (body.action === "save") {
        return await saveBillToDB(body.bill, body.products);
      }
    }

    // ── Analyze action (multipart) ─────────────────────────────────────────
    const fd   = await req.formData();
    const file = fd.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const bytes    = await file.arrayBuffer();
    const buffer   = Buffer.from(bytes);
    const base64   = buffer.toString("base64");
    const mime     = file.type;

    // Extract bill data using Gemini
    const { bill, products } = await extractBillFromImage(base64, mime);

    // Upload to Cloudinary (fire and forget metadata, return URL)
    let imageUrl   = "";
    let publicId   = "";
    let folder     = "";
    try {
      const uploaded = await uploadBillImage(
        buffer,
        bill.bill_no || "unknown",
        bill.bill_date || new Date().toLocaleDateString("en-IN"),
        mime
      );
      imageUrl = uploaded.url;
      publicId = uploaded.public_id;
      folder   = uploaded.folder;
    } catch (e) {
      console.error("Cloudinary upload failed:", e);
      // Non-fatal — continue without image URL
    }

    return NextResponse.json({
      bill:     { ...bill, image_url: imageUrl, cloudinary_public_id: publicId, folder_path: folder },
      products,
    });

  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

async function saveBillToDB(bill: Partial<Bill>, products: Product[]) {
  const db = createServiceClient();

  // Insert bill
  const { data: billRow, error: billErr } = await db
    .from("bills")
    .insert({
      bill_no:              bill.bill_no,
      bill_date:            convertDate(bill.bill_date || ""),
      supplier_name:        bill.supplier_name || "Unknown",
      total_qty:            bill.total_qty || 0,
      total_amount:         bill.total_amount || 0,
      image_url:            bill.image_url || null,
      cloudinary_public_id: bill.cloudinary_public_id || null,
      folder_path:          bill.folder_path || null,
    })
    .select()
    .single();

  if (billErr) return NextResponse.json({ error: billErr.message }, { status: 500 });

  // Insert products
  const rows = products.map(p => ({ ...p, bill_id: billRow.id }));
  const { error: prodErr } = await db.from("products").insert(rows);
  if (prodErr) return NextResponse.json({ error: prodErr.message }, { status: 500 });

  return NextResponse.json({ success: true, bill_id: billRow.id });
}

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get("action");
  if (action === "list") {
    const db = createServiceClient();
    const { data, error } = await db
      .from("bills")
      .select("*")
      .order("bill_date", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ bills: data });
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

/** Convert DD/MM/YYYY → YYYY-MM-DD for Supabase */
function convertDate(d: string): string {
  if (!d) return new Date().toISOString().split("T")[0];
  if (d.includes("/")) {
    const [day, month, year] = d.split("/");
    return `${year}-${month.padStart(2,"0")}-${day.padStart(2,"0")}`;
  }
  return d;
}
