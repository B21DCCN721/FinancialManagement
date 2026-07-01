/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useRef } from "react"
import { DynamicIcon } from "@/components/ui/dynamic-icon"
import { ArrowDownRight, ArrowUpRight, Wallet, TrendingUp, TrendingDown, PiggyBank, Sparkles, Loader2, MoreHorizontal, Download, ReceiptText } from "lucide-react"
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
import { useGetMonthlyTrendQuery, useGetCategoryBreakdownQuery, useGetReportSummaryQuery, useGetBalanceQuery, useLazyGetAiInsightsQuery } from "@/services/reportsApi"
import { useGetGoalsQuery } from "@/services/goalsApi"
import { MonthPicker } from "@/components/ui/month-picker"
import { Modal } from "@/components/ui/modal"
import { SkeletonStat, SkeletonChart, SkeletonRow } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { useCountUp } from "@/hooks/useCountUp"
import { formatCurrencyAxis } from "@/lib/format"
import ReactMarkdown from "react-markdown"
import { useTranslation } from "react-i18next"

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
            {entry.name}: {entry.value.toLocaleString("vi-VN")} ₫
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function Dashboard() {
  const { t } = useTranslation()
  const [period, setPeriod] = useState(currentPeriod())
  const [isAiModalOpen, setIsAiModalOpen] = useState(false)
  const reportRef = useRef<HTMLDivElement>(null)

  const [triggerAi, { data: aiData, isFetching: isAiFetching }] = useLazyGetAiInsightsQuery()

  const handleOpenAiModal = () => {
    setIsAiModalOpen(true)
    triggerAi({ period })
  }

  const handleDownloadPdf = async () => {
    if (!reportRef.current) return
    try {
      const html2pdf = (await import("html2pdf.js")).default
      const opt = {
        margin: [15, 15] as [number, number],
        filename: `Bao_Cao_Tai_Chinh_${period}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
      }
      html2pdf().set(opt).from(reportRef.current).save()
    } catch (error) {
      console.error("Lỗi xuất PDF", error)
    }
  }

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
  const { data: balance } = useGetBalanceQuery()
  const { data: trend = [], isLoading: isTrendLoading } = useGetMonthlyTrendQuery({ months: 6 })
  const { data: breakdown = [], isLoading: isBreakdownLoading } = useGetCategoryBreakdownQuery({ period })
  const { data: goals = [] } = useGetGoalsQuery()

  const transactions = data?.data ?? []

  const totalIncome = summary?.totalIncome ?? transactions.filter(tx => tx.type === "income").reduce((acc, tx) => acc + tx.amount, 0)
  const totalExpense = summary?.totalExpense ?? transactions.filter(tx => tx.type === "expense").reduce((acc, tx) => acc + tx.amount, 0)
  // Tổng tiền đã nạp vào mục tiêu (all-time, lấy từ goals list để hiển thị ở stat card)
  const totalGoalSavings = goals.reduce((acc, g) => acc + (g.currentAmount ?? 0), 0)
  // Số dư khả dụng = balance.netBalance từ BE (all-time income - expense - goalSavings)
  // Đồng nhất với sidebar và modal nạp tiền mục tiêu
  const totalBalance = balance?.netBalance ?? 0

  // CountUp animations for stat cards
  const isStatsLoading = isLoading
  const animatedBalance = useCountUp({ target: totalBalance, isLoading: isStatsLoading, format: (v) => `${v.toLocaleString("vi-VN")} ₫` })
  const animatedIncome = useCountUp({ target: totalIncome, isLoading: isStatsLoading, format: (v) => `${v.toLocaleString("vi-VN")} ₫` })
  const animatedExpense = useCountUp({ target: totalExpense, isLoading: isStatsLoading, format: (v) => `${v.toLocaleString("vi-VN")} ₫` })
  const animatedGoals = useCountUp({ target: totalGoalSavings, isLoading: isStatsLoading, format: (v) => `${v.toLocaleString("vi-VN")} ₫` })

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
      label: t("dashboard.availableBalance"),
      value: animatedBalance,
      changeLabel: t("dashboard.basedOnRecent"),
      positive: totalBalance >= 0,
      icon: Wallet,
      className: "stat-card-primary",
      iconBg: "rgba(124,92,252,0.2)",
      iconColor: "#7c5cfc",
    },
    {
      label: t("dashboard.totalIncome"),
      value: animatedIncome,
      changeLabel: t("dashboard.basedOnRecent"),
      positive: true,
      icon: TrendingUp,
      className: "stat-card-income",
      iconBg: "rgba(16,217,160,0.15)",
      iconColor: "#10d9a0",
    },
    {
      label: t("dashboard.totalExpense"),
      value: animatedExpense,
      changeLabel: t("dashboard.basedOnRecent"),
      positive: false,
      icon: TrendingDown,
      className: "stat-card-expense",
      iconBg: "rgba(255,77,109,0.15)",
      iconColor: "#ff4d6d",
    },
    {
      label: t("dashboard.totalGoalSavings") || "Tiền đang tiết kiệm",
      value: animatedGoals,
      changeLabel: t("dashboard.allocatedToGoals") || "Đã nạp vào mục tiêu",
      positive: true,
      icon: PiggyBank,
      className: "stat-card-primary",
      iconBg: "rgba(245,158,11,0.15)",
      iconColor: "#f59e0b",
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl md:text-4xl font-bold text-foreground tracking-tight">{t("dashboard.title")}</h1>
          </div>
          <p className="text-sm md:text-lg text-muted-foreground">{t("dashboard.subtitle")} {selectedMonthLabel.toLowerCase()}, {periodYStr}</p>
        </div>
        <div className="flex items-center gap-2">
          <MonthPicker value={period} onChange={setPeriod} />
          <button
            onClick={handleOpenAiModal}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105 bg-primary text-primary-foreground shadow-[0_4px_15px_rgba(124,92,252,0.4)]"
          >
            <Sparkles className="h-4 w-4" />
            {t("dashboard.aiReport")}
          </button>
        </div>
      </div>

      {/* Stats cards */}
      {isLoading ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonStat key={i} />)}
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className={`rounded-2xl p-4 transition-all duration-300 hover:scale-[1.02] overflow-hidden min-w-0 ${stat.className}`}>
              <div className="flex items-center justify-between mb-3 gap-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground leading-snug line-clamp-2">{stat.label}</p>
                <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: stat.iconBg }}>
                  <stat.icon className="h-4 w-4" style={{ color: stat.iconColor }} />
                </div>
              </div>
              <div className="text-lg sm:text-2xl font-bold mb-1.5 tracking-tight text-foreground truncate">
                {stat.value}
              </div>
              <div className="flex items-center gap-1 min-w-0">
                {stat.positive ? (
                  <ArrowUpRight className="h-3.5 w-3.5 text-success shrink-0" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5 text-danger shrink-0" />
                )}
                <span className="text-xs text-muted-foreground truncate">{stat.changeLabel}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Charts row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Bar chart */}
        {isTrendLoading ? (
          <div className="md:col-span-2 lg:col-span-4">
            <SkeletonChart height={260} />
          </div>
        ) : (
        <div className="md:col-span-2 lg:col-span-4 rounded-2xl p-5 glass-card min-w-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg md:text-2xl font-semibold text-foreground">{t("dashboard.incomeAndExpense")}</h3>
              <p className="text-sm md:text-base mt-0.5 text-muted-foreground">{t("dashboard.monthlyCashflow")}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-sm" style={{ background: "#10d9a0" }} />
                <span className="text-xs text-muted-foreground">{t("dashboard.income")}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-sm" style={{ background: "#ff4d6d" }} />
                <span className="text-xs text-muted-foreground">{t("dashboard.expense")}</span>
              </div>
              <button className="text-muted-foreground hover:text-foreground transition-colors">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="h-[260px]">
            {monthlyData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">{t("dashboard.noData")}</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" vertical={false} />
                  <XAxis dataKey="name" stroke="currentColor" className="text-muted-foreground" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="currentColor" className="text-muted-foreground" fontSize={11} tickLine={false} axisLine={false} tickFormatter={formatCurrencyAxis} />
                  <Tooltip content={<CustomTooltip />} cursor={false} />
                  <Bar dataKey="income" name="Thu nhập" fill="#10d9a0" radius={[6, 6, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="expense" name="Chi phí" fill="#ff4d6d" radius={[6, 6, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        )}

        {/* Pie chart */}
        {isBreakdownLoading ? (
          <div className="md:col-span-2 lg:col-span-3">
            <SkeletonChart height={180} />
          </div>
        ) : (
        <div className="md:col-span-2 lg:col-span-3 rounded-2xl p-5 glass-card min-w-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg md:text-2xl font-semibold text-foreground">{t("dashboard.expenseByCategory")}</h3>
              <p className="text-sm md:text-base mt-0.5 text-muted-foreground">{t("dashboard.whereMoneyWent")}</p>
            </div>
            <button className="text-muted-foreground hover:text-foreground transition-colors">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
          <div className="flex flex-col items-center">
            {categoryData.length === 0 ? (
              <div className="h-[180px] flex items-center justify-center text-xs text-muted-foreground">{t("dashboard.noData")}</div>
            ) : (
              <>
                <div className="h-[180px] w-full">
                  <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
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
        )}
      </div>

      {/* Recent transactions + area chart */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Area chart */}
        <div className="lg:col-span-2 rounded-2xl p-5 glass-card min-w-0">
          <div className="mb-4">
            <h3 className="text-lg md:text-2xl font-semibold text-foreground">{t("dashboard.savingsTrend")}</h3>
            <p className="text-sm md:text-base mt-0.5 text-muted-foreground">{t("dashboard.netSavings")}</p>
          </div>
          <div className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <AreaChart data={monthlyData.map((d) => ({ ...d, savings: d.income - d.expense }))} margin={{ top: 5, right: 5, left: -30, bottom: 5 }}>
                <defs>
                  <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c5cfc" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7c5cfc" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" vertical={false} />
                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} stroke="currentColor" className="text-muted-foreground" />
                <YAxis fontSize={10} tickLine={false} axisLine={false} stroke="currentColor" className="text-muted-foreground" tickFormatter={formatCurrencyAxis} />
                <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid var(--border)", backgroundColor: "var(--popover)", color: "var(--popover-foreground)", fontSize: "12px" }} />
                <Area type="monotone" dataKey="savings" name="Tiết kiệm" stroke="#7c5cfc" strokeWidth={2} fill="url(#savingsGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent transactions */}
        <div className="lg:col-span-3 rounded-2xl p-5 glass-card min-w-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg md:text-2xl font-semibold text-foreground">{t("dashboard.recentTransactions")}</h3>
              <p className="text-sm md:text-base mt-0.5 text-muted-foreground">{t("dashboard.latestTransactions")}</p>
            </div>
            <Link href="/transactions" className="text-xs font-medium px-3 py-1 rounded-lg transition-all hover:scale-105 bg-accent text-primary border border-primary/20">
              {t("dashboard.viewAll")}
            </Link>
          </div>
          <div className="space-y-2">
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
              </div>
            ) : transactions.length > 0 ? (
              transactions.map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 p-3 rounded-xl transition-all hover:scale-[1.01] bg-card border border-border">
                  <div 
                    className="h-9 w-9 rounded-xl flex items-center justify-center text-base shrink-0"
                    style={{ 
                      backgroundColor: tx.category?.color ? `${tx.category.color}20` : 'var(--secondary)',
                      color: tx.category?.color || 'currentColor'
                    }}
                  >
                    <DynamicIcon name={tx.category?.icon ?? "FileText"} className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{tx.description ?? "—"}</p>
                    <p className="text-xs truncate text-muted-foreground">
                      {tx.category?.name ?? tx.categoryId} · {formatDate(tx.date)}
                    </p>
                  </div>
                  <div className="text-sm font-bold shrink-0" style={{ color: tx.type === "income" ? "var(--success)" : "var(--danger)" }}>
                    {tx.type === "income" ? "+" : "-"}{Math.abs(tx.amount).toLocaleString("vi-VN")} ₫
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                icon={ReceiptText}
                title={t("dashboard.noTransactions")}
                description="Hãy thêm khoản thu chi đầu tiên của bạn."
              />
            )}
          </div>
        </div>
      </div>

      {/* AI Report Modal */}
      <Modal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        title={t("dashboard.aiReportTitle")}
        description={`Phân tích tháng ${periodM}/${periodYStr} bởi Gemini`}
        className="max-w-2xl"
      >
        <div className="relative min-h-[200px]">
          {isAiFetching ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 backdrop-blur-sm z-10 space-y-4">
              <div className="relative">
                <div className="absolute inset-0 rounded-full blur-md bg-primary/30 animate-pulse" />
                <Sparkles className="h-8 w-8 text-primary animate-bounce relative z-10" />
              </div>
              <p className="text-sm font-medium text-muted-foreground animate-pulse">{t("dashboard.analyzing")}</p>
            </div>
          ) : aiData ? (
            <div className="space-y-4">
              {/* Vùng chứa nội dung Markdown để in PDF */}
              <div
                ref={reportRef}
                className="bg-card rounded-lg p-5 border border-border shadow-sm text-sm space-y-3 
                  [&>h1]:text-lg [&>h1]:font-bold [&>h1]:mb-3
                  [&>h2]:text-base [&>h2]:font-semibold [&>h2]:mb-2 [&>h2]:mt-4
                  [&>h3]:text-sm [&>h3]:font-medium [&>h3]:mb-1 [&>h3]:mt-3
                  [&>p]:text-muted-foreground [&>p]:leading-relaxed
                  [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:space-y-1 [&>ul]:text-muted-foreground
                  [&>li>strong]:text-foreground"
              >
                <div className="border-b pb-4 mb-4 hidden print:block">
                  <h1 className="text-2xl font-bold text-center text-primary">BÁO CÁO TÀI CHÍNH</h1>
                  <p className="text-center text-muted-foreground">Kỳ báo cáo: Tháng {periodM} / {periodYStr}</p>
                </div>
                <ReactMarkdown>{aiData.insights}</ReactMarkdown>
                <div className="mt-8 pt-4 border-t text-xs text-right text-muted-foreground hidden print:block">
                  Phân tích tự động bởi Gemini AI - {new Date(aiData.generatedAt).toLocaleString('vi-VN')}
                </div>
              </div>

              {/* Nút thao tác */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => setIsAiModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium border hover:bg-accent transition-colors"
                >
                  {t("dashboard.close")}
                </button>
                <button
                  onClick={handleDownloadPdf}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity shadow-md"
                >
                  <Download className="h-4 w-4" />
                  {t("dashboard.downloadPdf")}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <p>Không thể lấy dữ liệu phân tích.</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
