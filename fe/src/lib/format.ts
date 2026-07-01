/**
 * Format Vietnamese currency with smart abbreviation.
 * < 1.000       → "500 ₫"
 * < 1.000.000   → "500k ₫"
 * >= 1.000.000  → "1,5tr ₫"
 * >= 1.000.000.000 → "1,2tỷ ₫"
 */
export function formatCurrencyAxis(value: number): string {
  if (value === 0) return "0 ₫"
  const abs = Math.abs(value)
  const sign = value < 0 ? "-" : ""

  if (abs >= 1_000_000_000) {
    const billions = abs / 1_000_000_000
    const formatted = billions % 1 === 0 ? billions.toFixed(0) : billions.toFixed(1)
    return `${sign}${formatted}tỷ ₫`
  }
  if (abs >= 1_000_000) {
    const millions = abs / 1_000_000
    const formatted = millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)
    return `${sign}${formatted}tr ₫`
  }
  if (abs >= 1_000) {
    const thousands = abs / 1_000
    const formatted = thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1)
    return `${sign}${formatted}k ₫`
  }
  return `${sign}${abs} ₫`
}

/**
 * Format full Vietnamese currency for display (not abbreviated).
 */
export function formatCurrencyFull(value: number): string {
  return `${value.toLocaleString("vi-VN")} ₫`
}
