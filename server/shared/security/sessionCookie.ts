import type { Request, Response } from 'express';

export const SESSION_COOKIE = 'vuesp_session';

export interface ISessionCookieOptions {
  maxAgeSeconds: number;
  secure?: boolean;
}

/** Reads one cookie value from a raw `Cookie` header without extra dependencies. */
export const readCookie = (header: string | undefined, name: string): string | undefined => {
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const separator = part.indexOf('=');
    if (separator < 0) continue;
    if (part.slice(0, separator).trim() !== name) continue;
    const value = part.slice(separator + 1).trim();
    if (!value) return undefined;
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }
  return undefined;
};

export const sessionTokenFromRequest = (request: Pick<Request, 'headers'>): string | undefined =>
  readCookie(request.headers.cookie, SESSION_COOKIE);

/**
 * Session cookie defaults: the browser never exposes it to scripts, and
 * `SameSite=Strict` keeps cross-site requests from carrying it at all.
 * `Secure` is added when the hub runs behind HTTPS (or is forced by env) so
 * plain-HTTP LAN development keeps working.
 */
export const setSessionCookie = (response: Response, token: string, { maxAgeSeconds, secure }: ISessionCookieOptions): void => {
  const attributes = [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${Math.max(Math.floor(maxAgeSeconds), 1)}`,
  ];
  if (secure || process.env.VUESP_COOKIE_SECURE === '1') attributes.push('Secure');
  response.append('Set-Cookie', attributes.join('; '));
};

export const clearSessionCookie = (response: Response): void => {
  const attributes = [`${SESSION_COOKIE}=`, 'Path=/', 'HttpOnly', 'SameSite=Strict', 'Max-Age=0'];
  if (process.env.VUESP_COOKIE_SECURE === '1') attributes.push('Secure');
  response.append('Set-Cookie', attributes.join('; '));
};
