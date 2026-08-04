"use client";

import { clsx } from "clsx";
import {
  BarChart3,
  Upload,
  ShieldCheck,
  Search,
  Camera,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  X,
} from "lucide-react";

export type TabId = "dashboard" | "upload" | "verify" | "search" | "image-search";

interface NavItem {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const navItems: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <BarChart3 size={20} />,
    description: "Overview & stats",
  },
  {
    id: "upload",
    label: "Bill Upload",
    icon: <Upload size={20} />,
    description: "Analyze & save bills",
  },
  {
    id: "verify",
    label: "Bill Verify",
    icon: <ShieldCheck size={20} />,
    description: "Check price accuracy",
  },
  {
    id: "search",
    label: "Product Search",
    icon: <Search size={20} />,
    description: "Find products",
  },
  {
    id: "image-search",
    label: "Image Search",
    icon: <Camera size={20} />,
    description: "Search by photo",
  },
];

interface SidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  collapsed: boolean;
  onCollapsedChange: (v: boolean) => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({
  activeTab,
  onTabChange,
  collapsed,
  onCollapsedChange,
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  const handleTabChange = (tab: TabId) => {
    onTabChange(tab);
    onMobileClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          "fixed left-0 top-0 z-30 flex h-full flex-col bg-gray-950 border-r border-gray-800 transition-all duration-300",
          collapsed ? "w-16" : "w-64",
          // Mobile: slide in/out
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div
          className={clsx(
            "flex items-center border-b border-gray-800 px-4 py-5",
            collapsed ? "justify-center" : "justify-between"
          )}
        >
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-900/30">
                <Sparkles size={18} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-tight">Ambika Beauty</p>
                <p className="text-xs text-gray-500">Bill Manager</p>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-900/30">
              <Sparkles size={18} className="text-white" />
            </div>
          )}

          {/* Mobile close button */}
          <button
            onClick={onMobileClose}
            className="rounded-lg p-1 text-gray-500 hover:bg-gray-800 hover:text-white lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={clsx(
                "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-150",
                activeTab === item.id
                  ? "bg-violet-600/20 text-violet-300 shadow-sm"
                  : "text-gray-400 hover:bg-gray-800/70 hover:text-gray-200"
              )}
            >
              <span
                className={clsx(
                  "flex-shrink-0 transition-colors",
                  activeTab === item.id ? "text-violet-400" : "group-hover:text-gray-300"
                )}
              >
                {item.icon}
              </span>

              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.label}</p>
                  <p className="truncate text-xs text-gray-500">{item.description}</p>
                </div>
              )}

              {!collapsed && activeTab === item.id && (
                <div className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-violet-400" />
              )}
            </button>
          ))}
        </nav>

        {/* Collapse toggle (desktop only) */}
        <div className="hidden border-t border-gray-800 p-2 lg:block">
          <button
            onClick={() => onCollapsedChange(!collapsed)}
            className="flex w-full items-center justify-center rounded-lg py-2 text-gray-500 transition-colors hover:bg-gray-800 hover:text-gray-300"
          >
            {collapsed ? <ChevronRight size={18} /> : (
              <span className="flex items-center gap-2 text-xs">
                <ChevronLeft size={18} />
                Collapse
              </span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
