/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2, ArrowLeft, Mail, KeyRound, Lock, CheckCircle2 } from "lucide-react"
import { useForgotPasswordMutation, useResetPasswordMutation } from "@/services/authApi"
import { useTranslation } from "react-i18next"

export default function ForgotPasswordPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const [forgotPassword, { isLoading: isSending }] = useForgotPasswordMutation()
  const [resetPassword, { isLoading: isResetting }] = useResetPasswordMutation()

  const [step, setStep] = useState<1 | 2>(1)
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!email) return

    try {
      const res = await forgotPassword({ email }).unwrap()
      setSuccessMsg(res.message || t("forgot.otpSent"))
      setStep(2)
    } catch (err: any) {
      setError(err?.data?.message || t("forgot.otpError"))
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccessMsg("")

    if (newPassword !== confirmPassword) {
      setError(t("forgot.passwordMismatch"))
      return
    }

    if (newPassword.length < 8) {
      setError(t("forgot.passwordLength"))
      return
    }

    try {
      await resetPassword({ email, otp, newPassword }).unwrap()
      setSuccessMsg(t("forgot.success"))
      setTimeout(() => {
        router.push("/login")
      }, 2000)
    } catch (err: any) {
      setError(err?.data?.message || t("forgot.resetError"))
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
      <div className="fixed bottom-20 right-1/4 w-64 h-64 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(192,132,252,0.06) 0%, transparent 70%)", filter: "blur(40px)" }} />

      <div className="w-full max-w-md relative space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-white">{t("forgot.title")}</h1>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
            {step === 1
              ? t("forgot.desc1")
              : t("forgot.desc2")}
          </p>
        </div>

        <div
          className="rounded-2xl p-8"
          style={{
            background: "linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 25px 80px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.06) inset",
            backdropFilter: "blur(20px)",
          }}
        >
          {error && (
            <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-3 flex items-center gap-2 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {successMsg}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-white/80">
                  {t("forgot.email")}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-white/40" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#7c5cfc] transition-all"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSending || !email}
                className="relative w-full h-11 rounded-xl font-semibold text-white overflow-hidden transition-all group disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                style={{
                  background: "linear-gradient(135deg, #7c5cfc 0%, #c084fc 100%)",
                }}
              >
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center justify-center gap-2">
                  {isSending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    t("forgot.sendOtp")
                  )}
                </div>
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="otp" className="text-sm font-medium text-white/80">
                  {t("forgot.otp")}
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3 h-5 w-5 text-white/40" />
                  <input
                    id="otp"
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#7c5cfc] transition-all tracking-widest font-mono"
                    placeholder="123456"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="newPassword" className="text-sm font-medium text-white/80">
                  {t("forgot.newPassword")}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-white/40" />
                  <input
                    id="newPassword"
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#7c5cfc] transition-all"
                    placeholder={t("forgot.newPasswordPlaceholder")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-white/80">
                  {t("forgot.confirmPassword")}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-white/40" />
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#7c5cfc] transition-all"
                    placeholder={t("forgot.confirmPlaceholder")}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isResetting || !otp || !newPassword || !confirmPassword}
                className="relative w-full h-11 rounded-xl font-semibold text-white overflow-hidden transition-all group disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                style={{
                  background: "linear-gradient(135deg, #7c5cfc 0%, #c084fc 100%)",
                }}
              >
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center justify-center gap-2">
                  {isResetting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    t("forgot.updatePassword")
                  )}
                </div>
              </button>
            </form>
          )}
        </div>

        <div className="text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("forgot.backToLogin")}
          </Link>
        </div>
      </div>
    </div>
  )
}
