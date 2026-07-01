"use client"

import { useState } from "react"
import { Target, Plus, TrendingUp, TrendingDown, CalendarDays, Loader2, Trash2, Inbox, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { DatePicker } from "@/components/ui/date-picker"
import { ConfirmModal } from "@/components/ui/confirm-modal"
import { SkeletonGoalCard } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import {
  useGetGoalsQuery,
  useCreateGoalMutation,
  useContributeToGoalMutation,
  useWithdrawFromGoalMutation,
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
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false)
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [depositValue, setDepositValue] = useState("")
  const [withdrawValue, setWithdrawValue] = useState("")
  const [deadlineDate, setDeadlineDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [goalErrors, setGoalErrors] = useState<{ title?: string; target?: string }>({})

  const { data: goals = [], isLoading } = useGetGoalsQuery()
  const { data: balance } = useGetBalanceQuery()
  const [createGoal, { isLoading: isCreating }] = useCreateGoalMutation()
  const [contributeToGoal, { isLoading: isContributing }] = useContributeToGoalMutation()
  const [withdrawFromGoal, { isLoading: isWithdrawing }] = useWithdrawFromGoalMutation()
  const [deleteGoal, { isLoading: isDeleting }] = useDeleteGoalMutation()

  // Available balance = totalIncome - totalExpense - totalGoalSavings (already deducted by BE)
  const availableBalance = balance?.netBalance ?? 0
  const depositAmount = parseFloat(depositValue) || 0
  const withdrawAmount = parseFloat(withdrawValue) || 0
  const isDepositExceedBalance = depositAmount > availableBalance

  const selectedGoal = selectedGoalId ? goals.find((g) => g.id === selectedGoalId) : null
  const isWithdrawExceedSavings = withdrawAmount > (selectedGoal?.currentAmount ?? 0)

  const handleAddGoal = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    const titleVal = formData.get("title") as string
    const targetAmount = parseFloat(formData.get("target") as string)

    const errors: { title?: string; target?: string } = {}
    if (!titleVal?.trim()) errors.title = "Vui lòng nhập tên mục tiêu"
    if (isNaN(targetAmount) || targetAmount <= 0) errors.target = "Vui lòng nhập số tiền mục tiêu hợp lệ"
    if (Object.keys(errors).length > 0) { setGoalErrors(errors); return }
    setGoalErrors({})
    if (isNaN(targetAmount)) return

    const deadlineStr = formData.get("deadline") as string
    if (!deadlineStr) {
      toast.error(t("goals.deadlineRequired") || "Vui lòng chọn ngày hết hạn")
      return
    }

    // Parse as local midnight to avoid UTC timezone shift (YYYY-MM-DD → treat as local)
    const deadlineDateObj = new Date(`${deadlineStr}T00:00:00`)
    if (isNaN(deadlineDateObj.getTime())) {
      toast.error(t("goals.deadlineInvalid") || "Ngày hết hạn không hợp lệ")
      return
    }

    try {
      await createGoal({
        title: formData.get("title") as string,
        targetAmount,
        deadline: deadlineDateObj.toISOString(),
      }).unwrap()
      setIsAddModalOpen(false)
      form.reset()
      setGoalErrors({})
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

    // Client-side guard — dùng availableBalance (đã trừ savings)
    if (amount > availableBalance) {
      toast.error(`Số tiền nạp vượt quá số dư khả dụng (${fmt(availableBalance)} ₫)`)
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

  const handleWithdraw = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const amount = parseFloat(withdrawValue)
    if (isNaN(amount) || !selectedGoalId || !selectedGoal) return

    // Client-side guard
    if (amount > selectedGoal.currentAmount) {
      toast.error(`Số tiền rút vượt quá số tiền đang có trong mục tiêu (${fmt(selectedGoal.currentAmount)} ₫)`)
      return
    }

    try {
      await withdrawFromGoal({ id: selectedGoalId, body: { amount } }).unwrap()
      setIsWithdrawOpen(false)
      setSelectedGoalId(null)
      setWithdrawValue("")
      logger.info("Withdrew from goal", { goalId: selectedGoalId, amount })
      toast.success(t("goals.withdrawSuccess") || "Rút tiền từ mục tiêu thành công")
    } catch (err: any) {
      logger.error("Failed to withdraw from goal", err)
      toast.error(err?.data?.message || t("goals.withdrawError") || "Rút tiền thất bại. Vui lòng thử lại.")
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonGoalCard key={i} />)}
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

                  {/* Action buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* Nạp tiền */}
                    <button
                      className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition-all ${
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

                    {/* Rút tiền */}
                    <button
                      className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition-all ${
                        goal.currentAmount <= 0
                          ? "bg-muted text-muted-foreground cursor-not-allowed"
                          : "bg-card border border-border text-foreground hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/30"
                      }`}
                      onClick={() => {
                        setSelectedGoalId(goal.id)
                        setWithdrawValue("")
                        setIsWithdrawOpen(true)
                      }}
                      disabled={goal.currentAmount <= 0}
                    >
                      <TrendingDown className="h-4 w-4" />
                      {t("goals.withdraw") || "Rút tiền"}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
          {goals.length === 0 && (
            <EmptyState
              icon={Target}
              title={t("goals.empty") || "Chưa có mục tiêu nào"}
              description="Hãy thiết lập mục tiêu tài chính để bắt đầu tiết kiệm cho tương lai."
              actionLabel={t("goals.createGoal") || "Tạo mục tiêu"}
              onAction={() => {
                setDeadlineDate(new Date().toISOString().slice(0, 10))
                setIsAddModalOpen(true)
              }}
            />
          )}
        </div>
      )}

      {/* Add Goal Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title={t("goals.addModalTitle")} description={t("goals.addModalDesc")}>
        <form className="space-y-4 pt-4" onSubmit={handleAddGoal}>
          <div className="space-y-2">
            <Label htmlFor="title">{t("goals.goalName")}</Label>
            <Input id="title" name="title" autoComplete="off" placeholder="VD: Du lịch hè"
              error={goalErrors.title}
              onChange={() => { if (goalErrors.title) setGoalErrors(p => ({ ...p, title: undefined })) }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="target">{t("goals.targetAmount")}</Label>
            <Input id="target" name="target" type="number" inputMode="decimal" autoComplete="off" placeholder="5000000"
              error={goalErrors.target}
              onChange={() => { if (goalErrors.target) setGoalErrors(p => ({ ...p, target: undefined })) }}
              className="focus-visible:ring-0 focus-visible:ring-offset-0" />
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
          {/* Available balance info (already deducted goal savings) */}
          <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-colors ${
            availableBalance > 0
              ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
              : "bg-destructive/10 border border-destructive/20 text-destructive"
          }`}>
            <Wallet className="h-4 w-4 flex-shrink-0" />
            <span className="font-medium">
              Số dư khả dụng: <span className="font-bold">{fmt(availableBalance)} ₫</span>
            </span>
          </div>

          {selectedGoal && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs bg-muted/50 text-muted-foreground border border-border">
              <Target className="h-3.5 w-3.5 flex-shrink-0" />
              <span>
                Còn thiếu để hoàn thành: <span className="font-semibold text-foreground">{fmt(Math.max(0, selectedGoal.targetAmount - selectedGoal.currentAmount))} ₫</span>
              </span>
            </div>
          )}

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
              max={availableBalance > 0 ? Math.min(availableBalance, selectedGoal ? selectedGoal.targetAmount - selectedGoal.currentAmount : availableBalance) : undefined}
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
                    Vượt quá số dư ({fmt(availableBalance)} ₫)
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => { setIsAddFundsOpen(false); setDepositValue("") }}>{t("goals.cancel")}</Button>
            <Button type="submit" disabled={isContributing || isDepositExceedBalance || availableBalance <= 0}>
              {isContributing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("goals.confirm")}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Withdraw Modal */}
      <Modal
        isOpen={isWithdrawOpen}
        onClose={() => { setIsWithdrawOpen(false); setSelectedGoalId(null); setWithdrawValue("") }}
        title={t("goals.withdrawModalTitle") || "Rút tiền từ Mục tiêu"}
        description={t("goals.withdrawModalDesc") || "Rút một phần hoặc toàn bộ số tiền đã tiết kiệm trong mục tiêu này."}
      >
        <form className="space-y-4 pt-4" onSubmit={handleWithdraw}>
          {/* Current savings in goal */}
          {selectedGoal && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400">
              <Wallet className="h-4 w-4 flex-shrink-0" />
              <span className="font-medium">
                Số tiền hiện có trong mục tiêu: <span className="font-bold">{fmt(selectedGoal.currentAmount)} ₫</span>
              </span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="withdraw">{t("goals.withdrawAmount") || "Số tiền rút (₫)"}</Label>
            <Input
              id="withdraw"
              name="withdraw"
              type="number"
              inputMode="decimal"
              autoComplete="off"
              step="1"
              min="1"
              max={selectedGoal?.currentAmount ?? undefined}
              placeholder="100.000"
              autoFocus
              required
              value={withdrawValue}
              onChange={(e) => setWithdrawValue(e.target.value)}
              className={isWithdrawExceedSavings ? "border-destructive focus-visible:ring-0 focus-visible:ring-offset-0" : "focus-visible:ring-0 focus-visible:ring-offset-0"}
            />
            {/* Preview + warning */}
            {withdrawAmount > 0 && (
              <div className="flex items-center justify-between text-xs px-1">
                <span className="text-muted-foreground">
                  = <span className="font-semibold text-foreground">{fmt(withdrawAmount)} ₫</span>
                </span>
                {isWithdrawExceedSavings && (
                  <span className="text-destructive font-medium">
                    Vượt quá số tiền hiện có ({fmt(selectedGoal?.currentAmount ?? 0)} ₫)
                  </span>
                )}
              </div>
            )}
            {/* After-withdraw preview */}
            {withdrawAmount > 0 && !isWithdrawExceedSavings && selectedGoal && (
              <p className="text-xs text-muted-foreground px-1">
                Còn lại trong mục tiêu sau rút:{" "}
                <span className="font-semibold text-foreground">{fmt(selectedGoal.currentAmount - withdrawAmount)} ₫</span>
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => { setIsWithdrawOpen(false); setWithdrawValue("") }}>
              {t("goals.cancel")}
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={isWithdrawing || isWithdrawExceedSavings || !selectedGoal || selectedGoal.currentAmount <= 0}
            >
              {isWithdrawing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("goals.confirmWithdraw") || "Xác nhận rút"}
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
