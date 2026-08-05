import { cn } from "@/lib/utils";

interface SpinnerProps { className?: string; }

export function Spinner({ className }: SpinnerProps) {
  return (
    <div className={cn(
      "w-6 h-6 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin",
      className
    )} />
  );
}

export default Spinner;
