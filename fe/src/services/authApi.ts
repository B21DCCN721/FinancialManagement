import { baseApi } from "@/lib/api/baseApi"
import type { AuthTokens, User } from "@/lib/api/types"

interface LoginRequest {
  email: string
  password: string
}

interface RegisterRequest {
  email: string
  password: string
  firstName?: string
  lastName?: string
}

interface RefreshRequest {
  refreshToken: string
}

interface RefreshResponse {
  accessToken: string
  refreshToken: string
}

interface GoogleLoginRequest {
  token: string
}

interface ForgotPasswordRequest {
  email: string
}

interface ResetPasswordRequest {
  email: string
  otp: string
  newPassword: string
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<AuthTokens, LoginRequest>({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
    }),

    register: builder.mutation<AuthTokens, RegisterRequest>({
      query: (data) => ({
        url: "/auth/register",
        method: "POST",
        body: data,
      }),
    }),

    googleLogin: builder.mutation<AuthTokens, GoogleLoginRequest>({
      query: (data) => ({
        url: "/auth/google",
        method: "POST",
        body: data,
      }),
    }),

    logout: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
    }),

    refresh: builder.mutation<RefreshResponse, RefreshRequest>({
      query: (data) => ({
        url: "/auth/refresh",
        method: "POST",
        body: data,
      }),
    }),

    getMe: builder.query<User, void>({
      query: () => "/users/me",
    }),

    forgotPassword: builder.mutation<{ message: string }, ForgotPasswordRequest>({
      query: (data) => ({
        url: "/auth/forgot-password",
        method: "POST",
        body: data,
      }),
    }),

    resetPassword: builder.mutation<{ message: string }, ResetPasswordRequest>({
      query: (data) => ({
        url: "/auth/reset-password",
        method: "POST",
        body: data,
      }),
    }),

    deleteAccount: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: "/auth/account",
        method: "DELETE",
      }),
    }),
  }),
})

export const {
  useLoginMutation,
  useRegisterMutation,
  useGoogleLoginMutation,
  useLogoutMutation,
  useRefreshMutation,
  useGetMeQuery,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useDeleteAccountMutation,
} = authApi
