"use client";
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import {
  ShieldCheck, Upload, Loader2, CheckCircle2,
  XCircle, AlertTriangle, TrendingDown, FileImage, Sparkles
} from "lucide-react";
import { cn, formatCurrency, formatDate, getDiscountBadgeStyle } from "@/lib/utils";
import type { BillVerification, VerifyResult } from "@/types";

export default function VerifyPage() {
  const [file,   setFile]   = useState<File | null>(null);
  const [preview,setPreview]= useState<string | null>(null);
  const [loading,setLoading]= useState(false);
  const [result, setResult] = useState<BillVerification | null>(null);

  const onDrop = useCallback((accepted: File[]) => {
    const f = accepted[0]; if (!f) return;
    setFile(f);
    setPreview(f.type.startsWith("image/") ? URL.createObjectURL(f) : null);
    setResult(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg",".jpeg",".png"], "application/pdf": [".pdf"] },
    maxFiles: 1,
  });

  async function verify() {
    if (!file) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res  = await fetch("/api/verify-bill", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      toast.success("Verification complete!");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error";
      toast.error(msg);
    }
    setLoading(false);
  }

  const ok    = result?.results.filter(r => r.disc_match && r.amount_match) ?? [];
  const wrong = result?.results.filter(r => !r.disc_match || !r.amount_match) ?? [];

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-slide-up">
      <div>
        <h2 className="text-2xl font-bold text-white">Bill Verification</h2>
        <p className="text-sm text-slate-500 mt-1">AI checks every product's discount % and amount for errors</p>
      </div>

      {/* Upload */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all",
          isDragActive ? "border-violet-500 bg-violet-600/10" : "border-surface-border hover:border-violet-500/50 bg-surface-card"
        )}
      >
        <input {...getInputProps()} />
        {preview ? (
          <div className="flex flex-col items-center gap-3">
            <img src={preview} alt="bill" className="max-h-40 rounded-xl shadow-card" />
            <p className="text-sm text-violet-300">{file?.name}</p>
          </div>
        ) : file ? (
          <div className="flex flex-col items-center gap-3">
            <FileImage className="w-10 h-10 text-violet-400" />
            <p className="text-sm text-violet-300">{file?.name}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <ShieldCheck className="w-12 h-12 text-violet-400" />
            <p className="text-base font-semibold text-white">Drop bill image to verify</p>
            <p className="text-sm text-slate-500">AI will check all prices and discounts</p>
          </div>
        )}
      </div>

      {file && !result && (
        <button onClick={verify} disabled={loading} className="btn-primary">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</> : <><Sparkles className="w-4 h-4" /> Verify Now</>}
        </button>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-5 animate-slide-up">
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <SummaryCard icon={<ShieldCheck className="w-5 h-5 text-violet-400"/>} label="Total Products" value={result.total_products} color="violet" />
            <SummaryCard icon={<CheckCircle2 className="w-5 h-5 text-emerald-400"/>} label="All Correct" value={ok.length} color="emerald" />
            <SummaryCard icon={<XCircle className="w-5 h-5 text-red-400"/>} label="Errors Found" value={wrong.length} color="red" />
            <SummaryCard icon={<TrendingDown className="w-5 h-5 text-gold-400"/>} label="Total Loss" value={formatCurrency(result.total_loss)} color="gold" />
          </div>

          {/* AI Summary */}
          {result.summary && (
            <div className="card-base border-violet-500/20">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-violet-400" />
                <span className="text-sm font-semibold text-violet-300">AI Verification Summary</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{result.summary}</p>
            </div>
          )}

          {/* Errors table */}
          {wrong.length > 0 && (
            <div className="card-base border-red-500/20">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-sm font-semibold text-red-300">{wrong.length} Discrepancies Found</span>
              </div>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Sr</th><th>Product</th><th>MRP</th><th>Rate</th>
                      <th>Bill Disc%</th><th>Actual Disc%</th><th>Loss</th><th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wrong.map((r) => (
                      <tr key={r.sr}>
                        <td className="text-slate-500">{r.sr}</td>
                        <td className="font-medium text-white max-w-[200px] truncate">{r.name}</td>
                        <td>₹{r.mrp}</td>
                        <td className="text-violet-300">₹{r.rate}</td>
                        <td><span className={cn("badge-style", getDiscountBadgeStyle(r.bill_disc))}>{r.bill_disc}%</span></td>
                        <td className={r.disc_match ? "text-emerald-400" : "text-red-400 font-bold"}>{r.calc_disc}%</td>
                        <td className="text-red-400 font-semibold">{r.loss ? formatCurrency(r.loss) : "—"}</td>
                        <td>
                          {r.disc_match && r.amount_match
                            ? <span className="text-emerald-400 text-xs">✓ OK</span>
                            : <span className="text-red-400 text-xs">✗ Error</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* All correct */}
          {wrong.length === 0 && (
            <div className="card-base border-emerald-500/30 text-center py-10">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <p className="text-lg font-bold text-white">All {result.total_products} products verified!</p>
              <p className="text-sm text-slate-500 mt-1">Every discount % and amount is correct.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ icon, label, value, color }: {
  icon: React.ReactNode; label: string; value: string | number; color: string;
}) {
  const colors: Record<string, string> = {
    violet:  "border-violet-500/20  bg-violet-600/5",
    emerald: "border-emerald-500/20 bg-emerald-600/5",
    red:     "border-red-500/20     bg-red-600/5",
    gold:    "border-yellow-500/20  bg-yellow-600/5",
  };
  return (
    <div className={cn("card-base flex flex-col gap-3", colors[color])}>
      <div className="flex items-center gap-2">{icon}<span className="text-xs text-slate-500">{label}</span></div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
