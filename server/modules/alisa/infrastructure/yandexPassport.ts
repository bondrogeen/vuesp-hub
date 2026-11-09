import { randomUUID } from 'node:crypto';

const PASSPORT = 'https://passport.yandex.ru';
const MOBILE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1';
const MUSIC_CLIENT_ID = '23cabbbdc6cd418abb4b39c32c41195d';
const MUSIC_CLIENT_SECRET = '53bc75238f0c4d08a118e51fe9203300';
const QR_TTL_MS = 5 * 60 * 1000;

class CookieJar {
  private values = new Map<string, string>();

  update(response: Response): void {
    const lines = typeof response.headers.getSetCookie === 'function' ? response.headers.getSetCookie() : [];
    for (const line of lines) {
      const pair = line.split(';', 1)[0];
      const index = pair.indexOf('=');
      if (index <= 0) continue;
      this.values.set(pair.slice(0, index).trim(), pair.slice(index + 1).trim());
    }
  }

  header(): string {
    return [...this.values].map(([name, value]) => `${name}=${value}`).join('; ');
  }
}

export interface QrLoginStart {
  id: string;
  qrImage: string;
  expiresAt: number;
}

export interface QrLoginPoll {
  status: 'pending' | 'ok';
  xToken?: string;
}

interface QrLoginState {
  trackId: string;
  authJson: Record<string, unknown>;
  csrfToken: string;
  expiresAt: number;
}

export interface PassportQrLogin {
  start(): Promise<QrLoginStart>;
  poll(id: string): Promise<QrLoginPoll>;
  drop(id: string): void;
}

/**
 * Undocumented Yandex Passport QR login. It mirrors the flow used by the
 * YandexStation/YandexStation-Api projects: obtain a CSRF token, create a
 * magic QR session, wait for the user to confirm it in the Yandex app, then
 * exchange the session cookies for an x-token. The x-token is accepted by the
 * Quasar endpoints, unlike a third-party OAuth app token.
 */
export const createPassportQrLogin = (): PassportQrLogin => {
  const states = new Map<string, { jar: CookieJar; state: QrLoginState }>();

  const request = async (jar: CookieJar, url: string, init: RequestInit = {}): Promise<Response> => {
    const headers = new Headers(init.headers);
    headers.set('User-Agent', MOBILE_UA);
    headers.set('Accept', headers.get('Accept') ?? 'application/json, text/plain, */*');
    const cookie = jar.header();
    if (cookie) headers.set('Cookie', cookie);
    const response = await fetch(url, { ...init, headers, redirect: 'follow' });
    jar.update(response);
    return response;
  };

  const json = async <T>(response: Response): Promise<T> => {
    const text = await response.text();
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new Error(`Passport returned a non-JSON response (${response.status})`);
    }
  };

  return {
    async start() {
      const jar = new CookieJar();
      const page = await request(jar, `${PASSPORT}/pwl-yandex`, { headers: { Accept: 'text/html,application/xhtml+xml' } });
      const html = await page.text();
      const csrfToken =
        /__CSRF__\s*=\s*"([^"]+)"/.exec(html)?.[1] ??
        /"csrf_token"\s+value="([^"]+)"/.exec(html)?.[1] ??
        /name="csrf_token"\s+value="([^"]+)"/.exec(html)?.[1];
      if (!csrfToken) throw new Error('Could not get the Passport CSRF token');

      const commonHeaders = {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
        Origin: PASSPORT,
        Referer: `${PASSPORT}/pwl-yandex`,
      };

      const authResponse = await request(jar, `${PASSPORT}/pwl-yandex/api/passport/auth/password/submit`, {
        method: 'POST',
        headers: commonHeaders,
        body: JSON.stringify({ retpath: `${PASSPORT}/`, with_code: true }),
      });
      const authJson = await json<Record<string, unknown>>(authResponse);
      const trackId = typeof authJson.track_id === 'string' ? authJson.track_id : '';
      if (!trackId) throw new Error('Passport did not return a QR track id');

      const magicResponse = await request(jar, `${PASSPORT}/pwl-yandex/api/passport/auth/magic/code`, {
        method: 'POST',
        headers: commonHeaders,
        body: new URLSearchParams({ location_id: '0', magic_track_id: trackId, track_id: '' }),
      });
      const magicJson = await json<Record<string, unknown>>(magicResponse);
      const qrSvgResponse = await request(jar, `${PASSPORT}/auth/magic/code/?track_id=${encodeURIComponent(trackId)}`, {
        headers: { Accept: 'image/svg+xml,text/html' },
      });
      const svg = await qrSvgResponse.text();
      const qrImage = svg.includes('<svg') ? `data:image/svg+xml;base64,${Buffer.from(svg, 'utf8').toString('base64')}` : '';

      const id = randomUUID();
      const expiresAt = Date.now() + QR_TTL_MS;
      states.set(id, {
        jar,
        state: { trackId, authJson, csrfToken, expiresAt },
      });

      // Keep the magic link available for diagnostics without exposing cookies.
      if (typeof magicJson.link === 'string' && !qrImage) {
        throw new Error('Passport did not return a QR image');
      }

      return { id, qrImage, expiresAt };
    },

    async poll(id) {
      const entry = states.get(id);
      if (!entry) throw new Error('QR login session not found');
      if (entry.state.expiresAt < Date.now()) {
        states.delete(id);
        throw new Error('QR code expired');
      }

      const headers = {
        'Content-Type': 'application/json',
        'X-CSRF-Token': entry.state.csrfToken,
        Origin: PASSPORT,
        Referer: `${PASSPORT}/pwl-yandex`,
      };
      const statusResponse = await request(entry.jar, `${PASSPORT}/pwl-yandex/api/passport/auth/magic/code/status`, {
        method: 'POST',
        headers,
        body: JSON.stringify(entry.state.authJson),
      });
      const status = await json<Record<string, unknown>>(statusResponse);
      if (status.state !== 'otp_auth_finished') {
        return { status: 'pending' };
      }

      const trackId = typeof status.trackId === 'string' ? status.trackId : entry.state.trackId;
      await request(entry.jar, `${PASSPORT}/pwl-yandex/api/passport/sessions/get_session`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ track_id: trackId }),
      });

      const cookie = entry.jar.header();
      const exchangeResponse = await request(entry.jar, 'https://mobileproxy.passport.yandex.net/1/bundle/oauth/token_by_sessionid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Ya-Client-Host': 'passport.yandex.ru',
          'Ya-Client-Cookie': cookie,
        },
        body: new URLSearchParams({ client_id: MUSIC_CLIENT_ID, client_secret: MUSIC_CLIENT_SECRET }),
      });
      const exchange = await json<Record<string, unknown>>(exchangeResponse);
      const xToken = typeof exchange.access_token === 'string' ? exchange.access_token : '';
      if (!xToken) throw new Error('Passport did not return an x-token');

      states.delete(id);
      return { status: 'ok', xToken };
    },

    drop(id) {
      states.delete(id);
    },
  };
};
