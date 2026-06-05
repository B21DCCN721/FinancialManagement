import Link from "next/link"
import { Home, SearchX } from "lucide-react"

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{
        background: "#0a0a0f",
        backgroundImage: `
          radial-gradient(ellipse 80% 60% at 50% -10%, rgba(124, 92, 252, 0.15) 0%, transparent 65%),
          radial-gradient(ellipse 40% 40% at 85% 85%, rgba(192, 132, 252, 0.07) 0%, transparent 60%)
        `,
      }}
    >
      {/* Decorative blobs */}
      <div
        className="fixed top-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(124,92,252,0.06) 0%, transparent 70%)", filter: "blur(60px)" }}
      />

      <div className="text-center max-w-lg">
        {/* Icon */}
        <div
          className="inline-flex h-20 w-20 items-center justify-center rounded-3xl mb-6"
          style={{
            background: "linear-gradient(135deg, rgba(124,92,252,0.2) 0%, rgba(192,132,252,0.1) 100%)",
            border: "1px solid rgba(124,92,252,0.3)",
          }}
        >
          <SearchX className="h-9 w-9" style={{ color: "#a78bfa" }} />
        </div>

        {/* 404 Number */}
        <p
          className="text-8xl font-black tracking-tight mb-2"
          style={{
            background: "linear-gradient(135deg, #7c5cfc 0%, #c084fc 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          404
        </p>

        <h1 className="text-2xl font-bold text-white mb-3 tracking-tight">
          Trang không tìm thấy
        </h1>
        <p className="text-base mb-8" style={{ color: "rgba(255,255,255,0.4)" }}>
          Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển đến địa chỉ khác.
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-2 h-11 px-6 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 hover:shadow-lg"
          style={{
            background: "linear-gradient(135deg, #7c5cfc 0%, #c084fc 100%)",
            boxShadow: "0 4px 20px rgba(124, 92, 252, 0.4)",
          }}
        >
          <Home className="h-4 w-4" />
          Về trang chủ
        </Link>
      </div>
    </div>
  )
}
