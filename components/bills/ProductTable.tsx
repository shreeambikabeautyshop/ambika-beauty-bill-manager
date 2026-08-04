"use client";
import { cn, formatCurrency, getDiscountBadgeStyle } from "@/lib/utils";
import type { Product } from "@/types";

export default function ProductTable({ products }: { products: Product[] }) {
  const total = products.reduce((s, p) => s + p.amount, 0);
  return (
    <div className="card-base p-0 overflow-hidden">
      <div className="px-4 py-3 border-b border-surface-border flex items-center justify-between">
        <span className="text-sm font-semibold text-white">{products.length} Products</span>
        <span className="text-sm font-bold text-white">{formatCurrency(total)}</span>
      </div>
      <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Sr</th><th>Product Name</th><th>Qty</th>
              <th>MRP</th><th>Rate</th><th>Disc%</th><th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p, i) => (
              <tr key={i}>
                <td className="text-slate-600 text-xs">{p.sr}</td>
                <td className="font-medium text-white">
                  <div className="max-w-xs truncate" title={p.name}>{p.name}</div>
                </td>
                <td><span className="bg-slate-700/60 text-slate-300 text-xs px-2 py-0.5 rounded">{p.qty}</span></td>
                <td className="text-slate-400">₹{p.mrp}</td>
                <td className="text-violet-300 font-semibold">₹{p.rate}</td>
                <td>
                  <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full border", getDiscountBadgeStyle(p.disc))}>
                    {p.disc}%
                  </span>
                </td>
                <td className="font-semibold text-white">{formatCurrency(p.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
