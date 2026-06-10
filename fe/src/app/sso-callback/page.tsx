"use client"

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs"
import { Loader2 } from "lucide-react"

export default function SSOCallbackPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0f] text-white">
      <Loader2 className="h-8 w-8 animate-spin mb-4 text-[#7c5cfc]" />
      <p className="text-sm text-white/50">Đang xác thực với Google...</p>
      <AuthenticateWithRedirectCallback 
        signInForceRedirectUrl="/auth-sync" 
        signUpForceRedirectUrl="/auth-sync" 
      />
    </div>
  )
}
