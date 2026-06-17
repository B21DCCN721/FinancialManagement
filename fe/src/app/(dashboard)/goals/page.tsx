"use client"

import { useState } from "react"
import { Target, Plus, TrendingUp, CalendarDays, Loader2, Trash2, Inbox, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { DatePicker } from "@/components/ui/date-picker"
import { ConfirmModal } from "@/components/ui/confirm-modal"
import {
  useGetGoalsQuery,
  useCreateGoalMutation,
  useContributeToGoalMutation,
  useDeleteGoalMutation,
} from "@/services/goalsApi"
import { useGetBalanceQuery } from "@/services/reportsApi"
import { logger } from "@/lib/logger"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

const fmt = (n: number) => n.toLocaleString("vi-VN")

export default function GoalsPage() {
  const { t } = useTranslation()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false)
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [depositValue, setDepositValue] = useState("")
  const [deadlineDate, setDeadlineDate] = useState(() => new Date().toISOString().slice(0, 10))

  const { data: goals = [], isLoading } = useGetGoalsQuery()
  const { data: balance } = useGetBalanceQuery()
  const [createGoal, { isLoading: isCreating }] = useCreateGoalMutation()
  const [contributeToGoal, { isLoading: isContributing }] = useContributeToGoalMutation()
  const [deleteGoal, { isLoading: isDeleting }] = useDeleteGoalMutation()

  const netBalance = balance?.netBalance ?? 0
  const depositAmount = parseFloat(depositValue) || 0
  const isDepositExceedBalance = depositAmount > netBalance

  const handleAddGoal = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    const targetAmount = parseFloat(formData.get("target") as string)
    if (isNaN(targetAmount)) return

    const deadlineStr = formData.get("deadline") as string
    if (!deadlineStr) {
      toast.error(t("goals.deadlineRequired") || "Vui lòng chọn ngày hết hạn")
      return
    }

    // Parse as local midnight to avoid UTC timezone shift (YYYY-MM-DD → treat as local)
    const deadlineDate = new Date(`${deadlineStr}T00:00:00`)
    if (isNaN(deadlineDate.getTime())) {
      toast.error(t("goals.deadlineInvalid") || "Ngày hết hạn không hợp lệ")
      return
    }

    try {
      await createGoal({
        title: formData.get("title") as string,
        targetAmount,
        deadline: deadlineDate.toISOString(),
      }).unwrap()
      setIsAddModalOpen(false)
      form.reset()
      logger.info("Goal created")
      toast.success(t("goals.addSuccess"))
    } catch (err: any) {
      logger.error("Failed to create goal", err)
      toast.error(err?.data?.message || t("goals.addError"))
    }
  }

  const handleAddFunds = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const amount = parseFloat(depositValue)
    if (isNaN(amount) || !selectedGoalId) return

    // Client-side guard
    if (amount > netBalance) {
      toast.error(`Số tiền nạp vượt quá số dư ròng hiện có (${fmt(netBalance)} ₫)`)
      return
    }

    try {
      await contributeToGoal({ id: selectedGoalId, body: { amount } }).unwrap()
      setIsAddFundsOpen(false)
      setSelectedGoalId(null)
      setDepositValue("")
      logger.info("Contributed to goal", { goalId: selectedGoalId, amount })
      toast.success(t("goals.fundsSuccess"))
    } catch (err: any) {
      logger.error("Failed to contribute to goal", err)
      toast.error(err?.data?.message || t("goals.fundsError"))
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteId) return
    try {
      await deleteGoal(deleteId).unwrap()
      toast.success(t("goals.deleteSuccess") || "Xóa mục tiêu thành công")
      setDeleteId(null)
    } catch (err: any) {
      toast.error(err?.data?.message || t("goals.deleteError") || "Có lỗi xảy ra khi xóa mục tiêu")
    }
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Không có"
    try {
      return new Date(dateStr).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
    } catch { return dateStr }
  }

  const colors = [
    "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]",
    "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]",
    "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]",
    "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]",
    "bg-primary shadow-[0_0_10px_rgba(124,92,252,0.5)]",
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-foreground">{t("goals.title")}</h1>
          <p className="text-sm md:text-lg text-muted-foreground">{t("goals.subtitle")}</p>
        </div>
        <button
          onClick={() => {
            setDeadlineDate(new Date().toISOString().slice(0, 10))
            setIsAddModalOpen(true)
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105 bg-primary text-primary-foreground shadow-[0_4px_15px_rgba(124,92,252,0.4)]"
        >
          <Plus className="h-4 w-4" />
          {t("goals.createGoal")}
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal, idx) => {
            const colorClass = colors[idx % colors.length]

            return (
              <div key={goal.id} className="glass-card rounded-2xl p-5 relative overflow-hidden transition-all hover:scale-[1.02] group">
                <div className="pb-4">
                  <div className="flex items-center justify-between text-lg font-bold text-foreground mb-1">
                    <span className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      {goal.title}
                    </span>
                    <div className="flex items-center gap-1">
                      {goal.isCompleted && (
                        <span className="text-[10px] font-bold text-success uppercase px-2 py-1 bg-success/10 border border-success/20 rounded-full">
                          {t("goals.completed")}
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-danger hover:bg-danger/10 ml-2"
                        onClick={() => setDeleteId(goal.id)}
                        title="Xóa mục tiêu"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {t("goals.deadline")} {formatDate(goal.deadline)}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-end justify-between">
                    <div className="space-y-1">
                      <p className="text-3xl font-bold text-foreground">{fmt(goal.currentAmount)} ₫</p>
                      <p className="text-xs text-muted-foreground">{t("goals.onTotal")} {fmt(goal.targetAmount)} ₫</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">{goal.progressPercentage.toFixed(1)}%</p>
                    </div>
                  </div>

                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${goal.isCompleted ? "bg-success shadow-[0_0_10px_rgba(16,217,160,0.5)]" : colorClass}`}
                      style={{ width: `${Math.min(goal.progressPercentage, 100)}%` }}
                    />
                  </div>

                  <button
                    className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-all ${
                      goal.isCompleted
                        ? "bg-muted text-muted-foreground cursor-not-allowed"
                        : "bg-card border border-border text-foreground hover:bg-accent hover:text-primary"
                    }`}
                    onClick={() => {
                      setSelectedGoalId(goal.id)
                      setDepositValue("")
                      setIsAddFundsOpen(true)
                    }}
                    disabled={goal.isCompleted}
                  >
                    <TrendingUp className="h-4 w-4" />
                    {t("goals.addFunds")}
                  </button>
                </div>
              </div>
            )
          })}
          {goals.length === 0 && (
            <div className="col-span-full py-12 flex flex-col items-center justify-center gap-3 text-center glass-card rounded-2xl px-6">
              <div className="h-14 w-14 rounded-2xl bg-muted/50 flex items-center justify-center text-muted-foreground">
                <Inbox className="h-6 w-6" />
              </div>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {t("goals.empty")}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Add Goal Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title={t("goals.addModalTitle")} description={t("goals.addModalDesc")}>
        <form className="space-y-4 pt-4" onSubmit={handleAddGoal}>
          <div className="space-y-2">
            <Label htmlFor="title">{t("goals.goalName")}</Label>
            <Input id="title" name="title" autoComplete="off" placeholder="VD: Du lịch hè" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="target">{t("goals.targetAmount")}</Label>
            <Input id="target" name="target" type="number" inputMode="decimal" autoComplete="off" placeholder="5000000" required className="focus-visible:ring-0 focus-visible:ring-offset-0" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deadline">{t("goals.deadlineLabel")}</Label>
            <DatePicker id="deadline" name="deadline" required value={deadlineDate} onChange={setDeadlineDate} />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>{t("goals.cancel")}</Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("goals.save")}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Funds Modal */}
      <Modal
        isOpen={isAddFundsOpen}
        onClose={() => { setIsAddFundsOpen(false); setSelectedGoalId(null); setDepositValue("") }}
        title={t("goals.fundsModalTitle")}
        description={t("goals.fundsModalDesc")}
      >
        <form className="space-y-4 pt-4" onSubmit={handleAddFunds}>
          {/* Balance info */}
          <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-colors ${
            netBalance > 0
              ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
              : "bg-destructive/10 border border-destructive/20 text-destructive"
          }`}>
            <Wallet className="h-4 w-4 flex-shrink-0" />
            <span className="font-medium">
              Số dư khả dụng: <span className="font-bold">{fmt(netBalance)} ₫</span>
            </span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deposit">{t("goals.deposit")}</Label>
            <Input
              id="deposit"
              name="deposit"
              type="number"
              inputMode="decimal"
              autoComplete="off"
              step="1"
              min="1"
              max={netBalance > 0 ? netBalance : undefined}
              placeholder="100.000"
              autoFocus
              required
              value={depositValue}
              onChange={(e) => setDepositValue(e.target.value)}
              className={isDepositExceedBalance ? "border-destructive focus-visible:ring-0 focus-visible:ring-offset-0" : "focus-visible:ring-0 focus-visible:ring-offset-0"}
            />
            {/* Formatted preview + warning */}
            {depositAmount > 0 && (
              <div className="flex items-center justify-between text-xs px-1">
                <span className="text-muted-foreground">
                  = <span className="font-semibold text-foreground">{fmt(depositAmount)} ₫</span>
                </span>
                {isDepositExceedBalance && (
                  <span className="text-destructive font-medium">
                    Vượt quá số dư ({fmt(netBalance)} ₫)
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => { setIsAddFundsOpen(false); setDepositValue("") }}>{t("goals.cancel")}</Button>
            <Button type="submit" disabled={isContributing || isDepositExceedBalance || netBalance <= 0}>
              {isContributing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("goals.confirm")}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title={t("goals.deleteConfirmTitle") || "Xóa mục tiêu"}
        description={t("goals.deleteConfirmDesc") || "Bạn có chắc chắn muốn xóa mục tiêu này? Hành động này không thể hoàn tác."}
        confirmText={t("goals.delete") || "Xóa"}
        cancelText={t("goals.cancel") || "Hủy"}
        isLoading={isDeleting}
      />
    </div>
  )
}
