import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildTileCommands, resolvePublicTiles, resolveTiles } from '../../shared/dashboardTiles.ts';
import type { DashboardItem } from 'vuesp-dashboard-core';

const state = {
  device: { key: 6, output: 1, command: 0 },
  ports: { '25': { key: 4, gpio: 25, value: 10, command: 0 } },
  dallas: { '280102': { address: [40, 1, 2], value: 20 } },
};

const button: DashboardItem = {
  id: 'device.output.1',
  name: 'output.1',
  type: 'button',
  args: ['device.output', 'device'],
  get: '(a & 1 ? 0 : 1)',
  getTo: "v ? 'ON' : 'OFF'",
  set: '({...b, output: v ? (b.output &= ~1) : (b.output |= 1), command: 2 })',
};

const dimmer: DashboardItem = {
  id: 'ports.25',
  name: 'port.25',
  type: 'dimmer',
  args: ['ports.25.value', 'ports.25'],
  set: '({ ...b, value: v, command: 2})',
};

test('resolves tile values from the per-device state', () => {
  const [tile] = resolveTiles([button], state);
  assert.equal(tile.value, 0);
  assert.equal(tile.valueTo, 'OFF');

  const [port] = resolveTiles([dimmer], state);
  assert.equal(port.value, 10);
});

test('publishes only presentation fields and never dashboard expressions', () => {
  const [published] = resolvePublicTiles([{ ...button, icon: 'bulb' }], state, 'uuid-1');
  assert.equal(published.key, 'uuid-1:0');
  assert.equal(published.id, 'device.output.1');
  assert.equal(published.value, 0);
  assert.equal(published.valueTo, 'OFF');
  assert.equal(published.entityType, 'switch');
  assert.equal(published.viewIcon, 'sun');

  for (const forbidden of ['args', 'get', 'getTo', 'set', 'meta']) {
    assert.equal(forbidden in published, false, `${forbidden} must be stripped`);
  }
});

test('builds device commands from set expressions and derives the message key', () => {
  assert.deepEqual(buildTileCommands(button, 1, state), [
    { comm: 'DEVICE', data: { output: 0, command: 2 } },
  ]);
  assert.deepEqual(buildTileCommands(button, 0, state), [
    { comm: 'DEVICE', data: { output: 1, command: 2 } },
  ]);
  assert.deepEqual(buildTileCommands(dimmer, 42, state), [
    { comm: 'PORT', data: { gpio: 25, value: 42, command: 2 } },
  ]);
});

test('ignores the numeric protocol key from the device state when choosing a message name', () => {
  // Device state objects contain `key: <number>`; it must not become the command name.
  assert.deepEqual(buildTileCommands(button, 1, { device: { key: 6, output: 1 } }), [
    { comm: 'DEVICE', data: { output: 0, command: 2 } },
  ]);
  assert.deepEqual(buildTileCommands(dimmer, 42, { ports: { '25': { key: 4, gpio: 25, value: 10 } } }), [
    { comm: 'PORT', data: { gpio: 25, value: 42, command: 2 } },
  ]);
});

test('prefers an explicit key/object pair and falls back to the args root', () => {
  const explicit: DashboardItem = {
    id: 'settings.foo',
    name: 'foo',
    type: 'input',
    args: ['settings.foo'],
    set: "({ key: 'SETTINGS', object: { foo: v } })",
  };
  assert.deepEqual(buildTileCommands(explicit, 'abc', { settings: { foo: '' } }), [
    { comm: 'SETTINGS', data: { foo: 'abc' } },
  ]);

  const dallas: DashboardItem = {
    id: 'dallas.0',
    name: 'dallas',
    type: 'info',
    args: ['dallas.280102.value', 'dallas.280102'],
    set: '({ ...b, value: v })',
  };
  assert.deepEqual(buildTileCommands(dallas, 21, state), [
    { comm: 'DALLAS', data: { address: [40, 1, 2], value: 21 } },
  ]);
});

test('ignores tiles without a command payload', () => {
  const info: DashboardItem = { id: 'plain', name: 'plain', type: 'info', args: ['device.output'] };
  assert.deepEqual(buildTileCommands(info, 1, state), []);

  const primitive: DashboardItem = { id: 'value', name: 'value', type: 'input', args: ['settings.foo'], set: 'v' };
  assert.deepEqual(buildTileCommands(primitive, 1, state), []);
});
