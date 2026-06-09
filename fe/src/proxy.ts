import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ĐỔI TÊN HÀM THÀNH proxy THEO ĐÚNG CHUẨN NEXT.JS 16+
export function proxy(request: NextRequest) {
  // Sinh nonce ngẫu nhiên bằng Web Crypto API tích hợp sẵn của Edge Runtime
  const nonce = crypto.randomUUID()
  const isDev = process.env.NODE_ENV !== 'production'

  // Xây dựng chuỗi CSP nghiêm ngặt
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://*.clerk.accounts.dev ${isDev ? "'unsafe-eval'" : ""};
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' blob: data: https: https://img.clerk.com;
    font-src 'self' data: https://fonts.gstatic.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    connect-src 'self' http://localhost:* https://*.clerk.com https://*.clerk.accounts.dev https://*.sentry.io;
  `
  
  // Chuẩn hoá chuỗi CSP (loại bỏ khoảng trắng thừa và dòng trống)
  const contentSecurityPolicyHeaderValue = cspHeader
    .replace(/\s{2,}/g, ' ')
    .trim()

  const requestHeaders = new Headers(request.headers)
  
  // Set x-nonce để Next.js đọc và tự nhúng vào các thẻ <script> tự sinh
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set(
    'Content-Security-Policy',
    contentSecurityPolicyHeaderValue
  )

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
  
  // Gắn CSP header vào Response trả về Client
  response.headers.set(
    'Content-Security-Policy',
    contentSecurityPolicyHeaderValue
  )

  return response
}

export const config = {
  matcher: [
    /*
     * Match toàn bộ các đường dẫn NGOẠI TRỪ:
     * - api (API nội bộ nếu có)
     * - _next/static (chứa các file tĩnh Next.js)
     * - _next/image (API tối ưu ảnh)
     * - favicon.ico (icon)
     * - monitoring (Tunnel của Sentry)
     */
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico|monitoring).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}