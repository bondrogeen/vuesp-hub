import assert from 'node:assert/strict';
import { test } from 'node:test';

import { redactCameraText } from '@server/modules/cameras/sockets/stream.ts';

test('redacts camera credentials from FFmpeg stderr', () => {
  const value = 'rtsp://admin:secret@192.0.2.10:554/stream: connection refused';
  const redacted = redactCameraText(value);

  assert.equal(redacted.includes('secret'), false);
  assert.equal(redacted.includes('admin'), false);
  assert.match(redacted, /rtsp:\/\/\*\*\*/);
});
