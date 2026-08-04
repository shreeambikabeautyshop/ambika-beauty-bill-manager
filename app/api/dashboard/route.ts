import { NextResponse } from "next/server";
import { fetchDashboardStats } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET() {
  try {
    const stats = await fetchDashboardStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("dashboard error:", error);
    const message = error instanceof Error ? error.message : "Failed to load dashboard";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
