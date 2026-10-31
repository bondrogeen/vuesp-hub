import assert from 'node:assert/strict';
import { test } from 'node:test';
import Struct from 'c-struct-to-json';

import { decodeDiscoveryMessage } from '../../server/controllers/vuespController.ts';

const discoveryStruct = [
  { name: 'command', type: 'uint8_t' },
  { name: 'firmware', type: 'uint8_t', length: 3 },
  { name: 'deviceId', type: 'uint32_t' },
  { name: 'name', type: 'char', length: 20 },
];

test('decodes discovery payloads from a Buffer view and strips padded name bytes', () => {
  const buffer = Buffer.from(new Uint8Array(new Struct(discoveryStruct).setObject({
    command: 98,
    firmware: [1, 2, 3],
    deviceId: 1234,
    name: 'Desk lamp',
  }).getBuffer()));
  const paddedView = Buffer.concat([Buffer.from([0, 0]), buffer, Buffer.from([0])]).subarray(2, 2 + buffer.length);

  assert.deepEqual(decodeDiscoveryMessage(paddedView, '192.0.2.30'), {
    command: 98,
    firmware: [1, 2, 3],
    deviceId: 1234,
    name: 'Desk lamp',
    ip: '192.0.2.30',
  });
});

test('ignores malformed and non-discovery payloads', () => {
  assert.equal(decodeDiscoveryMessage(Buffer.alloc(2), '192.0.2.31'), null);
  const response = Buffer.from(new Uint8Array(new Struct(discoveryStruct).setObject({
    command: 99,
    firmware: [0, 0, 0],
    deviceId: 0,
    name: '',
  }).getBuffer()));
  assert.equal(decodeDiscoveryMessage(response, '192.0.2.31'), null);
});
