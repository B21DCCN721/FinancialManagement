import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default withSentryConfig(nextConfig, {
  org: "your-organization",
  project: "your-project",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  widenClientFileUpload: true,

  reactComponentAnnotation: {
    enabled: true,
  },

  tunnelRoute: "/monitoring",

  // By default, Sentry now deletes source maps after uploading them.
  // If you need to disable them entirely, use `sourcemaps: { disable: true }`
  
  disableLogger: true,

  automaticVercelMonitors: true,
});
