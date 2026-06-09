"use client"

import * as React from "react"
import Link from "next/link"
import { useTranslation } from "react-i18next"
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
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useGetReportSummaryQuery } from "@/services/reportsApi"

function currentPeriod() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

const navigation = [
  { nameKey: "dashboard", href: "/", icon: LayoutDashboard },
  { nameKey: "transactions", href: "/transactions", icon: ReceiptText },
  { nameKey: "categories", href: "/categories", icon: Tags },
  { nameKey: "budgets", href: "/budgets", icon: Wallet },
  { nameKey: "goals", href: "/goals", icon: Target },
  { nameKey: "reports", href: "/reports", icon: PieChart },
]

export function Sidebar() {
  const pathname = usePathname()
  const { t } = useTranslation()
  const { data: summary, isLoading } = useGetReportSummaryQuery({ period: currentPeriod() })

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
            <p className="text-[10px] text-primary/80 font-medium tracking-wider uppercase">Finance</p>
          </div>
        </Link>
      </div>

      {/* Section label */}
      <div className="px-5 mb-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
          {t("sidebar.navigation")}
        </p>
      </div>

      {/* Nav items */}
      <div className="flex flex-1 flex-col overflow-y-auto px-3 pb-4">
        <nav className="flex-1 space-y-0.5">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.nameKey}
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
                <span className="flex-1">{t(`sidebar.${item.nameKey}`)}</span>
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
              {t("sidebar.netBalance")}
            </p>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mt-2 mb-1" />
            ) : (
              <p className="text-lg font-bold text-foreground">
                {(summary?.netBalance ?? 0).toLocaleString("vi-VN")} ₫
              </p>
            )}
            <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
              {t("sidebar.thisMonth")}
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
          <span>{t("sidebar.settings")}</span>
        </Link>
      </div>
    </div>
  )
}
