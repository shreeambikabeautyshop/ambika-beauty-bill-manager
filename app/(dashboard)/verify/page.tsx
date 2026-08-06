"use client";
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import { ShieldCheck, Upload, Loader2, CheckCircle2, XCircle, AlertTriangle, TrendingDown, FileImage, Sparkles } from "lucide-react";
import { cn, formatCurrency, getDiscountBadgeStyle } from "@/lib/utils";
import type { BillVerification, VerifyResult } from "@/types";

export default function VerifyPage() {
  const [file,    setFile]   = useState<File | null>(null);
  const [preview, setPreview]= useState<string | null>(null);
  const [loading, setLoading]= useState(false);
  const [result,  setResult] = useState<BillVerification | null>(null);

  const onDrop = useCallback((accepted: File[]) => {
    const f = accepted[0]; if (!f) return;
    setFile(f); setPreview(f.type.startsWith("image/") ? URL.createObjectURL(f) : null); setResult(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { "image/*": [], "application/pdf": [".pdf"] }, maxFiles: 1,
  });

  async function verify() {
    if (!file) return; setLoading(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const res  = await fetch("/api/verify-bill", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data); toast.success("Verification complete!");
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Error"); }
    setLoading(false);
  }

  const ok    = result?.results.filter(r => r.disc_match && r.amount_match) ?? [];
  const wrong = result?.results.filter(r => !r.disc_match || !r.amount_match) ?? [];

  return (
    <div className="space-y-4 animate-slide-up max-w-2xl mx-auto">
      <div>
        <h2 className="text-lg font-bold text-white">Verify Bill</h2>
        <p className="text-xs text-slate-500 mt-0.5">AI checks every price & discount for errors</p>
      </div>

      {/* Upload */}
      <div {...getRootProps()} className={cn(
        "border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all",
        isDragActive ? "border-violet-500 bg-violet-600/10" : "border-surface-border hover:border-violet-500/40 bg-surface-card active:bg-surface-hover"
      )}>
        <input {...getInputProps()} />
        {preview ? (
          <img src={preview} alt="bill" className="max-h-40 rounded-xl mx-auto" />
        ) : file ? (
          <div className="flex flex-col items-center gap-2">
            <FileImage className="w-10 h-10 text-violet-400" /><p className="text-sm text-violet-300">{file.name}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-violet-600/20 flex items-center justify-center">
              <ShieldCheck className="w-7 h-7 text-violet-400" />
            </div>
            <p className="text-sm font-semibold text-white">Tap to upload bill image</p>
            <p className="text-xs text-slate-500">AI will verify all prices</p>
          </div>
        )}
      </div>

      {file && !result && (
        <button onClick={verify} disabled={loading} className="btn-primary w-full">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin"/>Verifying...</> : <><Sparkles className="w-4 h-4"/>Verify Now</>}
        </button>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-3 animate-slide-up">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: ShieldCheck,  label: "Total",   value: result.total_products, color: "text-violet-400"  },
              { icon: CheckCircle2, label: "Correct",  value: ok.length,             color: "text-emerald-400" },
              { icon: XCircle,      label: "Errors",   value: wrong.length,          color: "text-red-400"     },
              { icon: TrendingDown, label: "Loss",     value: formatCurrency(result.total_loss), color: "text-yellow-400" },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="card-base p-3 flex items-center gap-2.5">
                <Icon className={cn("w-5 h-5 shrink-0", color)} />
                <div><p className="text-[10px] text-slate-500">{label}</p>
                  <p className="text-sm font-bold text-white">{value}</p></div>
              </div>
            ))}
          </div>

          {/* AI Summary */}
          {result.summary && (
            <div className="card-base border-violet-500/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                <span className="text-xs font-semibold text-violet-300">AI Summary</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{result.summary}</p>
            </div>
          )}

          {/* Errors */}
          {wrong.length > 0 ? (
            <div className="card-base border-red-500/20 p-0 overflow-hidden">
              <div className="flex items-center gap-2 p-4 pb-3">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-sm font-semibold text-red-300">{wrong.length} Issues Found</span>
              </div>
              <div className="space-y-0">
                {wrong.map((r) => <ErrorRow key={r.sr} r={r} />)}
              </div>
            </div>
          ) : (
            <div className="card-base border-emerald-500/30 text-center py-8">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-white">All {result.total_products} products verified!</p>
              <p className="text-xs text-slate-500 mt-1">Every discount & amount is correct.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ErrorRow({ r }: { r: VerifyResult }) {
  return (
    <div className="px-4 py-3 border-t border-surface-border/50">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <p className="text-xs font-medium text-white flex-1 leading-snug">{r.name}</p>
        {r.loss ? <span className="text-xs font-bold text-red-400 shrink-0">-{formatCurrency(r.loss)}</span> : null}
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="text-[10px] text-slate-500">MRP ₹{r.mrp}</span>
        <span className="text-[10px] text-slate-500">Rate ₹{r.rate}</span>
        <span className={cn("text-[10px] font-semibold", r.disc_match ? "text-emerald-400" : "text-red-400")}>
          Bill {r.bill_disc}% → Actual {r.calc_disc}%
        </span>
      </div>
    </div>
  );
}
