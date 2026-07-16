package com.financialmanagement.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.view.View;
import android.widget.RemoteViews;

public class FinanceAppWidgetProvider extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        // Đọc dữ liệu tài chính từ SharedPreferences
        SharedPreferences sharedPref = context.getSharedPreferences("FinanceWidgetPrefs", Context.MODE_PRIVATE);
        String balance = sharedPref.getString("balance", "0 ₫");
        String monthlySpent = sharedPref.getString("monthlySpent", "0 ₫");
        String monthlyLimit = sharedPref.getString("monthlyLimit", "Không giới hạn");
        String dailySpent = sharedPref.getString("dailySpent", "0 ₫");
        String dailyLimit = sharedPref.getString("dailyLimit", "Không giới hạn");
        String dailyProgress = sharedPref.getString("dailyProgress", "0%");
        boolean isExceeded = sharedPref.getBoolean("isExceeded", false);

        for (int appWidgetId : appWidgetIds) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.finance_widget_layout);

            // Gán dữ liệu số dư khả dụng
            views.setTextViewText(R.id.widget_balance, balance);

            // Gán thông tin chi tiêu tháng (Đã chi / Hạn mức)
            String monthlyInfo = monthlySpent + " / " + monthlyLimit;
            views.setTextViewText(R.id.widget_monthly_spent, monthlyInfo);

            // Gán thông tin chi tiêu ngày (Chi tiêu / Giới hạn (Tiến trình))
            String dailyInfo = dailySpent + " / " + dailyLimit + " (" + dailyProgress + ")";
            views.setTextViewText(R.id.widget_daily_spent, dailyInfo);

            // Cập nhật giao diện cảnh báo nếu chi tiêu vượt hạn mức ngày
            if (isExceeded) {
                views.setViewVisibility(R.id.widget_warning_icon, View.VISIBLE);
                views.setViewVisibility(R.id.widget_warning_label, View.VISIBLE);
                // Đổi nền daily container sang màu đỏ cảnh báo bo góc
                views.setInt(R.id.widget_daily_container, "setBackgroundResource", R.drawable.widget_exceeded_bg);
            } else {
                views.setViewVisibility(R.id.widget_warning_icon, View.GONE);
                views.setViewVisibility(R.id.widget_warning_label, View.GONE);
                // Bỏ background đỏ của container
                views.setInt(R.id.widget_daily_container, "setBackgroundResource", 0);
            }

            // --- Sự kiện: Click vào Widget để mở app (Màn hình chính) ---
            Intent mainIntent = new Intent(context, MainActivity.class);
            PendingIntent pendingMain = PendingIntent.getActivity(
                context,
                0,
                mainIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            views.setOnClickPendingIntent(R.id.widget_container, pendingMain);

            // --- Sự kiện: Click nút "+ Giao dịch" để mở form thêm giao dịch qua Deep Link ---
            Intent addTxIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("finmanage://add-transaction"));
            addTxIntent.setClass(context, MainActivity.class);
            PendingIntent pendingAddTx = PendingIntent.getActivity(
                context,
                1,
                addTxIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            views.setOnClickPendingIntent(R.id.widget_btn_add, pendingAddTx);

            // Cập nhật Widget thông qua AppWidgetManager
            appWidgetManager.updateAppWidget(appWidgetId, views);
        }
    }
}
