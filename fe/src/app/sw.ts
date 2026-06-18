import type { PrecacheEntry, SerwistGlobalConfig, RuntimeCaching } from "serwist";
import {
  Serwist,
  NetworkFirst,
  NetworkOnly,
  CacheFirst,
  StaleWhileRevalidate,
  ExpirationPlugin,
  RangeRequestsPlugin,
} from "serwist";

declare global {
  interface ServiceWorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

/**
 * API backend URL – phải khớp với NEXT_PUBLIC_API_URL
 * Service Worker không đọc được biến môi trường Next.js,
 * nên cần hardcode hoặc dùng cơ chế inject riêng.
 */
const API_ORIGIN = "https://financialmanagement-f43q.onrender.com";

/**
 * Custom runtime cache:
 * - Static assets (JS, CSS, fonts, images): Cache bình thường
 * - API backend (financialmanagement-f43q.onrender.com): NetworkOnly – KHÔNG bao giờ cache
 * - Firebase calls: NetworkOnly – KHÔNG bao giờ cache
 * - Next.js RSC/data: NetworkFirst với fallback
 *
 * Lý do không dùng defaultCache:
 *   defaultCache có rule "cross-origin: NetworkFirst 1h" sẽ cache
 *   response từ backend API → dữ liệu tài chính bị stale.
 */
const runtimeCaching: RuntimeCaching[] = [
  // ─── 1. API BACKEND – Không bao giờ cache ───────────────────────────────
  {
    // Chặn toàn bộ calls đến backend API
    matcher: ({ url }) => url.origin === API_ORIGIN,
    handler: new NetworkOnly(),
  },

  // ─── 2. Firebase – Không bao giờ cache ──────────────────────────────────
  {
    matcher: ({ url }) =>
      url.hostname.endsWith(".firebaseio.com") ||
      url.hostname.endsWith(".firebaseapp.com") ||
      url.hostname.endsWith(".googleapis.com") ||
      url.hostname === "identitytoolkit.googleapis.com" ||
      url.hostname === "securetoken.googleapis.com",
    handler: new NetworkOnly(),
  },

  // ─── 3. Sentry – Không cache ─────────────────────────────────────────────
  {
    matcher: ({ url }) => url.hostname.endsWith(".sentry.io") || url.hostname.endsWith(".ingest.de.sentry.io"),
    handler: new NetworkOnly(),
  },

  // ─── 4. Next.js API routes (same-origin /api/*) – Không cache ────────────
  {
    matcher: ({ sameOrigin, url: { pathname } }) =>
      sameOrigin && pathname.startsWith("/api/"),
    handler: new NetworkOnly(),
  },

  // ─── 5. Google Fonts CSS ─────────────────────────────────────────────────
  {
    matcher: /^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,
    handler: new StaleWhileRevalidate({
      cacheName: "google-fonts-stylesheets",
      plugins: [
        new ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 7 * 24 * 60 * 60 }),
      ],
    }),
  },

  // ─── 6. Google Fonts Files ───────────────────────────────────────────────
  {
    matcher: /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
    handler: new CacheFirst({
      cacheName: "google-fonts-webfonts",
      plugins: [
        new ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 365 * 24 * 60 * 60 }),
      ],
    }),
  },

  // ─── 7. Static fonts ────────────────────────────────────────────────────
  {
    matcher: /\.(?:eot|otf|ttc|ttf|woff|woff2|font\.css)$/i,
    handler: new StaleWhileRevalidate({
      cacheName: "static-font-assets",
      plugins: [
        new ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 7 * 24 * 60 * 60 }),
      ],
    }),
  },

  // ─── 8. Next.js static JS (hashed filenames → bất biến) ────────────────
  {
    matcher: /\/_next\/static.+\.js$/i,
    handler: new CacheFirst({
      cacheName: "next-static-js-assets",
      plugins: [
        new ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 24 * 60 * 60 }),
      ],
    }),
  },

  // ─── 9. Next.js Image Optimization ──────────────────────────────────────
  {
    matcher: /\/_next\/image\?url=.+$/i,
    handler: new StaleWhileRevalidate({
      cacheName: "next-image",
      plugins: [
        new ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 24 * 60 * 60 }),
      ],
    }),
  },

  // ─── 10. Static images (assets trong /public) ────────────────────────────
  {
    matcher: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
    handler: new StaleWhileRevalidate({
      cacheName: "static-image-assets",
      plugins: [
        new ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 30 * 24 * 60 * 60 }),
      ],
    }),
  },

  // ─── 11. Static JS (other) ───────────────────────────────────────────────
  {
    matcher: /\.(?:js)$/i,
    handler: new StaleWhileRevalidate({
      cacheName: "static-js-assets",
      plugins: [
        new ExpirationPlugin({ maxEntries: 48, maxAgeSeconds: 24 * 60 * 60 }),
      ],
    }),
  },

  // ─── 12. Static CSS ──────────────────────────────────────────────────────
  {
    matcher: /\.(?:css|less)$/i,
    handler: new StaleWhileRevalidate({
      cacheName: "static-style-assets",
      plugins: [
        new ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 24 * 60 * 60 }),
      ],
    }),
  },

  // ─── 13. Audio/Video ─────────────────────────────────────────────────────
  {
    matcher: /\.(?:mp3|wav|ogg|mp4|webm)$/i,
    handler: new CacheFirst({
      cacheName: "static-media-assets",
      plugins: [
        new ExpirationPlugin({ maxEntries: 16, maxAgeSeconds: 24 * 60 * 60 }),
        new RangeRequestsPlugin(),
      ],
    }),
  },

  // ─── 14. Next.js RSC prefetch ────────────────────────────────────────────
  {
    matcher: ({ request, url: { pathname }, sameOrigin }) =>
      request.headers.get("RSC") === "1" &&
      request.headers.get("Next-Router-Prefetch") === "1" &&
      sameOrigin &&
      !pathname.startsWith("/api/"),
    handler: new NetworkFirst({
      cacheName: "pages-rsc-prefetch",
      plugins: [
        new ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 24 * 60 * 60 }),
      ],
    }),
  },

  // ─── 15. Next.js RSC ─────────────────────────────────────────────────────
  {
    matcher: ({ request, url: { pathname }, sameOrigin }) =>
      request.headers.get("RSC") === "1" &&
      sameOrigin &&
      !pathname.startsWith("/api/"),
    handler: new NetworkFirst({
      cacheName: "pages-rsc",
      plugins: [
        new ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 24 * 60 * 60 }),
      ],
    }),
  },

  // ─── 16. HTML pages (same-origin, non-API) ───────────────────────────────
  {
    matcher: ({ sameOrigin, url: { pathname } }) =>
      sameOrigin && !pathname.startsWith("/api/"),
    handler: new NetworkFirst({
      cacheName: "pages",
      plugins: [
        new ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 24 * 60 * 60 }),
      ],
    }),
  },

  // ─── 17. Mọi thứ còn lại (cross-origin unknown) – Không cache ────────────
  //    Đây là fallback cuối cùng, NetworkOnly để không vô tình cache gì đó lạ
  {
    matcher: /.*/i,
    method: "GET",
    handler: new NetworkOnly(),
  },
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching,
});

serwist.addEventListeners();
