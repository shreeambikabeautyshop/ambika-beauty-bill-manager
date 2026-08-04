"use client";
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import { Upload, FileImage, Loader2, CheckCircle2, AlertCircle, Sparkles, ArrowRight } from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { Bill, Product } from "@/types";
import ProductTable from "@/components/bills/ProductTable";

type State = "idle" | "uploading" | "analyzing" | "done" | "error";

export default function BillsPage() {
  const [state,     setState]    = useState<State>("idle");
  const [preview,   setPreview]  = useState<string | null>(null);
  const [file,      setFile]     = useState<File | null>(null);
  const [bill,      setBill]     = useState<Partial<Bill> | null>(null);
  const [products,  setProducts] = useState<Product[]>([]);
  const [errorMsg,  setErrorMsg] = useState("");

  const onDrop = useCallback((accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    setFile(f);
    setPreview(f.type.startsWith("image/") ? URL.createObjectURL(f) : null);
    setState("idle");
    setBill(null);
    setProducts([]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg",".jpeg",".png",".webp"], "application/pdf": [".pdf"] },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024,
  });

  async function analyze() {
    if (!file) return;
    setState("analyzing");
    setErrorMsg("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res  = await fetch("/api/analyze-bill", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setBill(data.bill);
      setProducts(data.products);
      setState("done");
      toast.success(`✅ ${data.products.length} products extracted!`);
    } catch (e: unknown) {
      setState("error");
      const msg = e instanceof Error ? e.message : "Unknown error";
      setErrorMsg(msg);
      toast.error("Analysis failed: " + msg);
    }
  }

  async function saveToDB() {
    if (!bill || !products.length) return;
    const toastId = toast.loading("Saving to database...");
    try {
      const res  = await fetch("/api/analyze-bill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save", bill, products }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("✅ Bill saved successfully!", { id: toastId });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      toast.error("Save failed: " + msg, { id: toastId });
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-slide-up">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Upload & Analyze Bill</h2>
        <p className="text-sm text-slate-500 mt-1">AI extracts all products, prices, and discounts automatically</p>
      </div>

      {/* Upload Zone */}
      <div
        {...getRootProps()}
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300",
          isDragActive
            ? "border-brand-500 bg-brand-600/10 shadow-brand"
            : file
            ? "border-brand-500/50 bg-brand-600/5"
            : "border-surface-border hover:border-brand-500/50 hover:bg-surface-hover/50 bg-surface-card"
        )}
      >
        <input {...getInputProps()} />
        {preview ? (
          <div className="flex flex-col items-center gap-4">
            <img src={preview} alt="bill preview" className="max-h-48 rounded-xl shadow-card object-contain" />
            <p className="text-sm text-brand-300 font-medium">{file?.name}</p>
            <p className="text-xs text-slate-500">Click or drop to replace</p>
          </div>
        ) : file ? (
          <div className="flex flex-col items-center gap-3">
            <FileImage className="w-12 h-12 text-brand-400" />
            <p className="text-sm font-medium text-brand-300">{file.name}</p>
            <p className="text-xs text-slate-500">PDF ready for analysis</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-brand-600/20 flex items-center justify-center">
              <Upload className="w-8 h-8 text-brand-400" />
            </div>
            <div>
              <p className="text-base font-semibold text-white">Drop your bill here</p>
              <p className="text-sm text-slate-500 mt-1">or click to browse — PDF, JPG, PNG supported</p>
            </div>
            <p className="text-xs text-slate-600 bg-surface-hover px-3 py-1.5 rounded-full">Max 20MB</p>
          </div>
        )}
      </div>

      {/* Action */}
      {file && state !== "done" && (
        <div className="flex items-center gap-4">
          <button onClick={analyze} disabled={state === "analyzing"} className="btn-primary">
            {state === "analyzing" ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing with AI...</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Analyze Bill</>
            )}
          </button>
          {state === "error" && (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" /> {errorMsg}
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {state === "done" && bill && products.length > 0 && (
        <div className="space-y-4 animate-slide-up">
          {/* Bill summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Bill No",     value: bill.bill_no || "—" },
              { label: "Date",        value: formatDate(bill.bill_date || "") },
              { label: "Products",    value: products.length },
              { label: "Total",       value: formatCurrency(bill.total_amount || 0) },
            ].map(({ label, value }) => (
              <div key={label} className="card-base">
                <p className="text-xs text-slate-500 mb-1">{label}</p>
                <p className="text-lg font-bold text-white">{value}</p>
              </div>
            ))}
          </div>

          {/* Save button */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-emerald-400 text-sm">
              <CheckCircle2 className="w-4 h-4" />
              {products.length} products extracted
            </div>
            <button onClick={saveToDB} className="btn-primary ml-auto">
              Save to Database <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Products table */}
          <ProductTable products={products} />
        </div>
      )}
    </div>
  );
}
