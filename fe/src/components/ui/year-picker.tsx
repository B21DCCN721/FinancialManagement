"use client"

import { useState, useRef, useEffect } from "react"
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react"

interface YearPickerProps {
  value: string // "YYYY"
  onChange: (value: string) => void
}

export function YearPicker({ value, onChange }: YearPickerProps) {
  const [open, setOpen] = useState(false)
  const selectedYear = parseInt(value)
  const [panelYear, setPanelYear] = useState(selectedYear)
  const ref = useRef<HTMLDivElement>(null)

  const nowYear = new Date().getFullYear()

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

  function selectYear(year: number) {
    onChange(`${year}`)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative w-full sm:w-auto">
      {/* Trigger button */}
      <button
        onClick={() => {
          setPanelYear(selectedYear)
          setOpen((o) => !o)
        }}
        className="flex w-full sm:w-auto items-center justify-center sm:justify-start gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105 bg-card border border-border text-foreground hover:border-primary/40 hover:shadow-[0_0_0_3px_rgba(124,92,252,0.1)]"
      >
        <Calendar className="h-4 w-4 text-primary shrink-0" />
        <span>Năm {selectedYear}</span>
      </button>

      {/* Dropdown panel */}
      {open && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm sm:hidden" 
            onClick={(e) => { e.stopPropagation(); setOpen(false); }} 
          />
          <div
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl sm:rounded-2xl sm:absolute sm:bottom-auto sm:left-auto sm:right-0 sm:top-[calc(100%+8px)] sm:w-[280px] sm:z-50 shadow-[0_8px_40px_rgba(0,0,0,0.25)] border border-border overflow-hidden animate-in slide-in-from-bottom-2 sm:slide-in-from-top-2"
            style={{
              background: "var(--popover)",
              color: "var(--popover-foreground)",
            }}
          >
            {/* Year navigation */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <button
                onClick={() => setPanelYear((y) => y - 12)}
                className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-semibold">{panelYear - 4} - {panelYear + 7}</span>
              <button
                onClick={() => setPanelYear((y) => y + 12)}
                className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Year grid */}
            <div className="grid grid-cols-3 gap-1.5 p-3">
              {Array.from({ length: 12 }).map((_, i) => {
                const y = panelYear - 4 + i
                const isSelected = y === selectedYear
                const isToday = y === nowYear

                return (
                  <button
                    key={y}
                    onClick={() => selectYear(y)}
                    className={[
                      "relative h-9 rounded-xl text-sm font-medium transition-all hover:scale-105",
                      isSelected
                        ? "bg-primary text-white shadow-[0_4px_12px_rgba(124,92,252,0.4)]"
                        : isToday
                        ? "border border-primary/40 text-primary bg-primary/5"
                        : "hover:bg-accent text-foreground",
                    ].join(" ")}
                  >
                    {y}
                    {isToday && !isSelected && (
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary" />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Footer — quick jump to current year */}
            <div className="border-t border-border px-3 py-2 flex justify-center">
              <button
                onClick={() => {
                  onChange(`${nowYear}`)
                  setOpen(false)
                }}
                className="text-xs text-primary hover:underline font-medium"
              >
                Năm hiện tại
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
