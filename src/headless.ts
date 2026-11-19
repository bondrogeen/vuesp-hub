import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';

import { createHub } from '@server/app/host.ts';
import { migrateLegacyAlisaData, migrateLegacyCameraData } from '@server/app/legacy.ts';
import { createAuthService } from '@server/modules/auth/application/authService.ts';
import { createJsonAccessRepository } from '@server/modules/access/infrastructure/jsonAccessRepository.ts';
import { createDeviceRepository } from '@server/modules/devices/infrastructure/deviceRepository.ts';
import { createJsonSettingsStore, createJsonStoreModel } from '@server/shared/stores/jsonStore.ts';
import type { IDeviceRepository } from '@server/modules/devices/infrastructure/deviceRepository.ts';
import { createAesSecretProvider } from '@server/shared/secrets/aesSecretProvider.ts';
import { defaultDataDirectory } from './paths.ts';
import { runUpdateCommand } from './updateCli.ts';

const usage = `Usage: vuesp-hub [options]
       vuesp-hub update <status|check|apply|rollback> [options]

Options:
  --host <address>       HTTP/Socket.IO bind address (default: 127.0.0.1, env: VUESP_HOST)
  --port <port>          HTTP/Socket.IO port (default: 3005, env: VUESP_PORT)
  --data-dir <path>      Database and settings directory (default: XDG data dir, env: VUESP_DATA_DIR)
  --static-dir <path>    Built web UI directory (default: bundled web/)
  --script-runner <path> Script runner process bundle (env: VUESP_SCRIPT_RUNNER)
  --secret-key <key>     Master key for device credentials (or VUESP_SECRET_KEY)
  -h, --help             Show this help
`;

export const main = async () => {
  if (process.argv[2] === 'update') {
    await runUpdateCommand(process.argv.slice(3));
    return;
  }

  const { values } = parseArgs({
    options: {
      host: { type: 'string' },
      port: { type: 'string' },
      'data-dir': { type: 'string' },
      'static-dir': { type: 'string' },
      'script-runner': { type: 'string' },
      'secret-key': { type: 'string' },
      help: { type: 'boolean', short: 'h' },
    },
    strict: true,
    allowPositionals: false,
  });

  if (values.help) {
    process.stdout.write(usage);
    return;
  }

  const host = values.host ?? process.env.VUESP_HOST ?? '127.0.0.1';
  const port = Number(values.port ?? process.env.VUESP_PORT ?? 3005);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new TypeError(`Invalid port: ${values.port}`);
  }
  if (!['127.0.0.1', '::1', 'localhost'].includes(host)) {
    console.warn('[WARN] HTTP API is exposed beyond loopback and has no authentication yet.');
  }

  const dataDirectory = path.resolve(values['data-dir'] ?? defaultDataDirectory());
  mkdirSync(dataDirectory, { recursive: true, mode: 0o700 });
  migrateLegacyCameraData(dataDirectory);

  const secretKey = values['secret-key'] ?? process.env.VUESP_SECRET_KEY;
  const secretProvider = createAesSecretProvider({
    passphrase: secretKey,
    saltPath: path.join(dataDirectory, 'secret.salt'),
  });
  migrateLegacyAlisaData(dataDirectory, secretProvider);

  let repositoryPromise: Promise<IDeviceRepository> | undefined;
  const getDeviceModel = () => {
    repositoryPromise ??= createDeviceRepository({
      databasePath: path.join(dataDirectory, 'vuesp.sqlite'),
      secretProvider,
    });
    return repositoryPromise;
  };
  const closeDeviceModel = async () => {
    const repository = await repositoryPromise;
    repository?.close();
    repositoryPromise = undefined;
  };

  const bundledWeb = path.join(__dirname, 'web');
  const explicitWeb = values['static-dir'];
  const webDirectory = explicitWeb ? path.resolve(explicitWeb) : existsSync(bundledWeb) ? bundledWeb : undefined;

  const scriptRunnerPath = path.resolve(values['script-runner'] ?? process.env.VUESP_SCRIPT_RUNNER ?? path.join(__dirname, 'script-runner.cjs'));

  const cloudUrl = process.env.VUESP_CLOUD_URL?.trim();
  const cloudToken = process.env.VUESP_CLOUD_TOKEN?.trim();

  const hub = createHub({
    staticDirectory: webDirectory,
    getDeviceModel,
    closeDeviceModel,
    storeModel: createJsonStoreModel(path.join(dataDirectory, 'store.json')),
    serialSettingsStore: createJsonSettingsStore(path.join(dataDirectory, 'settings.json')),
    scriptRunnerPath,
    auth: createAuthService({ dataDirectory }),
    access: createJsonAccessRepository({ dataDirectory }),
    dataDirectory,
    secretProvider,
    host,
    port,
    telemetry: cloudUrl && cloudToken
      ? { url: cloudUrl, token: cloudToken, hubName: process.env.VUESP_CLOUD_HUB_NAME?.trim() || undefined, dataDirectory }
      : undefined,
    moduleRunnerPath: path.join(__dirname, 'module-runner.cjs'),
    modulesDirectory: path.join(dataDirectory, 'modules'),
    modulesCatalogUrl: process.env.VUESP_MODULES_CATALOG?.trim() || 'https://modules.vuesp.ru/catalog.json',
  });

  await hub.start();

  console.log('Vuesp hub');
  console.log(`  URL:      http://${host}:${port}`);
  console.log(`  Data:     ${dataDirectory}`);
  console.log(`  Web UI:   ${webDirectory ?? 'API only (pass --static-dir)'}`);
  console.log(`  Secrets:  ${secretKey ? 'enabled (VUESP_SECRET_KEY)' : 'disabled (set VUESP_SECRET_KEY to save device credentials)'}`);
  console.log(`  Cloud:    ${cloudUrl && cloudToken ? `bootstrap ${cloudUrl}` : 'pairing UI ready (no bootstrap credentials)'}`);

  let stopping = false;
  const shutdown = async (signal: string) => {
    if (stopping) {
      process.exit(1);
    }
    stopping = true;
    console.log(`Received ${signal}, shutting down...`);
    try {
      await hub.stop();
      process.exit(0);
    } catch (error) {
      console.error('Shutdown failed:', error);
      process.exit(1);
    }
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
};
