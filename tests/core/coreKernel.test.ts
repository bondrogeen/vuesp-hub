import assert from 'node:assert/strict';
import { test } from 'node:test';

import Core from '@core/core.ts';
import { loadCoreConfig, parseCoreConfig } from '@core/kernel/config.ts';
import { CoreEventBus } from '@core/kernel/eventBus.ts';
import { HealthRegistry } from '@core/kernel/healthRegistry.ts';
import { LogBuffer } from '@core/kernel/logBuffer.ts';
import { Scheduler } from '@core/kernel/scheduler.ts';
import { ServiceRegistry } from '@core/kernel/serviceRegistry.ts';

test('event bus isolates handler errors and preserves order', () => {
  const errors: Array<{ type: string; error: unknown }> = [];
  const bus = new CoreEventBus({ onError: (type, error) => errors.push({ type, error }) });
  const seen: string[] = [];

  bus.on('core:ready', () => {
    seen.push('first');
    throw new Error('boom');
  });
  bus.on('core:ready', () => {
    seen.push('second');
  });

  assert.equal(bus.emit('core:ready', { at: 1 }), 1);
  assert.deepEqual(seen, ['first', 'second']);
  assert.equal(errors.length, 1);
  assert.match(String(errors[0]?.error), /boom/);
});

test('event bus once and unsubscribe work', () => {
  const bus = new CoreEventBus();
  const seen: number[] = [];
  const unsubscribe = bus.on('core:ready', event => seen.push(event.at));
  bus.emit('core:ready', { at: 1 });
  unsubscribe();
  bus.emit('core:ready', { at: 2 });

  bus.once('core:stopped', event => seen.push(event.at));
  bus.emit('core:stopped', { at: 3 });
  bus.emit('core:stopped', { at: 4 });

  assert.deepEqual(seen, [1, 3]);
  assert.equal(bus.listenerCount('core:ready'), 0);
});

test('service registry rejects duplicates unless replacement is explicit', () => {
  const registry = new ServiceRegistry();
  const service = { ok: true };
  registry.register('demo', service);
  assert.equal(registry.get('demo'), service);
  assert.equal(registry.getRequired('demo'), service);
  assert.throws(() => registry.register('demo', {}), /already registered/);

  const replacing = new ServiceRegistry({ allowReplace: true });
  replacing.register('demo', service);
  replacing.register('demo', { ok: false });
  assert.deepEqual(replacing.get('demo'), { ok: false });
  assert.throws(() => registry.register('bad name', service), /Invalid service name/);
});

test('log buffer is bounded and reports dropped entries', () => {
  const buffer = new LogBuffer(2);
  buffer.add({ timestamp: '1', level: 'info', message: 'one' });
  buffer.add({ timestamp: '2', level: 'warn', message: 'two' });
  buffer.add({ timestamp: '3', level: 'error', message: 'three', context: 'test' });

  assert.equal(buffer.size, 2);
  assert.equal(buffer.droppedCount, 1);
  assert.deepEqual(buffer.list({ level: 'error' }).map(entry => entry.message), ['three']);
  assert.deepEqual(buffer.list({ context: 'test' }).map(entry => entry.message), ['three']);
  assert.deepEqual(buffer.list({ search: 'tw' }).map(entry => entry.message), ['two']);
});

test('health degrades when a service is not ready', () => {
  const health = new HealthRegistry();
  health.setStatus('ready');
  assert.equal(health.snapshot().status, 'ready');

  health.setService('adapter', 'ready');
  health.setService('history', 'degraded', 'disk full');
  const snapshot = health.snapshot();
  assert.equal(snapshot.status, 'degraded');
  assert.equal(snapshot.services.history?.message, 'disk full');
  assert.match(snapshot.reason ?? '', /disk full/);

  health.removeService('history');
  health.setStatus('ready');
  assert.equal(health.snapshot().status, 'ready');
});

test('scheduler clears timers and survives handler errors', async () => {
  const errors: string[] = [];
  const scheduler = new Scheduler({ onError: name => errors.push(name) });
  let ticks = 0;

  scheduler.setInterval('tick', 5, () => {
    ticks += 1;
    throw new Error('tick failed');
  });
  await new Promise(resolve => setTimeout(resolve, 18));
  assert.ok(ticks > 0);
  assert.equal(errors.length, ticks);

  await new Promise<void>(resolve => {
    scheduler.setTimeout('once', 5, resolve);
  });
  assert.equal(scheduler.has('once'), false);
  scheduler.stopAll();
  assert.equal(scheduler.activeCount, 0);
});

test('core initializes modules, exposes health and stops in reverse order', async () => {
  const events: string[] = [];
  class DemoModule {
    async init() {
      events.push('module:init');
    }

    async destroy() {
      events.push('module:destroy');
    }
  }
  const core = new Core({
    modules: [() => new DemoModule()],
    config: { maxLogEntries: 3, shutdownTimeoutMs: 1_000 },
  });
  core.addHook('startup', () => {
    events.push('hook:startup');
  });
  core.addHook('shutdown', () => {
    events.push('hook:shutdown');
  });

  await core.init();
  assert.equal(core.getHealth().status, 'ready');
  assert.equal(core.getHealth().services.DemoModule?.status, 'ready');
  assert.ok(core.getLogs().length <= 3);
  assert.ok(core.getMetrics().logsWritten > 0);

  await core.shutdown();
  assert.deepEqual(events, ['module:init', 'hook:startup', 'hook:shutdown', 'module:destroy']);
  assert.equal(core.getHealth().status, 'stopped');
});

test('core marks a failed module and rejects initialization', async () => {
  class FailingModule {
    async init() {
      throw new Error('module failed');
    }

    async destroy() {}
  }
  const core = new Core({
    modules: [() => new FailingModule()],
    config: { shutdownTimeoutMs: 1_000 },
  });

  await assert.rejects(core.init(), /module failed/);
  assert.equal(core.getHealth().services.FailingModule?.status, 'error');
});

test('core rejects duplicate service names', () => {
  const core = new Core({ modules: [] });
  core.registerService('demo', {});
  assert.throws(() => core.registerService('demo', {}), /already registered/);
  assert.doesNotThrow(() => core.registerService('demo', core.getService('demo')));
});

test('core config validates env and overrides', () => {
  const config = parseCoreConfig({ logLevel: 'debug', maxLogEntries: 10 });
  assert.equal(config.logLevel, 'debug');
  assert.equal(config.maxLogEntries, 10);
  assert.throws(() => parseCoreConfig({ maxLogEntries: 0 }), /positive integer/);
  assert.throws(() => parseCoreConfig({ logLevel: 'verbose' }), /logLevel/);

  const fromEnv = loadCoreConfig({
    env: { VUESP_LOG_LEVEL: 'warn', VUESP_SHUTDOWN_TIMEOUT_MS: '250' },
    overrides: { maxLogEntries: 7 },
  });
  assert.equal(fromEnv.logLevel, 'warn');
  assert.equal(fromEnv.shutdownTimeoutMs, 250);
  assert.equal(fromEnv.maxLogEntries, 7);
});
