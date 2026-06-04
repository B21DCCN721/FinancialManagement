"use client"

import { useState } from "react"
import { Target, Plus, TrendingUp, CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Modal } from "@/components/ui/modal"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

const GOALS = [
  { id: 1, title: "Emergency Fund", targetAmount: 10000, currentAmount: 6500, deadline: "2024-12-31", color: "bg-emerald-500" },
  { id: 2, title: "New Car Downpayment", targetAmount: 15000, currentAmount: 3200, deadline: "2025-06-01", color: "bg-blue-500" },
  { id: 3, title: "Japan Trip", targetAmount: 4000, currentAmount: 3800, deadline: "2024-09-15", color: "bg-rose-500" },
]

export default function GoalsPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<number | null>(null)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Goals</h1>
          <p className="text-muted-foreground">
            Set targets and track your savings progress.
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Goal
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {GOALS.map((goal) => {
          const percentage = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
          const isCompleted = percentage >= 100

          return (
            <Card key={goal.id} className="relative overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between text-lg">
                  <span className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-muted-foreground" />
                    {goal.title}
                  </span>
                  {isCompleted && (
                    <span className="text-xs font-bold text-emerald-500 uppercase px-2 py-1 bg-emerald-500/10 rounded-full">
                      Completed
                    </span>
                  )}
                </CardTitle>
                <CardDescription className="flex items-center gap-1 mt-1">
                  <CalendarDays className="h-3 w-3" />
                  Target date: {goal.deadline}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-end justify-between">
                    <div className="space-y-1">
                      <p className="text-3xl font-bold">${goal.currentAmount.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">of ${goal.targetAmount.toLocaleString()} target</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                  
                  <Progress value={percentage} indicatorColor={isCompleted ? 'bg-emerald-500' : goal.color} className="h-3" />
                  
                  <Button 
                    variant="secondary" 
                    className="w-full" 
                    onClick={() => {
                      setSelectedGoal(goal.id)
                      setIsAddFundsOpen(true)
                    }}
                    disabled={isCompleted}
                  >
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Add Funds
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Add New Goal Modal */}
      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
        title="Create Financial Goal"
        description="Set a new savings target."
      >
        <form className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Goal Title</Label>
            <Input id="title" placeholder="E.g., Vacation, Emergency Fund" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="target">Target Amount ($)</Label>
            <Input id="target" type="number" placeholder="5000" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deadline">Target Date</Label>
            <Input id="deadline" type="date" required />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Goal</Button>
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
        title="Add Funds to Goal"
        description="Record a deposit towards your savings goal."
      >
        <form className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="deposit">Amount to Deposit ($)</Label>
            <Input id="deposit" type="number" placeholder="100.00" autoFocus required />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsAddFundsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Confirm Deposit</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
