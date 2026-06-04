"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ReceiptText,
  Tags,
  Wallet,
  Target,
  PieChart,
  Settings,
  TrendingUp,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Transactions", href: "/transactions", icon: ReceiptText },
  { name: "Categories", href: "/categories", icon: Tags },
  { name: "Budgets", href: "/budgets", icon: Wallet },
  { name: "Goals", href: "/goals", icon: Target },
  { name: "Reports", href: "/reports", icon: PieChart },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div
      className="flex h-full w-64 flex-col"
      style={{
        background: "linear-gradient(180deg, #0d0d1a 0%, #0a0a0f 100%)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center px-5">
        <Link href="/" className="flex items-center gap-3 group">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #7c5cfc 0%, #c084fc 100%)",
              boxShadow: "0 4px 16px rgba(124, 92, 252, 0.4)",
            }}
          >
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-white">FinManage</span>
            <p className="text-[10px] text-purple-400/60 font-medium tracking-wider uppercase">Smart Finance</p>
          </div>
        </Link>
      </div>

      {/* Section label */}
      <div className="px-5 mb-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.25)" }}>
          Navigation
        </p>
      </div>

      {/* Nav items */}
      <div className="flex flex-1 flex-col overflow-y-auto px-3 pb-4">
        <nav className="flex-1 space-y-0.5">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn("sidebar-nav-item group", isActive && "active")}
              >
                <item.icon
                  className={cn(
                    "h-[18px] w-[18px] shrink-0 transition-colors",
                    isActive ? "text-violet-400" : "text-zinc-500 group-hover:text-zinc-300"
                  )}
                  aria-hidden="true"
                />
                <span className="flex-1">{item.name}</span>
                {isActive && (
                  <ChevronRight className="h-3.5 w-3.5 text-violet-400/60" />
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Bottom section */}
      <div className="px-3 pb-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="pt-4 mb-3">
          {/* Quick stats */}
          <div
            className="rounded-xl p-3 mb-3"
            style={{
              background: "linear-gradient(135deg, rgba(124,92,252,0.12) 0%, rgba(192,132,252,0.06) 100%)",
              border: "1px solid rgba(124,92,252,0.2)",
            }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-400/70 mb-1">
              Net Balance
            </p>
            <p className="text-lg font-bold text-white">$41,775.89</p>
            <p className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
              <span>↑</span> +20.1% this month
            </p>
          </div>
        </div>
        <Link
          href="/profile"
          className={cn("sidebar-nav-item group", pathname === "/profile" && "active")}
        >
          <Settings
            className={cn(
              "h-[18px] w-[18px] shrink-0",
              pathname === "/profile" ? "text-violet-400" : "text-zinc-500 group-hover:text-zinc-300"
            )}
          />
          <span>Profile Settings</span>
        </Link>
      </div>
    </div>
  )
}
