"use client";
import { useState, useEffect } from "react";
import { Package, Search, X, SlidersHorizontal } from "lucide-react";
import { cn, formatCurrency, getDiscountBadgeStyle } from "@/lib/utils";
import type { Product } from "@/types";

const DISC_FILTERS = [
  { label: "All",  min: 0,  max: 101 },
  { label: "50%+", min: 50, max: 101 },
  { label: "40%+", min: 40, max: 101 },
  { label: "30%+", min: 30, max: 101 },
  { label: "<30%", min: 0,  max: 30  },
];

export default function ProductsPage() {
  const [products, setProducts]= useState<Product[]>([]);
  const [filtered, setFiltered]= useState<Product[]>([]);
  const [loading,  setLoading] = useState(true);
  const [search,   setSearch]  = useState("");
  const [discF,    setDiscF]   = useState(0);
  const [sortBy,   setSortBy]  = useState<"name"|"mrp"|"disc"|"amount">("name");
  const [sortDir,  setSortDir] = useState<"asc"|"desc">("asc");
  const [showFilter,setShowFilter]= useState(false);

  useEffect(() => {
    fetch("/api/search?q=&all=1").then(r => r.json())
      .then(d => { setProducts(d.products||[]); setFiltered(d.products||[]); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const f = DISC_FILTERS[discF];
    let data = products.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) &&
      p.disc >= f.min && p.disc < f.max
    );
    data = [...data].sort((a, b) => {
      const aV = a[sortBy] as string|number, bV = b[sortBy] as string|number;
      const cmp = typeof aV === "string" ? aV.localeCompare(bV as string) : (aV as number)-(bV as number);
      return sortDir === "asc" ? cmp : -cmp;
    });
    setFiltered(data);
  }, [search, discF, sortBy, sortDir, products]);

  const total = filtered.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-3 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Products</h2>
          <p className="text-xs text-slate-500">{filtered.length} of {products.length} · {formatCurrency(total)}</p>
        </div>
        <button onClick={() => setShowFilter(!showFilter)} className={cn("btn-secondary px-3 py-2 text-xs", showFilter && "border-brand-500/50 text-white")}>
          <SlidersHorizontal className="w-3.5 h-3.5" />Filter
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search products..." className="input-base pl-9" />
        {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"><X className="w-3.5 h-3.5"/></button>}
      </div>

      {/* Filters */}
      {showFilter && (
        <div className="space-y-3 card-base p-3">
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Discount</p>
            <div className="flex flex-wrap gap-1.5">
              {DISC_FILTERS.map((f, i) => (
                <button key={f.label} onClick={() => setDiscF(i)}
                  className={cn("px-3 py-1 rounded-lg text-xs font-medium transition-all", discF === i ? "bg-brand-600 text-white" : "bg-surface-hover text-slate-400")}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Sort by</p>
            <div className="flex flex-wrap gap-1.5">
              {(["name","mrp","disc","amount"] as const).map(s => (
                <button key={s} onClick={() => { if(sortBy===s) setSortDir(d => d==="asc"?"desc":"asc"); else setSortBy(s); }}
                  className={cn("px-3 py-1 rounded-lg text-xs font-medium transition-all capitalize", sortBy===s ? "bg-brand-600 text-white" : "bg-surface-hover text-slate-400")}>
                  {s} {sortBy===s ? (sortDir==="asc"?"↑":"↓") : ""}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Products list */}
      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => <div key={i} className="h-20 rounded-2xl shimmer" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-base text-center py-16">
          <Package className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No products found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((p, i) => (
            <div key={i} className="card-base p-3 active:bg-surface-hover transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-surface-hover flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold text-slate-500">{p.sr}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white leading-snug">{p.name}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                    <span className="text-[11px] text-slate-500">MRP <b className="text-slate-400">₹{p.mrp}</b></span>
                    <span className="text-[11px] text-slate-500">Rate <b className="text-violet-300">₹{p.rate}</b></span>
                    <span className="text-[11px] text-slate-500">Qty <b className="text-slate-400">{p.qty}</b></span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", getDiscountBadgeStyle(p.disc))}>{p.disc}%</span>
                  <span className="text-xs font-bold text-white">{formatCurrency(p.amount)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
