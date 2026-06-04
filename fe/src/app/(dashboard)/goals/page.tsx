"use client"

import { useState } from "react"
import { Target, Plus, TrendingUp, CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useSelector, useDispatch } from "react-redux"
import { RootState } from "@/store/store"
import { addGoal, updateGoalAmount } from "@/store/financeSlice"

export default function GoalsPage() {
  const goals = useSelector((state: RootState) => state.finance.goals)
  const dispatch = useDispatch()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null)

  const handleAddGoal = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const targetAmount = parseFloat(formData.get("target") as string)
    if (isNaN(targetAmount)) return

    dispatch(addGoal({
      name: formData.get("title") as string,
      targetAmount,
      currentAmount: 0,
      deadline: formData.get("deadline") as string
    }))

    setIsAddModalOpen(false)
    e.currentTarget.reset()
  }

  const handleAddFunds = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const deposit = parseFloat(formData.get("deposit") as string)
    if (isNaN(deposit) || !selectedGoal) return

    dispatch(updateGoalAmount({ id: selectedGoal, amount: deposit }))

    setIsAddFundsOpen(false)
    setSelectedGoal(null)
    e.currentTarget.reset()
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Không có"
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
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Mục tiêu tiết kiệm</h1>
          <p className="text-muted-foreground">
            Đặt mục tiêu và theo dõi tiến độ tiết kiệm của bạn.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105 bg-primary text-primary-foreground shadow-[0_4px_15px_rgba(124,92,252,0.4)]"
        >
          <Plus className="h-4 w-4" />
          Tạo mục tiêu
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {goals.map((goal, idx) => {
          const percentage = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
          const isCompleted = percentage >= 100
          
          // Tạo màu ngẫu nhiên nhưng cố định cho từng thẻ dựa trên index
          const colors = [
            "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]",
            "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]",
            "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]",
            "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]",
            "bg-primary shadow-[0_0_10px_rgba(124,92,252,0.5)]"
          ]
          const colorClass = colors[idx % colors.length]

          return (
            <div key={goal.id} className="glass-card rounded-2xl p-5 relative overflow-hidden transition-all hover:scale-[1.02]">
              <div className="pb-4">
                <div className="flex items-center justify-between text-lg font-bold text-foreground mb-1">
                  <span className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    {goal.name}
                  </span>
                  {isCompleted && (
                    <span className="text-[10px] font-bold text-success uppercase px-2 py-1 bg-success/10 border border-success/20 rounded-full">
                      Hoàn thành
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Hạn chót: {formatDate(goal.deadline)}
                </div>
              </div>
              <div>
                <div className="space-y-4">
                  <div className="flex items-end justify-between">
                    <div className="space-y-1">
                      <p className="text-3xl font-bold text-foreground">${goal.currentAmount.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">trên tổng ${goal.targetAmount.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">{percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                  
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${isCompleted ? 'bg-success shadow-[0_0_10px_rgba(16,217,160,0.5)]' : colorClass}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  
                  <button 
                    className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-all ${
                      isCompleted 
                        ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                        : 'bg-card border border-border text-foreground hover:bg-accent hover:text-primary'
                    }`}
                    onClick={() => {
                      setSelectedGoal(goal.id)
                      setIsAddFundsOpen(true)
                    }}
                    disabled={isCompleted}
                  >
                    <TrendingUp className="h-4 w-4" />
                    Nạp thêm tiền
                  </button>
                </div>
              </div>
            </div>
          )
        })}
        {goals.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground glass-card rounded-2xl">
            Bạn chưa có mục tiêu nào. Hãy thiết lập mục tiêu đầu tiên nhé!
          </div>
        )}
      </div>

      {/* Add New Goal Modal */}
      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
        title="Tạo Mục tiêu mới"
        description="Thiết lập mục tiêu tiết kiệm mới của bạn."
      >
        <form className="space-y-4 pt-4" onSubmit={handleAddGoal}>
          <div className="space-y-2">
            <Label htmlFor="title">Tên mục tiêu</Label>
            <Input id="title" name="title" placeholder="VD: Du lịch hè, Quỹ khẩn cấp" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="target">Số tiền đích ($)</Label>
            <Input id="target" name="target" type="number" placeholder="5000" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deadline">Hạn chót</Label>
            <Input id="deadline" name="deadline" type="date" required />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit">Lưu mục tiêu</Button>
          </div>
        </form>
      </Modal>

      {/* Add Funds Modal */}
      <Modal 
        isOpen={isAddFundsOpen} 
        onClose={() => {
          setIsAddFundsOpen(false)
          setSelectedGoal(null)
        }}
        title="Nạp thêm tiền vào Mục tiêu"
        description="Ghi nhận số tiền bạn vừa tích lũy được cho mục tiêu này."
      >
        <form className="space-y-4 pt-4" onSubmit={handleAddFunds}>
          <div className="space-y-2">
            <Label htmlFor="deposit">Số tiền gửi vào ($)</Label>
            <Input id="deposit" name="deposit" type="number" step="0.01" placeholder="100.00" autoFocus required />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsAddFundsOpen(false)}>
              Hủy
            </Button>
            <Button type="submit">Xác nhận nạp</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
