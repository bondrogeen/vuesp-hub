import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { Socket } from 'socket.io';

import type { IAuthService, IAuthUser } from '@server/modules/auth/application/authService.ts';
import type { TUserRole } from '@server/modules/users/domain/user.ts';
import { readCookie, sessionTokenFromRequest, SESSION_COOKIE } from '@server/shared/security/sessionCookie.ts';

export interface IAuthenticatedRequest extends Request {
  auth?: IAuthUser;
}

export const bearerToken = (value: string | undefined): string | undefined => {
  if (!value) return undefined;
  const [scheme, token] = value.split(' ');
  return scheme?.toLowerCase() === 'bearer' && token ? token : undefined;
};

export const requestToken = (request: Pick<Request, 'headers'>): string | undefined =>
  bearerToken(request.headers.authorization) ?? sessionTokenFromRequest(request);

export const requireAuth = (auth: IAuthService): RequestHandler => (request: IAuthenticatedRequest, response: Response, next: NextFunction) => {
  const user = auth.verify(requestToken(request));
  if (!user) {
    response.status(401).json({ error: 'Unauthorized' });
    return;
  }
  request.auth = user;
  next();
};

export const socketAuth = (auth: IAuthService) => (socket: Socket, next: (error?: Error) => void) => {
  const token =
    bearerToken(socket.handshake.headers.authorization) ??
    (typeof socket.handshake.auth?.token === 'string' ? socket.handshake.auth.token : undefined) ??
    readCookie(socket.handshake.headers.cookie, SESSION_COOKIE);

  const user = auth.verify(token);
  if (!user) {
    next(new Error('Unauthorized'));
    return;
  }
  if (user.mustChangePassword) {
    next(new Error('Password change required'));
    return;
  }
  next();
};

export const requirePasswordChanged: RequestHandler = (request: IAuthenticatedRequest, response: Response, next: NextFunction) => {
  if (request.auth?.mustChangePassword) {
    response.status(403).json({ error: 'Password change required', code: 'PASSWORD_CHANGE_REQUIRED' });
    return;
  }
  next();
};

export const requireRole = (...roles: TUserRole[]): RequestHandler => (request: IAuthenticatedRequest, response: Response, next: NextFunction) => {
  if (!request.auth || !roles.includes(request.auth.role)) {
    response.status(403).json({ error: 'Forbidden' });
    return;
  }
  next();
};

/**
 * Cookie sessions are sent automatically, so state-changing requests must come
 * from the hub's own origin. Bearer clients without `Origin` keep working.
 */
export const requireSameOrigin: RequestHandler = (request, response, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    next();
    return;
  }
  const origin = request.headers.origin;
  if (!origin) {
    next();
    return;
  }
  let host: string | undefined;
  try {
    host = new URL(origin).host;
  } catch {
    response.status(403).json({ error: 'Invalid origin' });
    return;
  }
  if (host !== request.headers.host) {
    response.status(403).json({ error: 'Cross-origin request rejected' });
    return;
  }
  next();
};
