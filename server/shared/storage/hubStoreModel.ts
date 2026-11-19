import type { IConfigStore } from '@core/application/configStore.ts';
import type { TStoreModelFactory } from '../stores/types.ts';
import { createConfigStoreModel } from './configStoreModel.ts';

export const CONFIG_SECTIONS = [
  'areas',
  'panels',
  'areaAssignments',
  'automations',
  'scenes',
  'notifications',
  'scripts',
] as const;

export type TConfigSection = typeof CONFIG_SECTIONS[number];

export interface IHubStoreModelOptions {
  configStore?: IConfigStore;
  fallback: TStoreModelFactory;
}

/**
 * Config-backed sections live in `config.sqlite`; everything else falls back
 * to the platform store (JSON or electron-store). Panels keep soft delete.
 */
export const createHubStoreModel = ({ configStore, fallback }: IHubStoreModelOptions): TStoreModelFactory =>
  configStore
    ? key => CONFIG_SECTIONS.includes(key as TConfigSection)
      ? createConfigStoreModel(configStore, key, { softDelete: key === 'panels' })
      : fallback(key)
    : fallback;
