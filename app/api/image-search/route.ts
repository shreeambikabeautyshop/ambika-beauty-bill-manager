import { NextRequest, NextResponse } from "next/server";
import { identifyProductFromImage } from "@/lib/gemini";
import { createServiceClient } from "@/lib/supabase";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const fd    = await req.formData();
    const image = fd.get("image") as File | null;
    if (!image) return NextResponse.json({ error: "No image" }, { status: 400 });

    const bytes  = await image.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mime   = image.type;

    // Identify product using Gemini Vision
    const identified = await identifyProductFromImage(base64, mime);
    if (!identified) return NextResponse.json({ error: "Could not identify product" }, { status: 422 });

    // Search in DB
    const db = createServiceClient();
    const { data } = await db
      .from("products")
      .select("*")
      .ilike("name", `%${identified.split(" ")[0]}%`)
      .limit(10);

    // If nothing found, try with each word
    let products = data || [];
    if (!products.length) {
      const words = identified.split(" ").filter(w => w.length > 3);
      for (const w of words) {
        const { data: d } = await db.from("products").select("*").ilike("name", `%${w}%`).limit(10);
        if (d?.length) { products = d; break; }
      }
    }

    return NextResponse.json({ identified, products });

  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
