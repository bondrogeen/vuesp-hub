import assert from 'node:assert/strict';
import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { AuditLog, redactSecrets } from '@server/modules/audit/application/auditLog.ts';

test('audit log appends entries and redacts secrets', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'vuesp-audit-'));
  try {
    const log = new AuditLog({ directory });
    await log.record({
      actor: 'admin',
      role: 'admin',
      action: 'action.execute',
      target: 'uuid-1/device.power',
      result: 'ok',
      details: { value: 1, password: 'secret', nested: { token: 'abc', entityKey: 'device.power' } },
    });
    await log.record({ actor: 'viewer', action: 'system.backup', result: 'denied' });

    const entries = await log.list();
    assert.equal(entries.length, 2);
    assert.equal(entries[0]?.actor, 'admin');
    assert.deepEqual(entries[0]?.details, { value: 1, password: '[redacted]', nested: { token: '[redacted]', entityKey: 'device.power' } });

    const raw = await readFile(path.join(directory, 'audit.jsonl'), 'utf8');
    assert.ok(!raw.includes('secret'));
    assert.ok(!raw.includes('"abc"'));

    assert.deepEqual(redactSecrets({ authorization: 'Bearer x', ok: 1 }), { authorization: '[redacted]', ok: 1 });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('audit log rotates and prunes old files', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'vuesp-audit-rotate-'));
  try {
    const log = new AuditLog({ directory, maxBytes: 1_024, keep: 2 });
    for (let index = 0; index < 40; index += 1) {
      await log.record({ actor: 'admin', action: 'test', result: 'ok', details: { index, padding: 'x'.repeat(60) } });
    }
    const archived = (await readdir(directory)).filter(name => name.startsWith('audit-'));
    assert.ok(archived.length >= 1);
    assert.ok(archived.length <= 2);
    assert.ok((await log.list(1_000)).length >= 1);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('audit log tolerates a corrupted line and a missing file', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'vuesp-audit-broken-'));
  try {
    const log = new AuditLog({ directory });
    assert.deepEqual(await log.list(), []);
    await writeFile(path.join(directory, 'audit.jsonl'), '{"at":1,"actor":"a","action":"x","result":"ok"}\nnot-json\n', { mode: 0o600 });
    const entries = await log.list();
    assert.equal(entries.length, 1);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
