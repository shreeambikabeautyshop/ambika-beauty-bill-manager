import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style:    "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  try {
    // Handle DD/MM/YYYY
    if (dateStr.includes("/")) {
      const [d, m, y] = dateStr.split("/");
      return new Date(`${y}-${m}-${d}`).toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
      });
    }
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function getDiscountColor(disc: number): string {
  if (disc >= 50) return "text-emerald-400";
  if (disc >= 40) return "text-green-400";
  if (disc >= 30) return "text-yellow-400";
  if (disc >= 20) return "text-orange-400";
  return "text-red-400";
}

export function getDiscountBadgeStyle(disc: number): string {
  if (disc >= 50) return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
  if (disc >= 40) return "bg-green-500/20 text-green-300 border-green-500/30";
  if (disc >= 30) return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
  if (disc >= 20) return "bg-orange-500/20 text-orange-300 border-orange-500/30";
  return "bg-red-500/20 text-red-300 border-red-500/30";
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload  = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]); // strip data:mime;base64,
    };
    reader.onerror = reject;
  });
}

export function calcDiscrepancy(mrp: number, rate: number, billDisc: number) {
  const calcDisc = mrp > 0 ? ((mrp - rate) / mrp) * 100 : 0;
  const diff     = Math.abs(calcDisc - billDisc);
  return { calcDisc: Math.round(calcDisc * 100) / 100, diff, match: diff < 0.15 };
}
