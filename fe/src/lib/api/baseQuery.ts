import { fetchBaseQuery, BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query"
import type { RootState } from "@/store/store"
import { setCredentials, clearAuth } from "@/store/authSlice"
import { logger } from "@/lib/logger"
import type { ApiError } from "./types"
import { Mutex } from "async-mutex"

const mutex = new Mutex()

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost"
const TIMEOUT_MS = 10_000 // 10 giây

// ─── Base fetch với timeout ───────────────────────────────────────────────────
const rawBaseQuery = fetchBaseQuery({
  baseUrl: `${API_URL}/api`,
  timeout: TIMEOUT_MS,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth?.accessToken
    if (token) {
      headers.set("Authorization", `Bearer ${token}`)
    }
    headers.set("Content-Type", "application/json")
    return headers
  },
})

// ─── Custom base query: timeout + auto-refresh + retry ────────────────────────
export const baseQueryWithAuth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions)

  // ── Xử lý lỗi timeout ─────────────────────────────────────────────────────
  if (result.error && result.error.status === "TIMEOUT_ERROR") {
    logger.error("Request timeout", new Error("Request timed out"), {
      url: typeof args === "string" ? args : args.url,
    })
    return {
      error: {
        status: "TIMEOUT_ERROR" as const,
        error: "Request timed out after 10 seconds",
      } as FetchBaseQueryError,
    }
  }

  // ── Log lỗi HTTP ──────────────────────────────────────────────────────────
  if (result.error) {
    const errData = result.error.data as ApiError | undefined
    logger.error(
      `API Error [${result.error.status}]: ${errData?.message ?? "Unknown error"}`,
      result.error,
      { url: typeof args === "string" ? args : args.url, status: result.error.status }
    )
  }

  // ── Auto-refresh token khi nhận 401 ───────────────────────────────────────
  if (result.error && result.error.status === 401) {
    const urlStr = typeof args === "string" ? args : args.url
    // Không chạy auto-refresh nếu đây là request login, register hoặc chính là request refresh
    if (urlStr.includes("/auth/login") || urlStr.includes("/auth/register") || urlStr.includes("/auth/refresh")) {
      return result
    }

    // Đợi nếu Mutex đang bị khoá (tức là đang có 1 request refresh khác chạy)
    if (!mutex.isLocked()) {
      const release = await mutex.acquire()
      try {
        const state = api.getState() as RootState
        const refreshToken = state.auth?.refreshToken

        if (!refreshToken) {
          logger.warn("No refresh token, clearing auth")
          api.dispatch(clearAuth())
          if (typeof window !== "undefined") window.location.href = "/login"
          return result
        }

        logger.info("Access token expired, attempting refresh...")

        const refreshResult = await rawBaseQuery(
          { url: "/auth/refresh", method: "POST", body: { refreshToken } },
          api,
          extraOptions
        )

        if (refreshResult.data) {
          const refreshData = refreshResult.data as { accessToken: string; refreshToken: string }
          api.dispatch(setCredentials({ accessToken: refreshData.accessToken, refreshToken: refreshData.refreshToken }))
          logger.info("Token refreshed successfully, retrying original request...")
          // Retry lại request gốc
          result = await rawBaseQuery(args, api, extraOptions)
        } else {
          logger.error("Refresh token failed, logging out", refreshResult.error)
          api.dispatch(clearAuth())
          if (typeof window !== "undefined") window.location.href = "/login"
        }
      } finally {
        // Mở khoá Mutex sau khi hoàn thành refresh (hoặc thất bại)
        release()
      }
    } else {
      // Nếu đã có 1 request refresh đang chạy, chỉ cần đợi nó chạy xong
      logger.info("Waiting for ongoing refresh token process...")
      await mutex.waitForUnlock()
      // Retry lại request gốc sau khi Mutex được mở khoá (token đã được cấp mới)
      result = await rawBaseQuery(args, api, extraOptions)
    }
  }

  return result
}
