"use client"

import * as React from "react"
import { Bell, Search, Sparkles, User, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Header() {
  return (
    <header
      className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 px-6"
      style={{
        background: "rgba(10, 10, 15, 0.8)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      {/* Search bar */}
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <form className="relative flex flex-1 max-w-md" action="#" method="GET">
          <label htmlFor="search-field" className="sr-only">Search</label>
          <div className="relative flex items-center w-full">
            <Search
              className="absolute left-3 h-4 w-4 pointer-events-none"
              style={{ color: "rgba(255,255,255,0.3)" }}
              aria-hidden="true"
            />
            <input
              id="search-field"
              className="input-modern flex h-9 w-full pl-9 pr-4 text-sm"
              placeholder="Search transactions..."
              type="search"
              name="search"
            />
          </div>
        </form>

        {/* Right actions */}
        <div className="flex items-center gap-x-3 ml-auto">
          {/* AI hint badge */}
          <div
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all hover:scale-105"
            style={{
              background: "linear-gradient(135deg, rgba(124,92,252,0.15) 0%, rgba(192,132,252,0.1) 100%)",
              border: "1px solid rgba(124,92,252,0.25)",
              color: "#c084fc",
            }}
          >
            <Sparkles className="h-3 w-3" />
            AI Insights
          </div>

          {/* Notification bell */}
          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9 rounded-xl transition-all hover:scale-105"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.5)",
            }}
          >
            <span className="sr-only">View notifications</span>
            <Bell className="h-4 w-4" aria-hidden="true" />
            <span
              className="absolute right-2 top-2 h-2 w-2 rounded-full pulse-dot"
              style={{ background: "linear-gradient(135deg, #ff4d6d, #dc2626)" }}
            />
          </Button>

          {/* Separator */}
          <div
            className="hidden lg:block h-6 w-px"
            style={{ background: "rgba(255,255,255,0.08)" }}
            aria-hidden="true"
          />

          {/* Profile button */}
          <button
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-all hover:scale-105"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div
              className="h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold"
              style={{ background: "linear-gradient(135deg, #7c5cfc, #c084fc)" }}
            >
              <User className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-white leading-none">John Doe</p>
              <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                Pro Plan
              </p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 hidden md:block" style={{ color: "rgba(255,255,255,0.3)" }} />
          </button>
        </div>
      </div>
    </header>
  )
}
