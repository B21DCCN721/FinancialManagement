import { baseApi } from "@/lib/api/baseApi"
import type { Budget, BudgetSummary } from "@/lib/api/types"

interface CreateBudgetRequest {
  amount: number
  categoryId: string
  period: string // "YYYY-MM" or "YYYY"
  type: "monthly" | "yearly"
}

interface UpdateBudgetRequest {
  amount: number
}

export const budgetsApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getBudgets: builder.query<Budget[], { period?: string }>({
      query: ({ period } = {}) => (period ? `/budgets?period=${period}` : "/budgets"),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Budget" as const, id })),
              { type: "Budget", id: "LIST" },
            ]
          : [{ type: "Budget", id: "LIST" }],
    }),

    getBudgetSummary: builder.query<BudgetSummary[], { period: string }>({
      query: ({ period }) => `/budgets/summary?period=${period}`,
      providesTags: [{ type: "Budget", id: "SUMMARY" }],
    }),

    createBudget: builder.mutation<Budget, CreateBudgetRequest>({
      query: (body) => ({
        url: "/budgets",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Budget", id: "LIST" }, { type: "Budget", id: "SUMMARY" }],
    }),

    updateBudget: builder.mutation<Budget, { id: string; body: UpdateBudgetRequest }>({
      query: ({ id, body }) => ({
        url: `/budgets/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: "Budget", id },
        { type: "Budget", id: "LIST" },
        { type: "Budget", id: "SUMMARY" },
      ],
    }),

    deleteBudget: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/budgets/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Budget", id: "LIST" }, { type: "Budget", id: "SUMMARY" }],
    }),
  }),
})

export const {
  useGetBudgetsQuery,
  useGetBudgetSummaryQuery,
  useCreateBudgetMutation,
  useUpdateBudgetMutation,
  useDeleteBudgetMutation,
} = budgetsApi
