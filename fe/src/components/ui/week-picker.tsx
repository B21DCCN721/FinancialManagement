"use client"

import { useState, useRef, useEffect } from "react"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"

interface WeekPickerProps {
  value: string // "YYYY-MM-DD" (usually Monday of the week)
  onChange: (value: string) => void
  align?: "left" | "right"
}

// Helpers to calculate Monday and Sunday
const getMondayDate = (date: Date): Date => {
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(date)
  monday.setDate(diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}

const getSundayDate = (monday: Date): Date => {
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return sunday
}

const formatDateString = (date: Date): string => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

const formatDateLabel = (date: Date): string => {
  const d = String(date.getDate()).padStart(2, "0")
  const m = String(date.getMonth() + 1).padStart(2, "0")
  return `${d}/${m}`
}

export function WeekPicker({ value, onChange, align = "left" }: WeekPickerProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Parse current selection
  const selectedDate = value ? new Date(value) : new Date()
  const selectedMonday = getMondayDate(selectedDate)
  const selectedSunday = getSundayDate(selectedMonday)

  // Panel state (what month we are viewing in grid)
  const [panelYear, setPanelYear] = useState(selectedMonday.getFullYear())
  const [panelMonth, setPanelMonth] = useState(selectedMonday.getMonth())

  // Hover state (index of the week row being hovered, 0 to 5)
  const [hoveredRowIndex, setHoveredRowIndex] = useState<number | null>(null)

  // Close popup on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  // Generate calendar grid dates (6 rows x 7 days)
  const getCalendarWeeks = (year: number, month: number): Date[][] => {
    const firstDay = new Date(year, month, 1)
    const dayOfWeek = firstDay.getDay()
    const startOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // Monday start

    const gridStartDate = new Date(year, month, 1 - startOffset)
    const weeks: Date[][] = []
    const currentDay = new Date(gridStartDate)

    for (let w = 0; w < 6; w++) {
      const week: Date[] = []
      for (let d = 0; d < 7; d++) {
        week.push(new Date(currentDay))
        currentDay.setDate(currentDay.getDate() + 1)
      }
      weeks.push(week)
    }
    return weeks
  }

  const weeks = getCalendarWeeks(panelYear, panelMonth)

  // Navigation handlers
  const handlePrev = () => {
    if (panelMonth === 0) {
      setPanelMonth(11)
      setPanelYear(panelYear - 1)
    } else {
      setPanelMonth(panelMonth - 1)
    }
  }

  const handleNext = () => {
    if (panelMonth === 11) {
      setPanelMonth(0)
      setPanelYear(panelYear + 1)
    } else {
      setPanelMonth(panelMonth + 1)
    }
  }

  const selectWeek = (weekMonday: Date) => {
    onChange(formatDateString(weekMonday))
    setOpen(false)
  }

  // Display label: e.g. "06/07 - 12/07/2026"
  const startStr = formatDateLabel(selectedMonday)
  const endStr = formatDateLabel(selectedSunday)
  const yearStr = selectedSunday.getFullYear()
  const displayLabel = `${startStr} - ${endStr}/${yearStr}`

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => {
          if (!open) {
            setPanelYear(selectedMonday.getFullYear())
            setPanelMonth(selectedMonday.getMonth())
          }
          setOpen((o) => !o)
        }}
        className="flex w-full items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all bg-card border border-input text-foreground hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        <span className="truncate">{displayLabel}</span>
        <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
      </button>

      {open && (
        <>
          {/* Mobile backdrop overlay */}
          <div
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm sm:hidden"
            onClick={() => setOpen(false)}
          />
          
          <div
            className={[
              "fixed bottom-0 left-0 right-0 z-[110] rounded-t-2xl sm:rounded-2xl sm:absolute sm:bottom-auto sm:top-[calc(100%+8px)] sm:w-[300px] sm:z-50 shadow-[0_8px_40px_rgba(0,0,0,0.25)] border border-border overflow-hidden animate-in slide-in-from-bottom-2 sm:slide-in-from-top-2",
              align === "right" ? "sm:left-auto sm:right-0" : "sm:left-0 sm:right-auto"
            ].join(" ")}
            style={{
              background: "var(--popover)",
              color: "var(--popover-foreground)",
            }}
          >
            {/* Header / Month Year Nav */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <button
                type="button"
                onClick={handlePrev}
                className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="text-sm font-semibold">
                Tháng {panelMonth + 1}, {panelYear}
              </div>
              <button
                type="button"
                onClick={handleNext}
                className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Days of Week Headers */}
            <div className="grid grid-cols-7 gap-1 p-3 pb-1 text-center text-xs font-medium text-muted-foreground border-b border-border/30">
              <div>T2</div><div>T3</div><div>T4</div><div>T5</div><div>T6</div><div>T7</div><div>CN</div>
            </div>

            {/* Calendar Grid */}
            <div className="p-3 space-y-1">
              {weeks.map((week, rowIndex) => {
                const weekMonday = week[0]
                const isSelectedWeek = weekMonday.getTime() === selectedMonday.getTime()
                const isHoveredWeek = hoveredRowIndex === rowIndex

                return (
                  <div
                    key={rowIndex}
                    onMouseEnter={() => setHoveredRowIndex(rowIndex)}
                    onMouseLeave={() => setHoveredRowIndex(null)}
                    onClick={() => selectWeek(weekMonday)}
                    className={[
                      "grid grid-cols-7 gap-0 rounded-xl transition-all cursor-pointer overflow-hidden",
                      isSelectedWeek
                        ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                        : isHoveredWeek
                        ? "bg-accent/60 text-foreground"
                        : ""
                    ].join(" ")}
                  >
                    {week.map((date, colIndex) => {
                      const isCurrentMonth = date.getMonth() === panelMonth
                      const isToday = formatDateString(date) === formatDateString(new Date())
                      const isMonday = colIndex === 0
                      const isSunday = colIndex === 6

                      return (
                        <div
                          key={colIndex}
                          className={[
                            "h-9 flex flex-col items-center justify-center text-sm font-medium transition-all relative",
                            isCurrentMonth ? "text-foreground" : "text-muted-foreground/40",
                            isMonday ? "rounded-l-xl" : "",
                            isSunday ? "rounded-r-xl" : "",
                            isSelectedWeek && date.getTime() === selectedMonday.getTime()
                              ? "bg-primary text-white rounded-xl shadow-md"
                              : ""
                          ].join(" ")}
                        >
                          <span>{date.getDate()}</span>
                          
                          {/* Underline current day marker if not selected week Monday */}
                          {isToday && !(isSelectedWeek && date.getTime() === selectedMonday.getTime()) && (
                            <span className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
