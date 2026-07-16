"use client"

import React, { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useGetBalanceQuery, useGetReportSummaryQuery } from "@/services/reportsApi"
import { useGetSpendingLimitsQuery } from "@/services/spendingLimitsApi"
import { syncWidgetData } from "@/lib/widget"
import { Capacitor } from "@capacitor/core"

export function WidgetSyncProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  
  // Lấy kỳ hiện tại (YYYY-MM) và ngày hiện tại (YYYY-MM-DD)
  const now = new Date()
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  const todayStr = now.toISOString().slice(0, 10)

  // Gọi API lấy số dư, hạn mức và tổng quan chi tiêu tháng
  // Chỉ gọi trên ứng dụng native Capacitor để tránh tốn tài nguyên trên Web thông thường
  const isNative = Capacitor.isNativePlatform()

  const { data: balanceData } = useGetBalanceQuery(undefined, {
    skip: !isNative,
    pollingInterval: 10000, // Cập nhật mỗi 10 giây trên native app
  })
  
  const { data: limitsData } = useGetSpendingLimitsQuery({ date: todayStr }, {
    skip: !isNative,
    pollingInterval: 10000,
  })

  const { data: summaryData } = useGetReportSummaryQuery({ period: currentPeriod }, {
    skip: !isNative,
    pollingInterval: 10000,
  })

  // Tự động đồng bộ dữ liệu sang Native Widget mỗi khi dữ liệu thay đổi
  useEffect(() => {
    if (!isNative) return

    const balance = balanceData?.netBalance ?? 0
    
    // Tìm hạn mức chi tiêu ngày và tháng
    const dailyLimitObj = limitsData?.find(l => l.type === 'daily')
    const monthlyLimitObj = limitsData?.find(l => l.type === 'monthly')

    const dailyLimit = dailyLimitObj?.amount ?? null
    const dailySpent = dailyLimitObj?.spentAmount ?? 0

    const monthlyLimit = monthlyLimitObj?.amount ?? null
    // Ưu tiên lấy spentAmount của hạn mức tháng, nếu chưa đặt hạn mức tháng thì lấy tổng chi tiêu từ summary
    const monthlySpent = monthlyLimitObj?.spentAmount ?? summaryData?.totalExpense ?? 0

    syncWidgetData({
      balance,
      monthlySpent,
      monthlyLimit,
      dailySpent,
      dailyLimit,
    })
  }, [balanceData, limitsData, summaryData, isNative])

  // Lắng nghe sự kiện click từ widget mở app qua Deep Link
  useEffect(() => {
    if (!isNative) return

    let appListener: any

    const setupDeepLink = async () => {
      const { App } = await import("@capacitor/app")
      appListener = await App.addListener("appUrlOpen", (data: any) => {
        console.log("App opened with URL: ", data.url)
        
        // Trích xuất path từ url (ví dụ: finmanage://add-transaction)
        const path = data.url.split("://")[1]
        
        if (path === "add-transaction") {
          router.push("/transactions")
          // Có thể lưu cờ để tự động mở form thêm giao dịch
          localStorage.setItem("AUTO_OPEN_ADD_TRANSACTION", "true")
        } else if (path === "spending-limits") {
          router.push("/spending-limits")
        } else {
          router.push("/")
        }
      })
    }

    setupDeepLink()

    return () => {
      if (appListener) {
        appListener.remove()
      }
    }
  }, [router, isNative])

  return <>{children}</>
}
