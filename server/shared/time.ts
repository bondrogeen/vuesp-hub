/** Filesystem-safe timestamp: `2026-11-19T20-15-00-000Z`. */
export const fileTimestamp = (date: Date = new Date()): string =>
  date.toISOString().replace(/[:.]/g, '-');
