"use client";

import { useState, useRef, useCallback } from "react";
import { Camera, Upload, Sparkles, Package, X } from "lucide-react";
import { clsx } from "clsx";
import { Card } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { LoadingSpinner } from "./ui/LoadingSpinner";

interface ImageSearchResult {
  success: boolean;
  identified: {
    product_name: string;
    brand: string;
    confidence: "high" | "medium" | "low";
  };
  matches: Array<{
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
  }>;
  error?: string;
}

const confidenceColors = {
  high: "success" as const,
  medium: "warning" as const,
  low: "error" as const,
};

export function ImageSearch() {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImageSearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return;
    }
    setFile(f);
    setResult(null);
    setError(null);
    const url = URL.createObjectURL(f);
    setPreview(url);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const search = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/image-search", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "Image search failed");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to search by image");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Image Search</h1>
        <p className="mt-1 text-sm text-gray-400">
          Upload a product photo — AI identifies it and finds matching records from your bills
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Upload panel */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <div
              className={clsx(
                "flex min-h-[240px] flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all duration-200 cursor-pointer",
                isDragging
                  ? "border-violet-500 bg-violet-500/5"
                  : file
                  ? "border-violet-600/50 bg-violet-900/5 p-3"
                  : "border-gray-700 bg-gray-800/20 hover:border-gray-600"
              )}
              onDrop={onDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onClick={() => !file && inputRef.current?.click()}
            >
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />

              {preview ? (
                <div className="relative w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview}
                    alt="Product"
                    className="mx-auto max-h-52 rounded-lg object-contain"
                  />
                  <button
                    onClick={(e) => { e.stopPropagation(); reset(); }}
                    className="absolute right-0 top-0 rounded-full bg-gray-800 p-1 text-gray-400 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <>
                  <div className="rounded-full bg-gray-800 p-4">
                    <Camera size={28} className="text-violet-400" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-white">
                    Drop product photo here
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    AI will identify the product name
                  </p>
                  <button
                    onClick={() => inputRef.current?.click()}
                    className="mt-4 flex items-center gap-2 rounded-lg border border-gray-700 px-4 py-2 text-xs text-gray-400 hover:border-gray-600 hover:text-white"
                  >
                    <Upload size={13} />
                    Choose image
                  </button>
                </>
              )}
            </div>

            {error && (
              <div className="mt-3 rounded-lg bg-red-900/20 border border-red-800/50 px-3 py-2.5">
                <p className="text-xs text-red-300">{error}</p>
              </div>
            )}

            <button
              onClick={search}
              disabled={!file || loading}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-900/20 transition-all hover:from-violet-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  Identifying...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Search by Image
                </>
              )}
            </button>
          </Card>

          {/* AI identification result */}
          {result && (
            <Card className="animate-slide-up">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={15} className="text-violet-400" />
                <h3 className="text-sm font-semibold text-white">AI Identification</h3>
              </div>

              <div className="space-y-2.5">
                <div>
                  <p className="text-xs text-gray-500">Product Name</p>
                  <p className="mt-0.5 text-sm font-semibold text-white">
                    {result.identified.product_name}
                  </p>
                </div>
                {result.identified.brand && (
                  <div>
                    <p className="text-xs text-gray-500">Brand</p>
                    <p className="mt-0.5 text-sm text-gray-300">{result.identified.brand}</p>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <p className="text-xs text-gray-500">Confidence</p>
                  <Badge variant={confidenceColors[result.identified.confidence]}>
                    {result.identified.confidence}
                  </Badge>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Results panel */}
        <div className="lg:col-span-3">
          {!result && !loading && (
            <div className="flex h-full min-h-[300px] items-center justify-center rounded-xl border border-dashed border-gray-800">
              <div className="text-center">
                <Camera size={36} className="mx-auto text-gray-700" />
                <p className="mt-3 text-sm text-gray-500">
                  Upload a product image to find matches
                </p>
              </div>
            </div>
          )}

          {loading && (
            <div className="flex h-full min-h-[300px] items-center justify-center rounded-xl border border-gray-800 bg-gray-900">
              <LoadingSpinner size="lg" label="AI is identifying the product..." />
            </div>
          )}

          {result && (
            <div className="space-y-3 animate-slide-up">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">
                  <span className="font-semibold text-white">{result.matches.length}</span>{" "}
                  matching records found
                </p>
                <button
                  onClick={reset}
                  className="text-xs text-gray-500 hover:text-gray-300"
                >
                  New search
                </button>
              </div>

              {result.matches.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-800 py-12 text-center">
                  <Package size={28} className="mx-auto text-gray-700" />
                  <p className="mt-3 text-sm text-gray-500">
                    No records found for &quot;{result.identified.product_name}&quot;
                  </p>
                  <p className="mt-1 text-xs text-gray-600">
                    This product may not be in any uploaded bills yet
                  </p>
                </div>
              ) : (
                result.matches.map((match) => (
                  <Card key={match.id} hover>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-white">{match.name}</h3>
                          {match.disc > 0 && (
                            <Badge variant="success">{match.disc}% off</Badge>
                          )}
                        </div>
                        {match.bills && (
                          <p className="mt-1 text-xs text-gray-500">
                            Bill {match.bills.bill_no} · {match.bills.supplier_name ?? "Unknown"}{" "}
                            · {match.bills.bill_date ?? "-"}
                          </p>
                        )}
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="text-lg font-bold text-white">₹{match.rate ?? "-"}</p>
                        {match.mrp && match.mrp !== match.rate && (
                          <p className="text-xs text-gray-500 line-through">₹{match.mrp}</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-4 gap-2">
                      {[
                        { label: "MRP", value: `₹${match.mrp ?? "-"}`, color: "text-gray-300" },
                        { label: "Rate", value: `₹${match.rate ?? "-"}`, color: "text-violet-300" },
                        { label: "Qty", value: match.qty ?? "-", color: "text-gray-300" },
                        {
                          label: "Amount",
                          value: `₹${match.amount ?? "-"}`,
                          color: "text-emerald-400",
                        },
                      ].map((item) => (
                        <div key={item.label} className="rounded-lg bg-gray-800/60 px-2.5 py-2">
                          <p className="text-xs text-gray-500">{item.label}</p>
                          <p className={clsx("text-sm font-semibold", item.color)}>
                            {item.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
