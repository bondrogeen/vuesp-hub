import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { createAuthService } from '@server/modules/auth/application/authService.ts';

test('module tokens are scoped to one module and never accepted as a session', () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'vuesp-module-token-'));

  try {
    const auth = createAuthService({ dataDirectory: directory });
    const session = auth.login('admin', 'admin');
    assert.ok(session);

    const changed = auth.changePassword(session.user.id, 'admin', 'admin123');
    assert.ok(changed);
    assert.equal(changed.user.mustChangePassword, false);

    const token = auth.issueModuleToken(changed.user, 'vuesp-hub.video.cameras');
    assert.deepEqual(auth.verifyModuleToken(token, 'vuesp-hub.video.cameras'), changed.user);
    assert.equal(auth.verifyModuleToken(token, 'vuesp-hub.video.other'), null);
    assert.equal(auth.verify(token), null, 'module token must not be a hub session');
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
