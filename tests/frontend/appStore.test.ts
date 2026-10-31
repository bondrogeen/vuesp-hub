import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createPinia, setActivePinia } from 'pinia';

import { useAppStore } from '../../frontend/stores/AppStore.ts';

test('persists notification updates, read state, and removal', () => {
  const values = new Map<string, string>();
  const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    },
  });

  try {
    setActivePinia(createPinia());
    const store = useAppStore();
    store.setNotification({ id: 'device-offline', message: 'Device offline', date: 100 });
    store.setNotification({ id: 'device-offline', message: 'Device online' });

    assert.equal(store.notifications.length, 1);
    assert.equal(store.notifications[0].message, 'Device online');
    assert.equal(store.notifications[0].date, 100);

    store.readNotification({ date: 100 });
    assert.equal(store.notifications[0].isNew, 0);
    assert.deepEqual(JSON.parse(values.get('notifications') ?? 'null'), store.notifications);

    store.removeNotification({ date: 100 });
    assert.deepEqual(store.notifications, []);
    assert.deepEqual(JSON.parse(values.get('notifications') ?? 'null'), []);
  } finally {
    if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  }
});
