"use client";

import { useEffect, useState } from "react";
import { X, Download, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * PWAInstallPrompt – Hiện banner mời cài PWA trên Android/iOS
 *
 * - Android Chrome: dùng BeforeInstallPromptEvent
 * - iOS Safari: hướng dẫn "Add to Home Screen"
 * - Tự động ẩn nếu đang chạy trong PWA standalone mode
 * - Tương thích với Capacitor.js: không làm gì khi chạy trong WebView native
 */
export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Kiểm tra nếu đang chạy trong Capacitor native WebView → không hiện gì
    const isCapacitor =
      typeof window !== "undefined" &&
      (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.();

    if (isCapacitor) return;

    // Kiểm tra nếu đã cài PWA (standalone mode) → không hiện banner
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) return;

    // Kiểm tra nếu user đã dismiss (chỉ hiện 1 lần duy nhất)
    const wasDismissed = localStorage.getItem("pwa-prompt-dismissed");
    if (wasDismissed) return;

    // Android Chrome: lắng nghe sự kiện beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // iOS Safari detection
    const isIOS =
      /iphone|ipad|ipod/i.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    if (isIOS && isSafari) {
      // Delay 3s để không làm phiền ngay khi vào trang
      const timer = setTimeout(() => setShowIOSGuide(true), 3000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("beforeinstallprompt", handler);
      };
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
    setDismissed(true);
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("pwa-prompt-dismissed", "1");
    setDeferredPrompt(null);
    setShowIOSGuide(false);
  };

  if (dismissed) return null;
  if (!deferredPrompt && !showIOSGuide) return null;

  return (
    <>
      {/* Overlay backdrop */}
      <div
        className="pwa-prompt-backdrop"
        onClick={handleDismiss}
        aria-hidden="true"
      />

      {/* Banner */}
      <div
        className="pwa-prompt-banner"
        role="dialog"
        aria-modal="false"
        aria-label="Cài ứng dụng FinManage"
      >
        <div className="pwa-prompt-icon">
          <Smartphone size={28} />
        </div>

        <div className="pwa-prompt-content">
          <p className="pwa-prompt-title">Cài FinManage</p>
          {showIOSGuide ? (
            <p className="pwa-prompt-desc">
              Nhấn <strong>Chia sẻ</strong> rồi chọn{" "}
              <strong>&quot;Thêm vào màn hình chính&quot;</strong>
            </p>
          ) : (
            <p className="pwa-prompt-desc">
              Thêm vào màn hình chính để truy cập nhanh hơn
            </p>
          )}
        </div>

        <div className="pwa-prompt-actions">
          {!showIOSGuide && (
            <button
              id="pwa-install-btn"
              className="pwa-prompt-install-btn"
              onClick={handleInstall}
              aria-label="Cài đặt ứng dụng"
            >
              <Download size={16} />
              Cài ngay
            </button>
          )}
          <button
            id="pwa-dismiss-btn"
            className="pwa-prompt-close-btn"
            onClick={handleDismiss}
            aria-label="Đóng thông báo"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <style>{`
        .pwa-prompt-backdrop {
          position: fixed;
          inset: 0;
          z-index: 49;
          pointer-events: none;
        }

        .pwa-prompt-banner {
          position: fixed;
          bottom: calc(1rem + var(--safe-area-bottom, 0px));
          left: calc(1rem + var(--safe-area-left, 0px));
          right: calc(1rem + var(--safe-area-right, 0px));
          z-index: 50;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.25rem;
          border-radius: 1rem;
          background: linear-gradient(135deg,
            rgba(124, 92, 252, 0.95) 0%,
            rgba(168, 85, 247, 0.95) 100%
          );
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow:
            0 20px 60px rgba(0, 0, 0, 0.4),
            0 0 0 1px rgba(255, 255, 255, 0.1) inset,
            0 0 40px rgba(124, 92, 252, 0.4);
          animation: pwa-slide-up 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          max-width: 480px;
          margin: 0 auto;
        }

        @keyframes pwa-slide-up {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .pwa-prompt-icon {
          width: 44px;
          height: 44px;
          border-radius: 0.75rem;
          background: rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }

        .pwa-prompt-content {
          flex: 1;
          min-width: 0;
        }

        .pwa-prompt-title {
          font-size: 0.9375rem;
          font-weight: 700;
          color: white;
          margin: 0 0 0.125rem;
          letter-spacing: -0.01em;
        }

        .pwa-prompt-desc {
          font-size: 0.8125rem;
          color: rgba(255, 255, 255, 0.85);
          margin: 0;
          line-height: 1.4;
        }

        .pwa-prompt-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-shrink: 0;
        }

        .pwa-prompt-install-btn {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.5rem 1rem;
          border-radius: 0.625rem;
          background: rgba(255, 255, 255, 0.25);
          color: white;
          font-size: 0.8125rem;
          font-weight: 600;
          border: 1px solid rgba(255, 255, 255, 0.3);
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .pwa-prompt-install-btn:hover {
          background: rgba(255, 255, 255, 0.35);
          border-color: rgba(255, 255, 255, 0.5);
          transform: translateY(-1px);
        }

        .pwa-prompt-close-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: rgba(255, 255, 255, 0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          padding: 0;
          font-family: inherit;
        }

        .pwa-prompt-close-btn:hover {
          background: rgba(255, 255, 255, 0.25);
          color: white;
        }
      `}</style>
    </>
  );
}
