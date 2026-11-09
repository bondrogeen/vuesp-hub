import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import express from 'express';
import { test } from 'node:test';

import {
  createModbusController,
  type ModbusSerial,
} from '@server/modules/serial/application/modbusController.ts';

const startApi = async (serial: ModbusSerial) => {
  const app = express();
  const controller = createModbusController(serial);
  app.get('/api/v1/modbus/send', controller.send);
  const server = createServer(app);

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });

  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Test server failed to bind');
  return {
    url: `http://127.0.0.1:${address.port}/api/v1/modbus/send`,
    close: () => new Promise<void>((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve());
    }),
  };
};

test('Modbus endpoint preserves its legacy success response', async () => {
  const api = await startApi({
    getList: async () => [],
    writeAsync: async () => [1, 4, 0, 0, 0, 1, 49, 202],
  });
  try {
    const response = await fetch(api.url);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { t: [1, 4, 0, 0, 0, 1, 49, 202] });
  } finally {
    await api.close();
  }
});

test('Modbus endpoint returns the shared generic error response', async () => {
  const api = await startApi({
    getList: async () => [],
    writeAsync: async () => {
      throw new Error('private serial port detail');
    },
  });
  const originalError = console.error;
  const loggedErrors: unknown[][] = [];
  console.error = (...args: unknown[]) => loggedErrors.push(args);
  try {
    const response = await fetch(api.url);
    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), { error: 'Internal server error' });
    assert.equal(loggedErrors.length, 1);
    assert.match(String(loggedErrors[0][1]), /private serial port detail/);
  } finally {
    console.error = originalError;
    await api.close();
  }
});
