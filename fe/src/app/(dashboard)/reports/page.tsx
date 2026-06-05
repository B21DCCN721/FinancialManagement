/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState } from "react"
import { FileText, FileSpreadsheet, FileJson, ArrowRight, Loader2, TrendingUp, TrendingDown, Wallet, Activity } from "lucide-react"
import {
  Line, LineChart, Bar, BarChart, Pie, PieChart, Cell,
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Area, AreaChart,
} from "recharts"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { MonthPicker } from "@/components/ui/month-picker"
import {
  useGetReportSummaryQuery,
  useGetMonthlyTrendQuery,
  useGetCategoryBreakdownQuery,
  useGetCashFlowQuery,
} from "@/services/reportsApi"
import { useGetTransactionsQuery } from "@/services/transactionsApi"

function currentPeriod() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

const CHART_COLORS = ["#7c5cfc", "#10d9a0", "#ff4d6d", "#f59e0b", "#38bdf8", "#a78bfa", "#34d399"]

export default function ReportsPage() {
  const [period, setPeriod] = useState(currentPeriod())
  const [exportDateFrom, setExportDateFrom] = useState("")
  const [exportDateTo, setExportDateTo] = useState("")

  const { data: summary, isLoading: isSummaryLoading } = useGetReportSummaryQuery({ period })
  const { data: trend = [], isLoading: isTrendLoading } = useGetMonthlyTrendQuery({ months: 6 })
  const { data: breakdown = [], isLoading: isBreakdownLoading } = useGetCategoryBreakdownQuery({ period })
  const { data: cashFlow = [], isLoading: isCashFlowLoading } = useGetCashFlowQuery({ period })

  // For CSV export – fetch all transactions in range
  const { data: exportData } = useGetTransactionsQuery(
    {
      limit: 1000,
      ...(exportDateFrom && { dateFrom: new Date(exportDateFrom).toISOString() }),
      ...(exportDateTo && { dateTo: new Date(exportDateTo + "T23:59:59").toISOString() }),
    },
    { skip: !exportDateFrom && !exportDateTo }
  )

  const handleExportCSV = () => {
    const rows = exportData?.data ?? []
    const header = "Ngày,Mô tả,Danh mục,Loại,Số tiền"
    const lines = rows.map((tx) =>
      [
        new Date(tx.date).toLocaleDateString("vi-VN"),
        `"${tx.description ?? ""}"`,
        tx.category?.name ?? tx.categoryId,
        tx.type === "income" ? "Thu nhập" : "Chi phí",
        tx.amount,
      ].join(",")
    )
    const csv = [header, ...lines].join("\n")
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `transactions_${exportDateFrom || "all"}_to_${exportDateTo || "all"}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const formatPeriodLabel = (p: string) => {
    const [year, month] = p.split("-")
    return `${month}/${year}`
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Báo cáo & Phân tích</h1>
          <p className="text-muted-foreground">Phân tích sâu dữ liệu tài chính của bạn theo thời gian thực.</p>
        </div>
        {/* Period selector */}
        <div className="flex items-center gap-2">
          <Label className="text-sm shrink-0">Kỳ báo cáo:</Label>
          <MonthPicker value={period} onChange={setPeriod} />
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          {
            label: "Thu nhập", value: summary?.totalIncome, icon: TrendingUp,
            color: "#10d9a0", bg: "rgba(16,217,160,0.1)",
          },
          {
            label: "Chi phí", value: summary?.totalExpense, icon: TrendingDown,
            color: "#ff4d6d", bg: "rgba(255,77,109,0.1)",
          },
          {
            label: "Số dư ròng", value: summary?.netBalance, icon: Wallet,
            color: "#7c5cfc", bg: "rgba(124,92,252,0.1)",
          },
          {
            label: "Giao dịch", value: summary?.transactionCount, icon: Activity,
            color: "#f59e0b", bg: "rgba(245,158,11,0.1)", isCount: true,
          },
        ].map((stat) => (
          <div key={stat.label} className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{stat.label}</span>
              <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: stat.bg }}>
                <stat.icon className="h-4 w-4" style={{ color: stat.color }} />
              </div>
            </div>
            {isSummaryLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              <p className="text-2xl font-bold text-foreground">
                {stat.isCount
                  ? (stat.value ?? 0)
                  : `${(stat.value ?? 0).toLocaleString("vi-VN")} ₫`}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Monthly Trend Bar Chart */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground">Thu nhập & Chi phí theo tháng</h3>
            <p className="text-xs mt-0.5 text-muted-foreground">6 tháng gần nhất</p>
          </div>
          {isTrendLoading ? (
            <div className="h-[260px] flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trend} margin={{ top: 5, right: 5, left: -10, bottom: 5 }} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" vertical={false} />
                  <XAxis dataKey="period" tickFormatter={formatPeriodLabel} fontSize={11} tickLine={false} axisLine={false} stroke="currentColor" className="text-muted-foreground" />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} stroke="currentColor" className="text-muted-foreground" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k ₫`} />
                  <Tooltip
                    contentStyle={{ borderRadius: "12px", border: "1px solid var(--border)", backgroundColor: "var(--popover)", color: "var(--popover-foreground)", fontSize: "12px" }}
                    formatter={(value: any) => [`${Number(value).toLocaleString("vi-VN")} ₫`]}
                  />
                  <Bar dataKey="income" name="Thu nhập" fill="#10d9a0" radius={[6, 6, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="expense" name="Chi phí" fill="#ff4d6d" radius={[6, 6, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Category Breakdown Pie */}
        <div className="glass-card rounded-2xl p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground">Chi tiêu theo danh mục</h3>
            <p className="text-xs mt-0.5 text-muted-foreground">Kỳ {period}</p>
          </div>
          {isBreakdownLoading ? (
            <div className="h-[260px] flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : breakdown.length === 0 ? (
            <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">Chưa có dữ liệu</div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={breakdown} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="totalAmount" strokeWidth={0}>
                      {breakdown.map((entry, i) => (
                        <Cell key={entry.categoryId} fill={entry.categoryColor ?? CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: "12px", border: "1px solid var(--border)", backgroundColor: "var(--popover)", color: "var(--popover-foreground)", fontSize: "12px" }}
                      formatter={(value: any) => [`${Number(value).toLocaleString("vi-VN")} ₫`]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full space-y-1.5 mt-2">
                {breakdown.slice(0, 5).map((item, i) => (
                  <div key={item.categoryId} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full shrink-0" style={{ background: item.categoryColor ?? CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="text-muted-foreground">{item.categoryName}</span>
                    </div>
                    <span className="font-medium text-foreground">{item.percentage.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Cash Flow Area Chart */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground">Dòng tiền theo ngày</h3>
            <p className="text-xs mt-0.5 text-muted-foreground">Kỳ {period}</p>
          </div>
          {isCashFlowLoading ? (
            <div className="h-[200px] flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cashFlow} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10d9a0" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10d9a0" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff4d6d" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#ff4d6d" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" vertical={false} />
                  <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} stroke="currentColor" className="text-muted-foreground" />
                  <YAxis fontSize={10} tickLine={false} axisLine={false} stroke="currentColor" className="text-muted-foreground" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k ₫`} />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid var(--border)", backgroundColor: "var(--popover)", color: "var(--popover-foreground)", fontSize: "12px" }} formatter={(value: any) => [`${Number(value).toLocaleString("vi-VN")} ₫`]} />
                  <Area type="monotone" dataKey="income" name="Thu nhập" stroke="#10d9a0" strokeWidth={2} fill="url(#incomeGrad)" />
                  <Area type="monotone" dataKey="expense" name="Chi phí" stroke="#ff4d6d" strokeWidth={2} fill="url(#expenseGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Export Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Xuất báo cáo</CardTitle>
            <CardDescription>Tải dữ liệu giao dịch theo khoảng thời gian.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="export-from">Từ ngày</Label>
              <Input id="export-from" type="date" value={exportDateFrom} onChange={(e) => setExportDateFrom(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="export-to">Đến ngày</Label>
              <Input id="export-to" type="date" value={exportDateTo} onChange={(e) => setExportDateTo(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 gap-2 pt-2">
              <Button variant="outline" className="justify-start w-full" onClick={handleExportCSV}>
                <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                Xuất CSV
                <ArrowRight className="ml-auto h-4 w-4 opacity-50" />
              </Button>
              <Button variant="outline" className="justify-start w-full" onClick={() => alert("Tính năng PDF đang phát triển.")}>
                <FileJson className="mr-2 h-4 w-4 text-muted-foreground" />
                Xuất PDF
                <ArrowRight className="ml-auto h-4 w-4 opacity-50" />
              </Button>
              <Button variant="outline" className="justify-start w-full" onClick={() => alert("Tính năng Excel đang phát triển.")}>
                <FileSpreadsheet className="mr-2 h-4 w-4 text-muted-foreground" />
                Xuất Excel
                <ArrowRight className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Net Balance Line Chart */}
      <div className="glass-card rounded-2xl p-5">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-foreground">Số dư ròng theo tháng</h3>
          <p className="text-xs mt-0.5 text-muted-foreground">Xu hướng tài chính của bạn</p>
        </div>
        {isTrendLoading ? (
          <div className="h-[200px] flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" vertical={false} />
                <XAxis dataKey="period" tickFormatter={formatPeriodLabel} stroke="currentColor" className="text-muted-foreground" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="currentColor" className="text-muted-foreground" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k ₫`} />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid var(--border)", backgroundColor: "var(--background)" }} formatter={(value: any) => [`${Number(value).toLocaleString("vi-VN")} ₫`, "Số dư ròng"]} />
                <Line type="monotone" dataKey="net" name="Số dư ròng" stroke="#7c5cfc" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: "var(--background)" }} activeDot={{ r: 6, strokeWidth: 0, fill: "#7c5cfc" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
