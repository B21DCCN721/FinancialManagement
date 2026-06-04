"use client"

import { useState } from "react"
import { Plus, Search, Filter, MoreHorizontal, RefreshCw, X, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Modal } from "@/components/ui/modal"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSelector, useDispatch } from "react-redux"
import { RootState } from "@/store/store"
import { addTransaction, deleteTransaction, TransactionType } from "@/store/financeSlice"

const RECURRING_TRANSACTIONS = [
  { id: 1, desc: "Tiền thuê nhà", category: "Nhà cửa", type: "expense", amount: 1200.00, frequency: "Hàng tháng", nextDate: "2024-06-01" },
  { id: 2, desc: "Hóa đơn Internet", category: "Tiện ích", type: "expense", amount: 65.00, frequency: "Hàng tháng", nextDate: "2024-06-15" },
  { id: 3, desc: "Tập Gym", category: "Sức khỏe", type: "expense", amount: 49.99, frequency: "Hàng tháng", nextDate: "2024-06-10" },
]

export default function TransactionsPage() {
  const transactions = useSelector((state: RootState) => state.finance.transactions)
  const dispatch = useDispatch()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isRecurring, setIsRecurring] = useState(false)
  
  // Filter States
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  // Filter Logic
  const filteredTransactions = transactions.filter((tx) => {
    const matchSearch = tx.name.toLowerCase().includes(searchTerm.toLowerCase()) || tx.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchType = filterType === "all" || tx.type === filterType
    const txDate = tx.date.split('T')[0]
    const matchDateFrom = !dateFrom || txDate >= dateFrom
    const matchDateTo = !dateTo || txDate <= dateTo
    return matchSearch && matchType && matchDateFrom && matchDateTo
  })

  const filteredRecurring = RECURRING_TRANSACTIONS.filter((tx) => {
    const matchSearch = tx.desc.toLowerCase().includes(searchTerm.toLowerCase()) || tx.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchType = filterType === "all" || tx.type === filterType
    return matchSearch && matchType
  })

  const clearFilters = () => {
    setFilterType("all")
    setDateFrom("")
    setDateTo("")
  }

  const activeFilterCount = (filterType !== "all" ? 1 : 0) + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0)

  const handleAddSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const name = formData.get("desc") as string
    const amount = parseFloat(formData.get("amount") as string)
    if (!name || isNaN(amount)) return

    dispatch(addTransaction({
      name,
      amount,
      type: formData.get("type") as TransactionType,
      category: formData.get("category") as string,
      date: (formData.get("date") as string) || new Date().toISOString()
    }))

    setIsAddModalOpen(false)
    e.currentTarget.reset()
    setIsRecurring(false)
  }

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Giao dịch</h1>
          <p className="text-muted-foreground">
            Quản lý các khoản thu chi một lần và định kỳ của bạn.
          </p>
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
        
        <div className="mb-4 space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Tìm kiếm giao dịch..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
                  <Select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                    <option value="all">Tất cả</option>
                    <option value="income">Thu nhập</option>
                    <option value="expense">Chi phí</option>
                  </Select>
                </div>
                <div className="space-y-1.5 flex-1 min-w-[150px]">
                  <Label className="text-xs text-muted-foreground">Từ ngày</Label>
                  <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                </div>
                <div className="space-y-1.5 flex-1 min-w-[150px]">
                  <Label className="text-xs text-muted-foreground">Đến ngày</Label>
                  <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
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

        <TabsContent value="all" className="mt-0">
          <Card>
            <CardContent className="p-0">
              <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b bg-muted/50">
                    <tr className="border-b transition-colors hover:bg-muted/50">
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Ngày</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Mô tả</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Danh mục</th>
                      <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Số tiền</th>
                      <th className="h-12 px-4 align-middle font-medium text-muted-foreground w-[50px]"></th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {filteredTransactions.length > 0 ? (
                      filteredTransactions.map((tx) => (
                        <tr key={tx.id} className="border-b transition-colors hover:bg-muted/50">
                          <td className="p-4 align-middle">{formatDate(tx.date)}</td>
                          <td className="p-4 align-middle font-medium flex items-center gap-2">
                            <span>{tx.icon}</span> {tx.name}
                          </td>
                          <td className="p-4 align-middle">
                            <Badge variant="secondary" className="font-normal">
                              {tx.category}
                            </Badge>
                          </td>
                          <td className={`p-4 align-middle text-right font-medium ${tx.type === 'income' ? 'text-success' : 'text-foreground'}`}>
                            {tx.type === 'income' ? '+' : '-'}${tx.amount.toLocaleString()}
                          </td>
                          <td className="p-4 align-middle text-right">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-muted-foreground hover:text-danger hover:bg-danger/10"
                              onClick={() => dispatch(deleteTransaction(tx.id))}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-muted-foreground">
                          Không tìm thấy giao dịch nào.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recurring" className="mt-0">
          <Card>
            <div className="p-4 border-b bg-muted/20">
              <h3 className="font-medium flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-primary" />
                Giao dịch được lên lịch
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Các giao dịch này sẽ tự động được thêm vào tài khoản dựa trên tần suất của chúng.
              </p>
            </div>
            <CardContent className="p-0">
              <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b bg-muted/50">
                    <tr className="border-b transition-colors hover:bg-muted/50">
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Mô tả</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Danh mục</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Tần suất</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Ngày tiếp theo</th>
                      <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Số tiền</th>
                      <th className="h-12 px-4 align-middle font-medium text-muted-foreground w-[50px]"></th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {filteredRecurring.length > 0 ? (
                      filteredRecurring.map((tx) => (
                        <tr key={tx.id} className="border-b transition-colors hover:bg-muted/50">
                          <td className="p-4 align-middle font-medium">{tx.desc}</td>
                          <td className="p-4 align-middle">
                            <Badge variant="outline" className="font-normal">
                              {tx.category}
                            </Badge>
                          </td>
                          <td className="p-4 align-middle text-muted-foreground">{tx.frequency}</td>
                          <td className="p-4 align-middle">{formatDate(tx.nextDate)}</td>
                          <td className={`p-4 align-middle text-right font-medium ${tx.type === 'income' ? 'text-success' : 'text-foreground'}`}>
                            {tx.type === 'income' ? '+' : '-'}${tx.amount.toLocaleString()}
                          </td>
                          <td className="p-4 align-middle text-right">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                          Không có giao dịch định kỳ nào.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
              <Input id="date" name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Số tiền ($)</Label>
            <Input id="amount" name="amount" type="number" step="0.01" placeholder="0.00" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Danh mục</Label>
            <Select id="category" name="category">
              <option value="Tự động">✨ Tự động phân loại</option>
              <option value="Ăn uống">Ăn uống</option>
              <option value="Di chuyển">Di chuyển</option>
              <option value="Tiền lương">Tiền lương</option>
              <option value="Nhà cửa">Nhà cửa</option>
              <option value="Tiện ích">Tiện ích</option>
              <option value="Giải trí">Giải trí</option>
              <option value="Khác">Khác</option>
            </Select>
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
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit">Lưu giao dịch</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
