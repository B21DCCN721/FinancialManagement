"use client"

import { useState } from "react"
import { AlertCircle, Plus, Utensils, Car, ShoppingBag, Gamepad2, ReceiptText, Home, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { useSelector, useDispatch } from "react-redux"
import { RootState } from "@/store/store"
import { addBudget } from "@/store/financeSlice"

export default function BudgetsPage() {
  const transactions = useSelector((state: RootState) => state.finance.transactions)
  const budgets = useSelector((state: RootState) => state.finance.budgets)
  const dispatch = useDispatch()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const getCategoryConfig = (category: string) => {
    switch (category) {
      case "Ăn uống": return { icon: <Utensils className="h-5 w-5" />, color: "bg-blue-500" }
      case "Di chuyển": return { icon: <Car className="h-5 w-5" />, color: "bg-emerald-500" }
      case "Mua sắm": return { icon: <ShoppingBag className="h-5 w-5" />, color: "bg-rose-500" }
      case "Giải trí": return { icon: <Gamepad2 className="h-5 w-5" />, color: "bg-amber-500" }
      case "Nhà cửa": return { icon: <Home className="h-5 w-5" />, color: "bg-indigo-500" }
      case "Tiện ích": return { icon: <Zap className="h-5 w-5" />, color: "bg-cyan-500" }
      default: return { icon: <ReceiptText className="h-5 w-5" />, color: "bg-slate-500" }
    }
  }

  const handleAddSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const limit = parseFloat(formData.get("limit") as string)
    if (isNaN(limit)) return

    dispatch(addBudget({
      category: formData.get("category") as string,
      limit
    }))

    setIsAddModalOpen(false)
    e.currentTarget.reset()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Ngân sách</h1>
          <p className="text-muted-foreground">
            Thiết lập giới hạn chi tiêu và theo dõi mức độ hoàn thành.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105 bg-primary text-primary-foreground shadow-[0_4px_15px_rgba(124,92,252,0.4)]"
        >
          <Plus className="h-4 w-4" />
          Tạo ngân sách
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {budgets.map((budget) => {
          // Tính tổng chi tiêu thực tế từ các giao dịch "expense" cùng danh mục
          const spent = transactions
            .filter(tx => tx.type === "expense" && tx.category === budget.category)
            .reduce((sum, tx) => sum + tx.amount, 0)

          const percentage = Math.min((spent / budget.limit) * 100, 100)
          const isOverBudget = spent > budget.limit
          const isNearLimit = percentage >= 90 && !isOverBudget
          const config = getCategoryConfig(budget.category)

          return (
            <div key={budget.id} className={`glass-card rounded-2xl p-5 transition-all ${isOverBudget ? 'border-danger/50 shadow-[0_0_15px_rgba(255,77,109,0.2)]' : ''}`}>
              <div className="flex flex-row items-center justify-between pb-4">
                <div className="text-sm font-bold text-foreground flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-white ${config.color} shadow-lg`}>
                    {config.icon}
                  </div>
                  {budget.category}
                </div>
                <span className="text-sm font-semibold text-muted-foreground">${budget.limit.toLocaleString()} Giới hạn</span>
              </div>
              <div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="font-bold text-foreground">${spent.toLocaleString()} đã chi</span>
                    <span className="text-muted-foreground font-medium">${Math.max(budget.limit - spent, 0).toLocaleString()} còn lại</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        isOverBudget ? "bg-danger shadow-[0_0_10px_rgba(255,77,109,0.5)]" : isNearLimit ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" : "bg-primary shadow-[0_0_10px_rgba(124,92,252,0.5)]"
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  {isOverBudget && (
                    <div className="flex items-center text-xs font-semibold text-danger mt-2 bg-danger/10 px-2 py-1.5 rounded-md">
                      <AlertCircle className="mr-1.5 h-3.5 w-3.5" />
                      Bạn đã vượt quá ngân sách ${(spent - budget.limit).toLocaleString()}.
                    </div>
                  )}
                  {isNearLimit && (
                    <div className="flex items-center text-xs font-semibold text-amber-500 mt-2 bg-amber-500/10 px-2 py-1.5 rounded-md">
                      <AlertCircle className="mr-1.5 h-3.5 w-3.5" />
                      Cảnh báo: Bạn sắp đạt giới hạn chi tiêu.
                    </div>
                  )}
                </div>
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

      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
        title="Tạo ngân sách"
        description="Thiết lập giới hạn chi tiêu hàng tháng cho một danh mục mới."
      >
        <form className="space-y-4 pt-4" onSubmit={handleAddSubmit}>
          <div className="space-y-2">
            <Label htmlFor="category">Danh mục</Label>
            <Select id="category" name="category">
              <option value="Ăn uống">Ăn uống</option>
              <option value="Di chuyển">Di chuyển</option>
              <option value="Giải trí">Giải trí</option>
              <option value="Mua sắm">Mua sắm</option>
              <option value="Tiện ích">Tiện ích</option>
              <option value="Nhà cửa">Nhà cửa</option>
              <option value="Khác">Khác</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="limit">Hạn mức hàng tháng ($)</Label>
            <Input id="limit" name="limit" type="number" step="10" placeholder="VD: 500" required />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit">Lưu Ngân Sách</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
