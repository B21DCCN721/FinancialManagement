import { useEffect, useRef, useState } from "react"

interface UseCountUpOptions {
  target: number
  duration?: number
  isLoading?: boolean
  /** Formatter fn — defaults to identity */
  format?: (value: number) => string
}

/**
 * Animate a number from 0 → target using requestAnimationFrame.
 * Returns the formatted display string.
 */
export function useCountUp({
  target,
  duration = 900,
  isLoading = false,
  format,
}: UseCountUpOptions): string {
  const [display, setDisplay] = useState(0)
  const rafRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const startValueRef = useRef(0)
  const prevTargetRef = useRef(target)

  useEffect(() => {
    if (isLoading) return

    // Cancel any running animation
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
    }

    startValueRef.current = prevTargetRef.current !== target ? prevTargetRef.current : 0
    prevTargetRef.current = target
    startTimeRef.current = null

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp
      }

      const elapsed = timestamp - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(startValueRef.current + (target - startValueRef.current) * eased)

      setDisplay(current)

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      } else {
        setDisplay(target)
        rafRef.current = null
      }
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [target, duration, isLoading])

  if (isLoading) return "—"
  if (format) return format(display)
  return display.toLocaleString("vi-VN")
}
