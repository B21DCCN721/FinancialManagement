import { fetchBaseQuery, BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query"
import type { RootState } from "@/store/store"
import { setCredentials, clearAuth } from "@/store/authSlice"
import { logger } from "@/lib/logger"
import type { ApiError } from "./types"
import { Mutex } from "async-mutex"

const mutex = new Mutex()

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost"
const TIMEOUT_MS = 30_000 // 30 giây (đủ để Render free tier wake up)
const MAX_FETCH_RETRIES = 3 // Retry 3 lần khi FETCH_ERROR (server đang spin-up)

// ─── Base fetch với timeout ───────────────────────────────────────────────────
const rawBaseQuery = fetchBaseQuery({
  baseUrl: `${API_URL}/api`,
  timeout: TIMEOUT_MS,
  fetchFn: (input, init) => {
    return fetch(input, { ...init, cache: "no-store" })
  },
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth?.accessToken
    if (token) {
      headers.set("Authorization", `Bearer ${token}`)
    }
    headers.set("Cache-Control", "no-cache, no-store, must-revalidate")
    headers.set("Pragma", "no-cache")
    headers.set("Expires", "0")
    // Bỏ hardcode Content-Type để tránh lỗi mất boundary khi dùng FormData (Upload file)
    // RTK Query sẽ tự động set "application/json" cho các request thông thường.
    return headers
  },
})

// ─── Custom base query: timeout + auto-refresh + retry ────────────────────────
export const baseQueryWithAuth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  // Lấy token ban đầu trước khi gọi API để sau này so sánh (cho Mutex Race Condition)
  const initialState = api.getState() as RootState
  const initialToken = initialState.auth?.accessToken

  let result = await rawBaseQuery(args, api, extraOptions)

  // ── Auto-retry khi FETCH_ERROR (server đang spin-up từ Render free tier sleep) ──
  if (result.error && result.error.status === "FETCH_ERROR") {
    const url = typeof args === "string" ? args : args.url
    // Bỏ qua retry cho các endpoint auth để tránh loop/delay không mong muốn
    if (!url.includes("/auth/")) {
      logger.warn(`FETCH_ERROR on [${url}], retrying in 3s...`)
      for (let attempt = 0; attempt < MAX_FETCH_RETRIES; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 3000))
        result = await rawBaseQuery(args, api, extraOptions)
        if (!result.error || result.error.status !== "FETCH_ERROR") break
      }
    }
  }

  // ── Xử lý lỗi timeout ─────────────────────────────────────────────────────
  if (result.error && result.error.status === "TIMEOUT_ERROR") {
    logger.error("Request timeout", new Error("Request timed out"), {
      url: typeof args === "string" ? args : args.url,
    })
    return {
      error: {
        status: "TIMEOUT_ERROR" as const,
        error: "Request timed out after 30 seconds",
      } as FetchBaseQueryError,
    }
  }

  // ── Auto-refresh token khi nhận 401 ───────────────────────────────────────
  if (result.error && result.error.status === 401) {
    const urlStr = typeof args === "string" ? args : args.url
    // Không chạy auto-refresh nếu đây là request login, register hoặc chính là request refresh
    if (urlStr.includes("/auth/login") || urlStr.includes("/auth/register") || urlStr.includes("/auth/refresh")) {
      return result
    }

    // Mutex.acquire() trực tiếp: Tự động xếp hàng các request bị 401
    const release = await mutex.acquire()
    try {
      const currentState = api.getState() as RootState
      const currentToken = currentState.auth?.accessToken

      // Giải quyết Race Condition: 
      // Nếu token hiện tại khác với token lúc gửi request, nghĩa là một request 401 trước đó
      // đã lấy được Mutex và refresh thành công. Ta chỉ việc retry request mà không gọi refresh nữa.
      if (initialToken !== currentToken) {
        logger.info("Token already refreshed by another request, retrying original request...")
        result = await rawBaseQuery(args, api, extraOptions)
      } else {
        const refreshToken = currentState.auth?.refreshToken

        if (!refreshToken) {
          logger.warn("No refresh token, clearing auth")
          api.dispatch(clearAuth())
          // Không dùng window.location.href để tránh lỗi SSR/Server Actions,
          // nên xử lý redirect thông qua AuthProvider Component hoặc Middleware lắng nghe state Redux.
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
        }
      }
    } finally {
      // Đảm bảo mở khoá Mutex trong mọi trường hợp (thành công hoặc có exception)
      release()
    }
  }

  // ── Log lỗi HTTP (Ngoại trừ 401, timeout, fetch_error đã handle) ─────────
  if (result.error && result.error.status !== 401 && result.error.status !== "FETCH_ERROR" && result.error.status !== "TIMEOUT_ERROR") {
    const errData = result.error.data as ApiError | undefined
    logger.error(
      `API Error [${result.error.status}]: ${errData?.message ?? "Unknown error"}`,
      result.error,
      { url: typeof args === "string" ? args : args.url, status: result.error.status }
    )
  }

  return result
}
