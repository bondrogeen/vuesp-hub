import { existsSync, readFileSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';

import { BackupService } from '@server/modules/backup/application/backupService.ts';
import { UpdateManager } from '@server/modules/update/application/updateManager.ts';
import { defaultDataDirectory } from './paths.ts';

const usage = `Usage: vuesp-hub update <status|check|apply|rollback> [options]

Options:
  --release-root <path>  Release layout directory (env: VUESP_RELEASE_ROOT)
  --data-dir <path>      Hub data directory (env: VUESP_DATA_DIR)
  --manifest <url|path>  Signed release manifest (env: VUESP_UPDATE_MANIFEST_URL)
  --public-key <pem|path> Ed25519 public key (env: VUESP_UPDATE_PUBLIC_KEY)
  --artifact <path>      Local release archive; otherwise manifest.url is downloaded
  --to <version>         Target version for rollback
  --no-backup            Skip the pre-update backup (not recommended)
  -h, --help             Show this help
`;

const readVersion = (): string => {
  for (const candidate of [path.join(__dirname, 'package.json'), path.join(__dirname, '..', 'package.json')]) {
    if (!existsSync(candidate)) continue;
    try {
      const version = (JSON.parse(readFileSync(candidate, 'utf8')) as { version?: unknown }).version;
      if (typeof version === 'string') return version;
    } catch {
      // Fall through to the default.
    }
  }
  return '0.0.0';
};

const print = (value: unknown): void => {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
};

export const runUpdateCommand = async (argv: string[]): Promise<void> => {
  const command = argv[0];
  if (!command || command === '-h' || command === '--help') {
    process.stdout.write(usage);
    return;
  }
  if (!['status', 'check', 'apply', 'rollback'].includes(command)) {
    throw new TypeError(`Unknown update command: ${command}`);
  }

  const { values } = parseArgs({
    args: argv.slice(1),
    options: {
      'release-root': { type: 'string' },
      'data-dir': { type: 'string' },
      manifest: { type: 'string' },
      'public-key': { type: 'string' },
      artifact: { type: 'string' },
      to: { type: 'string' },
      'no-backup': { type: 'boolean' },
      help: { type: 'boolean', short: 'h' },
    },
    strict: true,
    allowPositionals: false,
  });

  if (values.help) {
    process.stdout.write(usage);
    return;
  }

  const releaseRoot = path.resolve(values['release-root'] ?? process.env.VUESP_RELEASE_ROOT ?? '/opt/vuesp-hub');
  const dataDirectory = path.resolve(values['data-dir'] ?? defaultDataDirectory());
  const publicKey = values['public-key'] ?? process.env.VUESP_UPDATE_PUBLIC_KEY;
  const manifestSource = values.manifest ?? process.env.VUESP_UPDATE_MANIFEST_URL;
  const currentDataSchema = Number(process.env.VUESP_DATA_SCHEMA ?? 1);

  const backup = async (version: string): Promise<void> => {
    if (values['no-backup']) return;
    const directory = path.join(dataDirectory, 'backups');
    await mkdir(directory, { recursive: true, mode: 0o700 });
    const file = path.join(directory, `pre-update-${version}-${new Date().toISOString().replace(/[:.]/g, '-')}.tgz`);
    const service = new BackupService({ dataDirectory, appVersion: readVersion() });
    await service.create(file);
    process.stderr.write(`Backup: ${file}\n`);
  };

  const manager = new UpdateManager({
    releaseRoot,
    statePath: path.join(dataDirectory, 'update-state.json'),
    ...(publicKey ? { publicKey } : {}),
    ...(manifestSource ? { manifestSource } : {}),
    currentVersion: readVersion(),
    currentDataSchema,
    hooks: {
      backup: () => backup(manifestSource ?? 'unknown'),
    },
  });

  if (command === 'status') {
    print({ releaseRoot, dataDirectory, ...(await manager.status()) });
    return;
  }

  if (command === 'check') {
    print(await manager.check(values.artifact));
    return;
  }

  if (command === 'apply') {
    const check = await manager.check(values.artifact);
    if (!check.available) {
      print(check);
      process.exitCode = 1;
      return;
    }
    const result = await manager.apply(values.artifact);
    print(result);
    process.exitCode = result.ok ? 0 : 1;
    return;
  }

  print(await manager.rollback(values.to));
};
