"use client"

import { useState, useRef, useEffect } from "react"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"

interface DatePickerProps {
  value?: string // "YYYY-MM-DD"
  onChange?: (value: string) => void
  name?: string
  required?: boolean
  id?: string
}

export function DatePicker({ value, onChange, name, required, id }: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const [internalValue, setInternalValue] = useState(value || "")
  const currentValue = value !== undefined ? value : internalValue
  
  const initialDate = currentValue ? new Date(currentValue) : new Date()
  const [panelYear, setPanelYear] = useState(initialDate.getFullYear())
  const [panelMonth, setPanelMonth] = useState(initialDate.getMonth())

  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  const daysInMonth = new Date(panelYear, panelMonth + 1, 0).getDate()
  const firstDayOfMonth = new Date(panelYear, panelMonth, 1).getDay()
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1

  const displayDate = currentValue ? new Date(currentValue) : new Date()
  const displayLabel = currentValue 
    ? `${displayDate.getDate().toString().padStart(2, '0')}/${(displayDate.getMonth() + 1).toString().padStart(2, '0')}/${displayDate.getFullYear()}` 
    : "Chọn ngày"

  function selectDate(day: number) {
    const mm = String(panelMonth + 1).padStart(2, "0")
    const dd = String(day).padStart(2, "0")
    const newVal = `${panelYear}-${mm}-${dd}`
    setInternalValue(newVal)
    if (onChange) onChange(newVal)
    setOpen(false)
  }

  function handlePrevMonth() {
    if (panelMonth === 0) {
      setPanelMonth(11)
      setPanelYear(panelYear - 1)
    } else {
      setPanelMonth(panelMonth - 1)
    }
  }

  function handleNextMonth() {
    if (panelMonth === 11) {
      setPanelMonth(0)
      setPanelYear(panelYear + 1)
    } else {
      setPanelMonth(panelMonth + 1)
    }
  }

  return (
    <div ref={ref} className="relative w-full">
      {name && <input type="hidden" name={name} id={id} value={currentValue || ""} required={required} />}
      <button
        type="button"
        onClick={() => {
          const d = currentValue ? new Date(currentValue) : new Date()
          setPanelYear(d.getFullYear())
          setPanelMonth(d.getMonth())
          setOpen((o) => !o)
        }}
        className="flex w-full items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all bg-card border border-input text-foreground hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        <span>{displayLabel}</span>
        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
      </button>

      {open && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm sm:hidden" 
            onClick={(e) => { e.stopPropagation(); setOpen(false); }} 
          />
          <div
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl sm:rounded-2xl sm:absolute sm:bottom-auto sm:left-0 sm:top-[calc(100%+8px)] sm:w-[300px] sm:z-50 shadow-[0_8px_40px_rgba(0,0,0,0.25)] border border-border overflow-hidden animate-in slide-in-from-bottom-2 sm:slide-in-from-top-2"
            style={{
              background: "var(--popover)",
              color: "var(--popover-foreground)",
            }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <button type="button" onClick={handlePrevMonth} className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-accent text-muted-foreground hover:text-foreground"><ChevronLeft className="h-4 w-4" /></button>
              <span className="text-sm font-semibold">Tháng {panelMonth + 1}, {panelYear}</span>
              <button type="button" onClick={handleNextMonth} className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-accent text-muted-foreground hover:text-foreground"><ChevronRight className="h-4 w-4" /></button>
            </div>

            <div className="grid grid-cols-7 gap-1 p-3 pb-1 text-center text-xs font-medium text-muted-foreground">
              <div>T2</div><div>T3</div><div>T4</div><div>T5</div><div>T6</div><div>T7</div><div>CN</div>
            </div>

            <div className="grid grid-cols-7 gap-1 p-3 pt-0">
              {Array.from({ length: startOffset }).map((_, i) => <div key={`empty-${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const isSelected = !!currentValue && displayDate.getDate() === day && displayDate.getMonth() === panelMonth && displayDate.getFullYear() === panelYear
                const isToday = new Date().getDate() === day && new Date().getMonth() === panelMonth && new Date().getFullYear() === panelYear

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => selectDate(day)}
                    className={[
                      "relative h-9 w-full rounded-xl text-sm font-medium transition-all hover:scale-105 flex items-center justify-center",
                      isSelected
                        ? "bg-primary text-white shadow-[0_4px_12px_rgba(124,92,252,0.4)]"
                        : isToday
                        ? "border border-primary/40 text-primary bg-primary/5"
                        : "hover:bg-accent text-foreground",
                    ].join(" ")}
                  >
                    {day}
                    {isToday && !isSelected && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-primary" />}
                  </button>
                )
              })}
            </div>

            <div className="border-t border-border px-3 py-2 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  const now = new Date()
                  setPanelYear(now.getFullYear())
                  setPanelMonth(now.getMonth())
                  selectDate(now.getDate())
                }}
                className="text-xs text-primary hover:underline font-medium"
              >
                Hôm nay
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
