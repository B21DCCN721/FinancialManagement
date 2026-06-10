"use client"

import { useState } from "react"
import { Target, Plus, TrendingUp, CalendarDays, Loader2, Trash2, Inbox } from "lucide-react"
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
import { logger } from "@/lib/logger"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

export default function GoalsPage() {
  const { t } = useTranslation()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false)
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: goals = [], isLoading } = useGetGoalsQuery()
  const [createGoal, { isLoading: isCreating }] = useCreateGoalMutation()
  const [contributeToGoal, { isLoading: isContributing }] = useContributeToGoalMutation()
  const [deleteGoal, { isLoading: isDeleting }] = useDeleteGoalMutation()

  const handleAddGoal = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const targetAmount = parseFloat(formData.get("target") as string)
    if (isNaN(targetAmount)) return

    try {
      await createGoal({
        title: formData.get("title") as string,
        targetAmount,
        deadline: new Date(formData.get("deadline") as string).toISOString(),
      }).unwrap()
      setIsAddModalOpen(false)
      e.currentTarget.reset()
      logger.info("Goal created")
      toast.success(t("goals.addSuccess"))
    } catch (err: any) {
      logger.error("Failed to create goal", err)
      toast.error(err?.data?.message || t("goals.addError"))
    }
  }

  const handleAddFunds = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const amount = parseFloat(formData.get("deposit") as string)
    if (isNaN(amount) || !selectedGoalId) return

    try {
      await contributeToGoal({ id: selectedGoalId, body: { amount } }).unwrap()
      setIsAddFundsOpen(false)
      setSelectedGoalId(null)
      e.currentTarget.reset()
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
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("goals.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("goals.subtitle")}</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
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
                      <button
                        onClick={() => setDeleteId(goal.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-danger ml-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
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
                      <p className="text-3xl font-bold text-foreground">{goal.currentAmount.toLocaleString("vi-VN")} ₫</p>
                      <p className="text-xs text-muted-foreground">{t("goals.onTotal")} {goal.targetAmount.toLocaleString("vi-VN")} ₫</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">{goal.progressPercentage.toFixed(1)}%</p>
                    </div>
                  </div>

                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${goal.isCompleted ? "bg-success shadow-[0_0_10px_rgba(16,217,160,0.5)]" : colorClass}`}
                      style={{ width: `${goal.progressPercentage}%` }}
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
            <Input id="target" name="target" type="number" inputMode="decimal" autoComplete="off" placeholder="5000000" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deadline">{t("goals.deadlineLabel")}</Label>
            <DatePicker id="deadline" name="deadline" required />
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
        onClose={() => { setIsAddFundsOpen(false); setSelectedGoalId(null) }}
        title={t("goals.fundsModalTitle")}
        description={t("goals.fundsModalDesc")}
      >
        <form className="space-y-4 pt-4" onSubmit={handleAddFunds}>
          <div className="space-y-2">
            <Label htmlFor="deposit">{t("goals.deposit")}</Label>
            <Input id="deposit" name="deposit" type="number" inputMode="decimal" autoComplete="off" step="0.01" placeholder="100000" autoFocus required />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsAddFundsOpen(false)}>{t("goals.cancel")}</Button>
            <Button type="submit" disabled={isContributing}>
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
