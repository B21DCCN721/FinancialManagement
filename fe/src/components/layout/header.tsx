"use client"

import * as React from "react"
import { Search, Menu } from "lucide-react"
import { useTranslation } from "react-i18next"
import { ThemeToggle } from "@/components/theme-toggle"
import { useSelector } from "react-redux"
import type { RootState } from "@/store/store"
import { useRouter } from "next/navigation"
import { useSidebar } from "@/contexts/SidebarContext"

export function Header() {
  const { toggle, isOpen } = useSidebar()
  const user = useSelector((state: RootState) => state.auth.user)
  const router = useRouter()
  const { t } = useTranslation()
  const [searchValue, setSearchValue] = React.useState("")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchValue.trim()) {
      router.push(`/transactions?search=${encodeURIComponent(searchValue.trim())}`)
    } else {
      router.push(`/transactions`)
    }
  }

  const displayName = user?.name || "User"

  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "U"

  return (
    <header
      className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 px-4 md:px-6 bg-background/80 backdrop-blur-[20px] border-b border-border transition-all"
    >
      {!isOpen && (
        <button
          type="button"
          className="-m-2.5 p-2.5 text-foreground hover:bg-accent rounded-md transition-colors"
          onClick={toggle}
        >
          <span className="sr-only">Toggle sidebar</span>
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
      )}

      {/* Search bar */}
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <form className="relative flex flex-1 max-w-md items-center" onSubmit={handleSearch}>
          <label htmlFor="search-field" className="sr-only">Tìm kiếm</label>
          <div className="relative flex items-center w-full">
            <Search
              className="absolute left-3 h-4 w-4 pointer-events-none text-muted-foreground"
              aria-hidden="true"
            />
            <input
              id="search-field"
              className="input-modern flex h-9 w-full pl-9 pr-4 text-sm"
              placeholder={t("header.searchPlaceholder")}
              type="search"
              name="search"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </div>
        </form>

        {/* Right actions */}
        <div className="flex items-center gap-x-3 ml-auto">
          {/* AI hint badge */}
          {/* <div
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all hover:scale-105 bg-accent text-primary border border-primary/20"
          >
            <Sparkles className="h-3 w-3" />
            {t("header.aiAnalysis")}
          </div> */}

          <ThemeToggle />



          {/* Separator */}
          <div
            className="hidden lg:block h-6 w-px bg-border"
            aria-hidden="true"
          />

          <button
            className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-all hover:scale-105 bg-card border border-border"
          >
            <div
              className="h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold text-white bg-linear-to-br from-primary to-primary-light overflow-hidden"
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
