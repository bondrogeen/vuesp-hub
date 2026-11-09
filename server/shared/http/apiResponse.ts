import type { Response } from 'express';
import type { ApiErrorResponse } from '@root/shared/api.ts';

export const sendApiError = (
  response: Response<ApiErrorResponse>,
  status: number,
  message: string,
) => response.status(status).json({ error: message });

export const sendApiFailure = (
  response: Response<ApiErrorResponse>,
  error: unknown,
  operation: string,
  { conflictMessage = 'Conflict' }: { conflictMessage?: string } = {},
) => {
  if (error instanceof TypeError) {
    return sendApiError(response, 400, error.message);
  }
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'SQLITE_CONSTRAINT_UNIQUE'
  ) {
    return sendApiError(response, 409, conflictMessage);
  }
  console.error(`${operation} failed:`, error);
  return sendApiError(response, 500, 'Internal server error');
};
