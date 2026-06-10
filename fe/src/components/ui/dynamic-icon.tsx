/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react"
import * as LucideIcons from "lucide-react"

export function DynamicIcon({ name, className }: { name?: string, className?: string }) {
  if (!name) return <LucideIcons.Tag className={className} />

  // Check if the name is a Lucide component
  const IconComponent = (LucideIcons as any)[name]
  if (IconComponent) {
    return <IconComponent className={className} />
  }

  // Fallback for existing emoji icons
  return <span className={className} style={{ fontSize: '1.2em', lineHeight: 1 }}>{name}</span>
}
