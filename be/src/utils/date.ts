export function calcNextRunAt(from: Date, frequency: "daily" | "weekly" | "monthly" | "yearly"): Date {
  const next = new Date(from)
  switch (frequency) {
    case "daily":   next.setDate(next.getDate() + 1); break
    case "weekly":  next.setDate(next.getDate() + 7); break
    case "monthly": next.setMonth(next.getMonth() + 1); break
    case "yearly":  next.setFullYear(next.getFullYear() + 1); break
  }
  return next
}

export function currentPeriod() {
  return new Date().toISOString().slice(0, 7)
}

export function periodToRange(period: string) {
  const [year, month] = period.split("-").map(Number)
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 1)
  return { start, end }
}
