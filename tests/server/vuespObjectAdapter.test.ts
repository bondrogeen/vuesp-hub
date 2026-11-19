import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ObjectRegistry } from '@core/application/objectRegistry.ts';
import { attachVuespObjects } from '@server/modules/devices/application/vuespObjectAdapter.ts';

const createRuntime = () => {
  const handlers = new Map<string, (payload: unknown) => void>();
  return {
    getList: () => [{
      id: 42,
      uuid: 'uuid-42',
      ip: '192.0.2.42',
      name: 'Lamp',
      list: [],
      enums: {},
    }],
    getState: () => ({}),
    on(event: string, listener: (payload: unknown) => void) {
      handlers.set(event, listener);
    },
    off(event: string) {
      handlers.delete(event);
    },
    emit(payload: unknown) {
      handlers.get('data')?.(payload);
    },
  };
};

test('ping registers a device and tracks liveness before INFO arrives', async () => {
  const runtime = createRuntime();
  const registry = new ObjectRegistry();
  const adapter = attachVuespObjects(runtime as never, registry);

  try {
    runtime.emit({ event: 'ping', id: -1, uuid: 'uuid-42', ip: '192.0.2.42', key: 'PING', data: { delta: 120 } });
    const online = registry.getDevice('uuid-42');
    assert.equal(online?.online, true);
    assert.equal(online?.legacyId, 42);

    // Between the thresholds the previous state is kept (no flapping).
    runtime.emit({ event: 'ping', id: -1, uuid: 'uuid-42', ip: '192.0.2.42', key: 'PING', data: { delta: 10_000 } });
    assert.equal(registry.getDevice('uuid-42')?.online, true);

    runtime.emit({ event: 'ping', id: -1, uuid: 'uuid-42', ip: '192.0.2.42', key: 'PING', data: { delta: 20_000 } });
    assert.equal(registry.getDevice('uuid-42')?.online, false);

    runtime.emit({ event: 'message', id: 42, uuid: 'uuid-42', ip: '192.0.2.42', key: 'DEVICE', data: { output: 1 } });
    await new Promise(resolve => setTimeout(resolve, 150));
    assert.equal(registry.getDevice('uuid-42')?.online, true);
  } finally {
    adapter.detach();
  }
});
