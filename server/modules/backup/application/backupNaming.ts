import { fileTimestamp } from '@server/shared/time.ts';

/** `backup-2026-11-19T20-15-00-000Z.tgz[.enc]` */
export const backupFileName = (prefix: string, encrypted = false, date: Date = new Date()): string =>
  `${prefix}-${fileTimestamp(date)}.tgz${encrypted ? '.enc' : ''}`;
