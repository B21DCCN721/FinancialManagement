"use client"

import { useState } from "react"
import { AlertCircle, Plus, Utensils, Car, ShoppingBag, Gamepad2, ReceiptText, Home, Zap, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import {
  useGetBudgetSummaryQuery,
  useCreateBudgetMutation,
  useDeleteBudgetMutation,
} from "@/services/budgetsApi"
import { logger } from "@/lib/logger"
import { toast } from "sonner"

function currentPeriod() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

const getCategoryConfig = (name: string) => {
  switch (name) {
    case "Ăn uống": return { icon: <Utensils className="h-5 w-5" />, color: "bg-blue-500" }
    case "Di chuyển": return { icon: <Car className="h-5 w-5" />, color: "bg-emerald-500" }
    case "Mua sắm": return { icon: <ShoppingBag className="h-5 w-5" />, color: "bg-rose-500" }
    case "Giải trí": return { icon: <Gamepad2 className="h-5 w-5" />, color: "bg-amber-500" }
    case "Nhà cửa": return { icon: <Home className="h-5 w-5" />, color: "bg-indigo-500" }
    case "Tiện ích": return { icon: <Zap className="h-5 w-5" />, color: "bg-cyan-500" }
    default: return { icon: <ReceiptText className="h-5 w-5" />, color: "bg-slate-500" }
  }
}

export default function BudgetsPage() {
  const period = currentPeriod()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const { data: budgets = [], isLoading } = useGetBudgetSummaryQuery({ period })
  const [createBudget, { isLoading: isCreating }] = useCreateBudgetMutation()
  const [deleteBudget] = useDeleteBudgetMutation()

  const handleAddSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const amount = parseFloat(formData.get("limit") as string)
    const categoryId = formData.get("categoryId") as string
    if (isNaN(amount) || !categoryId) return

    try {
      await createBudget({ amount, categoryId, period }).unwrap()
      setIsAddModalOpen(false)
      e.currentTarget.reset()
      logger.info("Budget created")
      toast.success("Tạo ngân sách thành công")
    } catch (err) {
      logger.error("Failed to create budget", err)
      toast.error("Tạo ngân sách thất bại. Vui lòng thử lại.")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Ngân sách</h1>
          <p className="text-muted-foreground">Thiết lập giới hạn chi tiêu và theo dõi mức độ hoàn thành.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105 bg-primary text-primary-foreground shadow-[0_4px_15px_rgba(124,92,252,0.4)]"
        >
          <Plus className="h-4 w-4" />
          Tạo ngân sách
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget) => {
            const config = getCategoryConfig(budget.category.name)
            const isOverBudget = budget.status === "exceeded"
            const isNearLimit = budget.status === "warning"

            return (
              <div
                key={budget.id}
                className={`glass-card rounded-2xl p-5 transition-all group ${isOverBudget ? "border-danger/50 shadow-[0_0_15px_rgba(255,77,109,0.2)]" : ""}`}
              >
                <div className="flex flex-row items-center justify-between pb-4">
                  <div className="text-sm font-bold text-foreground flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-white ${config.color} shadow-lg`}>
                      {config.icon}
                    </div>
                    {budget.category.name}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-muted-foreground">
                      {budget.amount.toLocaleString("vi-VN")} ₫ giới hạn
                    </span>
                    <button
                      onClick={async () => {
                        try {
                          await deleteBudget(budget.id).unwrap()
                          toast.success("Xóa ngân sách thành công")
                        } catch (err) {
                          toast.error("Xóa ngân sách thất bại")
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-danger text-xs"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="font-bold text-foreground">{budget.spentAmount.toLocaleString("vi-VN")} ₫ đã chi</span>
                    <span className="text-muted-foreground font-medium">
                      {Math.max(budget.remaining, 0).toLocaleString("vi-VN")} ₫ còn lại
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        isOverBudget
                          ? "bg-danger shadow-[0_0_10px_rgba(255,77,109,0.5)]"
                          : isNearLimit
                          ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                          : "bg-primary shadow-[0_0_10px_rgba(124,92,252,0.5)]"
                      }`}
                      style={{ width: `${Math.min(budget.percentUsed, 100)}%` }}
                    />
                  </div>
                  {isOverBudget && (
                    <div className="flex items-center text-xs font-semibold text-danger mt-2 bg-danger/10 px-2 py-1.5 rounded-md">
                      <AlertCircle className="mr-1.5 h-3.5 w-3.5" />
                      Bạn đã vượt quá ngân sách {Math.abs(budget.remaining).toLocaleString("vi-VN")} ₫.
                    </div>
                  )}
                  {isNearLimit && (
                    <div className="flex items-center text-xs font-semibold text-amber-500 mt-2 bg-amber-500/10 px-2 py-1.5 rounded-md">
                      <AlertCircle className="mr-1.5 h-3.5 w-3.5" />
                      Cảnh báo: Bạn sắp đạt giới hạn chi tiêu ({budget.percentUsed.toFixed(0)}%).
                    </div>
                  )}
                </div>
              </div>
            )
          })}
          {budgets.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground glass-card rounded-2xl">
              Chưa có ngân sách nào được thiết lập. Hãy nhấn &quot;Tạo ngân sách&quot; để bắt đầu!
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Tạo ngân sách"
        description="Thiết lập giới hạn chi tiêu hàng tháng cho một danh mục."
      >
        <form className="space-y-4 pt-4" onSubmit={handleAddSubmit}>
          <div className="space-y-2">
            <Label htmlFor="categoryId">Mã danh mục (ID)</Label>
            <Input id="categoryId" name="categoryId" placeholder="UUID danh mục từ Backend" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="limit">Hạn mức hàng tháng (₫)</Label>
            <Input id="limit" name="limit" type="number" step="10" placeholder="VD: 500" required />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Hủy</Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Lưu Ngân Sách
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
