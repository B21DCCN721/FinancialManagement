import { cn } from "@/lib/utils"

/** Base shimmer block */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted/60",
        className
      )}
      {...props}
    />
  )
}

/** Skeleton for dashboard stat cards (4-col grid) */
function SkeletonStat() {
  return (
    <div className="rounded-2xl p-4 border border-border/50 bg-card space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-9 w-9 rounded-xl" />
      </div>
      <Skeleton className="h-7 w-36" />
      <Skeleton className="h-3 w-24" />
    </div>
  )
}

/** Skeleton for chart area */
function SkeletonChart({ height = 260 }: { height?: number }) {
  return (
    <div className="rounded-2xl p-5 border border-border/50 bg-card space-y-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-5 w-5 rounded" />
      </div>
      <div style={{ height }} className="flex items-end gap-3 px-2 pt-4">
        {[65, 45, 80, 55, 95, 70].map((h, i) => (
          <Skeleton
            key={i}
            className="flex-1 rounded-t-md"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  )
}

/** Skeleton for a single transaction row */
function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-card">
      <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/5" />
        <Skeleton className="h-3 w-2/5" />
      </div>
      <Skeleton className="h-4 w-20 shrink-0" />
    </div>
  )
}

/** Skeleton for budget/goal card in a grid */
function SkeletonCard() {
  return (
    <div className="rounded-2xl p-5 border border-border/50 bg-card space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-2xl shrink-0" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex gap-1">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <div className="flex justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-2.5 w-full rounded-full" />
      </div>
    </div>
  )
}

/** Skeleton for goals card (has different layout) */
function SkeletonGoalCard() {
  return (
    <div className="rounded-2xl p-5 border border-border/50 bg-card space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 w-32" />
        </div>
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="h-3 w-28" />
      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="h-5 w-12" />
      </div>
      <Skeleton className="h-2.5 w-full rounded-full" />
      <div className="grid grid-cols-2 gap-2">
        <Skeleton className="h-9 rounded-xl" />
        <Skeleton className="h-9 rounded-xl" />
      </div>
    </div>
  )
}

export { Skeleton, SkeletonStat, SkeletonChart, SkeletonRow, SkeletonCard, SkeletonGoalCard }
