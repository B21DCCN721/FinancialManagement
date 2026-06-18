import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FinManage – Quản lý tài chính thông minh",
  description:
    "Theo dõi tài chính, ngân sách và mục tiêu của bạn với bảng điều khiển hiện đại và trực quan.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent", // Cho phép content kéo lên dưới status bar (safe-area)
    title: "FinManage",
    startupImage: [
      {
        url: "/icons/icon-512x512.png",
      },
    ],
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    // Hỗ trợ Android Chrome PWA
    "mobile-web-app-capable": "yes",
    // Hỗ trợ IE/Edge cũ
    "msapplication-TileColor": "#7c5cfc",
    "msapplication-TileImage": "/icons/icon-144x144.png",
    "msapplication-tap-highlight": "no",
  },
};

// viewport phải export riêng (Next.js 14+)
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0f" },
  ],
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
  userScalable: true,
  // Safe area cho iOS (notch, home indicator)
  viewportFit: "cover",
};

import { ThemeProvider } from "@/components/theme-provider";
import { ReduxProvider } from "@/store/provider";
import I18nProvider from "@/components/providers/I18nProvider";
import { Toaster } from "sonner";
import { PWAInstallPrompt } from "@/components/pwa/PWAInstallPrompt";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${inter.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
    >
      <head>
        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512x512.png" />
        {/* Favicon */}
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-96x96.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-72x72.png" />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ReduxProvider>
            <I18nProvider>
              {children}
              <Toaster position="top-right" richColors />
              <PWAInstallPrompt />
            </I18nProvider>
          </ReduxProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
