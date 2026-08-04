"use client";

import { useEffect, useState } from "react";
import { BarChart3, Package, IndianRupee, Receipt, TrendingUp, Clock } from "lucide-react";
import { Card, StatCard } from "./ui/Card";
import { PageLoader } from "./ui/LoadingSpinner";

interface DashboardStats {
  totalBills: number;
  totalProducts: number;
  totalAmount: number;
  lastBill: {
    bill_no: string;
    supplier_name: string;
    bill_date: string;
    total_amount: number;
  } | null;
  recentBills: Array<{
    bill_no: string;
    supplier_name: string;
    bill_date: string;
    total_amount: number;
  }>;
}

interface RecentProduct {
  id: string;
  name: string;
  qty: number;
  mrp: number;
  rate: number;
  disc: number;
  amount: number;
  bills: {
    bill_no: string;
    supplier_name: string;
    bill_date: string;
  } | null;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentProducts, setRecentProducts] = useState<RecentProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsRes, productsRes] = await Promise.all([
          fetch("/api/dashboard"),
          fetch("/api/search?q=&limit=15"),
        ]);

        if (!statsRes.ok) throw new Error("Failed to load stats");

        const statsData = await statsRes.json();
        setStats(statsData);

        if (productsRes.ok) {
          const productsData = await productsRes.json();
          setRecentProducts(productsData.results ?? []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) return <PageLoader label="Loading dashboard..." />;

  if (error) {
    return (
      <div className="rounded-xl border border-red-800/50 bg-red-900/10 p-6 text-center">
        <p className="text-red-400">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 text-sm text-violet-400 hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-400">Overview of your cosmetic bill records</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Total Bills"
          value={stats?.totalBills ?? 0}
          icon={<Receipt size={20} />}
          accent="bg-violet-600"
        />
        <StatCard
          title="Total Products"
          value={stats?.totalProducts ?? 0}
          icon={<Package size={20} />}
          accent="bg-indigo-600"
        />
        <StatCard
          title="Total Amount"
          value={formatCurrency(stats?.totalAmount ?? 0)}
          icon={<IndianRupee size={20} />}
          accent="bg-emerald-600"
        />
        <StatCard
          title="Avg Per Bill"
          value={
            stats?.totalBills
              ? formatCurrency((stats.totalAmount ?? 0) / stats.totalBills)
              : "₹0"
          }
          icon={<TrendingUp size={20} />}
          accent="bg-blue-600"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Bills */}
        <Card className="lg:col-span-1">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
              <Clock size={16} className="text-violet-400" />
              Recent Bills
            </h2>
          </div>
          <div className="space-y-3">
            {(stats?.recentBills ?? []).length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-500">No bills yet</p>
            ) : (
              (stats?.recentBills ?? []).map((bill, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg bg-gray-800/50 px-3 py-2.5"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{bill.bill_no}</p>
                    <p className="text-xs text-gray-500">{bill.supplier_name ?? "Unknown"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-violet-400">
                      {formatCurrency(bill.total_amount ?? 0)}
                    </p>
                    <p className="text-xs text-gray-500">{bill.bill_date ?? "-"}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Recent Products Table */}
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 size={16} className="text-violet-400" />
            <h2 className="text-sm font-semibold text-white">Recent Products</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="pb-2 text-left font-medium text-gray-500">Product</th>
                  <th className="pb-2 text-right font-medium text-gray-500">MRP</th>
                  <th className="pb-2 text-right font-medium text-gray-500">Rate</th>
                  <th className="pb-2 text-right font-medium text-gray-500">Disc%</th>
                  <th className="pb-2 text-right font-medium text-gray-500">Qty</th>
                  <th className="pb-2 text-right font-medium text-gray-500">Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-gray-500">
                      No products found. Upload a bill to get started.
                    </td>
                  </tr>
                ) : (
                  recentProducts.map((product) => (
                    <tr
                      key={product.id}
                      className="border-b border-gray-800/50 transition-colors hover:bg-gray-800/30"
                    >
                      <td className="py-2.5 pr-4">
                        <p className="font-medium text-gray-200 line-clamp-1">{product.name}</p>
                        <p className="text-gray-500">{product.bills?.supplier_name ?? ""}</p>
                      </td>
                      <td className="py-2.5 text-right text-gray-300">₹{product.mrp ?? "-"}</td>
                      <td className="py-2.5 text-right text-gray-300">₹{product.rate ?? "-"}</td>
                      <td className="py-2.5 text-right">
                        <span className="font-medium text-emerald-400">{product.disc ?? 0}%</span>
                      </td>
                      <td className="py-2.5 text-right text-gray-400">{product.qty ?? "-"}</td>
                      <td className="py-2.5 text-right font-medium text-white">
                        ₹{product.amount ?? "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
