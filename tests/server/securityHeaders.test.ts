import assert from 'node:assert/strict';
import { test } from 'node:test';

import { SECURITY_HEADERS, applySecurityHeaders } from '@server/shared/security/securityHeaders.ts';

test('security headers cover clickjacking, sniffing and CSP', () => {
  assert.equal(SECURITY_HEADERS['X-Content-Type-Options'], 'nosniff');
  assert.equal(SECURITY_HEADERS['X-Frame-Options'], 'SAMEORIGIN');
  assert.equal(SECURITY_HEADERS['Referrer-Policy'], 'same-origin');

  const csp = SECURITY_HEADERS['Content-Security-Policy'] ?? '';
  assert.match(csp, /default-src 'self'/);
  assert.match(csp, /object-src 'none'/);
  assert.match(csp, /frame-ancestors 'self'/);
  assert.match(csp, /base-uri 'self'/);
  assert.doesNotMatch(csp, /script-src[^;]*\*/);
});

test('applySecurityHeaders writes every header', () => {
  const written: Record<string, string> = {};
  applySecurityHeaders((name, value) => { written[name] = value; });
  assert.deepEqual(written, { ...SECURITY_HEADERS });
});
