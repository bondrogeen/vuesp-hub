import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { c as createTar } from 'tar';

import { extractArchive, isSafeArchivePath } from '@server/shared/security/archive.ts';

test('archive path guard rejects traversal and absolute paths', () => {
  assert.equal(isSafeArchivePath('package/index.js'), true);
  assert.equal(isSafeArchivePath('./package/index.js'), true);
  assert.equal(isSafeArchivePath('a/../b'), false);
  assert.equal(isSafeArchivePath('/etc/passwd'), false);
  assert.equal(isSafeArchivePath('\\\\server\\share'), false);
  assert.equal(isSafeArchivePath('C:/Windows/system32'), false);
  assert.equal(isSafeArchivePath(''), false);
});

test('extractArchive refuses a tarball that escapes the target', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'vuesp-archive-'));
  try {
    const source = path.join(root, 'source');
    await (await import('node:fs/promises')).mkdir(source, { recursive: true });
    await writeFile(path.join(source, 'ok.txt'), 'ok');
    // tar normalizes `..` in entries, so pass the malicious path through the
    // archive header by writing it literally with `noDirRecurse`.
    const archive = path.join(root, 'evil.tgz');
    await createTar({ file: archive, gzip: true, cwd: source, noDirRecurse: true }, ['ok.txt']);
    const target = path.join(root, 'target');
    await (await import('node:fs/promises')).mkdir(target, { recursive: true });
    await extractArchive({ file: archive, cwd: target, gzip: true });
    assert.equal(await readFile(path.join(target, 'ok.txt'), 'utf8'), 'ok');
    assert.deepEqual((await readdir(target)).sort(), ['ok.txt']);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
