import assert from 'node:assert/strict';
import { test } from 'node:test';

import { Watchdog, type IWatchdogTarget } from '@core/application/watchdog.ts';

const makeWatchdog = (targets: IWatchdogTarget[], options: Partial<ConstructorParameters<typeof Watchdog>[0]> = {}) => {
  const logs: string[] = [];
  const watchdog = new Watchdog({
    targets: () => targets,
    failureThreshold: 2,
    restartCooldownMs: 0,
    log: (level, message) => logs.push(`${level}:${message}`),
    ...options,
  });
  return { watchdog, logs };
};

test('watchdog restarts a target only after repeated failures', async () => {
  let healthy = false;
  let restarts = 0;
  const { watchdog, logs } = makeWatchdog([{
    id: 'module:demo',
    check: () => ({ ok: healthy, reason: healthy ? undefined : 'process is not running' }),
    restart: () => { restarts += 1; healthy = true; },
  }]);

  await watchdog.tick();
  assert.equal(restarts, 0);
  assert.equal(watchdog.snapshot()['module:demo']?.failures, 1);

  await watchdog.tick();
  assert.equal(restarts, 1);
  assert.ok(logs.some(entry => entry.startsWith('error:')));

  await watchdog.tick();
  assert.equal(restarts, 1);
  assert.equal(watchdog.snapshot()['module:demo']?.ok, true);
});

test('watchdog reports unhealthy targets without a restart handler', async () => {
  const { watchdog, logs } = makeWatchdog([{ id: 'adapters', check: () => ({ ok: false, reason: 'broken' }) }], { failureThreshold: 1 });
  await watchdog.tick();
  assert.equal(watchdog.snapshot().adapters?.ok, false);
  assert.deepEqual(logs, ['warn:adapters is unhealthy: broken']);
});

test('watchdog throttles restarts, handles timeouts and forgets removed targets', async () => {
  let restarts = 0;
  const targets: IWatchdogTarget[] = [{
    id: 'module:flapping',
    check: () => new Promise(() => undefined),
    restart: () => { restarts += 1; },
  }];
  const { watchdog } = makeWatchdog(targets, { failureThreshold: 1, checkTimeoutMs: 20, restartCooldownMs: 60_000 });

  await watchdog.tick();
  await watchdog.tick();
  assert.equal(restarts, 1);
  assert.match(watchdog.snapshot()['module:flapping']?.reason ?? '', /timed out/);

  targets.length = 0;
  await watchdog.tick();
  assert.deepEqual(watchdog.snapshot(), {});
});

test('watchdog survives a throwing check', async () => {
  const { watchdog } = makeWatchdog([{
    id: 'module:throws',
    check: () => { throw new Error('boom'); },
  }], { failureThreshold: 1 });
  await watchdog.tick();
  assert.equal(watchdog.snapshot()['module:throws']?.reason, 'boom');
});
