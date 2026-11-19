import { x as extractTar } from 'tar';

/**
 * Rejects archive entries that could escape the extraction directory.
 *
 * `tar` already strips a leading `/`, but explicit `..` segments and Windows
 * drive prefixes must never be written outside the staging directory.
 */
export const isSafeArchivePath = (entry: string): boolean => {
  if (!entry || entry.startsWith('/') || entry.startsWith('\\')) return false;
  if (/^[a-zA-Z]:/.test(entry)) return false;
  const normalized = entry.replaceAll('\\', '/');
  return !normalized.split('/').some(segment => segment === '..');
};

export interface IExtractArchiveOptions {
  file: string;
  cwd: string;
  gzip?: boolean;
}

/** Extracts an archive and fails the whole operation on a path traversal. */
export const extractArchive = async ({ file, cwd, gzip }: IExtractArchiveOptions): Promise<void> => {
  const unsafe: string[] = [];
  await extractTar({
    file,
    cwd,
    ...(gzip === undefined ? {} : { gzip }),
    filter: entry => {
      if (isSafeArchivePath(entry)) return true;
      unsafe.push(entry);
      return false;
    },
  });
  if (unsafe.length) throw new Error(`Archive contains unsafe paths: ${unsafe.slice(0, 3).join(', ')}`);
};
