/**
 * Logger utility
 * - Môi trường development: In màu ra console
 * - Môi trường production: Gửi lỗi lên Sentry, KHÔNG log ra console
 */

const isDev = process.env.NODE_ENV === "development"

type LogLevel = "info" | "warn" | "error"

function formatMessage(level: LogLevel, message: string, data?: unknown): string {
  const time = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  return `[${time}] [${level.toUpperCase()}] ${message}`
}

async function sendToSentry(error: unknown, context?: Record<string, unknown>) {
  // Import Sentry lazily to avoid bundling issues with SSR
  try {
    const Sentry = await import("@sentry/nextjs")
    if (context) {
      Sentry.withScope((scope) => {
        Object.entries(context).forEach(([key, value]) => scope.setExtra(key, value))
        if (error instanceof Error) {
          Sentry.captureException(error)
        } else {
          Sentry.captureMessage(String(error), "error")
        }
      })
    } else {
      if (error instanceof Error) {
        Sentry.captureException(error)
      } else {
        Sentry.captureMessage(String(error), "error")
      }
    }
  } catch {
    // Sentry not available (e.g. DSN not configured), silently ignore
  }
}

export const logger = {
  info: (message: string, data?: unknown) => {
    if (isDev) {
      console.info(
        `%c${formatMessage("info", message)}`,
        "color: #6366f1; font-weight: 600",
        data !== undefined ? data : ""
      )
    }
  },

  warn: (message: string, data?: unknown) => {
    if (isDev) {
      console.warn(
        `%c${formatMessage("warn", message)}`,
        "color: #f59e0b; font-weight: 600",
        data !== undefined ? data : ""
      )
    }
  },

  error: (message: string, error?: unknown, context?: Record<string, unknown>) => {
    if (isDev) {
      console.error(
        `%c${formatMessage("error", message)}`,
        "color: #ef4444; font-weight: 600",
        error !== undefined ? error : ""
      )
    } else {
      // Production: send to Sentry silently
      sendToSentry(error ?? new Error(message), context)
    }
  },
}
