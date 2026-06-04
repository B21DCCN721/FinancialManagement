import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "gradient"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-primary/30 hover:scale-[1.02]":
              variant === "default",
            "bg-destructive text-destructive-foreground hover:bg-destructive/90":
              variant === "destructive",
            "border border-white/10 bg-white/4 hover:bg-white/8 hover:border-white/20 text-foreground/80 hover:text-foreground":
              variant === "outline",
            "bg-white/6 text-secondary-foreground hover:bg-white/10":
              variant === "secondary",
            "hover:bg-white/6 hover:text-foreground text-muted-foreground":
              variant === "ghost",
            "text-primary underline-offset-4 hover:underline":
              variant === "link",
            "btn-primary-gradient text-white":
              variant === "gradient",
            "h-10 px-4 py-2": size === "default",
            "h-9 rounded-lg px-3": size === "sm",
            "h-11 rounded-xl px-8": size === "lg",
            "h-10 w-10": size === "icon",
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
