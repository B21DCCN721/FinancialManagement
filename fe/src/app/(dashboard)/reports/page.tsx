/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState } from "react"
import { Download, FileText, FileSpreadsheet, FileJson, ArrowRight } from "lucide-react"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

// Mock data for Line Chart
const balanceTrendData = [
  { date: "01/05", balance: 41000 },
  { date: "05/05", balance: 40500 },
  { date: "10/05", balance: 39800 },
  { date: "15/05", balance: 40200 },
  { date: "20/05", balance: 44700 }, // Salary hits
  { date: "25/05", balance: 43500 },
  { date: "30/05", balance: 45231 },
]

export default function ReportsPage() {
  const [startDate, setStartDate] = useState("2024-05-01")
  const [endDate, setEndDate] = useState("2024-05-31")

  // Helper to simulate a file download
  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8,Date,Description,Category,Type,Amount\n2024-05-27,Grocery Store,Food,expense,120.50\n2024-05-26,Salary,Income,income,4500.00"
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `transactions_${startDate}_to_${endDate}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
        <p className="text-muted-foreground">
          Deep dive into your financial data and export reports.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Date Filter & Export Panel */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Export Data</CardTitle>
            <CardDescription>Generate reports based on a custom date range.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Export Format</Label>
              <div className="grid grid-cols-1 gap-2">
                <Button variant="outline" className="justify-start w-full" onClick={handleExportCSV}>
                  <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                  Export as CSV
                  <ArrowRight className="ml-auto h-4 w-4 opacity-50" />
                </Button>
                <Button variant="outline" className="justify-start w-full" onClick={() => alert('PDF export feature is a mockup in this demo.')}>
                  <FileJson className="mr-2 h-4 w-4 text-muted-foreground" />
                  Export as PDF
                  <ArrowRight className="ml-auto h-4 w-4 opacity-50" />
                </Button>
                <Button variant="outline" className="justify-start w-full" onClick={() => alert('Excel export feature is a mockup in this demo.')}>
                  <FileSpreadsheet className="mr-2 h-4 w-4 text-muted-foreground" />
                  Export as Excel
                  <ArrowRight className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analytics Chart Panel */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Balance Trend</CardTitle>
            <CardDescription>
              Your total account balance over the selected period.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={balanceTrendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value}`}
                    domain={['dataMin - 1000', 'dataMax + 1000']}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--background)',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                    itemStyle={{ color: 'var(--foreground)', fontWeight: 500 }}
                    formatter={(value: any) => [`$${value}`, 'Balance']}
                    labelStyle={{ color: 'var(--muted-foreground)', marginBottom: '4px' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="balance"
                    stroke="var(--primary)"
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2, fill: "var(--background)" }}
                    activeDot={{ r: 6, strokeWidth: 0, fill: "var(--primary)" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
