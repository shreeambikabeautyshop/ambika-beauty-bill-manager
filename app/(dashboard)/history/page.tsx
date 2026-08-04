"use client";
import { useState, useEffect } from "react";
import { History, Calendar, Package, IndianRupee, ChevronRight, ExternalLink, Search } from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { Bill } from "@/types";

export default function HistoryPage() {
  const [bills,     setBills]   = useState<Bill[]>([]);
  const [loading,   setLoading] = useState(true);
  const [search,    setSearch]  = useState("");
  const [selected,  setSelected]= useState<Bill | null>(null);

  useEffect(() => {
    fetch("/api/analyze-bill?action=list")
      .then(r => r.json())
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
    const key = b.bill_date ? b.bill_date.substring(3) : "Unknown"; // MM/YYYY
    if (!acc[key]) acc[key] = [];
    acc[key].push(b);
    return acc;
  }, {});

  return (
    <div className="max-w-5xl mx-auto space-y-5 animate-slide-up">
      <div>
        <h2 className="text-2xl font-bold text-white">Bill History</h2>
        <p className="text-sm text-slate-500 mt-1">Date-wise archive of all bills with Cloudinary storage</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by bill no, supplier, or date..."
          className="input-base w-full pl-10" />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="card-base h-20 shimmer" />)}
        </div>
      ) : bills.length === 0 ? (
        <div className="card-base text-center py-16">
          <History className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500">No bills uploaded yet.</p>
          <p className="text-xs text-slate-600 mt-1">Upload your first bill to see history here.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).sort(([a],[b]) => b.localeCompare(a)).map(([month, monthBills]) => (
            <div key={month}>
              <div className="flex items-center gap-3 mb-3">
                <Calendar className="w-4 h-4 text-brand-400" />
                <h3 className="text-sm font-semibold text-brand-300">{month}</h3>
                <div className="flex-1 h-px bg-surface-border" />
                <span className="text-xs text-slate-600">{monthBills.length} bill{monthBills.length > 1 ? "s" : ""}</span>
              </div>
              <div className="space-y-2">
                {monthBills.map(bill => (
                  <BillCard key={bill.id} bill={bill} onSelect={setSelected}
                    selected={selected?.id === bill.id} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bill detail panel */}
      {selected && (
        <div className="fixed inset-y-0 right-0 w-full max-w-md bg-surface-card border-l border-surface-border shadow-card z-50 overflow-y-auto animate-slide-up">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">Bill #{selected.bill_no}</h3>
              <button onClick={() => setSelected(null)}
                className="text-slate-500 hover:text-white p-2 rounded-lg hover:bg-surface-hover transition-colors">✕</button>
            </div>
            {selected.image_url && (
              <div className="mb-4 rounded-xl overflow-hidden border border-surface-border">
                <img src={selected.image_url} alt="bill" className="w-full object-contain max-h-80" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label: "Date",     value: formatDate(selected.bill_date) },
                { label: "Supplier", value: selected.supplier_name || "—" },
                { label: "Products", value: selected.total_qty },
                { label: "Amount",   value: formatCurrency(selected.total_amount) },
              ].map(({ label, value }) => (
                <div key={label} className="bg-surface-hover rounded-xl p-3">
                  <p className="text-xs text-slate-500 mb-1">{label}</p>
                  <p className="text-sm font-semibold text-white">{value}</p>
                </div>
              ))}
            </div>
            {selected.image_url && (
              <a href={selected.image_url} target="_blank" rel="noreferrer"
                className="btn-secondary w-full justify-center">
                <ExternalLink className="w-4 h-4" /> View Full Image
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function BillCard({ bill, onSelect, selected }: {
  bill: Bill; onSelect: (b: Bill) => void; selected: boolean;
}) {
  return (
    <button onClick={() => onSelect(bill)} className={cn(
      "w-full text-left card-base hover:border-brand-500/30 transition-all flex items-center gap-4 p-4",
      selected ? "border-brand-500/50 bg-brand-600/5" : ""
    )}>
      {bill.image_url ? (
        <img src={bill.image_url} alt="bill thumb" className="w-12 h-12 rounded-lg object-cover border border-surface-border shrink-0" />
      ) : (
        <div className="w-12 h-12 rounded-lg bg-surface-hover flex items-center justify-center shrink-0">
          <History className="w-5 h-5 text-slate-600" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-white">Bill #{bill.bill_no}</p>
          <span className="text-xs text-slate-600 bg-surface-hover px-2 py-0.5 rounded-full">
            {formatDate(bill.bill_date)}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">{bill.supplier_name || "Unknown Supplier"}</p>
        <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-600">
          <span className="flex items-center gap-1"><Package className="w-3 h-3"/>{bill.total_qty} items</span>
          <span className="flex items-center gap-1"><IndianRupee className="w-3 h-3"/>{formatCurrency(bill.total_amount)}</span>
        </div>
      </div>
      <ChevronRight className={cn("w-4 h-4 transition-colors shrink-0", selected ? "text-brand-400" : "text-slate-700")} />
    </button>
  );
}
