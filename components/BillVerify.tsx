"use client";

import { useState, useRef, useCallback } from "react";
import { ShieldCheck, Upload, CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react";
import { clsx } from "clsx";
import { Card } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { LoadingSpinner } from "./ui/LoadingSpinner";

interface VerifiedProduct {
  sr: number;
  name: string;
  qty: number;
  mrp: number;
  rate: number;
  bill_disc: number;
  actual_disc: number;
  bill_amount: number;
  calc_amount: number;
  disc_ok: boolean;
  amount_ok: boolean;
  status: "ok" | "disc_mismatch" | "amount_mismatch" | "both_mismatch";
  disc_diff: number;
  amount_diff: number;
}

interface VerifyResult {
  success: boolean;
  products: VerifiedProduct[];
  summary: {
    total: number;
    ok: number;
    mismatches: number;
    total_loss: number;
    ai_summary: string;
  };
  error?: string;
}

function StatusIcon({ status }: { status: VerifiedProduct["status"] }) {
  if (status === "ok") return <CheckCircle2 size={15} className="text-emerald-400" />;
  if (status === "disc_mismatch") return <AlertTriangle size={15} className="text-amber-400" />;
  return <XCircle size={15} className="text-red-400" />;
}

export function BillVerify() {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/heic"];
    if (!allowed.includes(f.type)) {
      setError("Please upload an image file (JPG, PNG, WebP, HEIC).");
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

  const verify = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/verify-bill", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "Verification failed");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify bill");
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

  const getRowBg = (status: VerifiedProduct["status"]) => {
    if (status === "ok") return "hover:bg-emerald-900/10";
    if (status === "disc_mismatch") return "bg-amber-900/10 hover:bg-amber-900/15";
    return "bg-red-900/10 hover:bg-red-900/15";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Bill Verify</h1>
        <p className="mt-1 text-sm text-gray-400">
          Upload a bill image — AI checks every price: MRP, Rate, Disc%, Amount for accuracy
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <CheckCircle2 size={13} className="text-emerald-400" />
          All correct
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <AlertTriangle size={13} className="text-amber-400" />
          Discount mismatch
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <XCircle size={13} className="text-red-400" />
          Amount / multiple errors
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Upload panel */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <div
              className={clsx(
                "flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200 cursor-pointer",
                isDragging
                  ? "border-violet-500 bg-violet-500/5"
                  : file
                  ? "border-emerald-600/50 bg-emerald-900/5"
                  : "border-gray-700 bg-gray-800/20 hover:border-gray-600"
              )}
              onDrop={onDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onClick={() => inputRef.current?.click()}
            >
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />

              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview}
                  alt="Bill preview"
                  className="max-h-48 rounded-lg object-contain"
                />
              ) : (
                <>
                  <div className="rounded-full bg-gray-800 p-3">
                    <ShieldCheck size={24} className="text-violet-400" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-white">Drop bill image here</p>
                  <p className="mt-1 text-xs text-gray-500">JPG, PNG, WebP, HEIC</p>
                </>
              )}
            </div>

            {file && (
              <p className="mt-2 text-center text-xs text-gray-500 truncate">{file.name}</p>
            )}

            {error && (
              <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-900/20 border border-red-800/50 px-3 py-2.5">
                <XCircle size={14} className="mt-0.5 flex-shrink-0 text-red-400" />
                <p className="text-xs text-red-300">{error}</p>
              </div>
            )}

            <div className="mt-4 flex gap-2">
              <button
                onClick={verify}
                disabled={!file || loading}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-900/20 transition-all hover:from-violet-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    Verify Bill
                  </>
                )}
              </button>
              {file && (
                <button
                  onClick={reset}
                  className="rounded-xl border border-gray-700 px-3 py-3 text-xs text-gray-400 hover:border-gray-600 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>
          </Card>

          {/* Summary card */}
          {result && (
            <Card className="animate-slide-up">
              <h3 className="mb-3 text-sm font-semibold text-white">Verification Summary</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-gray-800/50 px-3 py-2.5 text-center">
                  <p className="text-xl font-bold text-white">{result.summary.total}</p>
                  <p className="text-xs text-gray-500">Total Products</p>
                </div>
                <div className="rounded-lg bg-emerald-900/20 px-3 py-2.5 text-center">
                  <p className="text-xl font-bold text-emerald-400">{result.summary.ok}</p>
                  <p className="text-xs text-gray-500">Correct</p>
                </div>
                <div className="rounded-lg bg-red-900/20 px-3 py-2.5 text-center">
                  <p className="text-xl font-bold text-red-400">{result.summary.mismatches}</p>
                  <p className="text-xs text-gray-500">Mismatches</p>
                </div>
                <div className="rounded-lg bg-amber-900/20 px-3 py-2.5 text-center">
                  <p className="text-xl font-bold text-amber-400">
                    ₹{Math.abs(result.summary.total_loss).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">Discrepancy</p>
                </div>
              </div>

              {result.summary.ai_summary && (
                <div className="mt-3 flex gap-2 rounded-lg bg-blue-900/15 border border-blue-800/30 px-3 py-2.5">
                  <Info size={14} className="mt-0.5 flex-shrink-0 text-blue-400" />
                  <p className="text-xs text-blue-300">{result.summary.ai_summary}</p>
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Results table */}
        <div className="lg:col-span-3">
          {!result && !loading && (
            <div className="flex h-full min-h-[300px] items-center justify-center rounded-xl border border-dashed border-gray-800">
              <div className="text-center">
                <ShieldCheck size={36} className="mx-auto text-gray-700" />
                <p className="mt-3 text-sm text-gray-500">
                  Upload a bill image to see verification results
                </p>
              </div>
            </div>
          )}

          {loading && (
            <div className="flex h-full min-h-[300px] items-center justify-center rounded-xl border border-gray-800 bg-gray-900">
              <LoadingSpinner size="lg" label="Analyzing bill with AI..." />
            </div>
          )}

          {result && (
            <Card className="animate-slide-up">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">
                  Product Verification ({result.products.length})
                </h3>
                <div className="flex gap-2">
                  <Badge variant="success">{result.summary.ok} ✓</Badge>
                  {result.summary.mismatches > 0 && (
                    <Badge variant="error">{result.summary.mismatches} ✗</Badge>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="pb-2 text-left font-medium text-gray-500">Status</th>
                      <th className="pb-2 text-left font-medium text-gray-500">Product</th>
                      <th className="pb-2 text-right font-medium text-gray-500">MRP</th>
                      <th className="pb-2 text-right font-medium text-gray-500">Rate</th>
                      <th className="pb-2 text-right font-medium text-gray-500">Bill Disc%</th>
                      <th className="pb-2 text-right font-medium text-gray-500">Actual%</th>
                      <th className="pb-2 text-right font-medium text-gray-500">Bill Amt</th>
                      <th className="pb-2 text-right font-medium text-gray-500">Calc Amt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.products.map((p, i) => (
                      <tr
                        key={i}
                        className={clsx(
                          "border-b border-gray-800/40 transition-colors",
                          getRowBg(p.status)
                        )}
                      >
                        <td className="py-2.5 pr-2">
                          <StatusIcon status={p.status} />
                        </td>
                        <td className="py-2.5 pr-3">
                          <p className="font-medium text-gray-200 line-clamp-2">{p.name}</p>
                          <p className="text-gray-500">Qty: {p.qty}</p>
                        </td>
                        <td className="py-2.5 text-right text-gray-300">₹{p.mrp}</td>
                        <td className="py-2.5 text-right text-gray-300">₹{p.rate}</td>
                        <td className="py-2.5 text-right">
                          <span
                            className={clsx(
                              "font-medium",
                              p.disc_ok ? "text-emerald-400" : "text-red-400"
                            )}
                          >
                            {p.bill_disc}%
                          </span>
                        </td>
                        <td className="py-2.5 text-right">
                          <span
                            className={clsx(
                              "font-medium",
                              p.disc_ok ? "text-emerald-400" : "text-amber-400"
                            )}
                          >
                            {p.actual_disc.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-2.5 text-right">
                          <span
                            className={clsx(
                              "font-medium",
                              p.amount_ok ? "text-white" : "text-red-400"
                            )}
                          >
                            ₹{p.bill_amount}
                          </span>
                        </td>
                        <td className="py-2.5 text-right text-gray-400">
                          ₹{p.calc_amount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
