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
  output: "export",
  images: {
    unoptimized: true,
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
