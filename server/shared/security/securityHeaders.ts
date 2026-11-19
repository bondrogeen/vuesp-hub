/**
 * Static response headers shared by every hub route.
 *
 * The hub renders device dashboards and media from LAN origins inside
 * iframes, so `frame-src`, `img-src` and `media-src` stay scheme-based while
 * scripts remain restricted to the hub bundle. Inline styles are required by
 * Vue `:style` bindings and GridStack positioning.
 */
export const SECURITY_HEADERS: Readonly<Record<string, string>> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'same-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  // Kept in sync with the <meta http-equiv> policy in index.html, which is the
  // only policy available to the Electron build. `unsafe-inline`/`unsafe-eval`
  // are required by the Yandex Passport autofill SDK; drop them together with
  // the SDK script tag.
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://yastatic.net",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://avatars.yandex.net http: https:",
    "media-src 'self' blob: data: http: https:",
    "connect-src 'self' http: https: ws: wss:",
    "font-src 'self' data:",
    "frame-src 'self' http: https:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
  ].join('; '),
};

export const applySecurityHeaders = (setHeader: (name: string, value: string) => void): void => {
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) setHeader(name, value);
};
