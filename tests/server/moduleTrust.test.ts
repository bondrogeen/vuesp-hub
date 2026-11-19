import assert from 'node:assert/strict';
import { createHash, generateKeyPairSync, sign } from 'node:crypto';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { c as createTar } from 'tar';

import { createModuleHost } from '@server/module-host/moduleHost.ts';
import {
  assertModuleArchiveTrusted,
  isTrustPolicyActive,
  loadModuleTrustPolicy,
  verifyModuleSignature,
} from '@server/modules/modules/application/moduleTrust.ts';

const makeArchive = async (root: string) => {
  const source = path.join(root, 'hello');
  await cp(path.resolve('modules-dev/hello'), source, { recursive: true });
  const archive = path.join(root, 'hello.vmod');
  await createTar({ file: archive, gzip: true, cwd: source }, ['.']);
  const sha256 = createHash('sha256').update(await readFile(archive)).digest('hex');
  return { archive, sha256 };
};

test('trust policy is parsed from the environment', () => {
  const policy = loadModuleTrustPolicy({
    VUESP_MODULE_PUBLIC_KEYS: ' key-a ,,key-b ',
    VUESP_MODULE_ALLOWLIST: `${'a'.repeat(64)}, not-a-hash`,
    VUESP_MODULE_REQUIRE_SIGNATURE: '1',
  });
  assert.deepEqual(policy.publicKeys, ['key-a', 'key-b']);
  assert.deepEqual([...policy.allowlist], ['a'.repeat(64)]);
  assert.equal(policy.requireSignature, true);
  assert.equal(isTrustPolicyActive(policy), true);
  assert.equal(isTrustPolicyActive(loadModuleTrustPolicy({})), false);
});

test('unsigned archives are rejected when signatures are required', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'vuesp-module-trust-'));
  try {
    const { archive, sha256 } = await makeArchive(root);
    const { publicKey } = generateKeyPairSync('ed25519');

    await assert.rejects(
      assertModuleArchiveTrusted({
        file: archive,
        sha256,
        policy: { publicKeys: [publicKey.export({ type: 'spki', format: 'pem' }).toString()], allowlist: new Set(), requireSignature: true },
      }),
      /signature is required/,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('a signed archive passes and a tampered one fails', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'vuesp-module-signed-'));
  try {
    const { archive, sha256 } = await makeArchive(root);
    const { publicKey, privateKey } = generateKeyPairSync('ed25519');
    const pem = publicKey.export({ type: 'spki', format: 'pem' }).toString();
    const signature = sign(null, Buffer.from(sha256, 'utf8'), privateKey).toString('base64');

    assert.equal(verifyModuleSignature({ sha256, signature, publicKeys: [pem] }), true);
    assert.equal(verifyModuleSignature({ sha256: 'f'.repeat(64), signature, publicKeys: [pem] }), false);

    const policy = { publicKeys: [pem], allowlist: new Set([sha256]), requireSignature: true };
    await assertModuleArchiveTrusted({ file: archive, sha256, signature, policy });
    await assert.rejects(
      assertModuleArchiveTrusted({ file: archive, sha256, signature, policy: { ...policy, allowlist: new Set(['f'.repeat(64)]) } }),
      /not in the allowlist/,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('module host refuses an unsigned archive and accepts a signed one', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'vuesp-module-host-trust-'));
  const modulesDirectory = path.join(root, 'modules');
  const dataDirectory = path.join(root, 'data');
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  const pem = publicKey.export({ type: 'spki', format: 'pem' }).toString();
  const host = createModuleHost({
    modulesDirectory,
    dataDirectory,
    runnerPath: path.resolve('server/module-host/module-runner.cjs'),
    trust: { publicKeys: [pem], allowlist: new Set(), requireSignature: true },
  });

  try {
    const { archive, sha256 } = await makeArchive(root);
    await assert.rejects(host.install(archive), /signature is required/);

    const signature = sign(null, Buffer.from(sha256, 'utf8'), privateKey).toString('base64');
    await writeFile(`${archive}.sig`, `${signature}\n`);
    const manifest = await host.install(archive);
    assert.equal(manifest.id, 'vuesp-hub.hello');
  } finally {
    await host.stopAll();
    await rm(root, { recursive: true, force: true });
  }
});
