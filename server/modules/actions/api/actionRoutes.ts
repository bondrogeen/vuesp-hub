import express from 'express';

import type { ActionService } from '@core/application/actionService.ts';
import type { AuditLog } from '@server/modules/audit/application/auditLog.ts';

export const createActionsRouter = (actions: ActionService, audit?: AuditLog) => {
  const router = express.Router();

  router.post('/', async (request, response, next) => {
    try {
      const auth = (request as express.Request & { auth?: { role?: string; username?: string } }).auth;
      const role = auth?.role;
      if (role === 'viewer') {
        response.status(403).json({ error: 'Viewer cannot execute commands' });
        return;
      }

      const body = request.body as Record<string, unknown>;
      if (
        typeof body.deviceId !== 'string'
        || typeof body.entityKey !== 'string'
        || !('value' in body)
      ) {
        response.status(400).json({ error: 'deviceId, entityKey and value are required' });
        return;
      }

      const result = await actions.execute({
        requestId: typeof body.requestId === 'string' ? body.requestId : undefined,
        deviceId: body.deviceId,
        entityKey: body.entityKey,
        action: 'set',
        value: body.value,
        source: 'ui',
        ...(typeof body.timeoutMs === 'number' ? { timeoutMs: body.timeoutMs } : {}),
      });
      void audit?.record({
        actor: auth?.username ?? 'unknown',
        ...(role ? { role } : {}),
        action: 'action.execute',
        target: `${body.deviceId}/${body.entityKey}`,
        result: result.status === 'failed' ? 'failed' : 'ok',
        details: { value: body.value, requestId: result.requestId, status: result.status },
      }).catch(() => undefined);
      response.status(result.pending ? 202 : result.status === 'failed' ? 400 : 200).json(result);
    } catch (error) {
      next(error);
    }
  });

  router.get('/:requestId', (request, response) => {
    const result = actions.getResult(request.params.requestId);
    if (!result) {
      response.status(404).json({ error: 'Action not found' });
      return;
    }
    response.json(result);
  });

  return router;
};
