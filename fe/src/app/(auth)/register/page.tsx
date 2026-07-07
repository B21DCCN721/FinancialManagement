/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import Link from "next/link"
import { TrendingUp, ArrowRight, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useDispatch } from "react-redux"
import { useRegisterMutation, useGoogleLoginMutation } from "@/services/authApi"
import { setCredentials } from "@/store/authSlice"
import { logger } from "@/lib/logger"
import { auth, googleProvider } from "@/lib/firebase"
import { signInWithPopup } from "firebase/auth"
import { useTranslation } from "react-i18next"
import { TermsModal } from "@/components/auth/terms-modal"
import { ConfirmModal } from "@/components/ui/confirm-modal"

export default function RegisterPage() {
  const { t } = useTranslation()
  const [showPassword, setShowPassword] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; email?: string; password?: string }>({})

  const router = useRouter()
  const dispatch = useDispatch()
  const [register, { isLoading }] = useRegisterMutation()
  const [googleLogin] = useGoogleLoginMutation()
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [modalType, setModalType] = useState<"terms" | "privacy" | null>(null)
  
  // linkConfirmData.type identifies if we are confirming a googleLogin or a local register
  const [linkConfirmData, setLinkConfirmData] = useState<{ type: "google" | "local", token?: string } | null>(null)

  const handleGoogleLogin = async (confirmToken?: string) => {
    setIsGoogleLoading(true)
    let token = confirmToken || "";
    try {
      if (!token) {
        const result = await signInWithPopup(auth, googleProvider)
        token = await result.user.getIdToken()
      }

      const apiResult = await googleLogin({ token, confirmLink: !!confirmToken }).unwrap()

      dispatch(setCredentials({
        accessToken: apiResult.accessToken,
        refreshToken: apiResult.refreshToken,
        user: apiResult.user,
      }))

      logger.info("Google Register successful", { userId: apiResult.user.id })
      router.push("/")
    } catch (err: any) {
      setIsGoogleLoading(false)
      logger.error("Firebase Google Register failed", err)
      const errMessage = err?.data?.message || err?.error || err?.message || "Đã xảy ra lỗi không xác định"
      
      if (errMessage === "REQUIRE_LINK_CONFIRMATION") {
        setLinkConfirmData({ type: "google", token })
      } else {
        setErrorMsg(`${t("register.googleError")} ${errMessage}`)
      }
    }
  }

  const handleSubmit = async (e?: React.FormEvent, confirmLink: boolean = false) => {
    if (e) e.preventDefault()
    setErrorMsg("")

    const errs: { name?: string; email?: string; password?: string } = {}
    if (!name.trim()) errs.name = "Vui lòng nhập họ tên"
    if (!email.trim()) errs.email = "Vui lòng nhập email"
    if (password.length < 8) errs.password = t("register.passwordLength")
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return }
    setFieldErrors({})

    try {
      const result = await register({ email, password, name, confirmLink }).unwrap()
      dispatch(setCredentials({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
      }))
      logger.info("Registration successful", { userId: result.user.id })
      router.push("/")
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string }; status?: number }
      const msg = apiErr?.data?.message ?? t("register.failed")
      
      if (msg === "REQUIRE_LINK_CONFIRMATION") {
        setLinkConfirmData({ type: "local" })
      } else {
        setErrorMsg(msg)
        logger.error("Registration failed", err, { email })
      }
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{
        background: "#0a0a0f",
        backgroundImage: `
          radial-gradient(ellipse 80% 60% at 50% -10%, rgba(124, 92, 252, 0.22) 0%, transparent 65%),
          radial-gradient(ellipse 40% 40% at 85% 85%, rgba(192, 132, 252, 0.1) 0%, transparent 60%)
        `,
      }}
    >
      <div className="fixed top-32 left-1/4 w-72 h-72 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(124,92,252,0.08) 0%, transparent 70%)", filter: "blur(40px)" }} />

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-300 group-hover:scale-110"
              style={{ background: "linear-gradient(135deg, #7c5cfc 0%, #c084fc 100%)", boxShadow: "0 6px 24px rgba(124, 92, 252, 0.5)" }}>
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white">FinManage</span>
              <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "rgba(192,132,252,0.6)" }}>
                Tài chính thông minh
              </p>
            </div>
          </Link>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8"
          style={{
            background: "linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 25px 80px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.06) inset",
            backdropFilter: "blur(20px)",
          }}>
          <div className="text-center mb-7">
            <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">{t("register.title")}</h1>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
              {t("register.subtitle")}
            </p>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-xl px-4 py-3 mb-5 text-sm"
              style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }}>
              <AlertCircle className="h-4 w-4 shrink-0" />
              {errorMsg}
            </div>
          )}

          {/* Google Login Button */}
          <button
            type="button"
            onClick={() => handleGoogleLogin()}
            disabled={isGoogleLoading}
            className="relative flex items-center justify-center gap-3 w-full h-11 rounded-xl mb-6 text-sm font-medium transition-all group disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "white"
            }}
          >
            <div className="absolute inset-0 rounded-xl bg-white/5 opacity-0 transition-opacity group-hover:opacity-100" />
            {isGoogleLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <svg viewBox="0 0 24 24" className="w-5 h-5">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            {isGoogleLoading ? t("register.redirecting") : t("register.google")}
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1))" }} />
            <span className="text-xs uppercase font-medium tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>{t("register.or")}</span>
            <div className="flex-1 h-px" style={{ background: "linear-gradient(270deg, transparent, rgba(255,255,255,0.1))" }} />
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>{t("register.name")}</label>
              <input
                id="name"
                placeholder="Nguyễn Văn A"
                value={name}
                onChange={(e) => { setName(e.target.value); if (fieldErrors.name) setFieldErrors(p => ({ ...p, name: undefined })) }}
                className={`input-modern flex h-11 w-full px-4 text-sm ${fieldErrors.name ? "border-red-500" : ""}`}
              />
              {fieldErrors.name && <p className="mt-1 text-xs text-red-400 animate-in fade-in">{fieldErrors.name}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>{t("register.email")}</label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (fieldErrors.email) setFieldErrors(p => ({ ...p, email: undefined })) }}
                className={`input-modern flex h-11 w-full px-4 text-sm ${fieldErrors.email ? "border-red-500" : ""}`}
              />
              {fieldErrors.email && <p className="mt-1 text-xs text-red-400 animate-in fade-in">{fieldErrors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>{t("register.password")}</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t("register.passwordPlaceholder")}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (fieldErrors.password) setFieldErrors(p => ({ ...p, password: undefined })) }}
                  className={`input-modern flex h-11 w-full px-4 pr-11 text-sm ${fieldErrors.password ? "border-red-500" : ""}`}
                />
                {fieldErrors.password && <p className="mt-1 text-xs text-red-400 animate-in fade-in">{fieldErrors.password}</p>}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary-gradient flex items-center justify-center gap-2 h-11 w-full rounded-xl text-sm mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              {isLoading ? t("register.creating") : t("register.create")}
            </button>

            <p className="text-center text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
              {t("register.terms1")}
              <button
                type="button"
                onClick={() => setModalType("terms")}
                className="underline underline-offset-2 hover:text-white transition-colors"
                style={{ color: "rgba(167,139,250,0.7)" }}
              >
                {t("register.terms2")}
              </button>
              {t("register.terms3")}
              <button
                type="button"
                onClick={() => setModalType("privacy")}
                className="underline underline-offset-2 hover:text-white transition-colors"
                style={{ color: "rgba(167,139,250,0.7)" }}
              >
                {t("register.terms4")}
              </button>
              .
            </p>

          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-sm mt-6" style={{ color: "rgba(255,255,255,0.35)" }}>
          {t("register.alreadyAccount")}
          <Link href="/login" className="font-semibold transition-colors hover:text-white" style={{ color: "#a78bfa" }}>
            {t("register.login")}
          </Link>
        </p>
      </div>
      <TermsModal
        isOpen={modalType !== null}
        onClose={() => setModalType(null)}
        type={modalType || "terms"}
      />
      <ConfirmModal
        isOpen={!!linkConfirmData}
        onClose={() => setLinkConfirmData(null)}
        onConfirm={() => {
          if (linkConfirmData) {
            const currentData = linkConfirmData;
            setLinkConfirmData(null);
            if (currentData.type === "google" && currentData.token) {
              handleGoogleLogin(currentData.token);
            } else if (currentData.type === "local") {
              handleSubmit(undefined, true);
            }
          }
        }}
        title="Liên kết tài khoản"
        description="Email này đã được sử dụng. Bạn có muốn liên kết với tài khoản này để có thể đăng nhập bằng cả 2 cách không?"
        confirmText="Đồng ý liên kết"
        cancelText="Không, cảm ơn"
        variant="primary"
      />
    </div>
  )
}
