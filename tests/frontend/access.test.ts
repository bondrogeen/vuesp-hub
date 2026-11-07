import assert from 'node:assert/strict';
import { test } from 'node:test';

import { canAccess, DEFAULT_ROLE_PAGES } from '../../frontend/utils/access.ts';

test('role page access uses one defaults table', () => {
  assert.ok(canAccess('admin', '/admin/users/'));
  assert.ok(canAccess('user', '/device/192.168.1.10/'));
  assert.ok(canAccess('viewer', '/dashboard/'));
  assert.equal(canAccess('viewer', '/modbus/'), false);
  assert.equal(canAccess('viewer', '/admin/users/'), false);
  assert.equal(canAccess('user', '/admin/users/'), false);
  assert.equal(canAccess('viewer', '/device/raw/'), false);
  assert.ok(DEFAULT_ROLE_PAGES.viewer.includes('devices'));
});
