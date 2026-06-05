"use client"

import { useEffect } from "react"
import Link from "next/link"
import { RefreshCw, Home, TriangleAlert } from "lucide-react"
import { logger } from "@/lib/logger"

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    logger.error("Unhandled application error", error, { digest: error.digest })
  }, [error])

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{
        background: "#0a0a0f",
        backgroundImage: `
          radial-gradient(ellipse 80% 60% at 50% -10%, rgba(239, 68, 68, 0.1) 0%, transparent 65%),
          radial-gradient(ellipse 40% 40% at 85% 85%, rgba(252, 92, 92, 0.06) 0%, transparent 60%)
        `,
      }}
    >
      {/* Decorative blob */}
      <div
        className="fixed top-1/4 left-1/3 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(239,68,68,0.05) 0%, transparent 70%)", filter: "blur(60px)" }}
      />

      <div className="text-center max-w-lg">
        {/* Icon */}
        <div
          className="inline-flex h-20 w-20 items-center justify-center rounded-3xl mb-6"
          style={{
            background: "linear-gradient(135deg, rgba(239,68,68,0.2) 0%, rgba(252,92,92,0.1) 100%)",
            border: "1px solid rgba(239,68,68,0.3)",
          }}
        >
          <TriangleAlert className="h-9 w-9" style={{ color: "#fca5a5" }} />
        </div>

        {/* Label */}
        <p
          className="text-xs font-bold uppercase tracking-[0.2em] mb-3"
          style={{ color: "rgba(239,68,68,0.7)" }}
        >
          Đã có lỗi xảy ra
        </p>

        <h1 className="text-2xl font-bold text-white mb-3 tracking-tight">
          Ứng dụng gặp sự cố
        </h1>
        <p className="text-base mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>
          Đã có lỗi không mong muốn xảy ra. Chúng tôi đã được thông báo tự động và đang khắc phục.
        </p>

        {/* Error message in dev */}
        {process.env.NODE_ENV === "development" && error.message && (
          <div
            className="text-left rounded-xl px-4 py-3 mb-6 text-xs font-mono overflow-auto max-h-32"
            style={{
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
              color: "#fca5a5",
            }}
          >
            {error.message}
            {error.digest && (
              <span className="block mt-1 opacity-60">Digest: {error.digest}</span>
            )}
          </div>
        )}

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 h-11 px-6 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 hover:shadow-lg"
            style={{
              background: "linear-gradient(135deg, #ef4444 0%, #f87171 100%)",
              boxShadow: "0 4px 20px rgba(239, 68, 68, 0.35)",
            }}
          >
            <RefreshCw className="h-4 w-4" />
            Thử lại
          </button>

          <Link
            href="/"
            className="inline-flex items-center gap-2 h-11 px-6 rounded-xl text-sm font-semibold transition-all hover:scale-105"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.7)",
            }}
          >
            <Home className="h-4 w-4" />
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  )
}
