package com.financialmanagement.app;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "FinanceWidget")
public class FinanceWidgetPlugin extends Plugin {

    @PluginMethod
    public void updateWidgetData(PluginCall call) {
        String balance = call.getString("balance", "0 ₫");
        String monthlySpent = call.getString("monthlySpent", "0 ₫");
        String monthlyLimit = call.getString("monthlyLimit", "Không giới hạn");
        String dailySpent = call.getString("dailySpent", "0 ₫");
        String dailyLimit = call.getString("dailyLimit", "Không giới hạn");
        String dailyProgress = call.getString("dailyProgress", "0%");
        boolean isExceeded = call.getBoolean("isExceeded", false);

        Context context = getContext();
        SharedPreferences sharedPref = context.getSharedPreferences("FinanceWidgetPrefs", Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = sharedPref.edit();
        
        editor.putString("balance", balance);
        editor.putString("monthlySpent", monthlySpent);
        editor.putString("monthlyLimit", monthlyLimit);
        editor.putString("dailySpent", dailySpent);
        editor.putString("dailyLimit", dailyLimit);
        editor.putString("dailyProgress", dailyProgress);
        editor.putBoolean("isExceeded", isExceeded);
        editor.apply();

        // Phát Broadcast báo cho FinanceAppWidgetProvider để vẽ lại UI
        Intent intent = new Intent(context, FinanceAppWidgetProvider.class);
        intent.setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
        int[] ids = AppWidgetManager.getInstance(context).getAppWidgetIds(
            new ComponentName(context, FinanceAppWidgetProvider.class)
        );
        intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids);
        context.sendBroadcast(intent);

        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }
}
