"use client"

import { useState } from "react"
import { AlertCircle, Plus, Utensils, Car, ShoppingBag, Gamepad2, ReceiptText, Home, Zap, Loader2, Inbox } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { DynamicIcon } from "@/components/ui/dynamic-icon"
import {
  useGetBudgetSummaryQuery,
  useCreateBudgetMutation,
  useDeleteBudgetMutation,
} from "@/services/budgetsApi"
import { useGetCategoriesQuery } from "@/services/categoriesApi"
import { logger } from "@/lib/logger"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

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
  const { t } = useTranslation()
  const period = currentPeriod()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const { data: budgets = [], isLoading } = useGetBudgetSummaryQuery({ period })
  const { data: categories = [] } = useGetCategoriesQuery({ type: "expense" })
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
      toast.success(t("budgets.addSuccess"))
    } catch (err) {
      logger.error("Failed to create budget", err)
      toast.error(t("budgets.addError"))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("budgets.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("budgets.subtitle")}</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105 bg-primary text-primary-foreground shadow-[0_4px_15px_rgba(124,92,252,0.4)]"
        >
          <Plus className="h-4 w-4" />
          {t("budgets.createBudget")}
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
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm text-white ${config.color}`}
                    >
                      {budget.category.icon ? <DynamicIcon name={budget.category.icon} className="h-6 w-6" /> : config.icon}
                    </div>
                    {budget.category.name}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-muted-foreground">
                      {budget.amount.toLocaleString("vi-VN")} ₫ {t("budgets.limit")}
                    </span>
                    <button
                      onClick={async () => {
                        try {
                          await deleteBudget(budget.id).unwrap()
                          toast.success(t("budgets.deleteSuccess"))
                        } catch (err) {
                          toast.error(t("budgets.deleteError"))
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
                    <span className="font-bold text-foreground">{budget.spentAmount.toLocaleString("vi-VN")} ₫ {t("budgets.spent")}</span>
                    <span className="text-muted-foreground font-medium">
                      {Math.max(budget.remaining, 0).toLocaleString("vi-VN")} ₫ {t("budgets.remaining")}
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
                      {t("budgets.overBudget")} {Math.abs(budget.remaining).toLocaleString("vi-VN")} ₫.
                    </div>
                  )}
                  {isNearLimit && (
                    <div className="flex items-center text-xs font-semibold text-amber-500 mt-2 bg-amber-500/10 px-2 py-1.5 rounded-md">
                      <AlertCircle className="mr-1.5 h-3.5 w-3.5" />
                      {t("budgets.nearLimit")} ({budget.percentUsed.toFixed(0)}%).
                    </div>
                  )}
                </div>
              </div>
            )
          })}
          {budgets.length === 0 && (
            <div className="col-span-full py-12 flex flex-col items-center justify-center gap-3 text-center glass-card rounded-2xl px-6">
              <div className="h-14 w-14 rounded-2xl bg-muted/50 flex items-center justify-center text-muted-foreground">
                <Inbox className="h-6 w-6" />
              </div>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {t("budgets.empty")}
              </p>
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={t("budgets.addModalTitle")}
        description={t("budgets.addModalDesc")}
      >
        <form className="space-y-4 pt-4" onSubmit={handleAddSubmit}>
          <div className="space-y-2">
            <Label htmlFor="categoryId">{t("budgets.categoryId") || "Danh mục"}</Label>
            <Select 
              id="categoryId" 
              name="categoryId" 
              required
              options={[
                { value: "", label: "-- Chọn danh mục --" },
                ...categories.map(c => ({
                  value: c.id,
                  label: (
                    <div className="flex items-center gap-2">
                      <DynamicIcon name={c.icon} className="h-4 w-4" />
                      <span>{c.name}</span>
                    </div>
                  )
                }))
              ]}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="limit">{t("budgets.amountLimit")}</Label>
            <Input id="limit" name="limit" type="number" inputMode="decimal" autoComplete="off" step="10" placeholder="VD: 500000" required />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>{t("budgets.cancel")}</Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("budgets.save")}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
