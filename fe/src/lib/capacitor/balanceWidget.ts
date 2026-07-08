/**
 * balanceWidget.ts — Capacitor Plugin Bridge cho Android Home Screen Widget
 *
 * Gọi native BalancePlugin để cập nhật dữ liệu widget.
 * Tự động no-op trên web/iOS (chỉ hoạt động trên Android).
 *
 * Cách dùng trong Dashboard:
 *   import { syncBalanceToWidget } from '@/lib/capacitor/balanceWidget'
 *   syncBalanceToWidget({ balance: totalBalance, income: totalIncome, expense: totalExpense })
 */

import { registerPlugin } from '@capacitor/core'

// --- Types ---

export interface BalanceWidgetData {
  /** Số dư ròng (income - expense) */
  balance: number
  /** Tổng thu nhập */
  income: number
  /** Tổng chi tiêu */
  expense: number
  /** Đơn vị tiền tệ, mặc định 'VND' */
  currency?: string
}

export interface BalanceWidgetResult {
  success: boolean
}

export interface BalanceWidgetCurrentData extends BalanceWidgetData {
  updatedAt: number
}

// --- Plugin Interface ---

interface BalancePluginInterface {
  updateBalance(data: BalanceWidgetData): Promise<BalanceWidgetResult>
  getBalance(): Promise<BalanceWidgetCurrentData>
}

// --- Plugin Registration ---

/**
 * BalancePlugin — registered Capacitor plugin
 * Chỉ có implementation native trên Android.
 * Trên Web/iOS sẽ không làm gì (no-op).
 */
const BalancePlugin = registerPlugin<BalancePluginInterface>('BalancePlugin', {
  web: () =>
    import('./balanceWidgetWeb').then((m) => new m.BalancePluginWeb()),
})

// --- Public API ---

/**
 * Đồng bộ dữ liệu số dư lên Android home screen widget.
 *
 * @example
 * // Trong dashboard page sau khi load xong data
 * import { syncBalanceToWidget } from '@/lib/capacitor/balanceWidget'
 *
 * useEffect(() => {
 *   if (summary) {
 *     syncBalanceToWidget({
 *       balance: summary.netBalance,
 *       income: summary.totalIncome,
 *       expense: summary.totalExpense,
 *     })
 *   }
 * }, [summary])
 */
export async function syncBalanceToWidget(data: BalanceWidgetData): Promise<void> {
  try {
    await BalancePlugin.updateBalance({
      currency: 'VND',
      ...data,
    })
  } catch (error) {
    // Không phải Android hoặc plugin chưa khởi tạo — bỏ qua
    console.debug('[BalanceWidget] Plugin không khả dụng:', error)
  }
}

/**
 * Đọc dữ liệu hiện tại trong widget (debug).
 */
export async function getWidgetBalance(): Promise<BalanceWidgetCurrentData | null> {
  try {
    return await BalancePlugin.getBalance()
  } catch {
    return null
  }
}

export { BalancePlugin }
