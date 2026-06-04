"use client"

import { useState } from "react"
import { Plus, Search, Filter, MoreHorizontal, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Modal } from "@/components/ui/modal"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const TRANSACTIONS = [
  { id: 1, date: "2024-05-27", desc: "Grocery Store", category: "Food & Dining", type: "expense", amount: 120.50, status: "completed" },
  { id: 2, date: "2024-05-26", desc: "Monthly Salary", category: "Salary", type: "income", amount: 4500.00, status: "completed" },
  { id: 3, date: "2024-05-25", desc: "Uber Ride", category: "Transportation", type: "expense", amount: 15.20, status: "completed" },
  { id: 4, date: "2024-05-24", desc: "Netflix Subscription", category: "Entertainment", type: "expense", amount: 14.99, status: "completed" },
  { id: 5, date: "2024-05-22", desc: "Freelance Project", category: "Income", type: "income", amount: 850.00, status: "completed" },
]

const RECURRING_TRANSACTIONS = [
  { id: 1, desc: "Apartment Rent", category: "Housing", type: "expense", amount: 1200.00, frequency: "Monthly", nextDate: "2024-06-01" },
  { id: 2, desc: "Internet Bill", category: "Utilities", type: "expense", amount: 65.00, frequency: "Monthly", nextDate: "2024-06-15" },
  { id: 3, desc: "Gym Membership", category: "Health", type: "expense", amount: 49.99, frequency: "Monthly", nextDate: "2024-06-10" },
  { id: 4, desc: "Salary", category: "Income", type: "income", amount: 4500.00, frequency: "Monthly", nextDate: "2024-06-26" },
]

export default function TransactionsPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isRecurring, setIsRecurring] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">
            Manage your one-time and recurring transactions.
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Transactions</TabsTrigger>
          <TabsTrigger value="recurring">Recurring</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          <Card>
            <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between border-b">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search transactions..."
                  className="pl-8"
                />
              </div>
              <Button variant="outline" className="shrink-0">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </div>
            <CardContent className="p-0">
              <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b bg-muted/50">
                    <tr className="border-b transition-colors hover:bg-muted/50">
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Description</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Category</th>
                      <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Amount</th>
                      <th className="h-12 px-4 align-middle font-medium text-muted-foreground w-[50px]"></th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {TRANSACTIONS.map((tx) => (
                      <tr key={tx.id} className="border-b transition-colors hover:bg-muted/50">
                        <td className="p-4 align-middle">{tx.date}</td>
                        <td className="p-4 align-middle font-medium">{tx.desc}</td>
                        <td className="p-4 align-middle">
                          <Badge variant="secondary" className="font-normal">
                            {tx.category}
                          </Badge>
                        </td>
                        <td className={`p-4 align-middle text-right font-medium ${tx.type === 'income' ? 'text-emerald-500' : 'text-foreground'}`}>
                          {tx.type === 'income' ? '+' : '-'}${tx.amount.toFixed(2)}
                        </td>
                        <td className="p-4 align-middle text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recurring">
          <Card>
            <div className="p-4 border-b bg-muted/20">
              <h3 className="font-medium flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-primary" />
                Scheduled Transactions
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                These transactions will be automatically added to your account based on their frequency.
              </p>
            </div>
            <CardContent className="p-0">
              <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b bg-muted/50">
                    <tr className="border-b transition-colors hover:bg-muted/50">
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Description</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Category</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Frequency</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Next Date</th>
                      <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Amount</th>
                      <th className="h-12 px-4 align-middle font-medium text-muted-foreground w-[50px]"></th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {RECURRING_TRANSACTIONS.map((tx) => (
                      <tr key={tx.id} className="border-b transition-colors hover:bg-muted/50">
                        <td className="p-4 align-middle font-medium">{tx.desc}</td>
                        <td className="p-4 align-middle">
                          <Badge variant="outline" className="font-normal">
                            {tx.category}
                          </Badge>
                        </td>
                        <td className="p-4 align-middle text-muted-foreground">{tx.frequency}</td>
                        <td className="p-4 align-middle">{tx.nextDate}</td>
                        <td className={`p-4 align-middle text-right font-medium ${tx.type === 'income' ? 'text-emerald-500' : 'text-foreground'}`}>
                          {tx.type === 'income' ? '+' : '-'}${tx.amount.toFixed(2)}
                        </td>
                        <td className="p-4 align-middle text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
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
        title="Add Transaction"
        description="Fill in the details below to add a new income or expense."
      >
        <form className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select id="type">
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" defaultValue="2024-05-27" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Amount ($)</Label>
            <Input id="amount" type="number" step="0.01" placeholder="0.00" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select id="category">
              <option value="food">Food & Dining</option>
              <option value="transport">Transportation</option>
              <option value="salary">Salary</option>
              <option value="housing">Housing</option>
              <option value="utilities">Utilities</option>
              <option value="other">Other</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="desc">Description / Note</Label>
            <Input id="desc" placeholder="E.g., Groceries from Walmart" />
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <input 
              type="checkbox" 
              id="recurring" 
              className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
            />
            <Label htmlFor="recurring" className="font-normal">Set as recurring transaction</Label>
          </div>

          {isRecurring && (
            <div className="space-y-2 p-3 bg-muted/50 rounded-md border">
              <Label htmlFor="frequency">Frequency</Label>
              <Select id="frequency">
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Transaction</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
