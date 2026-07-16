package com.financialmanagement.app;

import android.os.Bundle;
import android.webkit.WebView;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Đăng ký custom plugin để đồng bộ Widget tài chính
        registerPlugin(FinanceWidgetPlugin.class);
        
        // Tránh đè vùng khuất (Safe Area) ở mức Native WebView
        WebView webView = this.bridge.getWebView();
        if (webView != null) {
            // Cho phép vẽ tràn viền dưới thanh Status/Navigation bar (Edge-to-Edge)
            WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
            
            // Lắng nghe insets và set padding thích hợp cho WebView
            ViewCompat.setOnApplyWindowInsetsListener(webView, (v, windowInsets) -> {
                Insets systemBars = windowInsets.getInsets(
                    WindowInsetsCompat.Type.statusBars() |
                    WindowInsetsCompat.Type.navigationBars() |
                    WindowInsetsCompat.Type.displayCutout()
                );
                
                // Set padding trực tiếp lên WebView để chừa khoảng trống an toàn
                v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
                
                return windowInsets;
            });
        }
    }
}
