import assert from 'node:assert/strict';
import { test } from 'node:test';
import VuespStruct from 'vuesp-struct';

import { LegacyDeviceProtocol } from '../../server/devices/protocols/legacyDeviceProtocol.ts';

const definition = {
  keys: ['INFO', 'CUSTOM'],
  structs: {
    Info: [
      { type: 'uint8_t', name: 'key' },
      { type: 'uint32_t', name: 'id' },
      { type: 'uint8_t', name: 'firmware', length: 3 },
    ],
    Custom: [
      { type: 'uint8_t', name: 'key' },
      { type: 'uint16_t', name: 'value' },
    ],
  },
};

test('legacy protocol preserves known command and state encoding', () => {
  const protocol = new LegacyDeviceProtocol();
  protocol.initialize(definition);

  const encoded = protocol.encode('CUSTOM', { value: 513 });
  assert.ok(encoded instanceof ArrayBuffer);
  assert.deepEqual(protocol.decode(encoded), {
    key: 'CUSTOM',
    object: { key: 1, value: 513 },
  });
});

test('legacy protocol leaves undeclared commands uninterpreted', () => {
  const protocol = new LegacyDeviceProtocol();
  protocol.initialize(definition);
  const originalWarn = console.warn;
  const warnings: unknown[][] = [];
  console.warn = (...args: unknown[]) => warnings.push(args);
  try {
    assert.equal(protocol.encode('UNDECLARED', { value: 1 }), null);
    assert.equal(warnings.length, 1);
  } finally {
    console.warn = originalWarn;
  }
});

test('legacy protocol rejects malformed device-provided struct definitions', () => {
  const protocol = new LegacyDeviceProtocol();
  assert.throws(
    () => protocol.initialize({ keys: ['INFO'], structs: { Info: [{ name: 'key' }] } }),
    /Legacy protocol struct fields are invalid/,
  );
});

test('legacy protocol decodes a declared state key without assigning it domain meaning', () => {
  const encoder = new VuespStruct();
  encoder.init(definition);
  const frame = encoder.set('CUSTOM', { value: 42 });
  assert.ok(frame);

  const protocol = new LegacyDeviceProtocol();
  protocol.initialize(definition);
  assert.deepEqual(protocol.decode(frame), {
    key: 'CUSTOM',
    object: { key: 1, value: 42 },
  });
});
