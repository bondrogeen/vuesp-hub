import { renameSync } from 'node:fs';

/**
 * SQLite reports a truncated or overwritten file with messages like
 * "file is not a database" or "database disk image is malformed". The hub
 * must start anyway, so the damaged file is moved aside and recreated.
 */
export const isSqliteCorruption = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error);
  return /not a database|malformed|corrupt|disk image/i.test(message);
};

/** Moves a damaged SQLite database and its WAL/SHM sidecars out of the way. */
export const quarantineSqlite = (file: string, now = Date.now()): string[] => {
  const suffix = `.corrupt-${new Date(now).toISOString().replace(/[:.]/g, '-')}`;
  const moved: string[] = [];
  for (const candidate of [file, `${file}-wal`, `${file}-shm`]) {
    try {
      renameSync(candidate, `${candidate}${suffix}`);
      moved.push(candidate);
    } catch {
      // The sidecar or the file itself may not exist.
    }
  }
  return moved;
};

/**
 * Opens a store and retries once after quarantining a corrupted database.
 * Any other error (permissions, unsupported schema) is re-thrown as-is.
 */
export const openWithRecovery = <T>(
  file: string,
  open: () => T,
  onQuarantine?: (moved: string[], error: unknown) => void,
): T => {
  try {
    return open();
  } catch (error) {
    if (!isSqliteCorruption(error)) throw error;
    const moved = quarantineSqlite(file);
    if (!moved.length) throw error;
    onQuarantine?.(moved, error);
    return open();
  }
};
