"use client"

import { type LucideIcon } from "lucide-react"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  /** Optional extra class for the wrapper */
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`col-span-full py-16 flex flex-col items-center justify-center gap-4 text-center glass-card rounded-2xl px-8 ${className}`}
    >
      {/* Animated icon container */}
      <div className="relative flex items-center justify-center">
        {/* Glow ring */}
        <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl scale-150 animate-pulse" />
        <div className="relative h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center shadow-[0_0_30px_rgba(124,92,252,0.15)]">
          <Icon className="h-9 w-9 text-primary/70" strokeWidth={1.5} />
        </div>
      </div>

      {/* Text */}
      <div className="space-y-1.5 max-w-xs">
        <p className="text-base font-semibold text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>

      {/* CTA button */}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-2 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105 active:scale-95 bg-primary text-primary-foreground shadow-[0_4px_15px_rgba(124,92,252,0.4)] hover:shadow-[0_6px_25px_rgba(124,92,252,0.5)]"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
