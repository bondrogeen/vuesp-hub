import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import express from 'express';
import { test } from 'node:test';

import Core from '@core/core.ts';
import { createSystemRouter } from '@server/modules/system/api/systemRoutes.ts';

const startApi = async (core: Core) => {
  const app = express();
  app.use('/api/v1/system', createSystemRouter(core));
  const server = createServer(app);

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });

  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Test server failed to bind');
  return {
    url: `http://127.0.0.1:${address.port}/api/v1/system`,
    close: () => new Promise<void>((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve());
    }),
  };
};

test('system API exposes health, metrics and bounded logs', async () => {
  const core = new Core({ modules: [], config: { maxLogEntries: 5 } });
  await core.init();
  core.log('system test message', 'warn', 'test');
  const api = await startApi(core);

  try {
    const health = await fetch(`${api.url}/health`);
    assert.equal(health.status, 200);
    const healthBody = await health.json();
    assert.equal(healthBody.status, 'ready');
    assert.equal(typeof healthBody.startedAt, 'number');

    const metrics = await fetch(`${api.url}/metrics`);
    assert.equal(metrics.status, 200);
    const metricsBody = await metrics.json();
    assert.ok(metricsBody.logsWritten >= 1);
    assert.equal(typeof metricsBody.eventLoopDelayMs?.p95, 'number');

    const logs = await fetch(`${api.url}/logs?level=warn&limit=1`);
    assert.equal(logs.status, 200);
    const logsBody = await logs.json();
    assert.equal(logsBody.total, 1);
    assert.equal(logsBody.items[0]?.message, 'system test message');
    assert.equal(logsBody.items[0]?.context, 'test');
  } finally {
    await api.close();
    await core.shutdown();
  }
});
