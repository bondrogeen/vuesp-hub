import assert from 'node:assert/strict';
import { test } from 'node:test';

import { RateLimiter } from '@server/shared/security/rateLimiter.ts';

test('rate limiter blocks after the limit and clears after the block', () => {
  const limiter = new RateLimiter({ limit: 2, windowMs: 1_000, blockMs: 5_000 });
  assert.equal(limiter.take('a', 0).allowed, true);
  assert.equal(limiter.take('a', 100).allowed, true);
  assert.equal(limiter.take('a', 200).allowed, false);

  // Other keys are independent.
  assert.equal(limiter.take('b', 200).allowed, true);

  // Still blocked inside the block window, allowed afterwards.
  assert.equal(limiter.take('a', 5_100).allowed, false);
  assert.equal(limiter.take('a', 5_300).allowed, true);
});

test('rate limiter reset and cleanup release memory', () => {
  const limiter = new RateLimiter({ limit: 1, windowMs: 1_000, blockMs: 1_000 });
  assert.equal(limiter.take('key', 0).allowed, true);
  limiter.reset('key');
  assert.equal(limiter.take('key', 0).allowed, true);

  limiter.take('stale', 0);
  limiter.cleanup(10_000);
  assert.equal(limiter.take('stale', 10_001).allowed, true);
});

test('check reports the limit without consuming attempts', () => {
  const limiter = new RateLimiter({ limit: 2, windowMs: 1_000 });
  for (let index = 0; index < 5; index += 1) {
    assert.equal(limiter.check('key', 0).allowed, true);
  }
  limiter.take('key', 0);
  limiter.take('key', 1);
  const state = limiter.check('key', 2);
  assert.equal(state.allowed, false);
  assert.equal(state.remaining, 0);
});
