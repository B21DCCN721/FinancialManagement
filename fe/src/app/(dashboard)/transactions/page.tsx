"use client"

import { useState } from "react"
import { Plus, Search, Filter, MoreHorizontal, RefreshCw, X, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Modal } from "@/components/ui/modal"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  useGetTransactionsQuery,
  useCreateTransactionMutation,
  useDeleteTransactionMutation,
} from "@/services/transactionsApi"
import { logger } from "@/lib/logger"
import { toast } from "sonner"


export default function TransactionsPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isRecurring, setIsRecurring] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [page, setPage] = useState(1)

  const { data, isLoading, isFetching } = useGetTransactionsQuery({
    page,
    limit: 20,
    ...(filterType && { type: filterType as "income" | "expense" }),
    ...(dateFrom && { dateFrom: new Date(dateFrom).toISOString() }),
    ...(dateTo && { dateTo: new Date(dateTo + "T23:59:59").toISOString() }),
    ...(searchTerm && { search: searchTerm }),
  })

  const [createTransaction, { isLoading: isCreating }] = useCreateTransactionMutation()
  const [deleteTransaction, { isLoading: isDeleting }] = useDeleteTransactionMutation()

  const transactions = data?.data ?? []
  const pagination = data?.pagination

  const clearFilters = () => {
    setFilterType("")
    setDateFrom("")
    setDateTo("")
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

  const handleAddSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const description = formData.get("desc") as string
    const amount = parseFloat(formData.get("amount") as string)
    const type = formData.get("type") as "income" | "expense"
    const categoryId = formData.get("categoryId") as string
    const dateVal = formData.get("date") as string
    const frequency = formData.get("frequency") as "daily" | "weekly" | "monthly" | "yearly" | undefined

    if (!description || isNaN(amount) || !categoryId) return

    try {
      await createTransaction({
        description,
        amount,
        type,
        categoryId,
        date: dateVal ? new Date(dateVal).toISOString() : new Date().toISOString(),
        isRecurring,
        ...(isRecurring && frequency ? { frequency } : {}),
      }).unwrap()
      setIsAddModalOpen(false)
      e.currentTarget.reset()
      setIsRecurring(false)
      logger.info("Transaction created")
      toast.success("Thêm giao dịch thành công")
    } catch (err) {
      logger.error("Failed to create transaction", err)
      toast.error("Thêm giao dịch thất bại. Vui lòng thử lại.")
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteTransaction(id).unwrap()
      logger.info("Transaction deleted", { id })
      toast.success("Xóa giao dịch thành công")
    } catch (err) {
      logger.error("Failed to delete transaction", err)
      toast.error("Xóa giao dịch thất bại. Vui lòng thử lại.")
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
          <h1 className="text-3xl font-bold tracking-tight">Giao dịch</h1>
          <p className="text-muted-foreground">Quản lý các khoản thu chi một lần và định kỳ của bạn.</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Thêm giao dịch
        </Button>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">Tất cả giao dịch</TabsTrigger>
          <TabsTrigger value="recurring">Định kỳ</TabsTrigger>
        </TabsList>

        {/* Search & Filter */}
        <div className="mb-4 space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Tìm kiếm giao dịch..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1) }}
              />
            </div>
            <Button
              variant={activeFilterCount > 0 ? "default" : "outline"}
              className="shrink-0"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              <Filter className="mr-2 h-4 w-4" />
              Bộ lọc {activeFilterCount > 0 && `(${activeFilterCount})`}
            </Button>
          </div>

          {isFilterOpen && (
            <Card className="bg-muted/30 border-dashed">
              <CardContent className="p-4 flex flex-wrap gap-4 items-end">
                <div className="space-y-1.5 flex-1 min-w-[150px]">
                  <Label className="text-xs text-muted-foreground">Loại</Label>
                  <Select value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(1) }}>
                    <option value="">Tất cả</option>
                    <option value="income">Thu nhập</option>
                    <option value="expense">Chi phí</option>
                  </Select>
                </div>
                <div className="space-y-1.5 flex-1 min-w-[150px]">
                  <Label className="text-xs text-muted-foreground">Từ ngày</Label>
                  <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1) }} />
                </div>
                <div className="space-y-1.5 flex-1 min-w-[150px]">
                  <Label className="text-xs text-muted-foreground">Đến ngày</Label>
                  <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1) }} />
                </div>
                {activeFilterCount > 0 && (
                  <Button variant="ghost" className="shrink-0 text-muted-foreground" onClick={clearFilters}>
                    <X className="mr-2 h-4 w-4" />
                    Xóa lọc
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* All Transactions Tab */}
        <TabsContent value="all" className="mt-0">
          <Card>
            <CardContent className="p-4">
              {isLoading ? (
                <div className="flex justify-center items-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : transactions.length > 0 ? (
                <div className="space-y-2">
                  {transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="group flex items-center gap-4 p-3.5 rounded-xl transition-all hover:scale-[1.005] bg-card border border-border hover:border-primary/20 hover:shadow-[0_4px_20px_rgba(124,92,252,0.08)]"
                    >
                      {/* Icon */}
                      <div
                        className="h-10 w-10 rounded-xl flex items-center justify-center text-base shrink-0 font-medium"
                        style={{
                          background: tx.type === "income"
                            ? "rgba(16,217,160,0.12)"
                            : "rgba(255,77,109,0.12)",
                        }}
                      >
                        {tx.category?.icon ?? (tx.type === "income" ? "💰" : "💸")}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {tx.description ?? "—"}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {tx.category?.name && (
                            <span
                              className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                              style={{
                                background: tx.type === "income" ? "rgba(16,217,160,0.1)" : "rgba(124,92,252,0.1)",
                                color: tx.type === "income" ? "#10d9a0" : "#a78bfa",
                              }}
                            >
                              {tx.category.name}
                            </span>
                          )}
                          <span className="text-[11px] text-muted-foreground">{formatDate(tx.date)}</span>
                        </div>
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

                      {/* Delete */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-danger hover:bg-danger/10"
                        onClick={() => handleDelete(tx.id)}
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center text-2xl">📭</div>
                  <p className="text-sm text-muted-foreground">
                    {isFetching ? "Đang tải..." : "Không tìm thấy giao dịch nào."}
                  </p>
                </div>
              )}

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    {pagination.total} giao dịch · Trang {pagination.page}/{pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Trước</Button>
                    <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}>Tiếp</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recurring" className="mt-0">
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
              border: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(12px)",
            }}
          >
            <div className="p-5 border-b border-border/50">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <RefreshCw className="h-4 w-4 text-primary" />
                </div>
                Giao dịch định kỳ
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Các giao dịch tự động theo lịch.
              </p>
            </div>

            <div className="p-4">
              {isRecurringLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : filteredRecurring.length > 0 ? (
                <div className="space-y-2">
                  {filteredRecurring.map((tx) => (
                    <div
                      key={tx.id}
                      className="group flex items-center gap-4 p-3.5 rounded-xl transition-all hover:scale-[1.005] bg-card border border-border hover:border-primary/20 hover:shadow-[0_4px_20px_rgba(124,92,252,0.08)]"
                    >
                      {/* Icon */}
                      <div
                        className="h-10 w-10 rounded-xl flex items-center justify-center text-base shrink-0"
                        style={{
                          background: tx.type === "income" ? "rgba(16,217,160,0.12)" : "rgba(255,77,109,0.12)",
                        }}
                      >
                        {tx.category?.icon ?? "🔄"}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {tx.description ?? "—"}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {tx.category?.name && (
                            <span
                              className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                              style={{
                                background: "rgba(124,92,252,0.1)",
                                color: "#a78bfa",
                              }}
                            >
                              {tx.category.name}
                            </span>
                          )}
                          {tx.frequency && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-muted text-muted-foreground">
                              {tx.frequency === "daily" ? "Hàng ngày" : tx.frequency === "weekly" ? "Hàng tuần" : tx.frequency === "monthly" ? "Hàng tháng" : "Hàng năm"}
                            </span>
                          )}
                          <span className="text-[11px] text-muted-foreground">{formatDate(tx.date)}</span>
                        </div>
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

                      {/* Delete */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-danger hover:bg-danger/10"
                        onClick={() => handleDelete(tx.id)}
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center text-2xl">🔄</div>
                  <p className="text-sm text-muted-foreground">Không có giao dịch định kỳ nào.</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Thêm giao dịch"
        description="Điền thông tin bên dưới để thêm khoản thu nhập hoặc chi phí mới."
      >
        <form className="space-y-4 pt-4" onSubmit={handleAddSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Loại</Label>
              <Select id="type" name="type">
                <option value="expense">Chi phí</option>
                <option value="income">Thu nhập</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Ngày</Label>
              <Input id="date" name="date" type="date" defaultValue={new Date().toISOString().split("T")[0]} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Số tiền (₫)</Label>
            <Input id="amount" name="amount" type="number" step="0.01" placeholder="0.00" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="categoryId">Mã danh mục (ID)</Label>
            <Input id="categoryId" name="categoryId" placeholder="UUID danh mục từ Backend" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="desc">Mô tả / Tên</Label>
            <Input id="desc" name="desc" placeholder="VD: Mua cafe Starbucks" required />
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="recurring"
              className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
            />
            <Label htmlFor="recurring" className="font-normal">Thiết lập làm giao dịch định kỳ</Label>
          </div>

          {isRecurring && (
            <div className="space-y-2 p-3 bg-muted/50 rounded-md border">
              <Label htmlFor="frequency">Tần suất</Label>
              <Select id="frequency" name="frequency">
                <option value="weekly">Hàng tuần</option>
                <option value="monthly">Hàng tháng</option>
                <option value="yearly">Hàng năm</option>
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Hủy</Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Lưu giao dịch
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
