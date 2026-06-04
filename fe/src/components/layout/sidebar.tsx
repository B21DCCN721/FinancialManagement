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
  { name: "Tổng quan", href: "/", icon: LayoutDashboard },
  { name: "Giao dịch", href: "/transactions", icon: ReceiptText },
  { name: "Danh mục", href: "/categories", icon: Tags },
  { name: "Ngân sách", href: "/budgets", icon: Wallet },
  { name: "Mục tiêu", href: "/goals", icon: Target },
  { name: "Báo cáo", href: "/reports", icon: PieChart },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div
      className="flex h-full w-64 flex-col border-r border-border"
      style={{
        background: "var(--gradient-sidebar)",
      }}
    >
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center px-5">
        <Link href="/" className="flex items-center gap-3 group">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-105"
            style={{
              background: "var(--gradient-primary)",
              boxShadow: "var(--glow-primary)",
            }}
          >
            <TrendingUp className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-foreground">FinManage</span>
            <p className="text-[10px] text-primary/80 font-medium tracking-wider uppercase">Tài chính thông minh</p>
          </div>
        </Link>
      </div>

      {/* Section label */}
      <div className="px-5 mb-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
          Điều hướng
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
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )}
                  aria-hidden="true"
                />
                <span className="flex-1">{item.name}</span>
                {isActive && (
                  <ChevronRight className="h-3.5 w-3.5 text-primary/60" />
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Bottom section */}
      <div className="px-3 pb-4 border-t border-border">
        <div className="pt-4 mb-3">
          {/* Quick stats */}
          <div
            className="rounded-xl p-3 mb-3 bg-accent border border-primary/20"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-1">
              Số dư ròng
            </p>
            <p className="text-lg font-bold text-foreground">$41,775.89</p>
            <p className="text-[10px] text-success flex items-center gap-1 mt-0.5">
              <span>↑</span> +20.1% tháng này
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
              pathname === "/profile" ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
            )}
          />
          <span>Cài đặt tài khoản</span>
        </Link>
      </div>
    </div>
  )
}
