import assert from 'node:assert/strict';
import { test } from 'node:test';

import { isDeviceEventPayload, parseBroadcastDeviceCommand, parseDeviceCreateInput, parseDeviceUpdateInput, parseTargetedDeviceCommand } from '../../shared/device.ts';

test('parses valid registry inputs and preserves legacy numeric device IDs', () => {
  assert.deepEqual(
    parseDeviceCreateInput({
      deviceId: '4294967295',
      firmware: [1, 2, 3],
      ip: '192.0.2.40',
      name: 'Desk lamp',
      password: null,
    }),
    {
      deviceId: 0xffffffff,
      firmware: [1, 2, 3],
      ip: '192.0.2.40',
      name: 'Desk lamp',
      password: '',
    }
  );
});

test('rejects malformed registry records and invalid partial updates', () => {
  assert.throws(() => parseDeviceCreateInput(null), /Device data must be an object/);
  assert.throws(
    () =>
      parseDeviceCreateInput({
        deviceId: -1,
        ip: '192.0.2.41',
        name: 'Invalid',
      }),
    /unsigned 32-bit integer/
  );
  assert.throws(
    () =>
      parseDeviceCreateInput({
        deviceId: 1,
        firmware: [1, 256],
        ip: '192.0.2.41',
        name: 'Invalid',
      }),
    /Firmware version/
  );
  assert.throws(() => parseDeviceUpdateInput({ password: 42 }), /password must be a string/);
  assert.deepEqual(parseDeviceUpdateInput({ password: null }), { password: '' });
});

test('validates targeted and broadcast commands before runtime dispatch', () => {
  assert.deepEqual(
    parseTargetedDeviceCommand({
      ip: '192.0.2.42',
      comm: 'PORT',
      data: { command: 2 },
    }),
    {
      ip: '192.0.2.42',
      comm: 'PORT',
      data: { command: 2 },
    }
  );
  assert.deepEqual(parseBroadcastDeviceCommand({ comm: 'INFO' }), { comm: 'INFO' });
  assert.throws(() => parseTargetedDeviceCommand({ comm: 'INFO' }), /device and command/);
  assert.throws(() => parseBroadcastDeviceCommand({ comm: '', data: {} }), /command name/);
  assert.throws(() => parseBroadcastDeviceCommand({ comm: 'INFO', data: [] }), /payload must be an object/);
  assert.throws(() => parseBroadcastDeviceCommand(null), /Command data must be an object/);
});

test('accepts only well-formed device events from the local socket boundary', () => {
  assert.equal(isDeviceEventPayload({ event: 'message', id: 7, key: 'INFO', data: {} }), true);
  assert.equal(isDeviceEventPayload({ event: '', id: 7 }), false);
  assert.equal(isDeviceEventPayload({ event: 'message', id: Number.NaN }), false);
  assert.equal(isDeviceEventPayload({ event: 'message', id: '__proto__', key: 'INFO' }), false);
  assert.equal(isDeviceEventPayload({ event: 'message', id: 7, key: '__proto__' }), false);
  assert.equal(isDeviceEventPayload(null), false);
});
