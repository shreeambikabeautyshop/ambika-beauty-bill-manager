import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { cloudinary } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function DELETE(req: NextRequest) {
  try {
    const { bill_id, cloudinary_public_id } = await req.json();
    if (!bill_id) return NextResponse.json({ error: "bill_id required" }, { status: 400 });

    const db = createServiceClient();

    // Delete from Cloudinary if image exists
    if (cloudinary_public_id) {
      try {
        await cloudinary.uploader.destroy(cloudinary_public_id);
      } catch (e) {
        console.warn("Cloudinary delete failed (non-fatal):", e);
      }
    }

    // Delete products first (cascade should handle but explicit is safer)
    await db.from("products").delete().eq("bill_id", bill_id);

    // Delete bill
    const { error } = await db.from("bills").delete().eq("id", bill_id);
    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Delete failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
