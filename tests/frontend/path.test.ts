import assert from 'node:assert/strict';
import { test } from 'node:test';

import { withTrailingSlash, withoutTrailingSlash } from '@/utils/path.ts';
import { pageForPath } from '@/utils/access.ts';

test('withTrailingSlash normalizes hub URLs', () => {
  assert.equal(withTrailingSlash('/dashboard'), '/dashboard/');
  assert.equal(withTrailingSlash('/modules/yandex/hub'), '/modules/yandex/hub/');
  assert.equal(withTrailingSlash('/device/192.168.1.10'), '/device/192.168.1.10/');
  assert.equal(withTrailingSlash('/dashboard/'), '/dashboard/');
  assert.equal(withTrailingSlash('/'), '/');
  assert.equal(withTrailingSlash('/device/list?page=2#top'), '/device/list/?page=2#top');
  assert.equal(withTrailingSlash(''), '/');
});

test('withoutTrailingSlash keeps the root path', () => {
  assert.equal(withoutTrailingSlash('/'), '/');
  assert.equal(withoutTrailingSlash('/dashboard/'), '/dashboard');
  assert.equal(withoutTrailingSlash('/modules/yandex/hub///'), '/modules/yandex/hub');
});

test('access lookup ignores the trailing slash', () => {
  assert.equal(pageForPath('/dashboard/'), 'dashboard');
  assert.equal(pageForPath('/device/192.168.1.10/'), 'devices');
  assert.equal(pageForPath('/device/raw/'), 'raw');
  assert.equal(pageForPath('/modules/yandex/hub/'), 'modules');
  assert.equal(pageForPath('/modbus/'), 'modbus');
});
