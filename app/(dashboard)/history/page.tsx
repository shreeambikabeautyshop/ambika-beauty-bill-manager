"use client";
import { useState, useEffect } from "react";
import { History, Calendar, Package, IndianRupee, ChevronRight, ExternalLink, Search, X } from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { Bill } from "@/types";

export default function HistoryPage() {
  const [bills,    setBills]   = useState<Bill[]>([]);
  const [loading,  setLoading] = useState(true);
  const [search,   setSearch]  = useState("");
  const [selected, setSelected]= useState<Bill | null>(null);

  useEffect(() => {
    fetch("/api/analyze-bill?action=list").then(r => r.json())
      .then(d => setBills(d.bills || []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = bills.filter(b =>
    b.bill_no?.toLowerCase().includes(search.toLowerCase()) ||
    b.supplier_name?.toLowerCase().includes(search.toLowerCase()) ||
    b.bill_date?.includes(search)
  );

  // Group by month
  const grouped = filtered.reduce<Record<string, Bill[]>>((acc, b) => {
    const key = b.bill_date ? b.bill_date.substring(0, 7) : "Unknown";
    if (!acc[key]) acc[key] = [];
    acc[key].push(b);
    return acc;
  }, {});

  return (
    <div className="space-y-4 animate-slide-up max-w-2xl mx-auto">
      <div>
        <h2 className="text-lg font-bold text-white">Bill History</h2>
        <p className="text-xs text-slate-500 mt-0.5">{bills.length} bills stored with photos</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search bill no, supplier, date..." className="input-base pl-9" />
        {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"><X className="w-3.5 h-3.5"/></button>}
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-20 rounded-2xl shimmer" />)}</div>
      ) : bills.length === 0 ? (
        <div className="card-base text-center py-16">
          <History className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No bills yet</p>
          <p className="text-xs text-slate-600 mt-1">Upload your first bill to see history</p>
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).sort(([a],[b]) => b.localeCompare(a)).map(([month, monthBills]) => (
            <div key={month}>
              <div className="flex items-center gap-2 mb-2 px-1">
                <Calendar className="w-3.5 h-3.5 text-brand-400" />
                <h3 className="text-xs font-semibold text-brand-300 uppercase tracking-wider">{month}</h3>
                <div className="flex-1 h-px bg-surface-border" />
                <span className="text-[10px] text-slate-600">{monthBills.length}</span>
              </div>
              <div className="space-y-2">
                {monthBills.map(bill => (
                  <button key={bill.id} onClick={() => setSelected(bill)}
                    className={cn("w-full text-left card-base p-3 flex items-center gap-3 active:bg-surface-hover transition-all",
                      selected?.id === bill.id && "border-brand-500/40")}>
                    {bill.image_url ? (
                      <img src={bill.image_url} alt="bill" className="w-12 h-12 rounded-xl object-cover border border-surface-border shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-surface-hover flex items-center justify-center shrink-0">
                        <History className="w-5 h-5 text-slate-600" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-white">Bill #{bill.bill_no}</p>
                        <span className="text-[10px] text-slate-600 bg-surface-hover px-1.5 py-0.5 rounded-md">{formatDate(bill.bill_date)}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{bill.supplier_name || "Unknown"}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] text-slate-600 flex items-center gap-1"><Package className="w-2.5 h-2.5"/>{bill.total_qty} items</span>
                        <span className="text-[10px] text-slate-600 flex items-center gap-1"><IndianRupee className="w-2.5 h-2.5"/>{formatCurrency(bill.total_amount)}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-700 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bill detail sheet */}
      {selected && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40 animate-fade-in" onClick={() => setSelected(null)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-surface-card rounded-t-3xl border-t border-surface-border overflow-y-auto max-h-[85vh] animate-slide-up"
            style={{ paddingBottom: "calc(80px + var(--safe-bottom))" }}>
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-surface-border" />
            </div>
            <div className="px-5 pb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white">Bill #{selected.bill_no}</h3>
                <button onClick={() => setSelected(null)} className="p-2 rounded-xl hover:bg-surface-hover text-slate-500">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {selected.image_url && (
                <div className="mb-4 rounded-2xl overflow-hidden border border-surface-border">
                  <img src={selected.image_url} alt="bill" className="w-full object-contain max-h-64" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  { label: "Date",     value: formatDate(selected.bill_date) },
                  { label: "Supplier", value: selected.supplier_name || "—" },
                  { label: "Products", value: selected.total_qty },
                  { label: "Amount",   value: formatCurrency(selected.total_amount) },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-surface-hover rounded-xl p-3">
                    <p className="text-[10px] text-slate-500 mb-0.5">{label}</p>
                    <p className="text-sm font-semibold text-white">{value}</p>
                  </div>
                ))}
              </div>
              {selected.image_url && (
                <a href={selected.image_url} target="_blank" rel="noreferrer" className="btn-secondary w-full">
                  <ExternalLink className="w-4 h-4" />View Full Image
                </a>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
