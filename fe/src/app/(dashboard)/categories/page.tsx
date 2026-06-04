"use client"

import { useState } from "react"
import { Plus, Tag, Utensils, Car, ShoppingBag, Gamepad2, Briefcase } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Modal } from "@/components/ui/modal"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

const CATEGORIES = [
  { id: 1, name: "Food & Dining", type: "expense", icon: <Utensils className="h-5 w-5" />, color: "bg-blue-500/10 text-blue-500" },
  { id: 2, name: "Transportation", type: "expense", icon: <Car className="h-5 w-5" />, color: "bg-emerald-500/10 text-emerald-500" },
  { id: 3, name: "Shopping", type: "expense", icon: <ShoppingBag className="h-5 w-5" />, color: "bg-rose-500/10 text-rose-500" },
  { id: 4, name: "Entertainment", type: "expense", icon: <Gamepad2 className="h-5 w-5" />, color: "bg-amber-500/10 text-amber-500" },
  { id: 5, name: "Salary", type: "income", icon: <Briefcase className="h-5 w-5" />, color: "bg-indigo-500/10 text-indigo-500" },
]

export default function CategoriesPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground">
            Manage your default and custom categories.
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Category
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((cat) => (
          <Card key={cat.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${cat.color}`}>
                    {cat.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold">{cat.name}</h3>
                    <p className="text-sm text-muted-foreground capitalize">{cat.type}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="text-muted-foreground">
                  <Tag className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
        title="Create Category"
        description="Add a new custom category for your transactions."
      >
        <form className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Category Name</Label>
            <Input id="name" placeholder="E.g., Travel" required />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input type="radio" name="type" value="expense" defaultChecked className="text-primary focus:ring-primary h-4 w-4" />
                <span className="text-sm font-medium">Expense</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="type" value="income" className="text-primary focus:ring-primary h-4 w-4" />
                <span className="text-sm font-medium">Income</span>
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Category</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
