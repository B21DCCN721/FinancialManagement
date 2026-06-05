/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState } from "react"
import { ArrowDownRight, ArrowUpRight, Wallet, TrendingUp, TrendingDown, Sparkles, Loader2, MoreHorizontal } from "lucide-react"
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts"
import Link from "next/link"
import { useGetTransactionsQuery } from "@/services/transactionsApi"
import { useGetMonthlyTrendQuery, useGetCategoryBreakdownQuery, useGetReportSummaryQuery } from "@/services/reportsApi"
import { MonthPicker } from "@/components/ui/month-picker"

function currentPeriod() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

const CHART_COLORS = ["#7c5cfc", "#10d9a0", "#ff4d6d", "#f59e0b", "#38bdf8", "#a78bfa", "#34d399"]


const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl p-3 text-sm bg-popover text-popover-foreground border border-border shadow-lg">
        <p className="font-semibold mb-2">{label}</p>
        {payload.map((entry) => (
          <p key={entry.name} className="flex items-center gap-2" style={{ color: entry.color }}>
            <span className="h-2 w-2 rounded-full inline-block" style={{ background: entry.color }} />
            {entry.name}: {entry.value.toLocaleString()} ₫
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function Dashboard() {
  const [period, setPeriod] = useState(currentPeriod())

  const VI_MONTHS = [
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4",
    "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8",
    "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
  ]
  const periodM = parseInt(period.split("-")[1], 10)
  const periodYStr = period.split("-")[0]
  const selectedMonthLabel = VI_MONTHS[periodM - 1]

  const { data, isLoading } = useGetTransactionsQuery({ page: 1, limit: 5 })
  const { data: summary } = useGetReportSummaryQuery({ period })
  const { data: trend = [], isLoading: isTrendLoading } = useGetMonthlyTrendQuery({ months: 6 })
  const { data: breakdown = [], isLoading: isBreakdownLoading } = useGetCategoryBreakdownQuery({ period })

  const transactions = data?.data ?? []

  const totalIncome = summary?.totalIncome ?? transactions.filter(tx => tx.type === "income").reduce((acc, tx) => acc + tx.amount, 0)
  const totalExpense = summary?.totalExpense ?? transactions.filter(tx => tx.type === "expense").reduce((acc, tx) => acc + tx.amount, 0)
  const totalBalance = summary?.netBalance ?? (totalIncome - totalExpense)

  // Map trend data to chart format
  const monthlyData = trend.map(d => ({
    name: (() => { const [, m] = d.period.split("-"); return `Thg ${parseInt(m)}` })(),
    income: d.income,
    expense: d.expense,
  }))

  // Map breakdown data to pie chart format
  const categoryData = breakdown.map((item, i) => ({
    name: item.categoryName,
    value: item.totalAmount,
    color: item.categoryColor ?? CHART_COLORS[i % CHART_COLORS.length],
  }))

  const stats = [
    {
      label: "Tổng số dư",
      value: `${totalBalance.toLocaleString("vi-VN")} ₫`,
      changeLabel: "dựa trên giao dịch gần đây",
      positive: totalBalance >= 0,
      icon: Wallet,
      className: "stat-card-primary",
      iconBg: "rgba(124,92,252,0.2)",
      iconColor: "#7c5cfc",
    },
    {
      label: "Tổng thu nhập",
      value: `${totalIncome.toLocaleString("vi-VN")} ₫`,
      changeLabel: "dựa trên giao dịch gần đây",
      positive: true,
      icon: TrendingUp,
      className: "stat-card-income",
      iconBg: "rgba(16,217,160,0.15)",
      iconColor: "#10d9a0",
    },
    {
      label: "Tổng chi phí",
      value: `${totalExpense.toLocaleString("vi-VN")} ₫`,
      changeLabel: "dựa trên giao dịch gần đây",
      positive: false,
      icon: TrendingDown,
      className: "stat-card-expense",
      iconBg: "rgba(255,77,109,0.15)",
      iconColor: "#ff4d6d",
    },
  ]

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })
    } catch { return dateStr }
  }

  return (
    <div className="space-y-6 py-2">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Tổng quan</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-accent text-primary border border-primary/20">
              Trực tiếp
            </span>
          </div>
          <p className="text-sm text-muted-foreground">Tổng quan tài chính của bạn trong {selectedMonthLabel.toLowerCase()}, {periodYStr}</p>
        </div>
        <div className="flex items-center gap-2">
          <MonthPicker value={period} onChange={setPeriod} />
          <button className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105 bg-primary text-primary-foreground shadow-[0_4px_15px_rgba(124,92,252,0.4)]">
            <Sparkles className="h-4 w-4" />
            Báo cáo AI
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className={`rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02] ${stat.className}`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
              <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: stat.iconBg }}>
                <stat.icon className="h-4 w-4" style={{ color: stat.iconColor }} />
              </div>
            </div>
            <div className="text-2xl font-bold mb-1.5 tracking-tight text-foreground">
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : stat.value}
            </div>
            <div className="flex items-center gap-1.5">
              {stat.positive ? (
                <ArrowUpRight className="h-3.5 w-3.5 text-success" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5 text-danger" />
              )}
              <span className="text-xs text-muted-foreground">{stat.changeLabel}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Bar chart */}
        <div className="col-span-4 rounded-2xl p-5 glass-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Thu nhập và Chi phí</h3>
              <p className="text-xs mt-0.5 text-muted-foreground">Tổng quan dòng tiền hàng tháng</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-sm" style={{ background: "#10d9a0" }} />
                <span className="text-xs text-muted-foreground">Thu nhập</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-sm" style={{ background: "#ff4d6d" }} />
                <span className="text-xs text-muted-foreground">Chi phí</span>
              </div>
              <button className="text-muted-foreground hover:text-foreground transition-colors">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="h-[260px]">
            {isTrendLoading ? (
              <div className="h-full flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : monthlyData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">Chưa có dữ liệu</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" vertical={false} />
                  <XAxis dataKey="name" stroke="currentColor" className="text-muted-foreground" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="currentColor" className="text-muted-foreground" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k ₫`} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "currentColor", className: "text-muted opacity-10", radius: 4 }} />
                  <Bar dataKey="income" name="Thu nhập" fill="#10d9a0" radius={[6, 6, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="expense" name="Chi phí" fill="#ff4d6d" radius={[6, 6, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Pie chart */}
        <div className="col-span-3 rounded-2xl p-5 glass-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Chi phí theo danh mục</h3>
              <p className="text-xs mt-0.5 text-muted-foreground">Tiền của bạn đã đi đâu</p>
            </div>
            <button className="text-muted-foreground hover:text-foreground transition-colors">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
          <div className="flex flex-col items-center">
            {isBreakdownLoading ? (
              <div className="h-[180px] flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : categoryData.length === 0 ? (
              <div className="h-[180px] flex items-center justify-center text-xs text-muted-foreground">Chưa có dữ liệu</div>
            ) : (
              <>
                <div className="h-[180px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value" strokeWidth={0}>
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid var(--border)", backgroundColor: "var(--popover)", boxShadow: "0 10px 40px rgba(0,0,0,0.1)", color: "var(--popover-foreground)", fontSize: "12px" }} formatter={(v: any) => [`${Number(v).toLocaleString("vi-VN")} ₫`]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full space-y-2 mt-2">
                  {categoryData.map((entry) => {
                    const maxVal = Math.max(...categoryData.map(e => e.value), 1)
                    return (
                      <div key={entry.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full shrink-0" style={{ background: entry.color }} />
                          <span className="text-xs text-muted-foreground">{entry.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-1 rounded-full" style={{ width: `${(entry.value / maxVal) * 60}px`, background: entry.color, opacity: 0.5 }} />
                          <span className="text-xs font-medium text-foreground">{entry.value.toLocaleString("vi-VN")} ₫</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Recent transactions + area chart */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Area chart */}
        <div className="lg:col-span-2 rounded-2xl p-5 glass-card">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground">Xu hướng tiết kiệm</h3>
            <p className="text-xs mt-0.5 text-muted-foreground">Tiết kiệm ròng trong 6 tháng</p>
          </div>
          <div className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData.map((d) => ({ ...d, savings: d.income - d.expense }))} margin={{ top: 5, right: 5, left: -30, bottom: 5 }}>
                <defs>
                  <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c5cfc" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7c5cfc" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" vertical={false} />
                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} stroke="currentColor" className="text-muted-foreground" />
                <YAxis fontSize={10} tickLine={false} axisLine={false} stroke="currentColor" className="text-muted-foreground" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k ₫`} />
                <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid var(--border)", backgroundColor: "var(--popover)", color: "var(--popover-foreground)", fontSize: "12px" }} />
                <Area type="monotone" dataKey="savings" name="Tiết kiệm" stroke="#7c5cfc" strokeWidth={2} fill="url(#savingsGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent transactions */}
        <div className="lg:col-span-3 rounded-2xl p-5 glass-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Giao dịch gần đây</h3>
              <p className="text-xs mt-0.5 text-muted-foreground">Các giao dịch mới nhất</p>
            </div>
            <Link href="/transactions" className="text-xs font-medium px-3 py-1 rounded-lg transition-all hover:scale-105 bg-accent text-primary border border-primary/20">
              Xem tất cả
            </Link>
          </div>
          <div className="space-y-2">
            {isLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : transactions.length > 0 ? (
              transactions.map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 p-3 rounded-xl transition-all hover:scale-[1.01] bg-card border border-border">
                  <div className="h-9 w-9 rounded-xl flex items-center justify-center text-base shrink-0 bg-secondary">
                    {tx.category?.icon ?? "📝"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{tx.description ?? "—"}</p>
                    <p className="text-xs truncate text-muted-foreground">
                      {tx.category?.name ?? tx.categoryId} · {formatDate(tx.date)}
                    </p>
                  </div>
                  <div className="text-sm font-bold shrink-0" style={{ color: tx.type === "income" ? "var(--success)" : "var(--danger)" }}>
                    {tx.type === "income" ? "+" : "-"}{Math.abs(tx.amount).toLocaleString()} ₫
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-sm text-muted-foreground">Chưa có giao dịch nào</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
