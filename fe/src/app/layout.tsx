import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FinManage – Quản lý tài chính thông minh",
  description: "Theo dõi tài chính, ngân sách và mục tiêu của bạn với bảng điều khiển hiện đại và trực quan.",
};

import { ThemeProvider } from "@/components/theme-provider";
import { ReduxProvider } from "@/store/provider";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="vi"
        suppressHydrationWarning
        className={`${inter.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col">
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ReduxProvider>
              {children}
              <Toaster position="top-right" richColors />
            </ReduxProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
