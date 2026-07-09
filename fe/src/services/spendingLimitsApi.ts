import { baseApi } from "@/lib/api/baseApi"
import type { SpendingLimit } from "@/lib/api/types"

interface UpsertSpendingLimitRequest {
  amount: number
  type: "daily" | "weekly" | "monthly"
}

export const spendingLimitsApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getSpendingLimits: builder.query<SpendingLimit[], { date?: string } | void>({
      query: (params) => {
        const date = params?.date
        return date ? `/spending-limits?date=${date}` : "/spending-limits"
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ type }) => ({ type: "SpendingLimit" as const, id: type })),
              { type: "SpendingLimit", id: "LIST" },
              { type: "Transaction", id: "LIST" }, // Auto-refetch when any transaction changes (expense added)
            ]
          : [{ type: "SpendingLimit", id: "LIST" }],
    }),

    upsertSpendingLimit: builder.mutation<unknown, UpsertSpendingLimitRequest>({
      query: (body) => ({
        url: "/spending-limits",
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _err, { type }) => [
        { type: "SpendingLimit", id: type },
        { type: "SpendingLimit", id: "LIST" },
      ],
    }),

    deleteSpendingLimit: builder.mutation<{ message: string }, "daily" | "weekly" | "monthly">({
      query: (type) => ({
        url: `/spending-limits/${type}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _err, type) => [
        { type: "SpendingLimit", id: type },
        { type: "SpendingLimit", id: "LIST" },
      ],
    }),
  }),
})

export const {
  useGetSpendingLimitsQuery,
  useUpsertSpendingLimitMutation,
  useDeleteSpendingLimitMutation,
} = spendingLimitsApi
