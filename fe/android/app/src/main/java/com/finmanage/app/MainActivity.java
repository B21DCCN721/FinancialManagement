package com.finmanage.app;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Đăng ký Capacitor Plugins tuỳ chỉnh TRƯỚC super.onCreate()
        registerPlugin(BalancePlugin.class);

        // ★ BẮT BUỘC để safe-area env() hoạt động trong CSS ★
        // Cho phép window render dưới status bar và navigation bar (edge-to-edge).
        // Khi gọi trước super.onCreate(), WebView sẽ extend full-screen ngay từ đầu.
        // Thiếu dòng này → env(safe-area-inset-top) luôn trả về 0px dù đã set overlaysWebView=true.
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);

        super.onCreate(savedInstanceState);
    }

    @Override
    public void onStart() {
        super.onStart();
        // Lấy WebView của Capacitor
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            WebSettings settings = webView.getSettings();
            String userAgent = settings.getUserAgentString();

            // Loại bỏ chuỗi "; wv" (WebView marker) khỏi User-Agent
            // để tránh một số websites chặn WebView User-Agent
            if (userAgent.contains("; wv")) {
                settings.setUserAgentString(userAgent.replace("; wv", ""));
            }

            // KHÔNG set padding native lên WebView.
            // Lý do: CSS đã dùng env(safe-area-inset-*) để xử lý safe area.
            // Nếu vừa set padding native VỪA dùng env() → double padding → nội dung bị đẩy xuống 2 lần.
            // Capacitor WebView chạy edge-to-edge: env() tự nhận đúng giá trị status bar height từ hệ thống.
        }
    }
}

