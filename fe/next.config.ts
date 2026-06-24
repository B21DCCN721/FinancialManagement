import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  // Service worker source file
  swSrc: "src/app/sw.ts",
  // Output destination for the compiled SW
  swDest: "public/sw.js",
  // Disable SW in development to avoid caching issues during dev
  disable: process.env.NODE_ENV === "development",
  // Cache only strategy: không inject runtime caching tự động
  // để tránh xung đột với Capacitor.js khi build native app
  cacheOnNavigation: false,
  reloadOnOnline: true,
});

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Áp dụng security headers cho tất cả các route
        source: "/(.*)",
        headers: [
          {
            // Chống Clickjacking: Ngăn không cho trang web bị nhúng vào iframe
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            // Chống XSS: Bật bộ lọc XSS tích hợp sẵn trên trình duyệt (đối với trình duyệt cũ)
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            // Chống MIME-sniffing: Ngăn trình duyệt tự đoán loại file
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(withSerwist(nextConfig), {
  org: "your-organization",
  project: "your-project",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  widenClientFileUpload: true,

  tunnelRoute: "/monitoring",

  // By default, Sentry now deletes source maps after uploading them.
  // If you need to disable them entirely, use `sourcemaps: { disable: true }`

  // Migrate deprecated properties into the webpack object
  webpack: {
    reactComponentAnnotation: {
      enabled: true,
    },
    treeshake: {
      removeDebugLogging: true,
    },
    automaticVercelMonitors: true,
  },
});
