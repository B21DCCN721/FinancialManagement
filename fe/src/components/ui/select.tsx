/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown, Check } from "lucide-react"

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  options?: { value: string; label: React.ReactNode }[];
  error?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, value, defaultValue, onChange, name, options: customOptions, error, ...props }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false)
    const [internalValue, setInternalValue] = React.useState(defaultValue || "")
    const dropdownRef = React.useRef<HTMLDivElement>(null)

    const currentValue = value !== undefined ? value : internalValue;

    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false)
        }
      }
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const parsedOptions = customOptions || React.Children.toArray(children).map((child: any) => ({
      value: child.props?.value,
      label: child.props?.children
    })).filter(opt => opt.value !== undefined)

    // Fallback if currentValue is not set but options exist
    React.useEffect(() => {
      if (!currentValue && parsedOptions.length > 0 && value === undefined) {
        setInternalValue(parsedOptions[0].value)
      }
    }, [parsedOptions, currentValue, value])

    const selectedOption = parsedOptions.find(opt => opt.value === currentValue)

    const handleSelect = (val: string) => {
      if (value === undefined) {
        setInternalValue(val)
      }
      setIsOpen(false)
      if (onChange) {
        const event = {
          target: { name, value: val },
          currentTarget: { name, value: val }
        } as any
        onChange(event)
      }
    }

    // Tách required và id ra để không truyền vào hidden select
    // required trên hidden element gây lỗi "An invalid form control is not focusable"
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { required: _required, id: _id, ...restProps } = props as any

    return (
      <div className="relative w-full" ref={dropdownRef}>
        {/* Hidden select for form submissions — bỏ required vì element bị ẩn */}
        <select
          ref={ref}
          name={name}
          value={currentValue}
          className="hidden"
          onChange={() => { }}
          {...restProps}
        >
          {customOptions ? customOptions.map(opt => (
            <option key={opt.value} value={opt.value}>
              {typeof opt.label === 'string' ? opt.label : opt.value}
            </option>
          )) : children}
        </select>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex h-[42px] w-full items-center justify-between rounded-xl border border-input bg-background/50 backdrop-blur-md px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all hover:bg-accent/50",
            isOpen && "border-primary ring-2 ring-primary/20",
            error && !isOpen && "border-destructive",
            className
          )}
        >
          <span className="truncate">{selectedOption ? selectedOption.label : "Select..."}</span>
          <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform duration-200", isOpen && "rotate-180")} />
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-2 max-h-60 w-full overflow-auto rounded-xl border border-border/50 bg-popover/95 backdrop-blur-xl text-popover-foreground shadow-xl animate-in fade-in-80 zoom-in-95 slide-in-from-top-2">
            <div className="p-1">
              {parsedOptions.map((opt) => (
                <div
                  key={opt.value}
                  onClick={() => handleSelect(opt.value)}
                  className={cn(
                    "relative flex w-full cursor-default select-none items-center rounded-lg py-2 pl-8 pr-2 text-sm outline-none transition-colors hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary",
                    currentValue === opt.value && "bg-primary/10 text-primary font-medium"
                  )}
                >
                  {currentValue === opt.value && (
                    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                      <Check className="h-4 w-4" />
                    </span>
                  )}
                  {opt.label}
                </div>
              ))}
            </div>
          </div>
        )}
        {error && (
          <p className="mt-1 text-xs text-destructive animate-in fade-in slide-in-from-top-1 duration-200">
            {error}
          </p>
        )}
      </div>
    )
  }
)
Select.displayName = "Select"

export { Select }
