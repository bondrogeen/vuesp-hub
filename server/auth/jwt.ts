import { createHmac, timingSafeEqual } from 'node:crypto';

export interface JwtPayload {
  sub: string;
  iat: number;
  exp: number;
}

const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');

const decode = <T>(value: string): T | null => {
  try {
    return JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as T;
  } catch {
    return null;
  }
};

export const signJwt = (subject: string, secret: Buffer, ttlSeconds: number): string => {
  const now = Math.floor(Date.now() / 1000);
  const header = encode({ alg: 'HS256', typ: 'JWT' });
  const payload = encode({ sub: subject, iat: now, exp: now + ttlSeconds });
  const signature = createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
};

export const verifyJwt = (token: string | undefined, secret: Buffer): JwtPayload | null => {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [header, payload, signature] = parts;
  const headerData = decode<{ alg?: string; typ?: string }>(header);
  if (headerData?.alg !== 'HS256') return null;

  const expected = createHmac('sha256', secret).update(`${header}.${payload}`).digest();
  let actual: Buffer;
  try {
    actual = Buffer.from(signature, 'base64url');
  } catch {
    return null;
  }
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;

  const data = decode<JwtPayload>(payload);
  if (!data || typeof data.sub !== 'string' || typeof data.exp !== 'number') return null;
  if (data.exp <= Math.floor(Date.now() / 1000)) return null;
  return data;
};
