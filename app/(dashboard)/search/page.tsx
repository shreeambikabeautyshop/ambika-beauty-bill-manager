"use client";
import { useState, useEffect, useRef } from "react";
import { Search, Camera, Loader2, Package, X, IndianRupee } from "lucide-react";
import toast from "react-hot-toast";
import { cn, formatCurrency, getDiscountBadgeStyle } from "@/lib/utils";
import type { Product } from "@/types";

export default function SearchPage() {
  const [query,      setQuery]      = useState("");
  const [suggestions,setSuggestions]= useState<string[]>([]);
  const [results,    setResults]    = useState<Product[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [imgLoading, setImgLoading] = useState(false);
  const [imgPreview, setImgPreview] = useState<string | null>(null);
  const [identified, setIdentified] = useState("");
  const [showSug,    setShowSug]    = useState(false);
  const imgRef  = useRef<HTMLInputElement>(null);
  const debounce= useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (query.length < 2) { setSuggestions([]); setShowSug(false); return; }
    clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      const res  = await fetch(`/api/search?q=${encodeURIComponent(query)}&suggest=1`);
      const data = await res.json();
      setSuggestions(data.suggestions || []);
      setShowSug(true);
    }, 300);
  }, [query]);

  async function search(q = query) {
    if (!q.trim()) return;
    setLoading(true); setShowSug(false);
    try {
      const res  = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.products || []);
      if (!data.products?.length) toast(`No results for "${q}"`, { icon: "🔍" });
    } catch { toast.error("Search failed"); }
    setLoading(false);
  }

  async function searchByImage(file: File) {
    setImgLoading(true); setIdentified(""); setResults([]);
    setImgPreview(URL.createObjectURL(file));
    try {
      const fd = new FormData(); fd.append("image", file);
      const res  = await fetch("/api/image-search", { method: "POST", body: fd });
      const data = await res.json();
      if (data.identified) {
        setIdentified(data.identified); setQuery(data.identified);
        setResults(data.products || []);
        toast.success("Found: " + data.identified);
      }
    } catch { toast.error("Image search failed"); }
    setImgLoading(false);
  }

  return (
    <div className="space-y-4 animate-slide-up max-w-2xl mx-auto">
      <div>
        <h2 className="text-lg font-bold text-white">Product Search</h2>
        <p className="text-xs text-slate-500 mt-0.5">Search by name or product photo</p>
      </div>

      {/* Search bar */}
      <div className="card-base p-3 space-y-2">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input value={query} onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && search()}
              onFocus={() => suggestions.length && setShowSug(true)}
              placeholder="Majirel, Pilgrim, Cetaphil..."
              className="input-base pl-9 pr-9"
            />
            {query && (
              <button onClick={() => { setQuery(""); setResults([]); setSuggestions([]); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 p-0.5">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button onClick={() => search()} disabled={loading} className="btn-primary px-4 shrink-0 w-12">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </button>
          <button onClick={() => imgRef.current?.click()} className="btn-secondary px-4 shrink-0 w-12" title="Photo search">
            <Camera className="w-4 h-4" />
          </button>
        </div>
        <input ref={imgRef} type="file" accept="image/*" capture="environment" className="hidden"
          onChange={e => e.target.files?.[0] && searchByImage(e.target.files[0])} />

        {/* Image result */}
        {(imgLoading || imgPreview) && (
          <div className="flex items-center gap-3 p-3 bg-surface-hover rounded-xl">
            {imgPreview && <img src={imgPreview} alt="product" className="w-12 h-12 object-contain rounded-lg shrink-0" />}
            {imgLoading
              ? <div className="flex items-center gap-2 text-xs text-slate-400"><Loader2 className="w-3.5 h-3.5 animate-spin text-brand-400"/>Identifying...</div>
              : <div><p className="text-[10px] text-slate-500">Identified</p><p className="text-xs font-semibold text-brand-300">{identified}</p></div>}
            <button onClick={() => { setImgPreview(null); setIdentified(""); }} className="ml-auto text-slate-600 p-1"><X className="w-3.5 h-3.5"/></button>
          </div>
        )}

        {/* Suggestions dropdown */}
        {showSug && suggestions.length > 0 && (
          <div className="bg-surface border border-surface-border rounded-xl overflow-hidden">
            {suggestions.map(s => (
              <button key={s} onClick={() => { setQuery(s); search(s); setShowSug(false); }}
                className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-surface-hover active:bg-surface-hover flex items-center gap-2 border-b border-surface-border/50 last:border-0">
                <Package className="w-3.5 h-3.5 text-slate-600 shrink-0" />{s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-2 animate-fade-in">
          <p className="text-xs text-slate-500 px-1">{results.length} product{results.length > 1 ? "s" : ""} found</p>
          {results.map((p, i) => <ProductCard key={i} product={p} />)}
        </div>
      )}
    </div>
  );
}

function ProductCard({ product: p }: { product: Product }) {
  return (
    <div className="card-base p-4 active:bg-surface-hover transition-colors">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-brand-600/20 flex items-center justify-center shrink-0 mt-0.5">
          <Package className="w-4 h-4 text-brand-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white text-sm leading-snug">{p.name}</h3>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
            <span className="text-xs text-slate-500">MRP <b className="text-slate-300">₹{p.mrp}</b></span>
            <span className="text-xs text-slate-500">Rate <b className="text-violet-300">₹{p.rate}</b></span>
            <span className="text-xs text-slate-500">Qty <b className="text-slate-300">{p.qty}</b></span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full border", getDiscountBadgeStyle(p.disc))}>
            {p.disc}%
          </span>
          <span className="text-xs font-bold text-white">{formatCurrency(p.amount)}</span>
        </div>
      </div>
    </div>
  );
}
