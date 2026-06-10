"use client"

import { useState, useRef, useEffect } from "react"
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react"

interface MonthPickerProps {
  value: string // "YYYY-MM"
  onChange: (value: string) => void
}

const VI_MONTHS_SHORT = [
  "Thg 1", "Thg 2", "Thg 3", "Thg 4",
  "Thg 5", "Thg 6", "Thg 7", "Thg 8",
  "Thg 9", "Thg 10", "Thg 11", "Thg 12",
]

export function MonthPicker({ value, onChange }: MonthPickerProps) {
  const [open, setOpen] = useState(false)
  const [panelYear, setPanelYear] = useState(() => parseInt(value.split("-")[0]))
  const ref = useRef<HTMLDivElement>(null)

  const selectedYear = parseInt(value.split("-")[0])
  const selectedMonth = parseInt(value.split("-")[1]) // 1–12

  const nowYear = new Date().getFullYear()
  const nowMonth = new Date().getMonth() + 1

  const displayLabel = `Tháng ${selectedMonth}, ${selectedYear}`

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  function selectMonth(month: number) {
    const mm = String(month).padStart(2, "0")
    onChange(`${panelYear}-${mm}`)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => {
          setPanelYear(selectedYear)
          setOpen((o) => !o)
        }}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105 bg-card border border-border text-foreground hover:border-primary/40 hover:shadow-[0_0_0_3px_rgba(124,92,252,0.1)]"
      >
        <Calendar className="h-4 w-4 text-primary" />
        <span>{displayLabel}</span>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute left-0 right-auto sm:left-auto sm:right-0 top-[calc(100%+8px)] z-50 w-[280px] rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.25)] border border-border overflow-hidden"
          style={{
            background: "var(--popover)",
            color: "var(--popover-foreground)",
          }}
        >
          {/* Year navigation */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <button
              onClick={() => setPanelYear((y) => y - 1)}
              className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold">{panelYear}</span>
            <button
              onClick={() => setPanelYear((y) => y + 1)}
              className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Month grid */}
          <div className="grid grid-cols-3 gap-1.5 p-3">
            {VI_MONTHS_SHORT.map((label, i) => {
              const m = i + 1
              const isSelected = m === selectedMonth && panelYear === selectedYear
              const isToday = m === nowMonth && panelYear === nowYear

              return (
                <button
                  key={m}
                  onClick={() => selectMonth(m)}
                  className={[
                    "relative h-9 rounded-xl text-sm font-medium transition-all hover:scale-105",
                    isSelected
                      ? "bg-primary text-white shadow-[0_4px_12px_rgba(124,92,252,0.4)]"
                      : isToday
                      ? "border border-primary/40 text-primary bg-primary/5"
                      : "hover:bg-accent text-foreground",
                  ].join(" ")}
                >
                  {label}
                  {isToday && !isSelected && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Footer — quick jump to current month */}
          <div className="border-t border-border px-3 py-2 flex justify-center">
            <button
              onClick={() => {
                const mm = String(nowMonth).padStart(2, "0")
                onChange(`${nowYear}-${mm}`)
                setOpen(false)
              }}
              className="text-xs text-primary hover:underline font-medium"
            >
              Tháng hiện tại
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
