import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import express from 'express';
import { test } from 'node:test';

import type { ScriptRuntime } from '@core/application/scriptRuntime.ts';
import { createScriptsRouter } from '@server/modules/scripts/api/scriptRoutes.ts';
import type { IStoreEntity, IStoreModel, TStoreModelFactory } from '@shared/stores/types.ts';

const memoryStore = (): TStoreModelFactory => (): IStoreModel => {
  const items: IStoreEntity[] = [];
  return {
    async getAll() { return [...items]; },
    async getById(id) { return items.find(item => item.id === id); },
    async create(data) { const item = { ...data, id: items.length + 1 } as IStoreEntity; items.push(item); return item; },
    async update(id, data) { const i = items.findIndex(item => item.id === id); if (i < 0) return null; items[i] = { ...items[i], ...data }; return items[i]; },
    async delete(id) { const i = items.findIndex(item => item.id === id); return i < 0 ? undefined : items.splice(i, 1)[0]; },
  };
};

const startApi = async () => {
  const runtime = { run: async ({ code }: { code: string }) => ({ ok: true, durationMs: 1, logs: [], output: code.length }) } as unknown as ScriptRuntime;
  const app = express();
  app.use(express.json());
  app.use('/api/v1/scripts', createScriptsRouter(runtime, memoryStore()));
  const server = createServer(app);
  await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('bind failed');
  return { url: `http://127.0.0.1:${address.port}/api/v1/scripts`, close: () => new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())) };
};

test('script API creates and runs a script', async () => {
  const api = await startApi();
  try {
    const created = await fetch(api.url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Demo', code: 'return 1 + 1' }),
    });
    assert.equal(created.status, 201);
    const body = await created.json();
    const run = await fetch(`${api.url}/${body.script.id}/run`, { method: 'POST' });
    assert.equal(run.status, 200);
    assert.equal((await run.json()).result.ok, true);
  } finally {
    await api.close();
  }
});
