import { registerPlugin } from '@capacitor/core';

interface FinanceWidgetPlugin {
  updateWidgetData(options: {
    balance: string;
    monthlySpent: string;
    monthlyLimit: string;
    dailySpent: string;
    dailyLimit: string;
    dailyProgress: string;
    isExceeded: boolean;
  }): Promise<void>;
}

export const FinanceWidget = registerPlugin<FinanceWidgetPlugin>('FinanceWidget');

export const syncWidgetData = async (data: {
  balance: number;
  monthlySpent: number;
  monthlyLimit: number | null;
  dailySpent: number;
  dailyLimit: number | null;
}) => {
  try {
    const formatVND = (val: number) => {
      return val.toLocaleString('vi-VN') + ' ₫';
    };

    const balanceStr = formatVND(data.balance);
    const monthlySpentStr = formatVND(data.monthlySpent);
    const monthlyLimitStr = data.monthlyLimit !== null && data.monthlyLimit > 0
      ? formatVND(data.monthlyLimit)
      : 'Không giới hạn';

    const dailySpentStr = formatVND(data.dailySpent);
    const dailyLimitStr = data.dailyLimit !== null && data.dailyLimit > 0
      ? formatVND(data.dailyLimit)
      : 'Không giới hạn';

    let dailyProgress = '0%';
    let isExceeded = false;

    if (data.dailyLimit !== null && data.dailyLimit > 0) {
      const percentage = Math.round((data.dailySpent / data.dailyLimit) * 100);
      dailyProgress = `${percentage}%`;
      isExceeded = data.dailySpent > data.dailyLimit;
    }

    await FinanceWidget.updateWidgetData({
      balance: balanceStr,
      monthlySpent: monthlySpentStr,
      monthlyLimit: monthlyLimitStr,
      dailySpent: dailySpentStr,
      dailyLimit: dailyLimitStr,
      dailyProgress,
      isExceeded,
    });
    console.log('AppWidget: Synced successfully!');
  } catch (error) {
    console.error('AppWidget: Failed to sync widget data', error);
  }
};
