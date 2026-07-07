import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.finmanage.app",
  appName: "FinManage",
  // Không dùng webDir vì đang dùng remote URL mode
  webDir: "out",
  server: {
    // Load trực tiếp từ URL deploy thay vì bundle web assets vào app
    url: "https://financialmanagement-f43q.onrender.com",
    // Cho phép navigate trong app (các route của Next.js)
    allowNavigation: ["financialmanagement-f43q.onrender.com"],
    // Dùng HTTPS nên không cần cleartext
    cleartext: false,
  },
  android: {
    // Cho phép mixed content nếu cần (không cần với HTTPS)
    allowMixedContent: false,
    // Bật hardware accelerated rendering
    hardwareAccelerated: true,
    // Tên package trên Android
    buildOptions: {
      keystoreAlias: "finmanage",
    },
  },
  ios: {
    // Scheme dùng cho WKWebView
    scheme: "FinManage",
  },
  plugins: {
    // Cấu hình SplashScreen nếu cần
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#0a0a0f",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
  },
};

export default config;
