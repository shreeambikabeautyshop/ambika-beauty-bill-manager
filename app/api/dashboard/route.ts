import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const db = createServiceClient();

    const [billsRes, productsRes] = await Promise.all([
      db.from("bills").select("id, total_amount, bill_date").order("bill_date", { ascending: false }),
      db.from("products").select("id", { count: "exact", head: true }),
    ]);

    const bills        = billsRes.data  || [];
    const totalBills   = bills.length;
    const totalAmount  = bills.reduce((s: number, b: { total_amount: number }) => s + (b.total_amount || 0), 0);
    const totalProducts= productsRes.count || 0;
    const latestDate   = bills[0]?.bill_date || null;

    return NextResponse.json({
      total_bills:            totalBills,
      total_products:         totalProducts,
      total_amount:           totalAmount,
      total_loss_identified:  0,
      latest_bill_date:       latestDate,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
