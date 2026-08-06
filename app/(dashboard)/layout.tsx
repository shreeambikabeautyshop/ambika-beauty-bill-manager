"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { FileText, Search, ShieldCheck, Package, History, Sparkles, Menu, X } from "lucide-react";
import { useState } from "react";

const NAV = [
  { href: "/bills",    icon: FileText,    label: "Upload",  mobileLabel: "Upload"  },
  { href: "/verify",   icon: ShieldCheck, label: "Verify",  mobileLabel: "Verify"  },
  { href: "/search",   icon: Search,      label: "Search",  mobileLabel: "Search"  },
  { href: "/products", icon: Package,     label: "Products",mobileLabel: "Products"},
  { href: "/history",  icon: History,     label: "History", mobileLabel: "History" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const path    = usePathname();
  const [open,  setOpen] = useState(false);
  const current = NAV.find(n => path === n.href || path.startsWith(n.href + "/"));

  return (
    <div className="flex min-h-screen bg-surface">

      {/* ── Desktop Sidebar ───────────────────────────────────────── */}
      <aside className="hidden lg:flex fixed top-0 left-0 h-full w-64 flex-col bg-surface-card border-r border-surface-border z-40">
        {/* Logo */}
        <div className="p-6 border-b border-surface-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 to-violet-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Ambika Beauty</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Bill Manager</p>
            </div>
          </div>
        </div>
        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV.map(({ href, icon: Icon, label }) => {
            const active = path === href || path.startsWith(href + "/");
            return (
              <Link key={href} href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all",
                  active
                    ? "bg-brand-600/20 border border-brand-500/30 text-white"
                    : "text-slate-400 hover:bg-surface-hover hover:text-white border border-transparent"
                )}>
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center",
                  active ? "bg-brand-600/40" : "bg-surface-border/60")}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">{label}</span>
                {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-400" />}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-surface-border">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-yellow-600/10 to-brand-600/10 border border-yellow-500/20">
            <Sparkles className="w-4 h-4 text-yellow-400 shrink-0" />
            <div><p className="text-xs font-semibold text-yellow-300">AI Powered</p>
              <p className="text-[10px] text-slate-500">Gemini + Groq</p></div>
          </div>
        </div>
      </aside>

      {/* ── Mobile Top Header ─────────────────────────────────────── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-surface-card/90 backdrop-blur-xl border-b border-surface-border px-4 flex items-center justify-between"
        style={{ height: "56px", paddingTop: "var(--safe-top)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-600 to-violet-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-xs font-bold text-white leading-tight">Ambika Beauty</p>
            <p className="text-[9px] text-slate-500">Bill Manager</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-emerald-300 font-medium">Live</span>
          </div>
        </div>
      </header>

      {/* ── Main Content ──────────────────────────────────────────── */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Desktop top bar */}
        <div className="hidden lg:flex sticky top-0 z-20 bg-surface-card/80 backdrop-blur-xl border-b border-surface-border px-6 py-4 items-center gap-3">
          <h1 className="text-base font-semibold text-white">{current?.label ?? "Dashboard"}</h1>
          <span className="text-slate-600">·</span>
          <p className="text-xs text-slate-500">Shree Ambika Beauty Shop</p>
        </div>

        {/* Page */}
        <main className="flex-1 px-4 lg:px-6 pb-safe pt-[72px] lg:pt-6">
          {children}
        </main>
      </div>

      {/* ── Mobile Bottom Navigation ──────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-surface-card/95 backdrop-blur-xl border-t border-surface-border"
        style={{ paddingBottom: "var(--safe-bottom)" }}>
        <div className="flex items-stretch">
          {NAV.map(({ href, icon: Icon, mobileLabel }) => {
            const active = path === href || path.startsWith(href + "/");
            return (
              <Link key={href} href={href}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-all active:scale-95 min-h-[60px]",
                  active ? "text-brand-400" : "text-slate-500"
                )}>
                <div className={cn(
                  "w-10 h-6 rounded-full flex items-center justify-center transition-all",
                  active ? "bg-brand-600/30" : ""
                )}>
                  <Icon className={cn("w-5 h-5 transition-all", active ? "text-brand-400" : "text-slate-500")} />
                </div>
                <span className={cn("text-[10px] font-medium", active ? "text-brand-400" : "text-slate-500")}>
                  {mobileLabel}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
