import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createPinia, setActivePinia } from 'pinia';
import { markRaw } from 'vue';

import { useWebSocketStore } from '../../frontend/stores/WebSocketStore.ts';

const createSocket = () => {
  const listeners = new Map();
  const events = [];
  let running = false;
  return {
    connected: true,
    events,
    on(event, listener) {
      listeners.set(event, listener);
    },
    timeout() {
      return this;
    },
    emit(event, _data, callback) {
      events.push(event);
      if (event === 'service:get-status') callback(null, { running });
      if (event === 'service:start') {
        running = true;
        callback(null, { status: 'success' });
      }
      if (event === 'device:menus') callback(null, { status: 'success', menus: [] });
      if (event === 'device:list') callback(null, { status: 'success', list: [] });
    },
    connect() {
      return listeners.get('connect')();
    },
    disconnect() {},
  };
};

test('initializes the device service and reuses it when the socket reconnects', async () => {
  setActivePinia(createPinia());
  const store = useWebSocketStore();
  const socket = createSocket();
  store.socket = markRaw(socket) as never;
  assert.equal(store.connect(), socket);

  await store.initializeConnection();
  assert.equal(socket.events.filter(event => event === 'service:start').length, 1);
  assert.deepEqual(store.menus, []);
  assert.deepEqual(store.list, []);

  await store.initializeConnection();
  assert.equal(socket.events.filter(event => event === 'service:start').length, 1);
  assert.equal(store.connectionError, '');
});
