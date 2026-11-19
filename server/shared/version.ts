/** Runtime version shown by the hub and written into backups. */
export const APP_VERSION = process.env.VUESP_VERSION?.trim() || '1.0.1';

/** Data schema this build understands; newer releases must not go below it. */
export const DATA_SCHEMA_VERSION = Number(process.env.VUESP_DATA_SCHEMA ?? 1);
