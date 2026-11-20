import assert from 'node:assert/strict';
import { test } from 'node:test';
import VuespStruct from 'vuesp-struct';

import { DeviceProtocol, parseProtocolDefinition } from '@server/modules/devices/domain/protocols/deviceProtocol.ts';

const definition = {
  enums: {
    KEY: { INFO: 0, CUSTOM: 1 },
    CMD: { SET: 2 },
    PORT: { NONE: 0, INPUT: 1 },
  },
  structs: {
    Info: [
      { name: 'key', type: 'uint8_t' },
      { name: 'id', type: 'uint32_t' },
      { name: 'firmware', type: 'uint8_t', dimensions: [3] },
    ],
    Custom: [
      { name: 'key', type: 'uint8_t' },
      { name: 'value', type: 'uint16_t' },
    ],
  },
};

test('device protocol preserves declared command and state encoding', () => {
  const protocol = new DeviceProtocol();
  protocol.initialize(definition);

  const encoded = protocol.encode('CUSTOM', { value: 513 });
  assert.ok(encoded instanceof ArrayBuffer);
  assert.deepEqual(protocol.decode(encoded), {
    key: 'CUSTOM',
    object: { key: 1, value: 513 },
  });
});

test('device protocol rejects undeclared commands', () => {
  const protocol = new DeviceProtocol();
  protocol.initialize(definition);
  assert.throws(() => protocol.encode('UNDECLARED', { value: 1 }), /неизвестный ключ/);
});

test('device protocol rejects malformed device-provided definitions', () => {
  assert.throws(
    () => parseProtocolDefinition({ enums: { KEY: { INFO: 0 } }, structs: { Info: [{ name: 'key' }] } }),
    /struct Info is invalid/,
  );
  assert.throws(() => parseProtocolDefinition({ structs: {} }), /enums must be an object/);
  assert.throws(() => parseProtocolDefinition({ enums: { CMD: { SET: 2 } }, structs: {} }), /KEY enum is required/);
});

test('device protocol decodes a declared state key and exposes protocol enums', () => {
  const encoder = new VuespStruct();
  encoder.init(definition);
  const frame = encoder.set('CUSTOM', { value: 42 });
  assert.ok(frame);

  const protocol = new DeviceProtocol();
  protocol.initialize(definition);
  assert.deepEqual(protocol.decode(frame), {
    key: 'CUSTOM',
    object: { key: 1, value: 42 },
  });
  assert.equal(protocol.enums.PORT.INPUT, 1);
  assert.equal(protocol.enums.CMD.SET, 2);
});

test('device protocol rejects an unsupported protocol version', () => {
  assert.throws(
    () => parseProtocolDefinition({ protocolVersion: 3, enums: { KEY: { INFO: 0 } }, structs: {} }),
    /Unsupported device protocol version/,
  );
  assert.equal(
    parseProtocolDefinition({ protocolVersion: 2, enums: { KEY: { INFO: 0 } }, structs: {} }).protocolVersion,
    2,
  );
});

test('dashboard schema version is validated before tiles are used', async () => {
  const { parseLegacyDashboard } = await import('@server/modules/devices/domain/legacyDashboard.ts');
  assert.equal(parseLegacyDashboard({ dashboard: [], schemaVersion: 1 })?.length, 0);
  assert.equal(parseLegacyDashboard({ dashboard: [], schemaVersion: 2 }), null);
  assert.equal(parseLegacyDashboard({ dashboard: [] })?.length, 0);
});

test('dashboard keeps the first tile when ids are duplicated', async () => {
  const { parseLegacyDashboard } = await import('@server/modules/devices/domain/legacyDashboard.ts');
  const items = parseLegacyDashboard([
    { id: 'device.status3', name: 'charge', type: 'info', args: ['device.status3'] },
    { id: 'device.status3', name: 'discharge', type: 'info', args: ['device.status3'] },
  ]);
  assert.equal(items?.length, 1);
  assert.equal(items?.[0]?.name, 'charge');
});

test('accepts the full parseProtocol shape from default.json', () => {
  const full = {
    protocol: 2,
    enums: definition.enums,
    flagGroups: [],
    descriptions: {},
    structs: Object.fromEntries(
      Object.entries(definition.structs).map(([name, fields]) => [name, { size: 16, fields }]),
    ),
  };
  const parsed = parseProtocolDefinition(full);
  assert.deepEqual(parsed.structs.Custom, definition.structs.Custom);

  const protocol = new DeviceProtocol();
  protocol.initialize(full);
  const encoded = protocol.encode('CUSTOM', { value: 7 });
  assert.ok(encoded instanceof ArrayBuffer);
  assert.deepEqual(protocol.decode(encoded), { key: 'CUSTOM', object: { key: 1, value: 7 } });
});

test('rejects a newer protocol field from default.json', () => {
  assert.throws(
    () => parseProtocolDefinition({ protocol: 3, enums: definition.enums, structs: definition.structs }),
    /Unsupported device protocol version: 3/,
  );
});
