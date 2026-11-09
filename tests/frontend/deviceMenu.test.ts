import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createDeviceMenu } from '@/utils/deviceMenu.ts';

const t = (key: string) => key;

test('nests all known devices under the devices item', () => {
  const menu = createDeviceMenu(
    [
      {
        id: 1,
        ip: '192.0.2.5',
        name: 'Lamp',
        menu: [{ name: 'menu.dashboard', path: '/dashboard' }],
      },
    ],
    t,
    [
      { ip: '192.0.2.5', name: 'Lamp' },
      { ip: '192.0.2.6', name: 'Offline' },
    ],
  );

  const devicesGroup = menu.find(group => group.items.some(item => item.path === '/device/list/'))!;
  const devices = devicesGroup.items[0];
  assert.equal(devices.path, '/device/list/');
  assert.deepEqual(devices.children?.map(child => child.path), ['/device/192.0.2.5/', '/device/192.0.2.6/']);
  assert.equal(devices.children?.[0].children?.[0].path, '/device/192.0.2.5/dashboard/');
  assert.equal(devices.children?.[1].children, undefined);

  // Devices are no longer separate top-level entries.
  assert.deepEqual(devicesGroup.items.map(item => item.path), ['/device/list/', '/device/raw/']);
  assert.ok(menu.some(group => group.items.some(item => item.path === '/')));
});

test('does not duplicate devices present both in runtime and registry', () => {
  const menu = createDeviceMenu(
    [{ id: 1, ip: '192.0.2.5', name: 'Lamp', menu: [] }],
    t,
    [{ ip: '192.0.2.5', name: 'Lamp from registry' }],
  );

  const devicesGroup = menu.find(group => group.items.some(item => item.path === '/device/list/'))!;
  const devices = devicesGroup.items[0];
  assert.equal(devices.children?.length, 1);
  assert.equal(devices.children?.[0].name, 'Lamp');
});
