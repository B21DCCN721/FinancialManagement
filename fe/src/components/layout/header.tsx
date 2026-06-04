"use client"

import * as React from "react"
import { Bell, Search, Sparkles, User, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"

export function Header() {
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
              className="h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold bg-gradient-to-br from-primary to-primary-light"
            >
              <User className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-foreground leading-none">John Doe</p>
              <p className="text-[10px] mt-0.5 text-muted-foreground">
                Gói Pro
              </p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 hidden md:block text-muted-foreground" />
          </button>
        </div>
      </div>
    </header>
  )
}
