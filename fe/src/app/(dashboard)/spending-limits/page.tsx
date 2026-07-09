"use client"

import { useState } from "react"
import { AlertCircle, Plus, Pencil, Trash2, CalendarDays, Loader2, ShieldCheck, ShieldAlert, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { ConfirmModal } from "@/components/ui/confirm-modal"
import { DatePicker } from "@/components/ui/date-picker"
import { MonthPicker } from "@/components/ui/month-picker"
import { WeekPicker } from "@/components/ui/week-picker"
import { EmptyState } from "@/components/ui/empty-state"
import { Progress } from "@/components/ui/progress"
import {
  useGetSpendingLimitsQuery,
  useUpsertSpendingLimitMutation,
  useDeleteSpendingLimitMutation,
} from "@/services/spendingLimitsApi"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { formatCurrencyFull } from "@/lib/format"

export default function SpendingLimitsPage() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<"daily" | "weekly" | "monthly" | string>("daily")
  
  // Date state: YYYY-MM-DD (defaults to today)
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10))

  // Fetch limits for the selected date
  const { data: limits = [], isLoading, isFetching } = useGetSpendingLimitsQuery({ date: selectedDate })
  const [upsertSpendingLimit, { isLoading: isSubmitting }] = useUpsertSpendingLimitMutation()
  const [deleteSpendingLimit, { isLoading: isDeleting }] = useDeleteSpendingLimitMutation()

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalAmount, setModalAmount] = useState("")
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false)

  // Find active limit details from array
  const currentLimit = limits.find((l) => l.type === activeTab)

  // Helper to format week range display
  const getWeekRangeLabel = (dateStr: string): string => {
    try {
      const [year, month, day] = dateStr.split("-").map(Number)
      const d = new Date(year, month - 1, day)
      const dayOfWeek = d.getDay() // 0 = Sun, 1 = Mon ...
      const diff = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
      
      const start = new Date(year, month - 1, diff)
      const end = new Date(start)
      end.setDate(start.getDate() + 6)
      
      const startStr = `${start.getDate().toString().padStart(2, '0')}/${(start.getMonth() + 1).toString().padStart(2, '0')}/${start.getFullYear()}`
      const endStr = `${end.getDate().toString().padStart(2, '0')}/${(end.getMonth() + 1).toString().padStart(2, '0')}/${end.getFullYear()}`
      
      return `${startStr} - ${endStr}`
    } catch {
      return dateStr
    }
  }

  // Handle month picker input (updates selectedDate to the 1st of that month)
  const handleMonthChange = (monthStr: string) => {
    setSelectedDate(`${monthStr}-01`)
  }

  const formatDateString = (date: Date): string => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, "0")
    const d = String(date.getDate()).padStart(2, "0")
    return `${y}-${m}-${d}`
  }

  const getMondayDateStr = (dateStr: string): string => {
    try {
      const [year, month, day] = dateStr.split("-").map(Number)
      const d = new Date(year, month - 1, day)
      const dayOfWeek = d.getDay()
      const diff = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
      const monday = new Date(year, month - 1, diff)
      return formatDateString(monday)
    } catch {
      return dateStr
    }
  }

  const isPeriodInPast = (): boolean => {
    try {
      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
      
      if (activeTab === "daily") {
        const [y, m, d] = selectedDate.split("-").map(Number)
        const periodDate = new Date(y, m - 1, d, 0, 0, 0, 0)
        return periodDate < todayStart
      } else if (activeTab === "weekly") {
        const selMondayStr = getMondayDateStr(selectedDate)
        const [y, m, d] = selMondayStr.split("-").map(Number)
        const periodMonday = new Date(y, m - 1, d, 0, 0, 0, 0)

        // Current week Monday
        const curMonday = new Date(todayStart)
        const curDay = curMonday.getDay()
        const curDiff = curMonday.getDate() - curDay + (curDay === 0 ? -6 : 1)
        curMonday.setDate(curDiff)
        curMonday.setHours(0, 0, 0, 0)

        return periodMonday < curMonday
      } else {
        const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
        const selectedMonthStr = selectedDate.slice(0, 7)
        return selectedMonthStr < currentMonthStr
      }
    } catch {
      return false
    }
  }

  const isPast = isPeriodInPast()

  const handleOpenAddModal = () => {
    setModalAmount(currentLimit?.amount ? String(currentLimit.amount) : "")
    setIsModalOpen(true)
  }

  const handleSubmitLimit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const amountNum = parseFloat(modalAmount)
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Vui lòng nhập số tiền hợp lệ")
      return
    }

    const periodStr = activeTab === "monthly"
      ? selectedDate.slice(0, 7)
      : (activeTab === "weekly" ? getMondayDateStr(selectedDate) : selectedDate)

    const isEdit = !!currentLimit?.id

    try {
      await upsertSpendingLimit({
        amount: amountNum,
        type: activeTab as "daily" | "weekly" | "monthly",
        period: periodStr,
        isEdit,
      }).unwrap()
      toast.success(isEdit ? "Cập nhật giới hạn chi tiêu thành công" : "Thiết lập giới hạn chi tiêu thành công")
      setIsModalOpen(false)
    } catch (err: any) {
      toast.error(err?.data?.message || "Không thể lưu giới hạn chi tiêu")
    }
  }

  const handleDeleteLimit = async () => {
    const periodStr = activeTab === "monthly"
      ? selectedDate.slice(0, 7)
      : (activeTab === "weekly" ? getMondayDateStr(selectedDate) : selectedDate)

    try {
      await deleteSpendingLimit({
        type: activeTab as "daily" | "weekly" | "monthly",
        period: periodStr,
      }).unwrap()
      toast.success("Xóa giới hạn chi tiêu thành công")
      setIsConfirmDeleteOpen(false)
    } catch (err: any) {
      toast.error(err?.data?.message || "Không thể xóa giới hạn chi tiêu")
    }
  }

  // Format display text
  const currentMonthPeriod = selectedDate.slice(0, 7) // YYYY-MM
  const formattedDay = (() => {
    try {
      const d = new Date(selectedDate)
      return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`
    } catch {
      return selectedDate
    }
  })()

  const showSkeleton = isLoading || isFetching

  return (
    <div className="space-y-6 py-2">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold text-foreground tracking-tight">
            {t("sidebar.spendingLimits") || "Giới hạn chi tiêu"}
          </h1>
          <p className="text-sm md:text-lg text-muted-foreground mt-1">
            Đặt hạn mức chi tiêu để quản lý ngân sách thông minh và an toàn.
          </p>
        </div>
      </div>

      {/* Navigation Tabs and Date Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-2 bg-muted/40 rounded-2xl border border-border/50">
        {/* Tab Controls */}
        <div className="flex items-center p-1 bg-card rounded-xl border border-border/30 self-start md:self-auto">
          <button
            onClick={() => setActiveTab("daily")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "daily"
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            Hàng ngày
          </button>
          <button
            onClick={() => setActiveTab("weekly")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "weekly"
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            Hàng tuần
          </button>
          <button
            onClick={() => setActiveTab("monthly")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "monthly"
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            Hàng tháng
          </button>
        </div>

        {/* Date Filters depending on Active Tab */}
        <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto shrink-0">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground bg-card px-3 py-1.5 rounded-xl border border-border/30">
            <CalendarDays className="h-4 w-4 text-primary/70" />
            <span>Thời gian:</span>
          </div>
          
          <div className="min-w-[140px] sm:min-w-[160px] flex-1 sm:flex-initial">
            {activeTab === "daily" && (
              <DatePicker value={selectedDate} onChange={setSelectedDate} align="right" />
            )}
            {activeTab === "weekly" && (
              <WeekPicker value={selectedDate} onChange={setSelectedDate} align="right" />
            )}
            {activeTab === "monthly" && (
              <MonthPicker value={currentMonthPeriod} onChange={handleMonthChange} />
            )}
          </div>
        </div>
      </div>

      {/* Main Limit display card */}
      {showSkeleton ? (
        <div className="rounded-2xl p-6 bg-card border border-border shadow-lg animate-pulse space-y-6">
          <div className="h-6 w-1/4 bg-muted rounded" />
          <div className="h-10 w-1/3 bg-muted rounded" />
          <div className="h-4 w-full bg-muted rounded" />
          <div className="h-12 w-full bg-muted rounded" />
          <div className="flex gap-4">
            <div className="h-10 w-24 bg-muted rounded" />
            <div className="h-10 w-24 bg-muted rounded" />
          </div>
        </div>
      ) : currentLimit && currentLimit.amount !== null && currentLimit.amount > 0 ? (
        <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-sm p-6 shadow-xl space-y-6 transition-all duration-300">
          {/* Header row inside card */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-border/50">
            <div>
              <span className="text-xs font-semibold tracking-wider text-primary uppercase bg-primary/10 px-3 py-1 rounded-full">
                {activeTab === "daily" ? "Hạn mức ngày" : activeTab === "weekly" ? "Hạn mức tuần" : "Hạn mức tháng"}
              </span>
              <h2 className="text-xl md:text-3xl font-bold mt-2 tracking-tight text-foreground">
                Hạn mức: {formatCurrencyFull(currentLimit.amount)}
              </h2>
              <p className="text-xs md:text-sm text-muted-foreground mt-1.5">
                Kỳ hạn hiện tại: {" "}
                <span className="font-semibold text-foreground">
                  {activeTab === "daily"
                    ? formattedDay
                    : activeTab === "weekly"
                    ? getWeekRangeLabel(selectedDate)
                    : `Tháng ${selectedDate.slice(5, 7)}/${selectedDate.slice(0, 4)}`}
                </span>
              </p>
            </div>
            
            <div className="text-left md:text-right">
              <span className="text-xs text-muted-foreground">Đã chi tiêu</span>
              <p className="text-lg md:text-2xl font-bold text-danger">
                {formatCurrencyFull(currentLimit.spentAmount)}
              </p>
              {currentLimit.remaining !== null && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Còn lại: <span className="font-semibold text-success">{formatCurrencyFull(currentLimit.remaining)}</span>
                </p>
              )}
            </div>
          </div>

          {/* Progress bar section */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium text-muted-foreground">Tiến độ chi tiêu</span>
              <span className={`font-bold ${
                currentLimit.percentUsed >= 100 
                  ? "text-danger" 
                  : currentLimit.percentUsed >= 80 
                  ? "text-warning" 
                  : "text-success"
              }`}>
                {currentLimit.percentUsed}%
              </span>
            </div>
            
            <Progress 
              value={currentLimit.percentUsed} 
              indicatorColor={
                currentLimit.percentUsed >= 100 
                  ? "bg-danger" 
                  : currentLimit.percentUsed >= 80 
                  ? "bg-warning" 
                  : "bg-success"
              }
              className="h-3"
            />
          </div>

          {/* Warning Banner alerts */}
          {currentLimit.percentUsed >= 100 ? (
            <div className="flex items-start gap-3 p-4 rounded-xl border bg-danger/10 border-danger/30 text-danger text-sm leading-relaxed">
              <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <p className="font-bold">Hạn mức chi tiêu đã bị VƯỢT QUÁ!</p>
                <p className="mt-1 text-danger/90">
                  Bạn đã chi tiêu {formatCurrencyFull(currentLimit.spentAmount)}, vượt mức hạn định là {formatCurrencyFull(currentLimit.amount)}. Vui lòng cắt giảm chi tiêu để tránh mất kiểm soát tài chính.
                </p>
              </div>
            </div>
          ) : currentLimit.percentUsed >= 80 ? (
            <div className="flex items-start gap-3 p-4 rounded-xl border bg-warning/10 border-warning/30 text-warning text-sm leading-relaxed">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Cảnh báo: Bạn sắp đạt tới giới hạn!</p>
                <p className="mt-1 text-warning/90">
                  Bạn đã dùng hết {currentLimit.percentUsed}% hạn mức. Vui lòng cân nhắc kỹ trước khi thực hiện thêm các khoản chi khác.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 p-4 rounded-xl border bg-success/10 border-success/30 text-success text-sm leading-relaxed">
              <ShieldCheck className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Chi tiêu trong tầm kiểm soát!</p>
                <p className="mt-1 text-success/90">
                  Hạn mức đã sử dụng là {currentLimit.percentUsed}%. Bạn đang quản lý chi tiêu rất tốt!
                </p>
              </div>
            </div>
          )}

          {/* Action buttons inside card */}
          {!isPast ? (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <Button
                onClick={handleOpenAddModal}
                className="flex items-center justify-center gap-2 border bg-accent border-primary/20 text-primary hover:bg-accent/80 transition-all font-medium rounded-xl w-full sm:w-auto"
              >
                <Pencil className="h-4 w-4" />
                Thay đổi giới hạn
              </Button>
              
              <Button
                onClick={() => setIsConfirmDeleteOpen(true)}
                variant="destructive"
                className="flex items-center justify-center gap-2 transition-all font-medium rounded-xl w-full sm:w-auto"
              >
                <Trash2 className="h-4 w-4" />
                Xóa giới hạn
              </Button>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground bg-muted/30 px-4 py-2.5 rounded-xl border border-border/40 inline-flex items-center gap-1.5 font-medium">
              <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />
              Không thể thay đổi hạn mức chi tiêu trong quá khứ.
            </div>
          )}
        </div>
      ) : (
        /* Empty state when limit has not been set yet */
        <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-sm p-8 shadow-md">
          <EmptyState
            icon={AlertCircle}
            title="Chưa thiết lập giới hạn chi tiêu"
            description={`Bạn chưa cài đặt giới hạn chi tiêu ${
              activeTab === "daily" ? "hàng ngày" : activeTab === "weekly" ? "hàng tuần" : "hàng tháng"
            } cho kỳ này.`}
          />
          {!isPast ? (
            <div className="flex justify-center mt-6">
              <Button
                onClick={handleOpenAddModal}
                className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/95 transition-all shadow-[0_4px_15px_rgba(124,92,252,0.3)] font-semibold rounded-xl px-5 py-2.5"
              >
                <Plus className="h-4.5 w-4.5" />
                Thiết lập ngay
              </Button>
            </div>
          ) : (
            <div className="flex justify-center mt-6">
              <span className="text-xs text-muted-foreground bg-muted/30 px-4 py-2.5 rounded-xl border border-border/40 inline-flex items-center gap-1.5 font-medium">
                <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />
                Không thể thiết lập hạn mức chi tiêu trong quá khứ.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Upsert Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={currentLimit?.amount ? "Chỉnh sửa giới hạn chi tiêu" : "Thiết lập giới hạn chi tiêu mới"}
        description={`Thiết lập hạn mức chi tiêu ${
          activeTab === "daily" ? "hàng ngày" : activeTab === "weekly" ? "hàng tuần" : "hàng tháng"
        }`}
        className="max-w-md"
      >
        <form onSubmit={handleSubmitLimit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="limitAmount" className="text-sm font-semibold">
              Hạn mức chi tiêu (₫)
            </Label>
            <Input
              id="limitAmount"
              type="number"
              value={modalAmount}
              onChange={(e) => setModalAmount(e.target.value)}
              placeholder="Nhập số tiền hạn mức, ví dụ: 500000"
              required
              className="rounded-xl border-border/80"
              min="1000"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="rounded-xl"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1 bg-primary text-primary-foreground hover:bg-primary/95 shadow-md rounded-xl font-semibold px-4"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Lưu lại
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={handleDeleteLimit}
        title="Xóa giới hạn chi tiêu"
        description={`Bạn có chắc chắn muốn xóa giới hạn chi tiêu ${
          activeTab === "daily" ? "hàng ngày" : activeTab === "weekly" ? "hàng tuần" : "hàng tháng"
        } hiện tại không?`}
        confirmText="Xóa ngay"
        cancelText="Hủy"
        isLoading={isDeleting}
      />
    </div>
  )
}
