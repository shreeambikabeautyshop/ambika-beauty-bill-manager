"use client";

import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glass?: boolean;
  hover?: boolean;
}

export function Card({ children, className, glass = false, hover = false }: CardProps) {
  return (
    <div
      className={twMerge(
        clsx(
          "rounded-xl border border-gray-800 bg-gray-900 p-5",
          glass && "bg-gray-900/60 backdrop-blur-sm",
          hover && "transition-all duration-200 hover:border-violet-700/50 hover:bg-gray-800/80 hover:shadow-lg hover:shadow-violet-900/10",
          className
        )
      )}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  accent?: string;
}

export function StatCard({ title, value, icon, trend, trendUp, accent }: StatCardProps) {
  return (
    <Card hover className="relative overflow-hidden">
      <div
        className={clsx(
          "absolute right-0 top-0 h-24 w-24 rounded-full opacity-10 blur-2xl",
          accent ?? "bg-violet-600"
        )}
      />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-400">{title}</p>
          <p className="mt-2 text-2xl font-bold text-white">{value}</p>
          {trend && (
            <p
              className={clsx(
                "mt-1 text-xs font-medium",
                trendUp ? "text-emerald-400" : "text-red-400"
              )}
            >
              {trendUp ? "↑" : "↓"} {trend}
            </p>
          )}
        </div>
        <div className="rounded-lg bg-gray-800 p-2.5 text-violet-400">{icon}</div>
      </div>
    </Card>
  );
}
