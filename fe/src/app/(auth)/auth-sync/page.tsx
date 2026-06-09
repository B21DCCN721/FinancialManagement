"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth, useClerk } from "@clerk/nextjs"
import { useDispatch } from "react-redux"
import { useGoogleLoginMutation } from "@/services/authApi"
import { setCredentials } from "@/store/authSlice"
import { logger } from "@/lib/logger"
import { Loader2 } from "lucide-react"

export default function AuthSyncPage() {
  const router = useRouter()
  const dispatch = useDispatch()
  const { getToken, isLoaded, isSignedIn } = useAuth()
  const { signOut } = useClerk()
  const [googleLogin] = useGoogleLoginMutation()
  
  const hasSynced = useRef(false)

  useEffect(() => {
    if (!isLoaded) return
    
    if (!isSignedIn) {
      router.push("/login")
      return
    }

    if (hasSynced.current) return
    hasSynced.current = true

    const syncWithBackend = async () => {
      try {
        const token = await getToken()
        if (!token) throw new Error("No token from Clerk")

        const result = await googleLogin({ token }).unwrap()
        
        dispatch(setCredentials({
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          user: result.user,
        }))
        
        logger.info("Google Login sync successful", { userId: result.user.id })
        router.push("/")
      } catch (err: unknown) {
        logger.error("Google Login sync failed", err)
        await signOut()
        const apiErr = err as { data?: { message?: string } }
        const msg = apiErr?.data?.message || "Đồng bộ tài khoản thất bại."
        router.push(`/login?error=${encodeURIComponent(msg)}`)
      }
    }

    syncWithBackend()
  }, [isLoaded, isSignedIn, getToken, googleLogin, dispatch, router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0f] text-white">
      <Loader2 className="h-8 w-8 animate-spin mb-4 text-[#7c5cfc]" />
      <p className="text-sm text-white/50">Đang đồng bộ dữ liệu tài khoản...</p>
    </div>
  )
}
