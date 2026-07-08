package com.finmanage.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/**
 * BalanceWidget — Android Home Screen App Widget
 *
 * Đọc dữ liệu từ SharedPreferences (được ghi bởi BalancePlugin)
 * và render lên màn hình chính thiết bị Android.
 */
public class BalanceWidget extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int widgetId : appWidgetIds) {
            updateWidget(context, appWidgetManager, widgetId);
        }
    }

    static void updateWidget(Context context, AppWidgetManager appWidgetManager, int widgetId) {
        // 1. Đọc dữ liệu từ SharedPreferences
        SharedPreferences prefs = context.getSharedPreferences(
            BalancePlugin.PREFS_NAME, Context.MODE_PRIVATE
        );

        // Đọc trực tiếp long (đơn vị: đồng), chuyển sang BigDecimal để format an toàn
        BigDecimal balance  = BigDecimal.valueOf(prefs.getLong(BalancePlugin.KEY_BALANCE,  0L));
        BigDecimal income   = BigDecimal.valueOf(prefs.getLong(BalancePlugin.KEY_INCOME,   0L));
        BigDecimal expense  = BigDecimal.valueOf(prefs.getLong(BalancePlugin.KEY_EXPENSE,  0L));
        long updatedAt      = prefs.getLong(BalancePlugin.KEY_UPDATED_AT, 0);

        // 2. Format số tiền VND
        NumberFormat vndFormat = NumberFormat.getIntegerInstance(new Locale("vi", "VN"));
        String balanceStr = vndFormat.format(balance) + " ₫";
        String incomeStr  = "+ " + vndFormat.format(income) + " ₫";
        String expenseStr = "- " + vndFormat.format(expense) + " ₫";

        // 3. Format thời gian cập nhật
        String updatedAtStr;
        if (updatedAt == 0) {
            updatedAtStr = "Chưa cập nhật";
        } else {
            SimpleDateFormat sdf = new SimpleDateFormat("HH:mm dd/MM", Locale.getDefault());
            updatedAtStr = "Cập nhật: " + sdf.format(new Date(updatedAt));
        }

        // 4. Build RemoteViews từ layout XML
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_balance);

        views.setTextViewText(R.id.widget_balance_amount, balanceStr);
        views.setTextViewText(R.id.widget_income_amount,  incomeStr);
        views.setTextViewText(R.id.widget_expense_amount, expenseStr);
        views.setTextViewText(R.id.widget_updated_at,     updatedAtStr);

        // 5. Màu số dư: xanh nếu dương, đỏ nếu âm
        int balanceColor = (balance.compareTo(BigDecimal.ZERO) >= 0)
            ? androidx.core.content.ContextCompat.getColor(context, R.color.widget_positive)
            : androidx.core.content.ContextCompat.getColor(context, R.color.widget_negative);
        views.setTextColor(R.id.widget_balance_amount, balanceColor);

        // 6. Tap vào widget → mở app
        Intent launchIntent = context.getPackageManager()
            .getLaunchIntentForPackage(context.getPackageName());
        if (launchIntent != null) {
            PendingIntent pendingIntent = PendingIntent.getActivity(
                context, 0, launchIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            views.setOnClickPendingIntent(R.id.widget_root, pendingIntent);
        }

        // 7. Push update lên AppWidgetManager
        appWidgetManager.updateAppWidget(widgetId, views);
    }

    @Override
    public void onEnabled(Context context) {
        // Widget được thêm lần đầu tiên
    }

    @Override
    public void onDisabled(Context context) {
        // Widget cuối cùng bị xoá khỏi home screen
    }
}
