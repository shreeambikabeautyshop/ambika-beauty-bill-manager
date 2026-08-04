import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "error" | "gold";
  className?: string;
}

const variants = {
  default: "bg-slate-700/60 text-slate-300 border-slate-600/40",
  success: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  warning: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  error:   "bg-red-500/20 text-red-300 border-red-500/30",
  gold:    "bg-yellow-500/15 text-yellow-300 border-yellow-500/25",
};

export default function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border",
      variants[variant], className
    )}>
      {children}
    </span>
  );
}
