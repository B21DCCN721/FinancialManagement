"use client"

import { useState } from "react"
import { AlertCircle, Plus, Utensils, Car, ShoppingBag, Gamepad2, ReceiptText, Home, Zap, Loader2, Inbox, Pencil, Trash2, CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { ConfirmModal } from "@/components/ui/confirm-modal"
import { DynamicIcon } from "@/components/ui/dynamic-icon"
import { MonthPicker } from "@/components/ui/month-picker"
import { YearPicker } from "@/components/ui/year-picker"
import {
  useGetBudgetSummaryQuery,
  useCreateBudgetMutation,
  useUpdateBudgetMutation,
  useDeleteBudgetMutation,
} from "@/services/budgetsApi"
import { useGetCategoriesQuery } from "@/services/categoriesApi"
import { logger } from "@/lib/logger"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

function currentPeriodMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

function currentPeriodYear() {
  return `${new Date().getFullYear()}`
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
  const [budgetType, setBudgetType] = useState<"monthly" | "yearly">("monthly")
  const [period, setPeriod] = useState(currentPeriodMonth())

  const [modalBudgetType, setModalBudgetType] = useState<"monthly" | "yearly">("monthly")
  const [modalPeriod, setModalPeriod] = useState(currentPeriodMonth())

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: budgets = [], isLoading } = useGetBudgetSummaryQuery({ period })
  const { data: categories = [] } = useGetCategoriesQuery({ type: "expense" })
  const [createBudget, { isLoading: isCreating }] = useCreateBudgetMutation()
  const [updateBudget, { isLoading: isUpdating }] = useUpdateBudgetMutation()
  const [deleteBudget, { isLoading: isDeleting }] = useDeleteBudgetMutation()

  const handleTypeChange = (type: "monthly" | "yearly") => {
    setBudgetType(type)
    if (type === "monthly") {
      setPeriod(currentPeriodMonth())
    } else {
      setPeriod(currentPeriodYear())
    }
  }

  const handleAddSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const amountStr = formData.get("limit") as string
    const amount = amountStr ? parseInt(amountStr.replace(/\D/g, ''), 10) : NaN
    const categoryId = formData.get("categoryId") as string
    
    if (isNaN(amount) || amount <= 0) {
      toast.error("Vui lòng nhập số tiền hợp lệ")
      return
    }

    try {
      if (editingId) {
        await updateBudget({ id: editingId, body: { amount } }).unwrap()
        toast.success(t("budgets.updateSuccess") || "Cập nhật ngân sách thành công")
      } else {
        if (!categoryId) {
          toast.error("Vui lòng chọn danh mục")
          return
        }
        await createBudget({ amount, categoryId, period: modalPeriod, type: modalBudgetType }).unwrap()
        logger.info("Budget created")
        toast.success(t("budgets.addSuccess"))
      }
      setIsAddModalOpen(false)
      setEditingId(null)
      e.currentTarget.reset()
    } catch (err: any) {
      logger.error("Failed to save budget", err)
      toast.error(err?.data?.message || err?.error || t("budgets.addError"))
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteId) return
    try {
      await deleteBudget(deleteId).unwrap()
      toast.success(t("budgets.deleteSuccess"))
      setDeleteId(null)
    } catch (err: any) {
      toast.error(err?.data?.message || t("budgets.deleteError"))
    }
  }

  const openEdit = (budget: any) => {
    setEditingId(budget.id)
    setModalBudgetType(budget.period.length === 4 ? "yearly" : "monthly")
    setModalPeriod(budget.period)
    setIsAddModalOpen(true)
  }

  const openCreate = () => {
    setEditingId(null)
    setModalBudgetType(budgetType)
    setModalPeriod(period)
    setIsAddModalOpen(true)
  }

  const editingBudget = editingId ? budgets.find(b => b.id === editingId) : null

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-foreground">{t("budgets.title")}</h1>
          <p className="text-sm md:text-lg text-muted-foreground">{t("budgets.subtitle")}</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105 bg-primary text-primary-foreground shadow-[0_4px_15px_rgba(124,92,252,0.4)]"
        >
          <Plus className="h-4 w-4" />
          {t("budgets.createBudget")}
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center bg-card border border-border p-2 rounded-2xl shadow-sm">
        <div className="flex p-1 bg-muted/50 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => handleTypeChange("monthly")}
            className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${budgetType === "monthly" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            Ngân sách Tháng
          </button>
          <button
            onClick={() => handleTypeChange("yearly")}
            className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${budgetType === "yearly" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            Ngân sách Năm
          </button>
        </div>

        <div className="flex items-center ml-auto w-full sm:w-auto">
          {budgetType === "monthly" ? (
            <div className="w-full sm:w-[160px] [&>div>button]:w-full [&>div>button]:justify-center">
              <MonthPicker value={period} onChange={setPeriod} />
            </div>
          ) : (
            <div className="w-full sm:w-[160px] [&>div>button]:w-full [&>div>button]:justify-center">
              <YearPicker value={period} onChange={setPeriod} />
            </div>
          )}
        </div>
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
                className={`glass-card rounded-2xl p-5 transition-all group hover:scale-[1.02] ${isOverBudget ? "border-danger shadow-[0_0_15px_rgba(255,77,109,0.15)] bg-danger/5" : ""}`}
              >
                <div className="flex flex-row items-center justify-between pb-4">
                  <div className="text-sm font-bold text-foreground flex items-center gap-3">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm text-white ${!budget.category.color ? config.color : ""}`}
                      style={budget.category.color ? { backgroundColor: budget.category.color } : {}}
                    >
                      {budget.category.icon ? <DynamicIcon name={budget.category.icon} className="h-6 w-6" /> : config.icon}
                    </div>
                    {budget.category.name}
                  </div>
                  <div className="flex items-center gap-1 opacity-100 sm:opacity-50 sm:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(budget)}
                      className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                      title="Sửa ngân sách"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteId(budget.id)}
                      className="h-8 w-8 rounded-lg flex items-center justify-center text-danger hover:bg-danger/10 transition-colors"
                      title="Xóa ngân sách"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground mb-1">
                    {t("budgets.limit")}: <span className="font-semibold text-foreground">{budget.amount.toLocaleString("vi-VN")} ₫</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-bold text-foreground">{budget.spentAmount.toLocaleString("vi-VN")} ₫ {t("budgets.spent")}</span>
                    <span className={`font-medium ${isOverBudget ? "text-danger" : "text-muted-foreground"}`}>
                      {Math.max(budget.remaining, 0).toLocaleString("vi-VN")} ₫ {t("budgets.remaining")}
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${isOverBudget
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
        onClose={() => { setIsAddModalOpen(false); setEditingId(null) }}
        title={editingId ? "Chỉnh sửa ngân sách" : t("budgets.addModalTitle")}
        description={editingId ? "Cập nhật giới hạn chi tiêu của bạn." : t("budgets.addModalDesc")}
      >
        <form className="space-y-4 pt-4" onSubmit={handleAddSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Loại ngân sách</Label>
              {editingId ? (
                <Input value={modalBudgetType === "monthly" ? "Ngân sách tháng" : "Ngân sách năm"} disabled className="bg-muted/50" />
              ) : (
                <Select
                  value={modalBudgetType}
                  onChange={(e) => {
                    const type = e.target.value as "monthly" | "yearly"
                    setModalBudgetType(type)
                    setModalPeriod(type === "monthly" ? currentPeriodMonth() : currentPeriodYear())
                  }}
                  options={[
                    { value: "monthly", label: "Ngân sách tháng" },
                    { value: "yearly", label: "Ngân sách năm" },
                  ]}
                />
              )}
            </div>
            <div className="space-y-2">
              <Label>{modalBudgetType === "monthly" ? "Chọn tháng" : "Chọn năm"}</Label>
              {editingId ? (
                <Input value={modalPeriod} disabled className="bg-muted/50" />
              ) : (
                <div className="w-full [&>div>button]:w-full [&>div>button]:justify-center">
                  {modalBudgetType === "monthly" ? (
                    <MonthPicker value={modalPeriod} onChange={setModalPeriod} />
                  ) : (
                    <YearPicker value={modalPeriod} onChange={setModalPeriod} />
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="categoryId">{t("budgets.categoryId") || "Danh mục"}</Label>
            {editingId ? (
              <Input value={editingBudget?.category?.name || ""} disabled className="bg-muted/50" />
            ) : (
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
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="limit">{t("budgets.amountLimit")}</Label>
            <Input
              id="limit"
              name="limit"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              defaultValue={editingBudget?.amount}
              placeholder="VD: 500000"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>{t("budgets.cancel")}</Button>
            <Button type="submit" disabled={isCreating || isUpdating}>
              {(isCreating || isUpdating) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingId ? "Cập nhật" : t("budgets.save")}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title={t("budgets.deleteConfirmTitle") || "Xóa ngân sách"}
        description={t("budgets.deleteConfirmDesc") || "Bạn có chắc chắn muốn xóa ngân sách này? Hành động này không thể hoàn tác."}
        confirmText={t("budgets.delete") || "Xóa"}
        cancelText={t("budgets.cancel") || "Hủy"}
        isLoading={isDeleting}
      />
    </div>
  )
}
