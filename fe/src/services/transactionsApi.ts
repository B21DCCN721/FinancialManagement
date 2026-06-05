import { baseApi } from "@/lib/api/baseApi"
import type {
  Transaction,
  PaginatedResponse,
  TransactionQuery,
  AutoCategorizeResult,
} from "@/lib/api/types"

interface CreateTransactionRequest {
  amount: number
  type: "income" | "expense"
  description?: string
  date: string
  isRecurring?: boolean
  frequency?: "daily" | "weekly" | "monthly" | "yearly"
  categoryId: string
}

interface UpdateTransactionRequest {
  amount?: number
  type?: "income" | "expense"
  description?: string
  date?: string
  isRecurring?: boolean
  frequency?: "daily" | "weekly" | "monthly" | "yearly" | null
  categoryId?: string
}

function buildQueryString(params: TransactionQuery): string {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value))
    }
  })
  const qs = searchParams.toString()
  return qs ? `?${qs}` : ""
}

export const transactionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTransactions: builder.query<PaginatedResponse<Transaction>, TransactionQuery>({
      query: (params = {}) => `/transactions${buildQueryString(params)}`,
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: "Transaction" as const, id })),
              { type: "Transaction", id: "LIST" },
            ]
          : [{ type: "Transaction", id: "LIST" }],
    }),

    getTransactionById: builder.query<Transaction, string>({
      query: (id) => `/transactions/${id}`,
      providesTags: (_result, _err, id) => [{ type: "Transaction", id }],
    }),

    createTransaction: builder.mutation<Transaction, CreateTransactionRequest>({
      query: (body) => ({
        url: "/transactions",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Transaction", id: "LIST" }, { type: "Report", id: "SUMMARY" }, { type: "Report", id: "TREND" }, { type: "Report", id: "BREAKDOWN" }, { type: "Report", id: "CASHFLOW" }, { type: "Budget", id: "LIST" }],
    }),

    updateTransaction: builder.mutation<Transaction, { id: string; body: UpdateTransactionRequest }>({
      query: ({ id, body }) => ({
        url: `/transactions/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _err, { id }) => [{ type: "Transaction", id }, { type: "Transaction", id: "LIST" }, { type: "Report", id: "SUMMARY" }, { type: "Report", id: "TREND" }, { type: "Report", id: "BREAKDOWN" }, { type: "Report", id: "CASHFLOW" }, { type: "Budget", id: "LIST" }],
    }),

    deleteTransaction: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/transactions/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Transaction", id: "LIST" }, { type: "Report", id: "SUMMARY" }, { type: "Report", id: "TREND" }, { type: "Report", id: "BREAKDOWN" }, { type: "Report", id: "CASHFLOW" }, { type: "Budget", id: "LIST" }],
    }),

    autoCategorize: builder.mutation<AutoCategorizeResult, { description: string }>({
      query: (body) => ({
        url: "/transactions/auto-categorize",
        method: "POST",
        body,
      }),
    }),
  }),
})

export const {
  useGetTransactionsQuery,
  useGetTransactionByIdQuery,
  useCreateTransactionMutation,
  useUpdateTransactionMutation,
  useDeleteTransactionMutation,
  useAutoCategorizeMutation,
} = transactionsApi
