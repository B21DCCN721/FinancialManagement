"use client"

import * as React from "react"
import { Bell, Search, Sparkles, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { useSelector } from "react-redux"
import type { RootState } from "@/store/store"

export function Header() {
  const user = useSelector((state: RootState) => state.auth.user)

  const displayName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.name || "Người dùng"
    : "Người dùng"

  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "U"

  return (
    <header
      className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 px-6 bg-background/80 backdrop-blur-[20px] border-b border-border"
    >
      {/* Search bar */}
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <form className="relative flex flex-1 max-w-md" action="#" method="GET">
          <label htmlFor="search-field" className="sr-only">Tìm kiếm</label>
          <div className="relative flex items-center w-full">
            <Search
              className="absolute left-3 h-4 w-4 pointer-events-none text-muted-foreground"
              aria-hidden="true"
            />
            <input
              id="search-field"
              className="input-modern flex h-9 w-full pl-9 pr-4 text-sm"
              placeholder="Tìm kiếm giao dịch..."
              type="search"
              name="search"
            />
          </div>
        </form>

        {/* Right actions */}
        <div className="flex items-center gap-x-3 ml-auto">
          {/* AI hint badge */}
          <div
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all hover:scale-105 bg-accent text-primary border border-primary/20"
          >
            <Sparkles className="h-3 w-3" />
            Phân tích AI
          </div>

          <ThemeToggle />

          {/* Notification bell */}
          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9 rounded-xl transition-all hover:scale-105 bg-card border border-border text-muted-foreground hover:text-foreground"
          >
            <span className="sr-only">Xem thông báo</span>
            <Bell className="h-4 w-4" aria-hidden="true" />
            <span
              className="absolute right-2 top-2 h-2 w-2 rounded-full pulse-dot bg-destructive"
            />
          </Button>

          {/* Separator */}
          <div
            className="hidden lg:block h-6 w-px bg-border"
            aria-hidden="true"
          />

          {/* Profile button */}
          <button
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-all hover:scale-105 bg-card border border-border"
          >
            <div
              className="h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold text-white bg-gradient-to-br from-primary to-primary-light overflow-hidden"
            >
              {user?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatarUrl} alt={displayName} className="h-7 w-7 object-cover" />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-foreground leading-none">{displayName}</p>
            </div>
          </button>
        </div>
      </div>
    </header>
  )
}
