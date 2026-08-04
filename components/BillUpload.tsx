"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, FileText, Image as ImageIcon, CheckCircle2, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import { clsx } from "clsx";
import { Card } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { LoadingSpinner } from "./ui/LoadingSpinner";

interface ExtractedProduct {
  sr: number;
  name: string;
  qty: number;
  mrp: number;
  rate: number;
  disc: number;
  amount: number;
}

interface AnalysisResult {
  success: boolean;
  bill_no: string;
  bill_date: string;
  supplier_name: string;
  total_amount: number;
  total_qty: number;
  products: ExtractedProduct[];
  products_saved: number;
  error?: string;
}

export function BillUpload() {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"];
    if (!allowed.includes(f.type)) {
      setError("Please upload a JPG, PNG, WebP, HEIC, or PDF file.");
      return;
    }
    setFile(f);
    setResult(null);
    setError(null);
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

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const analyze = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/analyze-bill", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "Analysis failed");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze bill");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setShowAllProducts(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const displayedProducts = showAllProducts
    ? result?.products ?? []
    : (result?.products ?? []).slice(0, 10);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Bill Upload & Analyze</h1>
        <p className="mt-1 text-sm text-gray-400">
          Upload a bill image or PDF — AI will extract all product details and save to database
        </p>
      </div>

      {/* Upload zone */}
      {!result && (
        <Card>
          <div
            className={clsx(
              "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition-all duration-200 cursor-pointer",
              isDragging
                ? "border-violet-500 bg-violet-500/5"
                : file
                ? "border-emerald-600/60 bg-emerald-900/5"
                : "border-gray-700 bg-gray-800/30 hover:border-gray-600 hover:bg-gray-800/50"
            )}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />

            {file ? (
              <>
                {file.type.startsWith("image/") ? (
                  <ImageIcon size={40} className="text-emerald-400" />
                ) : (
                  <FileText size={40} className="text-emerald-400" />
                )}
                <p className="mt-3 text-base font-semibold text-white">{file.name}</p>
                <p className="mt-1 text-sm text-gray-400">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <Badge variant="success" dot className="mt-3">
                  Ready to analyze
                </Badge>
              </>
            ) : (
              <>
                <div className="rounded-full bg-gray-800 p-4">
                  <Upload size={28} className="text-violet-400" />
                </div>
                <p className="mt-4 text-base font-semibold text-white">
                  Drop bill here or click to upload
                </p>
                <p className="mt-1.5 text-sm text-gray-500">
                  Supports JPG, PNG, WebP, HEIC, PDF
                </p>
              </>
            )}
          </div>

          {error && (
            <div className="mt-4 flex items-start gap-2.5 rounded-lg bg-red-900/20 border border-red-800/50 px-4 py-3">
              <XCircle size={16} className="mt-0.5 flex-shrink-0 text-red-400" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <div className="mt-5 flex gap-3">
            <button
              onClick={analyze}
              disabled={!file || loading}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-900/30 transition-all hover:from-violet-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  Analyzing with AI...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Analyze Bill
                </>
              )}
            </button>
            {file && (
              <button
                onClick={reset}
                className="rounded-xl border border-gray-700 px-4 py-3 text-sm text-gray-400 transition-colors hover:border-gray-600 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>
        </Card>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4 animate-slide-up">
          {/* Success banner */}
          <div className="flex items-center gap-3 rounded-xl border border-emerald-800/50 bg-emerald-900/15 px-5 py-4">
            <CheckCircle2 size={22} className="flex-shrink-0 text-emerald-400" />
            <div>
              <p className="font-semibold text-emerald-300">Bill analyzed successfully!</p>
              <p className="text-sm text-emerald-400/80">
                {result.products_saved} products saved to database
              </p>
            </div>
            <button
              onClick={reset}
              className="ml-auto rounded-lg border border-emerald-700/50 px-3 py-1.5 text-xs text-emerald-400 hover:bg-emerald-900/30"
            >
              Upload Another
            </button>
          </div>

          {/* Bill details */}
          <Card>
            <h2 className="mb-4 text-sm font-semibold text-white">Bill Information</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {[
                { label: "Bill No", value: result.bill_no },
                { label: "Date", value: result.bill_date },
                { label: "Supplier", value: result.supplier_name },
                { label: "Total Qty", value: result.total_qty },
                {
                  label: "Total Amount",
                  value: `₹${result.total_amount?.toLocaleString("en-IN")}`,
                },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-xs text-gray-500">{item.label}</p>
                  <p className="mt-1 text-sm font-semibold text-white">{item.value || "-"}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Products table */}
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">
                Extracted Products ({result.products.length})
              </h2>
              <Badge variant="success">{result.products_saved} saved</Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="pb-2 text-left font-medium text-gray-500">Sr</th>
                    <th className="pb-2 text-left font-medium text-gray-500">Product Name</th>
                    <th className="pb-2 text-right font-medium text-gray-500">Qty</th>
                    <th className="pb-2 text-right font-medium text-gray-500">MRP</th>
                    <th className="pb-2 text-right font-medium text-gray-500">Rate</th>
                    <th className="pb-2 text-right font-medium text-gray-500">Disc%</th>
                    <th className="pb-2 text-right font-medium text-gray-500">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedProducts.map((p, i) => (
                    <tr
                      key={i}
                      className="border-b border-gray-800/40 transition-colors hover:bg-gray-800/30"
                    >
                      <td className="py-2.5 text-gray-500">{p.sr}</td>
                      <td className="py-2.5 pr-4 font-medium text-gray-200">{p.name}</td>
                      <td className="py-2.5 text-right text-gray-400">{p.qty}</td>
                      <td className="py-2.5 text-right text-gray-300">₹{p.mrp}</td>
                      <td className="py-2.5 text-right text-gray-300">₹{p.rate}</td>
                      <td className="py-2.5 text-right">
                        <span className="font-medium text-emerald-400">{p.disc}%</span>
                      </td>
                      <td className="py-2.5 text-right font-semibold text-white">₹{p.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {result.products.length > 10 && (
              <button
                onClick={() => setShowAllProducts(!showAllProducts)}
                className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-700 py-2 text-xs text-gray-400 hover:bg-gray-800/50 hover:text-white"
              >
                {showAllProducts ? (
                  <>
                    <ChevronUp size={14} />
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronDown size={14} />
                    Show all {result.products.length} products
                  </>
                )}
              </button>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
