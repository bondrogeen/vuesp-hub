import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';

import { build } from 'esbuild';
import { build as viteBuild } from 'vite';

const rootPackage = JSON.parse(await readFile('package.json', 'utf8'));

const common = {
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node22',
  packages: 'external',
  tsconfig: 'tsconfig.json',
  sourcemap: true,
  logLevel: 'info',
};

await rm('dist', { recursive: true, force: true });

await build({
  ...common,
  entryPoints: ['src/headless.ts'],
  outfile: 'dist/index.cjs',
});

await build({
  ...common,
  entryPoints: ['core/modules/script/worker-script.ts'],
  outfile: 'dist/worker-script.cjs',
});

await viteBuild({ configFile: 'vite.web.config.mjs', logLevel: 'info' });

await mkdir('dist/bin', { recursive: true });
await writeFile(
  'dist/bin/vuesp-hub.js',
  `#!/usr/bin/env node
const { main } = require('../index.cjs');

main().catch(error => {
  console.error('Vuesp hub failed to start:', error);
  process.exit(1);
});
`,
  { mode: 0o755 },
);

const hubPackage = {
  name: 'vuesp-hub',
  version: rootPackage.version,
  description: 'Local-first Vuesp hub server with web UI and device integrations',
  license: rootPackage.license,
  author: rootPackage.author,
  repository: {
    type: 'git',
    url: 'https://github.com/bondrogeen/vuesp-hub.git',
  },
  main: 'index.cjs',
  bin: {
    'vuesp-hub': 'bin/vuesp-hub.js',
  },
  engines: {
    node: '>=22.13.0',
  },
  files: ['index.cjs', 'index.cjs.map', 'worker-script.cjs', 'worker-script.cjs.map', 'web', 'bin'],
  dependencies: {
    '@mhoc/axios-digest-auth': rootPackage.dependencies['@mhoc/axios-digest-auth'],
    'c-struct-to-json': rootPackage.dependencies['c-struct-to-json'],
    express: rootPackage.dependencies.express,
    'ffmpeg-static': rootPackage.dependencies['ffmpeg-static'],
    serialport: rootPackage.dependencies.serialport,
    'socket.io': rootPackage.dependencies['socket.io'],
    'vuesp-struct': rootPackage.dependencies['vuesp-struct'],
    ws: rootPackage.dependencies.ws,
  },
};

await writeFile('dist/package.json', `${JSON.stringify(hubPackage, null, 2)}\n`);
await writeFile(
  'dist/README.md',
  `# vuesp-hub

Local-first Vuesp hub: HTTP API, Socket.IO, device runtime and the browser UI.

## Install

\`\`\`bash
npm install -g vuesp-hub
\`\`\`

## Run

\`\`\`bash
VUESP_SECRET_KEY="long random passphrase" vuesp-hub --port 3005
\`\`\`

Open http://127.0.0.1:3005 in a browser.

The master key encrypts device credentials on disk (AES-256-GCM) and is never
written by the hub. Without it the server still starts, but saving or reading
device credentials is refused with an explicit error.

## Options

- \`--host <address>\` — bind address, default \`127.0.0.1\`
- \`--port <port>\` — HTTP/Socket.IO port, default \`3005\`
- \`--data-dir <path>\` — database and settings directory
- \`--static-dir <path>\` — override the bundled web UI directory
- \`--worker-script <path>\` — override the script runner worker
- \`--secret-key <key>\` — master key (alternative to \`VUESP_SECRET_KEY\`)

Data defaults to \`$XDG_DATA_HOME/vuesp-hub\` (\`~/.local/share/vuesp-hub\` on Linux).
The HTTP API is loopback-only by default; exposing it to LAN is not authenticated
yet, so keep the default unless you understand the risk.
`,
);
