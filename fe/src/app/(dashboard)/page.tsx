"use client"

import { ArrowDownRight, ArrowUpRight, Wallet, TrendingUp, TrendingDown, Sparkles, Calendar, MoreHorizontal } from "lucide-react"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const monthlyData = [
  { name: "Jan", income: 4000, expense: 2400 },
  { name: "Feb", income: 3000, expense: 1398 },
  { name: "Mar", income: 5200, expense: 3200 },
  { name: "Apr", income: 4780, expense: 2908 },
  { name: "May", income: 6890, expense: 3800 },
  { name: "Jun", income: 7390, expense: 4100 },
]

const categoryData = [
  { name: "Food & Dining", value: 400, color: "#7c5cfc" },
  { name: "Transportation", value: 300, color: "#10d9a0" },
  { name: "Shopping", value: 300, color: "#f59e0b" },
  { name: "Entertainment", value: 200, color: "#ff4d6d" },
  { name: "Healthcare", value: 150, color: "#38bdf8" },
]

const recentTransactions = [
  { name: "Netflix Subscription", category: "Entertainment", amount: -15.99, date: "Today", icon: "🎬" },
  { name: "Salary Deposit", category: "Income", amount: 4500.00, date: "Yesterday", icon: "💰" },
  { name: "Grocery Store", category: "Food & Dining", amount: -87.50, date: "Jun 2", icon: "🛒" },
  { name: "Uber Ride", category: "Transportation", amount: -12.30, date: "Jun 1", icon: "🚗" },
  { name: "Amazon Purchase", category: "Shopping", amount: -134.99, date: "May 31", icon: "📦" },
]

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="rounded-xl p-3 text-sm"
        style={{
          background: "#1a1a2e",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
        }}
      >
        <p className="font-semibold text-white mb-2">{label}</p>
        {payload.map((entry) => (
          <p key={entry.name} className="flex items-center gap-2" style={{ color: entry.color }}>
            <span className="h-2 w-2 rounded-full inline-block" style={{ background: entry.color }} />
            {entry.name}: ${entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function Dashboard() {
  const stats = [
    {
      label: "Total Balance",
      value: "$45,231.89",
      change: "+20.1%",
      changeLabel: "from last month",
      positive: true,
      icon: Wallet,
      className: "stat-card-primary",
      valueColor: "#a78bfa",
      iconBg: "rgba(124,92,252,0.2)",
      iconColor: "#7c5cfc",
    },
    {
      label: "Total Income (Jun)",
      value: "$12,234.00",
      change: "+15%",
      changeLabel: "from last month",
      positive: true,
      icon: TrendingUp,
      className: "stat-card-income",
      valueColor: "#10d9a0",
      iconBg: "rgba(16,217,160,0.15)",
      iconColor: "#10d9a0",
    },
    {
      label: "Total Expense (Jun)",
      value: "$3,456.00",
      change: "-4%",
      changeLabel: "from last month",
      positive: false,
      icon: TrendingDown,
      className: "stat-card-expense",
      valueColor: "#ff4d6d",
      iconBg: "rgba(255,77,109,0.15)",
      iconColor: "#ff4d6d",
    },
  ]

  return (
    <div className="space-y-6 py-2">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider"
              style={{ background: "rgba(124,92,252,0.15)", color: "#a78bfa", border: "1px solid rgba(124,92,252,0.25)" }}
            >
              Live
            </span>
          </div>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.875rem" }}>
            Your financial overview for June 2026
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.6)",
            }}
          >
            <Calendar className="h-4 w-4" />
            Jun 2026
          </button>
          <button
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #7c5cfc, #c084fc)",
              color: "white",
              boxShadow: "0 4px 15px rgba(124,92,252,0.4)",
            }}
          >
            <Sparkles className="h-4 w-4" />
            AI Report
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02] ${stat.className}`}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.55)" }}>
                {stat.label}
              </p>
              <div
                className="h-9 w-9 rounded-xl flex items-center justify-center"
                style={{ background: stat.iconBg }}
              >
                <stat.icon className="h-4 w-4" style={{ color: stat.iconColor }} />
              </div>
            </div>
            <div className="text-2xl font-bold mb-1.5 tracking-tight" style={{ color: stat.valueColor }}>
              {stat.value}
            </div>
            <div className="flex items-center gap-1.5">
              {stat.positive ? (
                <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5 text-rose-400" />
              )}
              <span
                className="text-xs font-semibold"
                style={{ color: stat.positive ? "#10d9a0" : "#ff4d6d" }}
              >
                {stat.change}
              </span>
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                {stat.changeLabel}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Bar chart */}
        <div
          className="col-span-4 rounded-2xl p-5"
          style={{
            background: "linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)",
            border: "1px solid rgba(255,255,255,0.07)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Income vs Expense</h3>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                Monthly cash flow overview
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-sm" style={{ background: "#10d9a0" }} />
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Income</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-sm" style={{ background: "#ff4d6d" }} />
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Expense</span>
              </div>
              <button style={{ color: "rgba(255,255,255,0.3)" }}>
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="rgba(255,255,255,0.2)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "rgba(255,255,255,0.4)" }}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.2)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "rgba(255,255,255,0.4)" }}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)", radius: 4 }} />
                <Bar dataKey="income" fill="#10d9a0" radius={[6, 6, 0, 0]} maxBarSize={28} />
                <Bar dataKey="expense" fill="#ff4d6d" radius={[6, 6, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie chart */}
        <div
          className="col-span-3 rounded-2xl p-5"
          style={{
            background: "linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)",
            border: "1px solid rgba(255,255,255,0.07)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Expenses by Category</h3>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                Where your money went
              </p>
            </div>
            <button style={{ color: "rgba(255,255,255,0.3)" }}>
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
          <div className="flex flex-col items-center">
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid rgba(255,255,255,0.1)",
                      backgroundColor: "#1a1a2e",
                      boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
                      color: "white",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className="w-full space-y-2 mt-2">
              {categoryData.map((entry) => (
                <div key={entry.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full shrink-0" style={{ background: entry.color }} />
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{entry.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-1 rounded-full"
                      style={{
                        width: `${(entry.value / 1350) * 60}px`,
                        background: entry.color,
                        opacity: 0.5,
                      }}
                    />
                    <span className="text-xs font-medium text-white">${entry.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent transactions + area chart */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Area chart */}
        <div
          className="lg:col-span-2 rounded-2xl p-5"
          style={{
            background: "linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)",
            border: "1px solid rgba(255,255,255,0.07)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
          }}
        >
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-white">Savings Trend</h3>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
              Net savings over 6 months
            </p>
          </div>
          <div className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={monthlyData.map((d) => ({ ...d, savings: d.income - d.expense }))}
                margin={{ top: 5, right: 5, left: -30, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c5cfc" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7c5cfc" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: "rgba(255,255,255,0.35)" }} />
                <YAxis fontSize={10} tickLine={false} axisLine={false} tick={{ fill: "rgba(255,255,255,0.35)" }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    backgroundColor: "#1a1a2e",
                    color: "white",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="savings"
                  stroke="#7c5cfc"
                  strokeWidth={2}
                  fill="url(#savingsGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent transactions */}
        <div
          className="lg:col-span-3 rounded-2xl p-5"
          style={{
            background: "linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)",
            border: "1px solid rgba(255,255,255,0.07)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Recent Transactions</h3>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                Latest 5 transactions
              </p>
            </div>
            <button
              className="text-xs font-medium px-3 py-1 rounded-lg transition-all hover:scale-105"
              style={{ color: "#a78bfa", background: "rgba(124,92,252,0.1)", border: "1px solid rgba(124,92,252,0.2)" }}
            >
              View all
            </button>
          </div>
          <div className="space-y-2">
            {recentTransactions.map((tx, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl transition-all hover:scale-[1.01]"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.04)",
                }}
              >
                <div
                  className="h-9 w-9 rounded-xl flex items-center justify-center text-base shrink-0"
                  style={{ background: "rgba(255,255,255,0.06)" }}
                >
                  {tx.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{tx.name}</p>
                  <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.35)" }}>
                    {tx.category} · {tx.date}
                  </p>
                </div>
                <div
                  className="text-sm font-bold shrink-0"
                  style={{ color: tx.amount > 0 ? "#10d9a0" : "#ff8fa3" }}
                >
                  {tx.amount > 0 ? "+" : ""}${Math.abs(tx.amount).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
