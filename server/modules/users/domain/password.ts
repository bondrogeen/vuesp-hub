import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

export const hashPassword = (password: string): string => {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`;
};

export const verifyPassword = (password: string, encoded: string): boolean => {
  const [algorithm, saltBase64, hashBase64] = encoded.split('$');
  if (algorithm !== 'scrypt' || !saltBase64 || !hashBase64) return false;
  const expected = Buffer.from(hashBase64, 'base64');
  const actual = scryptSync(password, Buffer.from(saltBase64, 'base64'), expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
};
