package com.finmanage.app;

import android.content.Context;
import android.content.SharedPreferences;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Intent;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * BalancePlugin — Capacitor Plugin
 *
 * Nhận dữ liệu số dư từ JS (Next.js) và:
 * 1. Lưu vào SharedPreferences (để widget đọc)
 * 2. Kích hoạt update widget ngay lập tức
 *
 * Gọi từ JS:
 *   import { BalancePlugin } from '@/lib/capacitor/balanceWidget';
 *   await BalancePlugin.updateBalance({ balance: 5000000, currency: 'VND', income: 8000000, expense: 3000000 });
 */
@CapacitorPlugin(name = "BalancePlugin")
public class BalancePlugin extends Plugin {

    public static final String PREFS_NAME    = "finmanage_widget_prefs";
    public static final String KEY_BALANCE   = "balance";
    public static final String KEY_INCOME    = "income";
    public static final String KEY_EXPENSE   = "expense";
    public static final String KEY_CURRENCY  = "currency";
    public static final String KEY_UPDATED_AT = "updated_at";

    /**
     * JS call: BalancePlugin.updateBalance({ balance, income, expense, currency })
     */
    @PluginMethod
    public void updateBalance(PluginCall call) {
        // call.getDouble() trả về Double (boxed) — có thể null nếu JS không gửi field
        // → unbox an toàn trước khi đưa vào BigDecimal để tránh NullPointerException
        long balance  = toSafeLong(call.getDouble("balance",  0.0));
        long income   = toSafeLong(call.getDouble("income",   0.0));
        long expense  = toSafeLong(call.getDouble("expense",  0.0));
        String currency = call.getString("currency", "VND");
        if (currency == null) currency = "VND";


        Context context = getContext();

        // 1. Lưu vào SharedPreferences dưới dạng long (đơn vị: đồng), không encode bits
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit()
            .putLong(KEY_BALANCE,     balance)
            .putLong(KEY_INCOME,      income)
            .putLong(KEY_EXPENSE,     expense)
            .putString(KEY_CURRENCY,  currency)
            .putLong(KEY_UPDATED_AT,  System.currentTimeMillis())
            .apply();

        // 2. Trigger widget update ngay lập tức
        AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
        ComponentName widgetComponent = new ComponentName(context, BalanceWidget.class);
        int[] widgetIds = appWidgetManager.getAppWidgetIds(widgetComponent);

        if (widgetIds.length > 0) {
            Intent updateIntent = new Intent(context, BalanceWidget.class);
            updateIntent.setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
            updateIntent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, widgetIds);
            context.sendBroadcast(updateIntent);
        }

        JSObject result = new JSObject();
        result.put("success", true);
        call.resolve(result);
    }

    /**
     * JS call: BalancePlugin.getBalance()
     * Trả về dữ liệu hiện tại trong SharedPreferences (để debug)
     */
    @PluginMethod
    public void getBalance(PluginCall call) {
        Context context = getContext();
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);

        // Đọc trực tiếp dưới dạng long (không cần decode bits)
        long balance    = prefs.getLong(KEY_BALANCE,  0L);
        long income     = prefs.getLong(KEY_INCOME,   0L);
        long expense    = prefs.getLong(KEY_EXPENSE,  0L);
        String currency = prefs.getString(KEY_CURRENCY, "VND");
        long updatedAt  = prefs.getLong(KEY_UPDATED_AT, 0);

        JSObject result = new JSObject();
        result.put("balance",   balance);
        result.put("income",    income);
        result.put("expense",   expense);
        result.put("currency",  currency);
        result.put("updatedAt", updatedAt);
        call.resolve(result);
    }

    /**
     * Chuyển Double (có thể null từ Capacitor) → long an toàn.
     * Dùng BigDecimal để làm tròn, tránh lỗi floating-point.
     */
    private static long toSafeLong(Double value) {
        if (value == null || value.isNaN() || value.isInfinite()) return 0L;
        return BigDecimal.valueOf(value).setScale(0, RoundingMode.HALF_UP).longValue();
    }
}
