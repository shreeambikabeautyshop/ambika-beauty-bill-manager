"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Package, Tag, IndianRupee } from "lucide-react";
import { clsx } from "clsx";
import { Card } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { LoadingSpinner } from "./ui/LoadingSpinner";

interface SearchProduct {
  id: string;
  name: string;
  qty: number;
  mrp: number;
  rate: number;
  disc: number;
  amount: number;
  bills: {
    bill_no: string;
    supplier_name: string;
    bill_date: string;
  } | null;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function ProductCard({ product }: { product: SearchProduct }) {
  const savings = product.mrp && product.rate
    ? ((product.mrp - product.rate) * (product.qty ?? 1)).toFixed(2)
    : null;

  return (
    <Card hover className="transition-all duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-white">{product.name}</h3>
            {product.disc > 0 && (
              <Badge variant="success">{product.disc}% off</Badge>
            )}
          </div>
          {product.bills && (
            <p className="mt-1 text-xs text-gray-500">
              Bill {product.bills.bill_no} · {product.bills.supplier_name ?? "Unknown"} ·{" "}
              {product.bills.bill_date ?? "-"}
            </p>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-lg font-bold text-white">₹{product.rate ?? "-"}</p>
          {product.mrp && product.mrp !== product.rate && (
            <p className="text-xs text-gray-500 line-through">₹{product.mrp}</p>
          )}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-lg bg-gray-800/60 px-3 py-2">
          <p className="text-xs text-gray-500">MRP</p>
          <p className="text-sm font-semibold text-white">₹{product.mrp ?? "-"}</p>
        </div>
        <div className="rounded-lg bg-gray-800/60 px-3 py-2">
          <p className="text-xs text-gray-500">Rate</p>
          <p className="text-sm font-semibold text-violet-300">₹{product.rate ?? "-"}</p>
        </div>
        <div className="rounded-lg bg-gray-800/60 px-3 py-2">
          <p className="text-xs text-gray-500">Qty</p>
          <p className="text-sm font-semibold text-white">{product.qty ?? "-"}</p>
        </div>
        <div className="rounded-lg bg-gray-800/60 px-3 py-2">
          <p className="text-xs text-gray-500">Amount</p>
          <p className="text-sm font-semibold text-emerald-400">₹{product.amount ?? "-"}</p>
        </div>
      </div>

      {savings && Number(savings) > 0 && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-400">
          <IndianRupee size={11} />
          Saved ₹{savings} on this bill
        </div>
      )}
    </Card>
  );
}

export function ProductSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchProduct[]>([]);
  const [suggestions, setSuggestions] = useState<SearchProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searched, setSearched] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Fetch suggestions
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    async function fetchSuggestions() {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}&limit=5`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.results ?? []);
          setShowSuggestions(true);
        }
      } catch {
        // silent
      }
    }

    fetchSuggestions();
  }, [debouncedQuery]);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setShowSuggestions(false);
    setSearched(true);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&limit=50`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results ?? []);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      performSearch(query);
    }
    if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setSuggestions([]);
    setSearched(false);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Product Search</h1>
        <p className="mt-1 text-sm text-gray-400">
          Search any product from your saved bills — instant autocomplete with full details
        </p>
      </div>

      {/* Search input */}
      <div className="relative">
        <div className="flex items-center gap-3 rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 focus-within:border-violet-600 transition-colors">
          <Search size={18} className="flex-shrink-0 text-gray-500" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            placeholder="Type product name... (press Enter to search)"
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none"
          />
          {loading && <LoadingSpinner size="sm" />}
          {query && !loading && (
            <button onClick={clearSearch} className="text-gray-500 hover:text-white">
              <X size={16} />
            </button>
          )}
          <button
            onClick={() => performSearch(query)}
            disabled={!query.trim() || loading}
            className="rounded-lg bg-violet-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Search
          </button>
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute left-0 right-0 top-full z-10 mt-1 rounded-xl border border-gray-700 bg-gray-900 shadow-xl shadow-black/30"
          >
            {suggestions.map((s) => (
              <button
                key={s.id}
                className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-gray-800 first:rounded-t-xl last:rounded-b-xl"
                onClick={() => {
                  setQuery(s.name);
                  performSearch(s.name);
                }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Package size={14} className="flex-shrink-0 text-violet-400" />
                  <span className="text-sm text-gray-200 truncate">{s.name}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                  {s.disc > 0 && (
                    <span className="text-xs text-emerald-400">{s.disc}%</span>
                  )}
                  <span className="text-xs font-medium text-gray-400">₹{s.rate}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results */}
      {loading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" label="Searching..." />
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-800 py-16 text-center">
          <Tag size={32} className="mx-auto text-gray-700" />
          <p className="mt-3 text-sm font-medium text-gray-400">No products found</p>
          <p className="mt-1 text-xs text-gray-600">
            Try a different search term or upload more bills
          </p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">
              Found <span className="font-semibold text-white">{results.length}</span> products
              for &quot;<span className="text-violet-400">{query}</span>&quot;
            </p>
            <button
              onClick={clearSearch}
              className="text-xs text-gray-500 hover:text-gray-300"
            >
              Clear results
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {results.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}

      {!searched && !loading && (
        <div className="rounded-xl border border-dashed border-gray-800 py-16 text-center">
          <Search size={36} className="mx-auto text-gray-700" />
          <p className="mt-3 text-sm text-gray-500">
            Start typing a product name to search
          </p>
          <p className="mt-1 text-xs text-gray-600">
            Searches across all saved bills in your database
          </p>
        </div>
      )}
    </div>
  );
}
