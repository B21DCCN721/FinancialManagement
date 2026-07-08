/**
 * balanceWidgetWeb.ts — Web implementation (no-op fallback)
 *
 * Được load bởi Capacitor khi chạy trên web hoặc iOS.
 * Không làm gì cả — tránh lỗi khi chạy ngoài Android.
 */

import { WebPlugin } from '@capacitor/core'
import type { BalanceWidgetData, BalanceWidgetResult, BalanceWidgetCurrentData } from './balanceWidget'

export class BalancePluginWeb extends WebPlugin {
  async updateBalance(_data: BalanceWidgetData): Promise<BalanceWidgetResult> {
    // No-op trên web
    return { success: false }
  }

  async getBalance(): Promise<BalanceWidgetCurrentData> {
    // No-op trên web
    return {
      balance: 0,
      income: 0,
      expense: 0,
      currency: 'VND',
      updatedAt: 0,
    }
  }
}
