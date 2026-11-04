import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createPinia, setActivePinia } from 'pinia';
import { markRaw } from 'vue';

import { useWebSocketStore } from '../../frontend/stores/WebSocketStore.ts';

type Listener = (data?: unknown) => void;
type FakeAck = (error: Error | null, response?: { status?: string; message?: string; menus?: unknown[]; list?: unknown[]; running?: boolean }) => void;

const createSocket = () => {
  const listeners = new Map<string, Listener>();
  const events: string[] = [];
  let running = false;
  return {
    connected: true,
    events,
    on(event: string, listener: Listener) {
      listeners.set(event, listener);
    },
    server(event: string, data?: unknown) {
      listeners.get(event)?.(data);
    },
    timeout() {
      return this;
    },
    emit(event: string, _data: unknown, callback: FakeAck) {
      events.push(event);
      if (event === 'service:get-status') callback(null, { running });
      if (event === 'service:start') {
        running = true;
        callback(null, { status: 'success' });
      }
      if (event === 'service:stop') {
        running = false;
        callback(null, { status: 'success' });
      }
      if (event === 'device:menus') callback(null, { status: 'success', menus: [] });
      if (event === 'device:list') callback(null, { status: 'success', list: [] });
    },
    connect() {
      return listeners.get('connect')?.();
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
  assert.equal(store.serviceRunning, true);
  assert.deepEqual(store.menus, []);
  assert.deepEqual(store.list, []);

  await store.initializeConnection();
  assert.equal(socket.events.filter(event => event === 'service:start').length, 1);
  assert.equal(store.connectionError, '');
});

test('tracks service status from server events and start/stop acknowledgements', async () => {
  setActivePinia(createPinia());
  const store = useWebSocketStore();
  const socket = createSocket();
  store.bindSocket(markRaw(socket) as never);

  socket.server('service:status', { running: true });
  assert.equal(store.serviceRunning, true);

  socket.server('service:status', { running: false });
  assert.equal(store.serviceRunning, false);

  socket.server('service:status', { running: 'yes' });
  assert.equal(store.serviceRunning, false);

  await store.initializeConnection();
  assert.equal(store.serviceRunning, true);

  await store.stopService();
  assert.equal(store.serviceRunning, false);

  await store.startService();
  assert.equal(store.serviceRunning, true);
});
