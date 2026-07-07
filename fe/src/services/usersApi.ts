import { baseApi } from "@/lib/api/baseApi"
import type { User } from "@/lib/api/types"

interface UpdateProfileRequest {
  name?: string
  avatarUrl?: string
}

interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export const usersApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getMe: builder.query<User, void>({
      query: () => "/users/me",
      providesTags: [{ type: "User", id: "ME" }],
    }),

    updateProfile: builder.mutation<User, UpdateProfileRequest>({
      query: (body) => ({
        url: "/users/me",
        method: "PATCH",
        body,
      }),
      invalidatesTags: [{ type: "User", id: "ME" }],
    }),

    changePassword: builder.mutation<{ message: string }, ChangePasswordRequest>({
      query: (body) => ({
        url: "/users/me/password",
        method: "PATCH",
        body,
      }),
    }),

    deleteAccount: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: "/users/me",
        method: "DELETE",
      }),
    }),

    unlinkGoogle: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: "/users/me/google-link",
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "User", id: "ME" }],
    }),
  }),
})

export const {
  useGetMeQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useDeleteAccountMutation,
  useUnlinkGoogleMutation,
} = usersApi
