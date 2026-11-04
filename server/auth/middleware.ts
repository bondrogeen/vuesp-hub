import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { Socket } from 'socket.io';

import type { AuthService, AuthUser } from './authService.ts';

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

  if (!auth.verify(token)) {
    next(new Error('Unauthorized'));
    return;
  }
  next();
};
