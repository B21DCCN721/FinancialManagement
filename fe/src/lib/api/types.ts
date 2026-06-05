// ─── Shared API Types ────────────────────────────────────────────────────────

export interface ApiError {
  statusCode: number
  message: string
  errors?: unknown[]
}

export interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: PaginationMeta
}

// ─── Domain Types (mirror của Backend) ───────────────────────────────────────

export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  name?: string
  avatarUrl?: string
  authProvider?: string
  createdAt: string
}

export interface Category {
  id: string
  name: string
  type: "income" | "expense"
  color?: string
  icon?: string
  userId: string
}

export interface Transaction {
  id: string
  amount: number
  type: "income" | "expense"
  description?: string
  date: string
  isRecurring: boolean
  frequency?: "daily" | "weekly" | "monthly" | "yearly" | null
  userId: string
  categoryId: string
  category?: Pick<Category, "id" | "name" | "color" | "icon">
  createdAt: string
  updatedAt: string
}

export interface Budget {
  id: string
  amount: number
  period: string // "YYYY-MM"
  userId: string
  categoryId: string
  category?: Pick<Category, "id" | "name" | "color" | "icon">
  createdAt: string
  updatedAt: string
}

export interface BudgetSummary {
  id: string
  amount: number
  period: string
  categoryId: string
  category: Pick<Category, "id" | "name" | "color" | "icon">
  spentAmount: number
  remaining: number
  percentUsed: number
  status: "normal" | "warning" | "exceeded"
}

export interface Goal {
  id: string
  title: string
  description?: string
  targetAmount: number
  currentAmount: number
  deadline: string
  color?: string
  icon?: string
  userId: string
  progressPercentage: number
  isCompleted: boolean
  createdAt: string
  updatedAt: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  user: User
}

export interface AutoCategorizeResult {
  categoryId: string | null
  categoryName: string | null
  type: string | null
}

// ─── Query Params ─────────────────────────────────────────────────────────────

export interface TransactionQuery {
  page?: number
  limit?: number
  type?: "income" | "expense"
  categoryId?: string
  dateFrom?: string
  dateTo?: string
  search?: string
  isRecurring?: boolean
}
