import { baseApi } from "@/lib/api/baseApi"

// ─── Response Types (mirror BE reports.schema.ts) ────────────────────────────

export interface ReportSummary {
  period: string
  totalIncome: number
  totalExpense: number
  netBalance: number
  transactionCount: number
}

export interface MonthlyTrendItem {
  period: string
  income: number
  expense: number
  net: number
}

export interface CategoryBreakdownItem {
  categoryId: string
  categoryName: string
  categoryColor: string | null
  categoryIcon: string | null
  type: string
  totalAmount: number
  transactionCount: number
  percentage: number
}

export interface CashFlowItem {
  date: string
  income: number
  expense: number
  net: number
}

export interface AiInsightsResponse {
  period: string
  generatedAt: string
  insights: string
}

// ─── API Service ──────────────────────────────────────────────────────────────

export const reportsApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getReportSummary: builder.query<ReportSummary, { period?: string }>({
      query: ({ period } = {}) =>
        period ? `/reports/summary?period=${period}` : "/reports/summary",
      providesTags: [{ type: "Report", id: "SUMMARY" }],
    }),

    getMonthlyTrend: builder.query<MonthlyTrendItem[], { months?: number }>({
      query: ({ months = 6 } = {}) => `/reports/monthly-trend?months=${months}`,
      providesTags: [{ type: "Report", id: "TREND" }],
    }),

    getCategoryBreakdown: builder.query<CategoryBreakdownItem[], { period?: string }>({
      query: ({ period } = {}) =>
        period ? `/reports/category-breakdown?period=${period}` : "/reports/category-breakdown",
      providesTags: [{ type: "Report", id: "BREAKDOWN" }],
    }),

    getCashFlow: builder.query<CashFlowItem[], { period?: string }>({
      query: ({ period } = {}) =>
        period ? `/reports/cash-flow?period=${period}` : "/reports/cash-flow",
      providesTags: [{ type: "Report", id: "CASHFLOW" }],
    }),

    getAiInsights: builder.query<AiInsightsResponse, { period?: string }>({
      query: ({ period } = {}) =>
        period ? `/reports/ai-insights?period=${period}` : "/reports/ai-insights",
      // Không cần auto-refetch khi focus, user muốn thì tự chạy lại
      keepUnusedDataFor: 3600, // cache trên FE 1 tiếng
    }),
  }),
})

export const {
  useGetReportSummaryQuery,
  useGetMonthlyTrendQuery,
  useGetCategoryBreakdownQuery,
  useGetCashFlowQuery,
  useLazyGetAiInsightsQuery,
} = reportsApi
