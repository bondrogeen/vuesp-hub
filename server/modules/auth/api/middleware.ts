import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { Socket } from 'socket.io';

import type { AuthService, AuthUser } from '@server/modules/auth/application/authService.ts';
import type { UserRole } from '@server/modules/users/domain/user.ts';

export interface AuthenticatedRequest extends Request {
  auth?: AuthUser;
}

export const bearerToken = (value: string | undefined): string | undefined => {
  if (!value) return undefined;
  const [scheme, token] = value.split(' ');
  return scheme?.toLowerCase() === 'bearer' && token ? token : undefined;
};

export const requireAuth = (auth: AuthService): RequestHandler => (request: AuthenticatedRequest, response: Response, next: NextFunction) => {
  const user = auth.verify(bearerToken(request.headers.authorization));
  if (!user) {
    response.status(401).json({ error: 'Unauthorized' });
    return;
  }
  request.auth = user;
  next();
};

export const socketAuth = (auth: AuthService) => (socket: Socket, next: (error?: Error) => void) => {
  const token =
    bearerToken(socket.handshake.headers.authorization) ??
    (typeof socket.handshake.auth?.token === 'string' ? socket.handshake.auth.token : undefined);

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

export const requirePasswordChanged: RequestHandler = (request: AuthenticatedRequest, response: Response, next: NextFunction) => {
  if (request.auth?.mustChangePassword) {
    response.status(403).json({ error: 'Password change required', code: 'PASSWORD_CHANGE_REQUIRED' });
    return;
  }
  next();
};

export const requireRole = (...roles: UserRole[]): RequestHandler => (request: AuthenticatedRequest, response: Response, next: NextFunction) => {
  if (!request.auth || !roles.includes(request.auth.role)) {
    response.status(403).json({ error: 'Forbidden' });
    return;
  }
  next();
};
