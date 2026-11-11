import assert from 'node:assert/strict';
import { test } from 'node:test';

import { canAccess, DEFAULT_ROLE_PAGES } from '@/utils/access.ts';

test('role page access uses one defaults table', () => {
  assert.ok(canAccess('admin', '/admin/users/', []));
  assert.ok(canAccess('user', '/device/192.168.1.10/', DEFAULT_ROLE_PAGES.user));
  assert.ok(canAccess('viewer', '/dashboard/', DEFAULT_ROLE_PAGES.viewer));
  assert.equal(canAccess('viewer', '/modbus/', DEFAULT_ROLE_PAGES.viewer), false);
  assert.equal(canAccess('viewer', '/admin/users/', DEFAULT_ROLE_PAGES.viewer), false);
  assert.equal(canAccess('user', '/admin/users/', DEFAULT_ROLE_PAGES.user), false);
  assert.equal(canAccess('viewer', '/device/raw/', DEFAULT_ROLE_PAGES.viewer), false);
  assert.ok(DEFAULT_ROLE_PAGES.viewer.includes('devices'));
});

test('per-user pages override role defaults', () => {
  assert.ok(canAccess('viewer', '/modbus/', ['modbus']));
  assert.ok(canAccess('viewer', '/modules/', ['modules']));
  assert.equal(canAccess('viewer', '/dashboard/', ['modbus']), false);
  assert.ok(canAccess('viewer', '/modules/yandex/hub/', ['modules']));
  assert.equal(canAccess('viewer', '/cloud/', ['modules']), false);
  assert.equal(canAccess('viewer', '/preview/', []), true);
});

test('administrators always keep full access', () => {
  assert.ok(canAccess('admin', '/admin/users/', []));
  assert.ok(canAccess('admin', '/modbus/', []));
});
