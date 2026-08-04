"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, FileText, Search, ShieldCheck,
  Package, History, Sparkles, Menu, X, TrendingUp
} from "lucide-react";
import { useState } from "react";

const NAV = [
  { href: "/bills",    icon: FileText,       label: "Upload Bill",    desc: "Scan & save bills" },
  { href: "/verify",   icon: ShieldCheck,    label: "Verify Bill",    desc: "Check price accuracy" },
  { href: "/search",   icon: Search,         label: "Product Search", desc: "Find any product" },
  { href: "/products", icon: Package,        label: "All Products",   desc: "Full product database" },
  { href: "/history",  icon: History,        label: "Bill History",   desc: "Date-wise bill archive" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const path    = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 h-full w-64 z-40 flex flex-col transition-transform duration-300",
        "bg-surface-card border-r border-surface-border",
        open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Logo */}
        <div className="p-6 border-b border-surface-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center shadow-brand-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-tight">Ambika Beauty</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Bill Manager</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <p className="text-[10px] text-slate-600 uppercase tracking-widest px-3 mb-3">Navigation</p>
          {NAV.map(({ href, icon: Icon, label, desc }) => {
            const active = path === href || path.startsWith(href + "/");
            return (
              <Link key={href} href={href} onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group",
                  active
                    ? "bg-brand-600/20 border border-brand-500/30 text-white shadow-glow-sm"
                    : "text-slate-400 hover:bg-surface-hover hover:text-slate-200 border border-transparent"
                )}>
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                  active ? "bg-brand-600/40" : "bg-surface-border/60 group-hover:bg-surface-border"
                )}>
                  <Icon className={cn("w-4 h-4", active ? "text-brand-300" : "")} />
                </div>
                <div className="min-w-0">
                  <p className={cn("text-sm font-medium truncate", active ? "text-white" : "")}>{label}</p>
                  <p className="text-[10px] text-slate-600 truncate">{desc}</p>
                </div>
                {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-400" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-surface-border">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-gold-600/10 to-brand-600/10 border border-gold-500/20">
            <TrendingUp className="w-4 h-4 text-gold-400 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-gold-300">AI Powered</p>
              <p className="text-[10px] text-slate-500">Gemini + Groq</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-surface-card/80 backdrop-blur-xl border-b border-surface-border px-6 py-4 flex items-center gap-4">
          <button className="lg:hidden p-2 rounded-lg hover:bg-surface-hover transition-colors" onClick={() => setOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-semibold text-white">
              {NAV.find(n => path === n.href || path.startsWith(n.href + "/"))?.label ?? "Dashboard"}
            </h1>
            <p className="text-xs text-slate-500">Shree Ambika Beauty Shop</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-slate-500 hidden sm:block">System Online</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
