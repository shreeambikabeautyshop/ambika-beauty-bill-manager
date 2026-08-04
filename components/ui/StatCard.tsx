import { cn } from "@/lib/utils";

interface StatCardProps {
  label:    string;
  value:    string | number;
  icon:     React.ReactNode;
  trend?:   string;
  color?:   "brand" | "emerald" | "gold" | "red";
  className?: string;
}

const colorMap = {
  brand:   { bg: "from-brand-600/20 to-violet-600/10",  border: "border-brand-500/20",   icon: "bg-brand-600/30"   },
  emerald: { bg: "from-emerald-600/20 to-teal-600/10",  border: "border-emerald-500/20", icon: "bg-emerald-600/30" },
  gold:    { bg: "from-yellow-600/20 to-orange-600/10", border: "border-yellow-500/20",  icon: "bg-yellow-600/30"  },
  red:     { bg: "from-red-600/20 to-rose-600/10",      border: "border-red-500/20",     icon: "bg-red-600/30"     },
};

export default function StatCard({ label, value, icon, trend, color = "brand", className }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl p-5 border bg-gradient-to-br",
      c.bg, c.border, className
    )}>
      {/* Glow blob */}
      <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-white/5 blur-xl" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">{label}</p>
          <p className="text-2xl font-bold text-white truncate">{value}</p>
          {trend && <p className="text-xs text-slate-500 mt-1">{trend}</p>}
        </div>
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", c.icon)}>
          {icon}
        </div>
      </div>
    </div>
  );
}
