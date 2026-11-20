export type {
  IModuleGroup as IModuleGroupInfo,
  IModuleLogEntry,
  IModuleSummary,
  IModuleWebSummary as IModuleWebInfo,
  TModuleStatus,
} from '../../shared/module.ts';

import type { IModuleGroup } from '../../shared/module.ts';

export interface ICatalogModule {
  id: string;
  name: string;
  version: string;
  description?: string;
  group?: IModuleGroup;
  slug?: string;
  permissions?: string[];
  platforms?: string[];
  artifact?: string;
  sha256?: string;
  size?: number;
  releasedAt?: string;
  compatible?: boolean;
  installed?: boolean;
  running?: boolean;
}
