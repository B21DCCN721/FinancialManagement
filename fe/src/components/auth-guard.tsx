"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSelector } from "react-redux"
import { RootState } from "@/store/store"
import { Loader2 } from "lucide-react"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  
  // Nguồn chân lý duy nhất (Single Source of Truth)
  // Vì cả Google Login (auth-sync) và Email Login đều trả về accessToken lưu vào Redux
  const accessToken = useSelector((state: RootState) => state.auth.accessToken)
  const refreshToken = useSelector((state: RootState) => state.auth.refreshToken)
  
  const isAuth = !!accessToken && !!refreshToken;

  useEffect(() => {
    if (!isAuth) {
      router.push('/login')
    }
  }, [isAuth, router])

  // Hiển thị màn hình Loading trong lúc chờ điều hướng
  if (!isAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return <>{children}</>
}
