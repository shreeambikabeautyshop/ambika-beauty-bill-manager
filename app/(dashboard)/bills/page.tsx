"use client";
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import { Upload, FileImage, Loader2, CheckCircle2, Sparkles, ArrowRight, X, IndianRupee, Package, Calendar, Hash } from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { Bill, Product } from "@/types";
import ProductTable from "@/components/bills/ProductTable";

type State = "idle" | "analyzing" | "done" | "error";

export default function BillsPage() {
  const [state,    setState]   = useState<State>("idle");
  const [preview,  setPreview] = useState<string | null>(null);
  const [file,     setFile]    = useState<File | null>(null);
  const [bill,     setBill]    = useState<Partial<Bill> | null>(null);
  const [products, setProducts]= useState<Product[]>([]);
  const [saving,   setSaving]  = useState(false);

  const onDrop = useCallback((accepted: File[]) => {
    const f = accepted[0]; if (!f) return;
    setFile(f);
    setPreview(f.type.startsWith("image/") ? URL.createObjectURL(f) : null);
    setState("idle"); setBill(null); setProducts([]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { "image/*": [], "application/pdf": [".pdf"] }, maxFiles: 1, maxSize: 20 * 1024 * 1024,
  });

  async function analyze() {
    if (!file) return;
    setState("analyzing");
    try {
      const fd = new FormData(); fd.append("file", file);
      const res  = await fetch("/api/analyze-bill", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setBill(data.bill); setProducts(data.products); setState("done");
      toast.success(`${data.products.length} products extracted!`);
    } catch (e: unknown) {
      setState("error");
      toast.error(e instanceof Error ? e.message : "Analysis failed");
    }
  }

  async function save() {
    if (!bill || !products.length) return;
    setSaving(true);
    const tid = toast.loading("Saving...");
    try {
      const res  = await fetch("/api/analyze-bill", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save", bill, products }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Bill saved!", { id: tid });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Save failed", { id: tid });
    }
    setSaving(false);
  }

  function reset() { setFile(null); setPreview(null); setState("idle"); setBill(null); setProducts([]); }

  return (
    <div className="space-y-4 animate-slide-up max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Upload Bill</h2>
          <p className="text-xs text-slate-500 mt-0.5">AI extracts all products automatically</p>
        </div>
        {file && <button onClick={reset} className="text-slate-500 hover:text-white p-1.5 rounded-lg hover:bg-surface-hover transition-colors"><X className="w-4 h-4"/></button>}
      </div>

      {/* Upload Zone */}
      {!file ? (
        <div {...getRootProps()} className={cn(
          "border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all",
          isDragActive ? "border-brand-500 bg-brand-600/10" : "border-surface-border hover:border-brand-500/50 bg-surface-card active:bg-surface-hover"
        )}>
          <input {...getInputProps()} />
          <div className="w-16 h-16 rounded-2xl bg-brand-600/20 flex items-center justify-center mx-auto mb-4">
            <Upload className="w-8 h-8 text-brand-400" />
          </div>
          <p className="text-base font-semibold text-white mb-1">Tap to upload bill</p>
          <p className="text-sm text-slate-500">PDF, JPG, PNG — Max 20MB</p>
        </div>
      ) : (
        <div className="card-base">
          {preview ? (
            <img src={preview} alt="bill" className="w-full max-h-52 object-contain rounded-xl mb-3" />
          ) : (
            <div className="flex items-center gap-3 mb-3 p-3 bg-surface-hover rounded-xl">
              <FileImage className="w-8 h-8 text-brand-400 shrink-0" />
              <div className="min-w-0"><p className="text-sm font-medium text-white truncate">{file.name}</p>
                <p className="text-xs text-slate-500">{(file.size/1024).toFixed(0)} KB</p></div>
            </div>
          )}
          {state !== "done" && (
            <button onClick={analyze} disabled={state === "analyzing"} className="btn-primary w-full">
              {state === "analyzing"
                ? <><Loader2 className="w-4 h-4 animate-spin"/>Analyzing with AI...</>
                : <><Sparkles className="w-4 h-4"/>Analyze Bill</>}
            </button>
          )}
          {state === "error" && <p className="text-xs text-red-400 mt-2 text-center">Analysis failed. Try again.</p>}
        </div>
      )}

      {/* Results */}
      {state === "done" && bill && (
        <div className="space-y-3 animate-slide-up">
          {/* Bill stats */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Hash,         label: "Bill No",   value: bill.bill_no || "—" },
              { icon: Calendar,     label: "Date",      value: formatDate(bill.bill_date || "") },
              { icon: Package,      label: "Products",  value: products.length },
              { icon: IndianRupee,  label: "Total",     value: formatCurrency(bill.total_amount || 0) },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="card-base flex items-center gap-3 p-3">
                <div className="w-8 h-8 rounded-lg bg-brand-600/20 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-brand-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-500">{label}</p>
                  <p className="text-sm font-bold text-white truncate">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Save button */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs flex-1">
              <CheckCircle2 className="w-3.5 h-3.5" />{products.length} products ready
            </div>
            <button onClick={save} disabled={saving} className="btn-primary flex-1">
              {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : <ArrowRight className="w-4 h-4"/>}
              Save to DB
            </button>
          </div>

          {/* Products table */}
          <ProductTable products={products} />
        </div>
      )}
    </div>
  );
}
