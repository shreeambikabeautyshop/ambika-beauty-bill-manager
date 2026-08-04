"use client";
import { useState, useEffect } from "react";
import { Package, Search, Filter, TrendingUp, X } from "lucide-react";
import { cn, formatCurrency, getDiscountBadgeStyle } from "@/lib/utils";
import type { Product } from "@/types";

const DISC_FILTERS = [
  { label: "All",    min: 0,  max: 100 },
  { label: "50%+",   min: 50, max: 100 },
  { label: "40-50%", min: 40, max: 50  },
  { label: "30-40%", min: 30, max: 40  },
  { label: "<30%",   min: 0,  max: 30  },
];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [discF,    setDiscF]    = useState(0);
  const [sortBy,   setSortBy]   = useState<"name"|"mrp"|"disc"|"amount">("name");
  const [sortDir,  setSortDir]  = useState<"asc"|"desc">("asc");

  useEffect(() => {
    fetch("/api/search?q=&all=1")
      .then(r => r.json())
      .then(d => { setProducts(d.products||[]); setFiltered(d.products||[]); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const f = DISC_FILTERS[discF];
    let data = products.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) &&
      p.disc >= f.min && p.disc < (f.max === 100 ? 101 : f.max)
    );
    data = [...data].sort((a, b) => {
      const aV = a[sortBy] as string|number;
      const bV = b[sortBy] as string|number;
      const cmp = typeof aV === "string" ? aV.localeCompare(bV as string) : (aV as number) - (bV as number);
      return sortDir === "asc" ? cmp : -cmp;
    });
    setFiltered(data);
  }, [search, discF, sortBy, sortDir, products]);

  const totalAmount = filtered.reduce((s, p) => s + p.amount, 0);

  function toggleSort(col: typeof sortBy) {
    if (sortBy === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("asc"); }
  }

  const SortIcon = ({ col }: { col: typeof sortBy }) =>
    sortBy === col ? <span className="text-brand-400">{sortDir === "asc" ? "↑" : "↓"}</span> : null;

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-white">All Products</h2>
          <p className="text-sm text-slate-500 mt-1">Complete product database from all bills</p>
        </div>
        <div className="flex items-center gap-2 card-base py-2 px-4">
          <TrendingUp className="w-4 h-4 text-gold-400" />
          <span className="text-sm font-semibold text-white">{formatCurrency(totalAmount)}</span>
          <span className="text-xs text-slate-500">total value</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Filter products..." className="input-base w-full pl-9" />
          {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"><X className="w-3.5 h-3.5"/></button>}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-slate-500" />
          {DISC_FILTERS.map((f, i) => (
            <button key={f.label} onClick={() => setDiscF(i)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                discF === i ? "bg-brand-600 text-white" : "bg-surface-hover text-slate-400 hover:text-white")}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span>Showing <b className="text-white">{filtered.length}</b> of {products.length} products</span>
      </div>

      {/* Table */}
      <div className="card-base p-0 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-16 text-center">
              <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-slate-500">Loading products...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-16 text-center">
              <Package className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500">No products found</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Sr</th>
                  <th className="cursor-pointer" onClick={() => toggleSort("name")}>Product <SortIcon col="name" /></th>
                  <th>Qty</th>
                  <th className="cursor-pointer" onClick={() => toggleSort("mrp")}>MRP <SortIcon col="mrp" /></th>
                  <th>Rate</th>
                  <th className="cursor-pointer" onClick={() => toggleSort("disc")}>Disc% <SortIcon col="disc" /></th>
                  <th className="cursor-pointer" onClick={() => toggleSort("amount")}>Amount <SortIcon col="amount" /></th>
                  <th>Bill</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr key={i}>
                    <td className="text-slate-600 text-xs">{p.sr}</td>
                    <td className="font-medium text-white max-w-xs">
                      <div className="truncate" title={p.name}>{p.name}</div>
                    </td>
                    <td>
                      <span className="bg-slate-700/60 text-slate-300 text-xs px-2 py-0.5 rounded-md">{p.qty}</span>
                    </td>
                    <td className="text-slate-400">₹{p.mrp}</td>
                    <td className="text-violet-300 font-semibold">₹{p.rate}</td>
                    <td>
                      <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full border", getDiscountBadgeStyle(p.disc))}>
                        {p.disc}%
                      </span>
                    </td>
                    <td className="font-semibold text-white">{formatCurrency(p.amount)}</td>
                    <td className="text-slate-600 text-xs">{p.bill_id ? "✓" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
