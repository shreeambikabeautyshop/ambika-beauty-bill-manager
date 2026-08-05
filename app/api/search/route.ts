import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { getSearchSuggestions } from "@/lib/groq";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const sp      = req.nextUrl.searchParams;
  const q       = sp.get("q") || "";
  const suggest = sp.get("suggest") === "1";
  const all     = sp.get("all") === "1";
  const db      = createServiceClient();

  // Return all products
  if (all) {
    const { data, error } = await db
      .from("products")
      .select("*")
      .order("name");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ products: data || [] });
  }

  // Suggestions mode — use Groq AI
  if (suggest && q.length >= 2) {
    const { data } = await db.from("products").select("name").limit(200);
    const names = Array.from(new Set((data || []).map((r: { name: string }) => r.name)));
    try {
      const suggestions = await getSearchSuggestions(q, names);
      return NextResponse.json({ suggestions });
    } catch {
      // Fallback: simple filter
      const suggestions = names.filter(n => n.toLowerCase().includes(q.toLowerCase())).slice(0, 8);
      return NextResponse.json({ suggestions });
    }
  }

  // Full text search
  if (q) {
    const { data, error } = await db
      .from("products")
      .select("*")
      .ilike("name", `%${q}%`)
      .order("name")
      .limit(50);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ products: data || [], total: data?.length || 0 });
  }

  return NextResponse.json({ products: [] });
}
