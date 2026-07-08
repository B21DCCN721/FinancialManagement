"use client";

import dynamic from "next/dynamic";

// dynamic({ ssr: false }) chỉ được phép trong Client Component
const PWAInstallPrompt = dynamic(
  () => import("@/components/pwa/PWAInstallPrompt").then((m) => m.PWAInstallPrompt),
  { ssr: false }
);

export default function PWAInstallPromptLoader() {
  return <PWAInstallPrompt />;
}
