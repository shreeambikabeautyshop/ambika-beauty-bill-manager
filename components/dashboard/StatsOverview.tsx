"use client";
import { useEffect, useState } from "react";
import { FileText, Package, IndianRupee, TrendingDown } from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import { formatCurrency } from "@/lib/utils";
import type { DashboardStats } from "@/types";

export default function StatsOverview() {
  const [stats,   setStats]   = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/analyze-bill?action=list").then(r => r.json()),
      fetch("/api/search?q=&all=1").then(r => r.json()),
    ]).then(([billsData, productsData]) => {
      const bills    = billsData.bills    || [];
      const products = productsData.products || [];
      setStats({
        total_bills:           bills.length,
        total_products:        products.length,
        total_amount:          bills.reduce((s: number, b: { total_amount: number }) => s + (b.total_amount || 0), 0),
        total_loss_identified: 0,
        latest_bill_date:      bills[0]?.bill_date || "—",
      });
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="h-28 rounded-2xl shimmer" />)}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Total Bills"    value={stats?.total_bills    ?? 0}
        icon={<FileText className="w-5 h-5 text-brand-300"/>}   color="brand"   />
      <StatCard label="Total Products" value={stats?.total_products ?? 0}
        icon={<Package  className="w-5 h-5 text-emerald-300"/>} color="emerald" />
      <StatCard label="Total Value"    value={formatCurrency(stats?.total_amount ?? 0)}
        icon={<IndianRupee className="w-5 h-5 text-yellow-300"/>} color="gold"  />
      <StatCard label="Loss Found"     value={formatCurrency(stats?.total_loss_identified ?? 0)}
        icon={<TrendingDown className="w-5 h-5 text-red-300"/>} color="red"     />
    </div>
  );
}
