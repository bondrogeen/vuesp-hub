import assert from 'node:assert/strict';
import path from 'node:path';
import { test } from 'node:test';

import { ActionService, type IActionTarget } from '@core/application/actionService.ts';
import { ObjectRegistry } from '@core/application/objectRegistry.ts';
import { ScriptRuntime } from '@core/application/scriptRuntime.ts';

const setup = () => {
  const registry = new ObjectRegistry();
  registry.upsertDevice({ deviceId: 'uuid-1', name: 'Lamp', ip: '192.0.2.1', online: true });
  const calls: unknown[] = [];
  const target: IActionTarget = {
    async execute(request) {
      calls.push(request);
      return { commands: [{ comm: 'DEVICE', ok: true }] };
    },
  };
  const actions = new ActionService({ registry, target });
  const runtime = new ScriptRuntime({
    registry,
    actions,
    runnerPath: path.resolve('server/modules/scripts/script-runner.cjs'),
  });
  return { registry, actions, runtime, calls };
};

test('script runtime executes a script and returns output', async () => {
  const { runtime } = setup();
  const result = await runtime.run({ code: 'console.log("hello"); return 2 + 2;' });
  assert.equal(result.ok, true);
  assert.equal(result.output, 4);
  assert.equal(result.logs[0]?.message, 'hello');
});

test('script runtime kills an infinite loop', async () => {
  const { runtime } = setup();
  const result = await runtime.run({ code: 'while (true) {}', timeoutMs: 200 });
  assert.equal(result.ok, false);
  assert.equal(result.error?.kind, 'timeout');
});

test('script runtime does not expose require or process', async () => {
  const { runtime } = setup();
  const result = await runtime.run({ code: 'return [typeof require, typeof process];' });
  assert.deepEqual(result.output, ['undefined', 'undefined']);
});
