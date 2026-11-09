import { Router } from 'express';
import { Readable } from 'node:stream';

import type { AuthenticatedRequest } from '@server/modules/auth/api/middleware.ts';
import type { AlisaService } from '@server/modules/alisa/application/alisaService.ts';

const text = (value: unknown): string => (typeof value === 'string' ? value : '');
const userId = (request: AuthenticatedRequest): number => request.auth?.id ?? 0;

export const createAlisaRouter = (alisa: AlisaService) => {
  const router = Router();

  router.get('/state', async (request: AuthenticatedRequest, response) => {
    try {
      response.json(await alisa.state(userId(request)));
    } catch (error) {
      response.status(500).json({ error: error instanceof Error ? error.message : 'Alisa state failed' });
    }
  });

  router.post('/qr/start', async (request: AuthenticatedRequest, response) => {
    try {
      response.json(await alisa.startQr(userId(request)));
    } catch (error) {
      response.status(500).json({ error: error instanceof Error ? error.message : 'QR login failed' });
    }
  });

  router.post('/qr/poll', async (request: AuthenticatedRequest, response) => {
    try {
      const id = text(request.body?.id);
      if (!id) return response.status(400).json({ error: 'QR session id is required' });
      response.json(await alisa.pollQr(userId(request), id));
    } catch (error) {
      response.status(400).json({ error: error instanceof Error ? error.message : 'QR login failed' });
    }
  });

  router.post('/init', async (request: AuthenticatedRequest, response) => {
    try {
      const token = text(request.body?.token);
      if (!token) return response.status(400).json({ error: 'Token is required' });
      response.json(await alisa.init(userId(request), token));
    } catch (error) {
      response.status(400).json({ error: error instanceof Error ? error.message : 'Yandex token was rejected' });
    }
  });

  router.delete('/accounts/:id', async (request: AuthenticatedRequest, response) => {
    try {
      const accountId = typeof request.params.id === 'string' ? request.params.id : request.params.id?.[0];
      if (!accountId) return response.status(400).json({ error: 'Account id is required' });
      response.json(await alisa.forget(userId(request), accountId));
    } catch (error) {
      response.status(500).json({ error: error instanceof Error ? error.message : 'Could not forget the account' });
    }
  });

  router.delete('/token', async (request: AuthenticatedRequest, response) => {
    try {
      response.json(await alisa.forget(userId(request)));
    } catch (error) {
      response.status(500).json({ error: error instanceof Error ? error.message : 'Could not forget the token' });
    }
  });

  router.get('/scan', async (request: AuthenticatedRequest, response) => {
    try {
      response.json(await alisa.scan(userId(request)));
    } catch (error) {
      response.status(500).json({ error: error instanceof Error ? error.message : 'Scan failed' });
    }
  });

  router.post('/connection', async (request: AuthenticatedRequest, response) => {
    try {
      response.json(await alisa.connect(userId(request), text(request.body?.accountId) || undefined));
    } catch (error) {
      response.status(500).json({ error: error instanceof Error ? error.message : 'Connection failed' });
    }
  });

  router.post('/disconnect', async (request: AuthenticatedRequest, response) => {
    try {
      response.json(await alisa.disconnect(userId(request), text(request.body?.accountId) || undefined));
    } catch (error) {
      response.status(500).json({ error: error instanceof Error ? error.message : 'Disconnect failed' });
    }
  });

  router.get('/music/playlists', async (request: AuthenticatedRequest, response) => {
    try {
      const accountId = typeof request.query.accountId === 'string' ? request.query.accountId : undefined;
      response.json(await alisa.musicPlaylists(userId(request), accountId));
    } catch (error) {
      response.status(400).json({ error: error instanceof Error ? error.message : 'Could not load playlists' });
    }
  });

  router.get('/music/collections', async (request: AuthenticatedRequest, response) => {
    try {
      const accountId = typeof request.query.accountId === 'string' ? request.query.accountId : undefined;
      response.json(await alisa.musicCollections(userId(request), accountId));
    } catch (error) {
      response.status(400).json({ error: error instanceof Error ? error.message : 'Could not load collections' });
    }
  });

  router.get('/music/wave', async (request: AuthenticatedRequest, response) => {
    try {
      const accountId = typeof request.query.accountId === 'string' ? request.query.accountId : undefined;
      const queue = typeof request.query.queue === 'string' ? request.query.queue : undefined;
      response.json(await alisa.musicWave(userId(request), accountId, queue));
    } catch (error) {
      response.status(400).json({ error: error instanceof Error ? error.message : 'Could not load the wave' });
    }
  });

  router.post('/music/wave/play', (request: AuthenticatedRequest, response) => {
    try {
      const accountId = text(request.body?.accountId);
      const deviceId = text(request.body?.deviceId);
      if (!accountId || !deviceId) return response.status(400).json({ error: 'accountId and deviceId are required' });
      alisa.playWave(userId(request), accountId, deviceId);
      response.json({ ok: true });
    } catch (error) {
      response.status(400).json({ error: error instanceof Error ? error.message : 'Could not start the wave' });
    }
  });

  router.post('/music/wave/feedback', async (request: AuthenticatedRequest, response) => {
    try {
      const accountId = text(request.body?.accountId);
      const type = text(request.body?.type);
      if (!accountId || !type) return response.status(400).json({ error: 'accountId and type are required' });
      const batchId = text(request.body?.batchId) || undefined;
      const trackId = text(request.body?.trackId) || undefined;
      const totalPlayedSeconds = typeof request.body?.totalPlayedSeconds === 'number' ? request.body.totalPlayedSeconds : undefined;
      await alisa.musicWaveFeedback(userId(request), accountId, type, batchId, trackId, totalPlayedSeconds);
      response.json({ ok: true });
    } catch (error) {
      response.status(400).json({ error: error instanceof Error ? error.message : 'Could not send wave feedback' });
    }
  });

  router.post('/music/like', async (request: AuthenticatedRequest, response) => {
    try {
      const accountId = text(request.body?.accountId);
      const trackId = text(request.body?.trackId);
      const liked = request.body?.liked === true;
      if (!accountId || !trackId) return response.status(400).json({ error: 'accountId and trackId are required' });
      await alisa.likeTrack(userId(request), accountId, trackId, liked);
      response.json({ ok: true });
    } catch (error) {
      response.status(400).json({ error: error instanceof Error ? error.message : 'Could not update the like' });
    }
  });

  router.get('/music/playlists/:id/tracks', async (request: AuthenticatedRequest, response) => {
    try {
      const playlistId = typeof request.params.id === 'string' ? request.params.id : request.params.id?.[0];
      if (!playlistId) return response.status(400).json({ error: 'Playlist id is required' });
      const accountId = typeof request.query.accountId === 'string' ? request.query.accountId : undefined;
      response.json(await alisa.musicTracks(userId(request), accountId, playlistId));
    } catch (error) {
      response.status(400).json({ error: error instanceof Error ? error.message : 'Could not load tracks' });
    }
  });

  router.post('/music/stream-token', async (request: AuthenticatedRequest, response) => {
    try {
      const accountId = text(request.body?.accountId);
      const trackId = text(request.body?.trackId);
      if (!accountId || !trackId) return response.status(400).json({ error: 'accountId and trackId are required' });
      response.json(await alisa.createStreamToken(userId(request), accountId, trackId));
    } catch (error) {
      response.status(400).json({ error: error instanceof Error ? error.message : 'Could not create a stream link' });
    }
  });

  router.post('/music/track', (request: AuthenticatedRequest, response) => {
    try {
      const accountId = text(request.body?.accountId);
      const deviceId = text(request.body?.deviceId);
      const trackId = text(request.body?.trackId);
      if (!accountId || !deviceId || !trackId) {
        return response.status(400).json({ error: 'accountId, deviceId and trackId are required' });
      }
      alisa.playTrack(userId(request), accountId, deviceId, trackId);
      response.json({ ok: true });
    } catch (error) {
      response.status(400).json({ error: error instanceof Error ? error.message : 'Could not play the track' });
    }
  });

  router.post('/music/play', (request: AuthenticatedRequest, response) => {
    try {
      const accountId = text(request.body?.accountId);
      const deviceId = text(request.body?.deviceId);
      const playlistId = text(request.body?.playlistId);
      if (!accountId || !deviceId || !playlistId) {
        return response.status(400).json({ error: 'accountId, deviceId and playlistId are required' });
      }
      alisa.playPlaylist(userId(request), accountId, deviceId, playlistId);
      response.json({ ok: true });
    } catch (error) {
      response.status(400).json({ error: error instanceof Error ? error.message : 'Could not play the playlist' });
    }
  });

  router.post('/send', (request: AuthenticatedRequest, response) => {
    try {
      const id = text(request.body?.id);
      const payload = request.body?.payload;
      if (!id || !payload) return response.status(400).json({ error: 'id and payload are required' });
      alisa.send(userId(request), id, payload);
      response.json({ ok: true });
    } catch (error) {
      response.status(400).json({ error: error instanceof Error ? error.message : 'Send failed' });
    }
  });

  return router;
};

/**
 * Public audio proxy for the in-page player. The opaque key is issued by the
 * authenticated `/music/stream-token` endpoint and expires after five minutes.
 */
export const createAlisaStreamRouter = (alisa: AlisaService) => {
  const router = Router();

  router.get('/:key', async (request, response) => {
    try {
      const key = typeof request.params.key === 'string' ? request.params.key : request.params.key?.[0];
      if (!key) return response.status(400).end();
      const result = await alisa.streamTrack(key, request.headers.range);
      response.status(result.status);
      for (const [name, value] of Object.entries(result.headers)) response.setHeader(name, value);
      if (!result.body) return response.end();
      Readable.fromWeb(result.body as Parameters<typeof Readable.fromWeb>[0]).pipe(response);
    } catch (error) {
      response.status(404).json({ error: error instanceof Error ? error.message : 'Stream unavailable' });
    }
  });

  return router;
};
