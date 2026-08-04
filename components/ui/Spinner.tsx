import { cn } from "@/lib/utils";

export default function Spinner({ className }: { className?: string }) {
  return (
    <div className={cn(
      "w-6 h-6 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin",
      className
    )} />
  );
}
