import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.finmanage.app",
  appName: "FinManage",
  // Không dùng webDir vì đang dùng remote URL mode
  webDir: "out",
  server: {
    // Load từ frontend Next.js deploy trên Vercel
    url: "https://financial-management-omega.vercel.app",
    // Cho phép navigate trong app (các route của Next.js)
    allowNavigation: ["financial-management-omega.vercel.app"],
    // Dùng HTTPS nên không cần cleartext
    cleartext: false,
  },
  android: {
    // Cho phép mixed content nếu cần (không cần với HTTPS)
    allowMixedContent: false,
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
    StatusBar: {
      overlaysWebView: true,
      backgroundColor: "#00000000",
    },
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
