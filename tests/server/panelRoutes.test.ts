import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import express from 'express';
import { test } from 'node:test';

import { createPanelsRouter } from '@server/modules/panels/api/panelRoutes.ts';
import { createConfigStoreModel } from '@server/shared/storage/configStoreModel.ts';
import type { IStoreEntity, IStoreModel, TStoreModelFactory } from '@shared/stores/types.ts';

const memoryStore = (): TStoreModelFactory => (key: string): IStoreModel => {
  const items: IStoreEntity[] = [];
  void key;
  return {
    async getAll() {
      return [...items];
    },
    async getById(id) {
      return items.find(item => item.id === id);
    },
    async create(data) {
      const item = { ...data, id: items.length ? Math.max(...items.map(entry => entry.id)) + 1 : 1 } as IStoreEntity;
      items.push(item);
      return item;
    },
    async update(id, data) {
      const index = items.findIndex(item => item.id === id);
      if (index < 0) return null;
      items[index] = { ...items[index], ...data };
      return items[index];
    },
    async delete(id) {
      const index = items.findIndex(item => item.id === id);
      if (index < 0) return undefined;
      return items.splice(index, 1)[0];
    },
  };
};

const startApi = async (storeModel: TStoreModelFactory) => {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/panels', createPanelsRouter(storeModel));
  const server = createServer(app);
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Test server failed to bind');
  return {
    url: `http://127.0.0.1:${address.port}/api/v1/panels`,
    close: () => new Promise<void>((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve());
    }),
  };
};

const widget = {
  id: 'temp',
  type: 'info',
  entityId: 'uuid-1/device.temp',
  pos: { x: 0, y: 0, w: 4, h: 2 },
};

test('panel API creates, updates and deletes panels', async () => {
  const api = await startApi(memoryStore());
  try {
    const created = await fetch(api.url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Home', widgets: [widget] }),
    });
    assert.equal(created.status, 201);
    const body = await created.json();
    assert.equal(body.panel.name, 'Home');
    assert.equal(body.panel.widgets[0].entityId, 'uuid-1/device.temp');

    const list = await fetch(api.url);
    assert.equal((await list.json()).panels.length, 1);

    const updated = await fetch(`${api.url}/${body.panel.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Home 2' }),
    });
    assert.equal(updated.status, 200);
    assert.equal((await updated.json()).panel.name, 'Home 2');

    const removed = await fetch(`${api.url}/${body.panel.id}`, { method: 'DELETE' });
    assert.equal(removed.status, 200);
    assert.equal((await (await fetch(api.url)).json()).panels.length, 0);
  } finally {
    await api.close();
  }
});

test('panel API rejects invalid widget ids and types', async () => {
  const api = await startApi(memoryStore());
  try {
    const duplicate = await fetch(api.url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Bad', widgets: [widget, widget] }),
    });
    assert.equal(duplicate.status, 400);
    assert.match((await duplicate.json()).error, /Duplicate widget id/);

    const invalidType = await fetch(api.url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Bad', widgets: [{ ...widget, type: 'iframe' }] }),
    });
    assert.equal(invalidType.status, 400);
  } finally {
    await api.close();
  }
});

test('panel API keeps deleted panels in the trash until purged', async () => {
  const state = new Map<string, Record<string, Record<string, unknown>>>();
  const configStore = {
    async get<T>(section: string, key: string) { return state.get(section)?.[key] as T | undefined; },
    async set<T>(section: string, key: string, value: T) {
      const bucket = state.get(section) ?? {};
      bucket[key] = value as Record<string, unknown>;
      state.set(section, bucket);
    },
    async delete(section: string, key: string) {
      return Boolean(state.get(section) && delete state.get(section)![key]);
    },
    async list<T>(section: string) { return { ...(state.get(section) ?? {}) } as Record<string, T>; },
    async health() { return { ok: true, status: 'ok' as const }; },
    async close() {},
  };
  const factory: TStoreModelFactory = key => createConfigStoreModel(configStore, key, { softDelete: key === 'panels' });
  const api = await startApi(factory);
  try {
    const created = await (await fetch(api.url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Kitchen', widgets: [widget] }),
    })).json();

    const removed = await fetch(`${api.url}/${created.panel.id}`, { method: 'DELETE' });
    assert.equal(removed.status, 200);
    assert.equal((await (await fetch(api.url)).json()).panels.length, 0);
    assert.equal((await (await fetch(`${api.url}/trash/`)).json()).panels.length, 1);

    const restored = await fetch(`${api.url}/${created.panel.id}/restore/`, { method: 'POST' });
    assert.equal(restored.status, 200);
    assert.equal((await (await fetch(api.url)).json()).panels.length, 1);

    await fetch(`${api.url}/${created.panel.id}`, { method: 'DELETE' });
    const purged = await fetch(`${api.url}/${created.panel.id}?purge=true`, { method: 'DELETE' });
    assert.equal(purged.status, 200);
    assert.equal((await (await fetch(`${api.url}/trash/`)).json()).panels.length, 0);
  } finally {
    await api.close();
  }
});
