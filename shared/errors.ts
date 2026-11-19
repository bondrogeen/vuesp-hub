/** Message from an unknown thrown value, preserving the existing `String()` fallback. */
export const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

/** Message from an unknown thrown value with a stable fallback for non-Errors. */
export const errorMessageOr = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;
