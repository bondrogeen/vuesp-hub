import { createHash, verify as verifySignature } from 'node:crypto';
import { readFile } from 'node:fs/promises';

export interface IModuleTrustPolicy {
  /** Ed25519 public keys in PEM or base64 SPKI DER form. */
  publicKeys: string[];
  /** Allowed archive SHA-256 digests (lowercase hex). */
  allowlist: Set<string>;
  /** Refuse archives without a signature even if no keys are configured. */
  requireSignature: boolean;
}

export interface IModuleTrustInput {
  file: string;
  sha256: string;
  signature?: string;
  policy: IModuleTrustPolicy;
}

const toKey = (value: string): string =>
  value.includes('BEGIN PUBLIC KEY') ? value : Buffer.from(value, 'base64').toString('utf8');

/** Reads trust settings from `VUESP_MODULE_PUBLIC_KEYS` and `VUESP_MODULE_ALLOWLIST`. */
export const loadModuleTrustPolicy = (env: NodeJS.ProcessEnv = process.env): IModuleTrustPolicy => ({
  publicKeys: (env.VUESP_MODULE_PUBLIC_KEYS ?? '').split(',').map(value => value.trim()).filter(Boolean),
  allowlist: new Set(
    (env.VUESP_MODULE_ALLOWLIST ?? '')
      .split(',')
      .map(value => value.trim().toLowerCase())
      .filter(value => /^[a-f0-9]{64}$/.test(value)),
  ),
  requireSignature: env.VUESP_MODULE_REQUIRE_SIGNATURE === '1',
});

export const isTrustPolicyActive = (policy: IModuleTrustPolicy): boolean =>
  policy.requireSignature || policy.publicKeys.length > 0 || policy.allowlist.size > 0;

export const verifyModuleSignature = ({ sha256, signature, publicKeys }: { sha256: string; signature: string; publicKeys: string[] }): boolean => {
  if (!/^[a-f0-9]{64}$/i.test(sha256) || !signature) return false;
  for (const key of publicKeys) {
    try {
      if (verifySignature(null, Buffer.from(sha256.toLowerCase(), 'utf8'), toKey(key), Buffer.from(signature, 'base64'))) return true;
    } catch {
      // A malformed key must not unlock the module.
    }
  }
  return false;
};

export const moduleArchiveSha256 = async (file: string): Promise<string> =>
  createHash('sha256').update(await readFile(file)).digest('hex');

/**
 * Enforces the trust policy for an archive. Directory installs are a local
 * development path and are not signed; archives are the distribution format.
 */
export const assertModuleArchiveTrusted = async ({ file, sha256, signature, policy }: IModuleTrustInput): Promise<void> => {
  if (!isTrustPolicyActive(policy)) return;

  if (policy.allowlist.size > 0 && !policy.allowlist.has(sha256.toLowerCase())) {
    throw new Error('Module archive is not in the allowlist');
  }

  const required = policy.requireSignature || policy.publicKeys.length > 0;
  if (!required) return;

  const detached = signature ?? await readFile(`${file}.sig`, 'utf8').catch(() => undefined);
  if (!detached) throw new Error('Module archive is unsigned and signature is required');
  if (!verifyModuleSignature({ sha256, signature: detached.trim(), publicKeys: policy.publicKeys })) {
    throw new Error('Module archive signature is invalid');
  }
};
