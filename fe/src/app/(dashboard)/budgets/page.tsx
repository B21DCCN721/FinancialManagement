"use client"

import { useState } from "react"
import { AlertCircle, Plus, Utensils, Car, ShoppingBag, Gamepad2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Modal } from "@/components/ui/modal"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"

const BUDGETS = [
  { id: 1, category: "Food & Dining", limit: 500, spent: 450, icon: <Utensils className="h-5 w-5" />, color: "bg-blue-500" },
  { id: 2, category: "Transportation", limit: 300, spent: 120, icon: <Car className="h-5 w-5" />, color: "bg-emerald-500" },
  { id: 3, category: "Shopping", limit: 400, spent: 420, icon: <ShoppingBag className="h-5 w-5" />, color: "bg-rose-500" },
  { id: 4, category: "Entertainment", limit: 200, spent: 180, icon: <Gamepad2 className="h-5 w-5" />, color: "bg-amber-500" },
]

export default function BudgetsPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Budgets</h1>
          <p className="text-muted-foreground">
            Set spending limits and track your goals.
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Budget
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {BUDGETS.map((budget) => {
          const percentage = Math.min((budget.spent / budget.limit) * 100, 100)
          const isOverBudget = budget.spent > budget.limit
          const isNearLimit = percentage >= 90 && !isOverBudget

          return (
            <Card key={budget.id} className={`transition-all ${isOverBudget ? 'border-destructive/50 bg-destructive/5' : ''}`}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-white ${budget.color}`}>
                    {budget.icon}
                  </div>
                  {budget.category}
                </CardTitle>
                <span className="text-sm text-muted-foreground">${budget.limit} Limit</span>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">${budget.spent} spent</span>
                    <span className="text-muted-foreground">${Math.max(budget.limit - budget.spent, 0)} left</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isOverBudget ? "bg-destructive" : isNearLimit ? "bg-amber-500" : "bg-primary"
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  {isOverBudget && (
                    <div className="flex items-center text-xs text-destructive mt-2">
                      <AlertCircle className="mr-1 h-3 w-3" />
                      You have exceeded your budget by ${budget.spent - budget.limit}.
                    </div>
                  )}
                  {isNearLimit && (
                    <div className="flex items-center text-xs text-amber-500 mt-2">
                      <AlertCircle className="mr-1 h-3 w-3" />
                      Warning: You are very close to your limit.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
        title="Create Budget"
        description="Set a new monthly spending limit for a category."
      >
        <form className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select id="category">
              <option value="utilities">Utilities</option>
              <option value="health">Health & Fitness</option>
              <option value="education">Education</option>
              <option value="gifts">Gifts & Donations</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="limit">Monthly Limit ($)</Label>
            <Input id="limit" type="number" step="10" placeholder="E.g., 200" required />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Budget</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
