"use client";
import { useState, useEffect, useRef } from "react";
import { Search, Camera, Loader2, Package, Upload, X } from "lucide-react";
import toast from "react-hot-toast";
import { cn, formatCurrency, getDiscountBadgeStyle } from "@/lib/utils";
import type { Product } from "@/types";

export default function SearchPage() {
  const [query,       setQuery]       = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [results,     setResults]     = useState<Product[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [imgLoading,  setImgLoading]  = useState(false);
  const [imgPreview,  setImgPreview]  = useState<string | null>(null);
  const [identified,  setIdentified]  = useState<string>("");
  const [showSug,     setShowSug]     = useState(false);
  const imgRef = useRef<HTMLInputElement>(null);
  const debounce = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (query.length < 2) { setSuggestions([]); return; }
    clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      const res  = await fetch("/api/search?q=" + encodeURIComponent(query) + "&suggest=1");
      const data = await res.json();
      setSuggestions(data.suggestions || []);
      setShowSug(true);
    }, 300);
  }, [query]);

  async function search(q = query) {
    if (!q.trim()) return;
    setLoading(true);
    setShowSug(false);
    try {
      const res  = await fetch("/api/search?q=" + encodeURIComponent(q));
      const data = await res.json();
      setResults(data.products || []);
      if (!data.products?.length) toast(`No products found for "${q}"`, { icon: "🔍" });
    } catch { toast.error("Search failed"); }
    setLoading(false);
  }

  async function searchByImage(file: File) {
    setImgLoading(true);
    setIdentified("");
    setResults([]);
    setImgPreview(URL.createObjectURL(file));
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res  = await fetch("/api/image-search", { method: "POST", body: fd });
      const data = await res.json();
      if (data.identified) {
        setIdentified(data.identified);
        setQuery(data.identified);
        setResults(data.products || []);
        toast.success("Identified: " + data.identified);
      }
    } catch { toast.error("Image search failed"); }
    setImgLoading(false);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-slide-up">
      <div>
        <h2 className="text-2xl font-bold text-white">Product Search</h2>
        <p className="text-sm text-slate-500 mt-1">Search by name or upload a product photo</p>
      </div>

      {/* Search bar */}
      <div className="card-base relative">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && search()}
              onFocus={() => suggestions.length && setShowSug(true)}
              placeholder="Search products… e.g. Majirel, Pilgrim, Cetaphil"
              className="input-base w-full pl-10 pr-4"
            />
            {query && (
              <button onClick={() => { setQuery(""); setResults([]); setSuggestions([]); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            )}
            {/* Suggestions dropdown */}
            {showSug && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-surface-card border border-surface-border rounded-xl shadow-card z-50 overflow-hidden">
                {suggestions.map(s => (
                  <button key={s} onClick={() => { setQuery(s); search(s); setShowSug(false); }}
                    className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-surface-hover hover:text-white transition-colors flex items-center gap-3 border-b border-surface-border/50 last:border-0">
                    <Package className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => search()} disabled={loading} className="btn-primary px-5">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </button>
          <button onClick={() => imgRef.current?.click()}
            className="btn-secondary px-4" title="Search by product photo">
            <Camera className="w-4 h-4" />
          </button>
          <input ref={imgRef} type="file" accept="image/*" className="hidden"
            onChange={e => e.target.files?.[0] && searchByImage(e.target.files[0])} />
        </div>

        {/* Image preview */}
        {imgLoading && (
          <div className="flex items-center gap-3 mt-4 text-sm text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
            AI is identifying the product...
          </div>
        )}
        {imgPreview && !imgLoading && (
          <div className="flex items-center gap-4 mt-4 p-3 bg-surface-hover rounded-xl">
            <img src={imgPreview} alt="product" className="w-16 h-16 object-contain rounded-lg" />
            <div>
              <p className="text-xs text-slate-500">Identified as</p>
              <p className="text-sm font-semibold text-brand-300">{identified || "—"}</p>
            </div>
            <button onClick={() => { setImgPreview(null); setIdentified(""); }}
              className="ml-auto text-slate-600 hover:text-white"><X className="w-4 h-4"/></button>
          </div>
        )}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-3 animate-fade-in">
          <p className="text-xs text-slate-500">{results.length} product{results.length > 1 ? "s" : ""} found</p>
          <div className="grid gap-3">
            {results.map((p, i) => <ProductCard key={i} product={p} />)}
          </div>
        </div>
      )}

      {!loading && results.length === 0 && query.length > 1 && (
        <div className="text-center py-16 text-slate-600">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No results yet. Press Enter or click Search.</p>
        </div>
      )}
    </div>
  );
}

function ProductCard({ product: p }: { product: Product }) {
  const profit = p.mrp - p.rate;
  return (
    <div className="card-base hover:border-brand-500/30 transition-all group">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-brand-600/20 flex items-center justify-center shrink-0">
          <Package className="w-5 h-5 text-brand-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white text-sm leading-tight">{p.name}</h3>
          <div className="flex flex-wrap gap-3 mt-2">
            <span className="text-xs text-slate-500">MRP <span className="text-slate-300 font-medium">₹{p.mrp}</span></span>
            <span className="text-xs text-slate-500">Rate <span className="text-violet-300 font-semibold">₹{p.rate}</span></span>
            <span className="text-xs text-slate-500">Qty <span className="text-slate-300 font-medium">{p.qty}</span></span>
            <span className="text-xs text-slate-500">Amount <span className="text-white font-semibold">{formatCurrency(p.amount)}</span></span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full border", getDiscountBadgeStyle(p.disc))}>
            {p.disc}% off
          </span>
          <span className="text-xs text-emerald-400">+{formatCurrency(profit)} margin</span>
        </div>
      </div>
    </div>
  );
}
