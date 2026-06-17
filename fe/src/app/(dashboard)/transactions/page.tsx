"use client"

import { useState, Suspense, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { Plus, Search, Filter, FilterX, RefreshCw, Trash2, Pencil, Loader2, Inbox, StopCircle, ArrowUpRight, ArrowDownRight, Clock, CalendarClock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { DatePicker } from "@/components/ui/date-picker"
import { Modal } from "@/components/ui/modal"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DynamicIcon } from "@/components/ui/dynamic-icon"
import { ConfirmModal } from "@/components/ui/confirm-modal"
import {
  useGetTransactionsQuery,
  useCreateTransactionMutation,
  useUpdateTransactionMutation,
  useDeleteTransactionMutation,
  useStopRecurringMutation,
} from "@/services/transactionsApi"
import { useGetBudgetSummaryQuery } from "@/services/budgetsApi"
import { useGetCategoriesQuery } from "@/services/categoriesApi"
import { logger } from "@/lib/logger"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import type { Transaction } from "@/lib/api/types"

const FREQUENCY_LABELS: Record<string, string> = {
  daily: "Hàng ngày",
  weekly: "Hàng tuần",
  monthly: "Hàng tháng",
  yearly: "Hàng năm",
}

function formatNextRun(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null
  try {
    return new Date(dateStr).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
  } catch { return null }
}

function TransactionsContent() {
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const urlSearch = searchParams.get("search") || ""

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)
  const isSubmittingRef = useRef(false)

  const [isRecurring, setIsRecurring] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState(urlSearch)
  const [filterType, setFilterType] = useState<string>("")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [stopRecurringId, setStopRecurringId] = useState<string | null>(null)
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined)
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined)
  const [dateFromStr, setDateFromStr] = useState<string>("")
  const [dateToStr, setDateToStr] = useState<string>("")
  const [page, setPage] = useState(1)
  const [txType, setTxType] = useState<"income" | "expense">("expense")
  const [txCategoryId, setTxCategoryId] = useState<string>("")
  const [txDate, setTxDate] = useState<string>(() => new Date().toISOString().split("T")[0])
  const [activeTab, setActiveTab] = useState("all")

  const { data: categories = [] } = useGetCategoriesQuery({ type: txType })
  const { data: budgetsMonth = [] } = useGetBudgetSummaryQuery({ period: txDate.substring(0, 7) }, { skip: txType !== "expense" || !isModalOpen })
  const { data: budgetsYear = [] } = useGetBudgetSummaryQuery({ period: txDate.substring(0, 4) }, { skip: txType !== "expense" || !isModalOpen })

  const [prevUrlSearch, setPrevUrlSearch] = useState(urlSearch)

  if (urlSearch !== prevUrlSearch) {
    setPrevUrlSearch(urlSearch)
    setSearchTerm(urlSearch)
    setPage(1)
  }

  const { data, isLoading, isFetching } = useGetTransactionsQuery({
    page,
    limit: 20,
    ...(filterType && { type: filterType as "income" | "expense" }),
    ...(dateFrom && { dateFrom: dateFrom.toISOString() }),
    ...(dateTo && { dateTo: dateTo.toISOString() }),
    ...(searchTerm && { search: searchTerm }),
    ...(activeTab === "non_recurring" && { isRecurring: false }),
  }, { skip: activeTab === "recurring" })

  const [createTransaction, { isLoading: isCreating }] = useCreateTransactionMutation()
  const [updateTransaction, { isLoading: isUpdating }] = useUpdateTransactionMutation()
  const [deleteTransaction, { isLoading: isDeleting }] = useDeleteTransactionMutation()
  const [stopRecurring, { isLoading: isStopping }] = useStopRecurringMutation()

  const isSaving = isCreating || isUpdating

  const transactions = data?.data ?? []
  const pagination = data?.pagination

  const clearFilters = () => {
    setFilterType("")
    setDateFrom(undefined)
    setDateTo(undefined)
    setDateFromStr("")
    setDateToStr("")
    setSearchTerm("")
    setPage(1)
  }

  const activeFilterCount = (filterType ? 1 : 0) + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0)

  const { data: recurringData, isLoading: isRecurringLoading } = useGetTransactionsQuery({ page: 1, limit: 100, isRecurring: true })
  const recurringTransactions = recurringData?.data ?? []

  const filteredRecurring = recurringTransactions.filter((tx) => {
    const matchSearch = (tx.description ?? "").toLowerCase().includes(searchTerm.toLowerCase())
    const matchType = !filterType || tx.type === filterType
    return matchSearch && matchType
  })

  const handleAddClick = () => {
    setEditingTx(null)
    setTxType("expense")
    setTxCategoryId("")
    setTxDate(new Date().toISOString().split("T")[0])
    setIsRecurring(false)
    setIsModalOpen(true)
  }

  const handleEditClick = (tx: Transaction) => {
    setEditingTx(tx)
    setTxType(tx.type)
    setTxCategoryId(tx.categoryId)
    setTxDate(new Date(tx.date).toISOString().split("T")[0])
    setIsRecurring(tx.isRecurring)
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (isSubmittingRef.current) return
    isSubmittingRef.current = true

    const form = e.currentTarget
    const formData = new FormData(form)
    const description = formData.get("description") as string
    const amount = parseFloat(formData.get("amount") as string)
    const type = formData.get("type") as "income" | "expense"
    const categoryId = formData.get("categoryId") as string
    const dateVal = formData.get("date") as string
    const frequency = formData.get("frequency") as "daily" | "weekly" | "monthly" | "yearly" | undefined

    if (!description || isNaN(amount) || !categoryId) {
      isSubmittingRef.current = false
      return
    }

    try {
      const payload = {
        description,
        amount,
        type,
        categoryId,
        date: dateVal ? new Date(dateVal).toISOString() : new Date().toISOString(),
        isRecurring,
        ...(isRecurring && frequency ? { frequency } : {}),
      }

      if (!editingTx && type === "expense") {
        const monthBudget = budgetsMonth.find(b => b.categoryId === categoryId)
        const yearBudget = budgetsYear.find(b => b.categoryId === categoryId)

        let warning = ""
        if (monthBudget && monthBudget.remaining - amount < 0) {
          warning = "Cảnh báo: Khoản chi này làm vượt ngân sách tháng!"
        } else if (yearBudget && yearBudget.remaining - amount < 0) {
          warning = "Cảnh báo: Khoản chi này làm vượt ngân sách năm!"
        }

        if (warning) {
          toast.warning(warning, { duration: 6000 })
        }
      }

      if (editingTx) {
        await updateTransaction({ id: editingTx.id, body: payload }).unwrap()
        logger.info("Transaction updated")
        toast.success(t("transactions.updateSuccess") || "Cập nhật giao dịch thành công")
      } else {
        await createTransaction(payload).unwrap()
        logger.info("Transaction created")
        toast.success(t("transactions.addSuccess") || "Thêm giao dịch thành công")
      }

      setIsModalOpen(false)
      form.reset()
      setEditingTx(null)
      setIsRecurring(false)
      setTxDate(new Date().toISOString().split("T")[0])
    } catch (err: any) {
      logger.error("Failed to save transaction", err)
      toast.error(err?.data?.message || t("transactions.saveError") || "Có lỗi xảy ra khi lưu")
    } finally {
      isSubmittingRef.current = false
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteId) return
    try {
      await deleteTransaction(deleteId).unwrap()
      logger.info("Transaction deleted", { id: deleteId })
      toast.success(t("transactions.deleteSuccess") || "Xóa giao dịch thành công")
      setDeleteId(null)
    } catch (err: any) {
      logger.error("Failed to delete transaction", err)
      toast.error(err?.data?.message || t("transactions.deleteError") || "Lỗi khi xóa giao dịch")
    }
  }

  const handleStopRecurringConfirm = async () => {
    if (!stopRecurringId) return
    try {
      await stopRecurring(stopRecurringId).unwrap()
      logger.info("Recurring stopped", { id: stopRecurringId })
      toast.success("Đã dừng giao dịch định kỳ thành công")
      setStopRecurringId(null)
    } catch (err: any) {
      logger.error("Failed to stop recurring", err)
      toast.error(err?.data?.message || "Lỗi khi dừng giao dịch định kỳ")
    }
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
    } catch { return dateStr }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-foreground">{t("transactions.title")}</h1>
          <p className="text-sm md:text-lg text-muted-foreground">{t("transactions.subtitle")}</p>
        </div>
        <Button onClick={handleAddClick}>
          <Plus className="mr-2 h-4 w-4" />
          {t("transactions.addTransaction")}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); setPage(1); }} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">{t("transactions.allTransactions")}</TabsTrigger>
          <TabsTrigger value="non_recurring">{t("transactions.nonRecurring")}</TabsTrigger>
          <TabsTrigger value="recurring">
            {t("transactions.recurring")}
          </TabsTrigger>
        </TabsList>

        {/* Search & Filter */}
        <div className="mb-4 space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={t("transactions.searchPlaceholder")}
                className="pl-8"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1) }}
                autoComplete="off"
              />
            </div>
            <Button
              variant={activeFilterCount > 0 ? "default" : "outline"}
              className="shrink-0"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              <Filter className="mr-2 h-4 w-4" />
              {t("transactions.filter")} {activeFilterCount > 0 && `(${activeFilterCount})`}
            </Button>
          </div>

          {isFilterOpen && (
            <Card className="bg-muted/30 border-dashed">
              <CardContent className="p-4 flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">{t("transactions.type")}</Label>
                    <Select value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(1) }}>
                      <option value="">{t("transactions.all")}</option>
                      <option value="income">{t("transactions.income")}</option>
                      <option value="expense">{t("transactions.expense")}</option>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">{t("transactions.dateFrom")}</Label>
                    <DatePicker
                      value={dateFromStr}
                      onChange={(d) => {
                        setDateFromStr(d)
                        const newDate = new Date(d);
                        setDateFrom(newDate);
                        if (dateTo && newDate > dateTo) { setDateTo(undefined); setDateToStr(""); }
                        setPage(1);
                      }}
                      maxDate={dateToStr || undefined}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">{t("transactions.dateTo")}</Label>
                    <DatePicker
                      value={dateToStr}
                      onChange={(d) => {
                        setDateToStr(d)
                        const newDate = new Date(d);
                        setDateTo(newDate);
                        if (dateFrom && newDate < dateFrom) { setDateFrom(undefined); setDateFromStr(""); }
                        setPage(1);
                      }}
                      minDate={dateFromStr || undefined}
                    />
                  </div>
                </div>
                {activeFilterCount > 0 && (
                  <div className="flex justify-end pt-2 border-t border-border/50">
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-danger hover:bg-danger/10" onClick={clearFilters}>
                      <FilterX className="mr-2 h-4 w-4" />
                      {t("transactions.clearFilter")}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* All / Non-Recurring Transactions Tab */}
        <TabsContent value={activeTab} className="mt-0">
          {activeTab !== "recurring" && (
            <div className="space-y-3">
              {isLoading ? (
                <div className="flex justify-center items-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : transactions.length > 0 ? (
                <>
                  <div className="space-y-2">
                    {transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className={`group p-3.5 rounded-xl transition-all hover:scale-[1.005] border ${tx.isRecurring
                          ? "bg-primary/[0.03] border-primary/20 hover:border-primary/40 hover:shadow-[0_4px_20px_rgba(124,92,252,0.12)]"
                          : "bg-card border-border hover:border-primary/20 hover:shadow-[0_4px_20px_rgba(124,92,252,0.08)]"
                          }`}
                      >
                        {/* Mobile: stacked layout / Desktop: single row */}
                        {/* Desktop row */}
                        <div className="hidden sm:flex items-center gap-4">
                          {/* Icon */}
                          <div
                            className="relative h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                            style={{
                              background: tx.category?.color ? `${tx.category.color}20` : (
                                tx.isRecurring
                                  ? "rgba(124,92,252,0.12)"
                                  : tx.type === "income"
                                    ? "rgba(16,217,160,0.12)"
                                    : "rgba(255,77,109,0.12)"
                              ),
                              color: tx.category?.color ? tx.category.color : (
                                tx.isRecurring
                                  ? "#7c5cfc"
                                  : tx.type === "income" ? "#10d9a0" : "#ff4d6d"
                              )
                            }}
                          >
                            {tx.category?.icon
                              ? <DynamicIcon name={tx.category.icon} className="h-5 w-5" />
                              : tx.isRecurring
                                ? <CalendarClock className="h-5 w-5" />
                                : tx.type === "income"
                                  ? <ArrowUpRight className="h-5 w-5" />
                                  : <ArrowDownRight className="h-5 w-5" />}
                            {tx.isRecurring && (
                              <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-primary flex items-center justify-center">
                                <RefreshCw className="h-2 w-2 text-white" />
                              </span>
                            )}
                          </div>
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{tx.description ?? "—"}</p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              {tx.category?.name && (
                                <span
                                  className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                                  style={{
                                    background: tx.category?.color ? `${tx.category.color}1A` : (
                                      tx.isRecurring ? "rgba(124,92,252,0.1)" : tx.type === "income" ? "rgba(16,217,160,0.1)" : "rgba(124,92,252,0.1)"
                                    ),
                                    color: tx.category?.color ? tx.category.color : (
                                      tx.isRecurring ? "#a78bfa" : tx.type === "income" ? "#10d9a0" : "#a78bfa"
                                    ),
                                  }}
                                >
                                  {tx.category.name}
                                </span>
                              )}
                              {tx.isRecurring && (
                                <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-primary/10 text-primary flex items-center gap-1">
                                  <RefreshCw className="h-2.5 w-2.5" />
                                  {tx.frequency ? FREQUENCY_LABELS[tx.frequency] : "Định kỳ"}
                                </span>
                              )}
                              <span className="text-[11px] text-muted-foreground">{formatDate(tx.date)}</span>
                            </div>
                          </div>
                          {/* Amount */}
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold tabular-nums" style={{ color: tx.type === "income" ? "#10d9a0" : "#ff4d6d" }}>
                              {tx.type === "income" ? "+" : "-"}{tx.amount.toLocaleString("vi-VN")} ₫
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {tx.isRecurring
                                ? "Định kỳ · " + (tx.type === "income" ? t("transactions.income") : t("transactions.expense"))
                                : tx.type === "income" ? t("transactions.income") : t("transactions.expense")}
                            </p>
                          </div>
                          {/* Actions */}
                          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => handleEditClick(tx)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-danger hover:bg-danger/10" onClick={() => setDeleteId(tx.id)} disabled={isDeleting}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Mobile: stacked layout */}
                        <div className="flex flex-col gap-1.5 sm:hidden">
                          {/* Row 1: Icon + Name */}
                          <div className="flex items-center gap-2">
                            <div
                              className="relative h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
                              style={{
                                background: tx.category?.color ? `${tx.category.color}20` : (
                                  tx.isRecurring
                                    ? "rgba(124,92,252,0.12)"
                                    : tx.type === "income"
                                      ? "rgba(16,217,160,0.12)"
                                      : "rgba(255,77,109,0.12)"
                                ),
                                color: tx.category?.color ? tx.category.color : (
                                  tx.isRecurring
                                    ? "#7c5cfc"
                                    : tx.type === "income" ? "#10d9a0" : "#ff4d6d"
                                )
                              }}
                            >
                              {tx.category?.icon
                                ? <DynamicIcon name={tx.category.icon} className="h-4 w-4" />
                                : tx.isRecurring
                                  ? <CalendarClock className="h-4 w-4" />
                                  : tx.type === "income"
                                    ? <ArrowUpRight className="h-4 w-4" />
                                    : <ArrowDownRight className="h-4 w-4" />}
                              {tx.isRecurring && (
                                <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary flex items-center justify-center">
                                  <RefreshCw className="h-1.5 w-1.5 text-white" />
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-semibold text-foreground truncate flex-1">{tx.description ?? "—"}</p>
                          </div>

                          {/* Row 2: Tags (category + recurring) — top-left */}
                          {(tx.category?.name || tx.isRecurring) && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {tx.category?.name && (
                                <span
                                  className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                                  style={{
                                    background: tx.category?.color ? `${tx.category.color}1A` : (
                                      tx.isRecurring ? "rgba(124,92,252,0.1)" : tx.type === "income" ? "rgba(16,217,160,0.1)" : "rgba(124,92,252,0.1)"
                                    ),
                                    color: tx.category?.color ? tx.category.color : (
                                      tx.isRecurring ? "#a78bfa" : tx.type === "income" ? "#10d9a0" : "#a78bfa"
                                    ),
                                  }}
                                >
                                  {tx.category.name}
                                </span>
                              )}
                              {tx.isRecurring && (
                                <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-primary/10 text-primary flex items-center gap-1">
                                  <RefreshCw className="h-2.5 w-2.5" />
                                  {tx.frequency ? FREQUENCY_LABELS[tx.frequency] : "Định kỳ"}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Row 3: Amount + type + Actions */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold tabular-nums" style={{ color: tx.type === "income" ? "#10d9a0" : "#ff4d6d" }}>
                                {tx.type === "income" ? "+" : "-"}{tx.amount.toLocaleString("vi-VN")} ₫
                              </p>
                              <span className="text-[11px] text-muted-foreground">
                                {tx.isRecurring
                                  ? "Định kỳ · " + (tx.type === "income" ? t("transactions.income") : t("transactions.expense"))
                                  : tx.type === "income" ? t("transactions.income") : t("transactions.expense")}
                              </span>
                            </div>
                            {/* Actions */}
                            <div className="flex items-center gap-0.5">
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => handleEditClick(tx)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-danger hover:bg-danger/10" onClick={() => setDeleteId(tx.id)} disabled={isDeleting}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>

                          {/* Row 4: Date — bottom-right */}
                          <div className="flex justify-end">
                            <span className="text-[11px] text-muted-foreground">{formatDate(tx.date)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Pagination */}
                  {pagination && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
                      <p className="text-xs text-muted-foreground">
                        {pagination.total} {t("transactions.title").toLowerCase()} · {t("transactions.page")} {pagination.page}/{pagination.totalPages}
                      </p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>{t("transactions.prev")}</Button>
                        <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}>{t("transactions.next")}</Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-6">
                  <div className="h-14 w-14 rounded-2xl bg-muted/50 flex items-center justify-center text-muted-foreground">
                    <Inbox className="h-6 w-6" />
                  </div>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    {isFetching ? t("transactions.loading") : t("transactions.noTransactions")}
                  </p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* Recurring Transactions Tab */}
        <TabsContent value="recurring" className="mt-0">
          <div className="space-y-4">
            <div className="p-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                      <RefreshCw className="h-4 w-4 text-primary" />
                    </div>
                    {t("transactions.recurringTitle")}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("transactions.recurringSubtitle")}
                  </p>
                </div>
                {filteredRecurring.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {filteredRecurring.length} giao dịch đang hoạt động
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {isRecurringLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : filteredRecurring.length > 0 ? (
                <>
                  {filteredRecurring.map((tx) => {
                    const nextRun = formatNextRun(tx.nextRunAt)
                    return (
                      <div
                        key={tx.id}
                        className="group flex items-center gap-4 p-4 rounded-xl transition-all hover:scale-[1.005] bg-card border border-border hover:border-primary/20 hover:shadow-[0_4px_20px_rgba(124,92,252,0.08)]"
                      >
                        {/* Icon */}
                        <div
                          className="relative h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                          style={{
                            background: tx.category?.color ? `${tx.category.color}20` : (tx.type === "income" ? "rgba(16,217,160,0.12)" : "rgba(124,92,252,0.12)"),
                            color: tx.category?.color ? tx.category.color : (tx.type === "income" ? "#10d9a0" : "#7c5cfc"),
                          }}
                        >
                          {tx.category?.icon
                            ? <DynamicIcon name={tx.category.icon} className="h-5 w-5" />
                            : <CalendarClock className="h-5 w-5" />}
                          <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-primary flex items-center justify-center">
                            <RefreshCw className="h-2 w-2 text-white" />
                          </span>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {tx.description ?? "—"}
                          </p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {tx.category?.name && (
                              <span
                                className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                                style={{
                                  background: tx.category?.color ? `${tx.category.color}1A` : "rgba(124,92,252,0.1)",
                                  color: tx.category?.color ? tx.category.color : "#a78bfa"
                                }}
                              >
                                {tx.category.name}
                              </span>
                            )}
                            {tx.frequency && (
                              <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-primary/10 text-primary flex items-center gap-1">
                                <RefreshCw className="h-2.5 w-2.5" />
                                {FREQUENCY_LABELS[tx.frequency] ?? tx.frequency}
                              </span>
                            )}
                            {nextRun && (
                              <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-amber-500/10 text-amber-500 flex items-center gap-1">
                                <Clock className="h-2.5 w-2.5" />
                                Tiếp: {nextRun}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Ngày bắt đầu: {formatDate(tx.date)}
                          </p>
                        </div>

                        {/* Amount */}
                        <div className="text-right shrink-0">
                          <p
                            className="text-sm font-bold tabular-nums"
                            style={{ color: tx.type === "income" ? "#10d9a0" : "#ff4d6d" }}
                          >
                            {tx.type === "income" ? "+" : "-"}{tx.amount.toLocaleString("vi-VN")} ₫
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {tx.type === "income" ? "Thu nhập" : "Chi phí"}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                            onClick={() => handleEditClick(tx)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>

                          {/* Stop Recurring */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10"
                            onClick={() => setStopRecurringId(tx.id)}
                            disabled={isStopping}
                            title="Dừng định kỳ"
                          >
                            <StopCircle className="h-4 w-4" />
                          </Button>

                          {/* Delete */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-danger hover:bg-danger/10"
                            onClick={() => setDeleteId(tx.id)}
                            disabled={isDeleting}
                            title="Xóa giao dịch"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-center px-6">
                  <div className="h-14 w-14 rounded-2xl bg-muted/50 flex items-center justify-center text-muted-foreground">
                    <RefreshCw className="h-6 w-6" />
                  </div>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    {t("transactions.noRecurring")}
                  </p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingTx(null); setIsRecurring(false); }}
        title={editingTx ? (t("transactions.editModalTitle") || "Sửa giao dịch") : (t("transactions.addModalTitle") || "Thêm giao dịch")}
        description={editingTx ? (t("transactions.editModalDesc") || "Cập nhật thông tin giao dịch của bạn.") : (t("transactions.addModalDesc") || "Nhập thông tin cho giao dịch mới của bạn.")}
      >
        <form className="space-y-4 pt-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">{t("transactions.type")}</Label>
              <Select id="type" name="type" value={txType} onChange={(e) => { setTxType(e.target.value as "income" | "expense"); setTxCategoryId(""); }}>
                <option value="expense">{t("transactions.expense")}</option>
                <option value="income">{t("transactions.income")}</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">{t("transactions.date")}</Label>
              <DatePicker name="date" value={txDate} onChange={setTxDate} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">{t("transactions.amount")}</Label>
            <Input id="amount" name="amount" type="number" inputMode="decimal" autoComplete="off" step="10" placeholder="0" defaultValue={editingTx?.amount} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="categoryId">{t("transactions.categoryId") || "Danh mục"}</Label>
            <Select
              id="categoryId"
              name="categoryId"
              value={txCategoryId}
              onChange={(e) => setTxCategoryId(e.target.value)}
              required
              options={[
                { value: "", label: t("transactions.selectCategory") || "-- Chọn danh mục --" },
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
            <Label htmlFor="description">{t("transactions.description")}</Label>
            <Input id="description" name="description" autoComplete="off" placeholder="VD: Lương tháng 5, Ăn trưa..." defaultValue={editingTx?.description || ""} required />
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="recurring"
              className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              disabled={!!editingTx && editingTx.isRecurring === false}
            />
            <Label htmlFor="recurring" className="font-normal">{t("transactions.setRecurring")}</Label>
          </div>

          {isRecurring && (
            <div className="space-y-2 p-3 bg-muted/50 rounded-md border">
              <Label htmlFor="frequency">{t("transactions.frequency")}</Label>
              <Select id="frequency" name="frequency" defaultValue={editingTx?.frequency || "monthly"}>
                <option value="daily">{t("transactions.daily")}</option>
                <option value="weekly">{t("transactions.weekly")}</option>
                <option value="monthly">{t("transactions.monthly")}</option>
                <option value="yearly">{t("transactions.yearly")}</option>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                Hệ thống sẽ tự động tạo giao dịch mới theo chu kỳ này mỗi ngày lúc 00:05.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => { setIsModalOpen(false); setEditingTx(null); }}>{t("transactions.cancel")}</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSaving ? t("transactions.saving") : t("transactions.save")}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title={t("transactions.deleteConfirmTitle") || "Xóa giao dịch"}
        description={t("transactions.deleteConfirmDesc") || "Bạn có chắc chắn muốn xóa giao dịch này? Hành động này không thể hoàn tác."}
        confirmText={t("transactions.delete") || "Xóa"}
        cancelText={t("transactions.cancel") || "Hủy"}
        isLoading={isDeleting}
      />

      {/* Stop Recurring Confirm Modal */}
      <ConfirmModal
        isOpen={!!stopRecurringId}
        onClose={() => setStopRecurringId(null)}
        onConfirm={handleStopRecurringConfirm}
        title="Dừng giao dịch định kỳ"
        description="Giao dịch này sẽ không còn tự động tạo thêm các kỳ mới. Các giao dịch đã tạo từ trước vẫn được giữ nguyên. Bạn có chắc muốn dừng không?"
        confirmText="Dừng định kỳ"
        cancelText="Hủy"
        isLoading={isStopping}
      />
    </div>
  )
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    }>
      <TransactionsContent />
    </Suspense>
  )
}
