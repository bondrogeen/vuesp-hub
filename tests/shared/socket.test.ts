import assert from 'node:assert/strict';
import { test } from 'node:test';

import { isServiceStatusPayload } from '@root/shared/socket.ts';

test('accepts only boolean service status payloads', () => {
  assert.equal(isServiceStatusPayload({ running: true }), true);
  assert.equal(isServiceStatusPayload({ running: false }), true);

  assert.equal(isServiceStatusPayload({ running: 1 }), false);
  assert.equal(isServiceStatusPayload({ running: 'true' }), false);
  assert.equal(isServiceStatusPayload({ running: null }), false);
  assert.equal(isServiceStatusPayload({}), false);
  assert.equal(isServiceStatusPayload(null), false);
  assert.equal(isServiceStatusPayload('running'), false);
  assert.equal(isServiceStatusPayload(['running']), false);
});
