import express from 'express';

import type { UpdateManager } from '@server/modules/update/application/updateManager.ts';

export interface IUpdateRouterOptions {
  /** Self-update replaces files and exits; a supervisor must restart the hub. */
  selfUpdate: boolean;
  onExit?: (code: number) => void;
}

/**
 * `/api/v1/system/update` — status, check, and (when enabled) apply/rollback.
 *
 * Applying from the running process cannot restart itself safely without a
 * supervisor, so it is opt-in through `VUESP_ALLOW_SELF_UPDATE=1`. The CLI
 * (`vuesp-hub update apply`) is the default path.
 */
const disabled = { enabled: false, current: null, releases: [], state: null, selfUpdate: false };

export const createUpdateRouter = (manager: UpdateManager | undefined, { selfUpdate, onExit = code => process.exit(code) }: IUpdateRouterOptions) => {
  const router = express.Router();

  router.get('/', async (_request, response, next) => {
    try {
      response.json(manager ? { ...(await manager.status()), selfUpdate } : disabled);
    } catch (error) {
      next(error);
    }
  });

  const unavailable = (response: express.Response): void => {
    response.status(503).json({ error: 'Updates are not configured. Set VUESP_RELEASE_ROOT.' });
  };

  router.post('/check', async (_request, response, next) => {
    try {
      if (!manager) {
        unavailable(response);
        return;
      }
      response.json(await manager.check());
    } catch (error) {
      next(error);
    }
  });

  router.post('/apply', async (_request, response, next) => {
    try {
      if (!manager) {
        unavailable(response);
        return;
      }
      if (!selfUpdate) {
        response.status(409).json({
          error: 'Self-update is disabled. Run `vuesp-hub update apply` while the service is stopped.',
          code: 'SELF_UPDATE_DISABLED',
        });
        return;
      }
      const check = await manager.check();
      if (!check.available) {
        response.status(409).json(check);
        return;
      }
      response.status(202).json({ status: 'scheduled', version: check.manifest?.appVersion });
      setTimeout(() => {
        void manager.apply()
          .then(result => {
            console.log(`Self-update finished: ${result.status} ${result.fromVersion} → ${result.toVersion}`);
            onExit(result.ok ? 0 : 1);
          })
          .catch(error => {
            console.error('Self-update failed:', error);
            onExit(1);
          });
      }, 250);
    } catch (error) {
      next(error);
    }
  });

  router.post('/rollback', async (request, response, next) => {
    try {
      if (!manager) {
        unavailable(response);
        return;
      }
      if (!selfUpdate) {
        response.status(409).json({
          error: 'Self-rollback is disabled. Run `vuesp-hub update rollback` while the service is stopped.',
          code: 'SELF_UPDATE_DISABLED',
        });
        return;
      }
      const to = typeof (request.body as { to?: unknown } | undefined)?.to === 'string'
        ? (request.body as { to: string }).to
        : undefined;
      const result = await manager.rollback(to);
      response.json({ ...result, restartRequired: true });
    } catch (error) {
      next(error);
    }
  });

  return router;
};
