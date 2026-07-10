import fp from "fastify-plugin"
import { FastifyInstance } from "fastify"
import { env } from "../config/env"

// Phiên bản ứng dụng cố định (có thể đọc từ package.json hoặc cấu hình)
const APP_VERSION = "1.0.0"

// Class xử lý gửi log bất đồng bộ lên Grafana Loki Cloud với độ bền vững cao
class LokiPusher {
  private queue: Array<{ time: string; line: string; level: string }> = []
  private timer: NodeJS.Timeout | null = null
  private url: string | null = null
  private authHeader: string | null = null
  private flushing = false
  private readonly MAX_QUEUE = 10000 // Tránh tràn bộ nhớ RAM khi Loki bị sập

  constructor() {
    if (env.LOKI_URL && env.LOKI_USER && env.LOKI_PASSWORD) {
      const baseUrl = env.LOKI_URL.endsWith("/") ? env.LOKI_URL.slice(0, -1) : env.LOKI_URL
      this.url = baseUrl.includes("/loki/api/v1/push") ? baseUrl : `${baseUrl}/loki/api/v1/push`
      
      const credentials = `${env.LOKI_USER}:${env.LOKI_PASSWORD}`
      this.authHeader = `Basic ${Buffer.from(credentials).toString("base64")}`

      // Bắt đầu chu kỳ quét gửi log định kỳ mỗi 5 giây
      this.timer = setInterval(() => {
        this.flush().catch((err) => console.error("[Loki] Background timer flush error:", err))
      }, 5000)
    }
  }

  // Thêm log vào queue
  public push(level: string, logData: Record<string, any>) {
    if (!this.url) return

    // Giới hạn hàng đợi, loại bỏ log cũ nhất nếu vượt quá giới hạn tối đa
    if (this.queue.length >= this.MAX_QUEUE) {
      this.queue.shift()
    }

    // Đảm bảo timestamp nanoseconds độc nhất ngay cả trong cùng 1ms bằng cách kết hợp với high-resolution hrtime
    const nowNs = BigInt(Date.now()) * 1_000_000n + (process.hrtime.bigint() % 1_000_000n)
    const timestampNs = nowNs.toString()

    const logLine = JSON.stringify({
      message: logData.msg || "",
      appVersion: APP_VERSION,
      ...logData,
    })

    this.queue.push({
      time: timestampNs,
      line: logLine,
      level,
    })

    // Nếu hàng đợi đạt 100 log, kích hoạt flush ngay lập tức
    if (this.queue.length >= 100) {
      this.flush().catch((err) => console.error("[Loki] Direct trigger flush error:", err))
    }
  }

  // Gửi log lên Grafana Loki
  public async flush() {
    if (this.queue.length === 0 || !this.url || !this.authHeader) return
    if (this.flushing) return // Khóa chặn chạy song song

    this.flushing = true

    // Chụp lại trạng thái queue hiện tại
    const batch = [...this.queue]

    // Phân nhóm dữ liệu theo 'level' để tối ưu hóa Labels trong Loki
    const streamsMap = new Map<string, Array<[string, string]>>()
    for (const item of batch) {
      if (!streamsMap.has(item.level)) {
        streamsMap.set(item.level, [])
      }
      streamsMap.get(item.level)!.push([item.time, item.line])
    }

    const streams = Array.from(streamsMap.entries()).map(([level, values]) => ({
      stream: {
        job: "financial-management-be",
        environment: env.NODE_ENV,
        service: "api",
        level: level, // Đưa level vào làm label index để truy vấn nhanh
      },
      values,
    }))

    // Cấu hình Timeout 5s cho API push để tránh treo request vô hạn
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    try {
      const response = await fetch(this.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: this.authHeader,
        },
        body: JSON.stringify({ streams }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        // Gửi thành công, loại bỏ chính xác số lượng bản ghi đã gửi khỏi đầu hàng đợi
        this.queue.splice(0, batch.length)
      } else {
        const errorText = await response.text()
        console.error(`[Loki] Failed to push logs (Status: ${response.status}). Details: ${errorText}`)
        // Giữ lại queue để thử lại ở chu kỳ tiếp theo
      }
    } catch (err: any) {
      clearTimeout(timeoutId)
      console.error("[Loki] Connection error when pushing logs to Grafana Cloud:", err.message || err)
      // Giữ lại queue để thử lại ở chu kỳ tiếp theo
    } finally {
      this.flushing = false
    }
  }

  // Dọn dẹp và đẩy nốt log tồn đọng khi shutdown server
  public async destroy() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }

    if (this.queue.length > 0) {
      console.log(`[Loki] Server shutting down, flushing remaining ${this.queue.length} logs...`)
      this.flushing = false // Override khóa
      await this.flush()
    }
  }
}

const lokiPusher = new LokiPusher()

export default fp(async (fastify: FastifyInstance) => {
  // Đăng ký decorateRequest để lưu trữ đối tượng lỗi nếu có
  fastify.decorateRequest("rawError", null)

  // 1. Ghi nhận thời điểm request bắt đầu vào hệ thống
  fastify.addHook("onRequest", async (request) => {
    request.startTime = Date.now()
  })

  // 2. Hook onError chỉ bắt lỗi xảy ra và đính kèm vào request object
  fastify.addHook("onError", async (request, reply, error) => {
    request.rawError = error
  })

  // 3. Hook onResponse: Nơi duy nhất ghi log (đảm bảo statusCode chính xác và không trùng lặp)
  fastify.addHook("onResponse", async (request, reply) => {
    const duration = request.startTime ? Date.now() - request.startTime : 0
    const userId = request.user?.id || "anonymous"
    const ip = request.ip
    const contentLength = reply.getHeader("content-length")

    const logPayload: Record<string, any> = {
      requestId: request.id,
      userId,
      ip,
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      durationMs: duration,
      userAgent: request.headers["user-agent"] || "",
      referer: request.headers["referer"] || "",
      contentLength: contentLength ? Number(contentLength) : undefined,
    }

    // Nếu request có phát sinh lỗi được lưu trữ từ hook onError
    if (request.rawError) {
      const error = request.rawError
      logPayload.msg = `[ERROR] API Request: ${request.method} ${request.url} -> ${reply.statusCode} (${duration}ms) - Exception: ${error.message}`
      logPayload.error = {
        message: error.message,
        code: (error as any).code || "UNKNOWN_CODE",
        stack: error.stack || "",
      }

      // Ghi lỗi ra console và đẩy lên Loki
      request.log.error(logPayload)
      lokiPusher.push("error", logPayload)
    } else {
      // Trường hợp request chạy thành công hoặc gặp lỗi client thông thường (400, 404, 429...) không ném Exception
      logPayload.msg = `API Request: ${request.method} ${request.url} -> ${reply.statusCode} (${duration}ms)`

      if (reply.statusCode >= 400) {
        logPayload.msg = `[WARN] ${logPayload.msg}`
        request.log.warn(logPayload)
        lokiPusher.push("warn", logPayload)
      } else {
        request.log.info(logPayload)
        lokiPusher.push("info", logPayload)
      }
    }
  })

  // Giải phóng tài nguyên và bảo đảm an toàn dữ liệu log khi đóng Fastify
  fastify.addHook("onClose", async () => {
    await lokiPusher.destroy()
  })
}, { name: "logging" })
