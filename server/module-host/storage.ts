/** Per-module storage is capped to keep one module from filling the disk. */
export const MODULE_STORAGE_LIMIT_BYTES = 10 * 1024 * 1024;

export const serializeModuleStorage = (value: Record<string, unknown>, limit = MODULE_STORAGE_LIMIT_BYTES): string => {
  const serialized = `${JSON.stringify(value, null, 2)}\n`;
  const bytes = Buffer.byteLength(serialized, 'utf8');
  if (bytes > limit) {
    throw new Error(`Module storage limit exceeded: ${bytes} bytes > ${limit} bytes`);
  }
  return serialized;
};
