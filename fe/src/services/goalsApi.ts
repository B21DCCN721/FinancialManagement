import { baseApi } from "@/lib/api/baseApi"
import type { Goal } from "@/lib/api/types"

interface CreateGoalRequest {
  title: string
  description?: string
  targetAmount: number
  deadline: string
  color?: string
  icon?: string
}

interface UpdateGoalRequest {
  title?: string
  description?: string
  targetAmount?: number
  deadline?: string
  color?: string
  icon?: string
}

interface ContributeRequest {
  amount: number
}

export const goalsApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getGoals: builder.query<Goal[], void>({
      query: () => "/goals",
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Goal" as const, id })),
              { type: "Goal", id: "LIST" },
            ]
          : [{ type: "Goal", id: "LIST" }],
    }),

    createGoal: builder.mutation<Goal, CreateGoalRequest>({
      query: (body) => ({
        url: "/goals",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Goal", id: "LIST" }],
    }),

    updateGoal: builder.mutation<Goal, { id: string; body: UpdateGoalRequest }>({
      query: ({ id, body }) => ({
        url: `/goals/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _err, { id }) => [{ type: "Goal", id }],
    }),

    contributeToGoal: builder.mutation<Goal, { id: string; body: ContributeRequest }>({
      query: ({ id, body }) => ({
        url: `/goals/${id}/contribute`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: "Goal", id },
        { type: "Goal", id: "LIST" },
      ],
    }),

    deleteGoal: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/goals/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _err, id) => [
        { type: "Goal", id },
        { type: "Goal", id: "LIST" },
      ],
    }),
  }),
})

export const {
  useGetGoalsQuery,
  useCreateGoalMutation,
  useUpdateGoalMutation,
  useContributeToGoalMutation,
  useDeleteGoalMutation,
} = goalsApi
