export interface ModuleGroupInfo {
  id: string;
  slug?: string;
  name: string;
  icon?: string;
  order?: number;
}

export interface ModuleWebInfo {
  entry: string;
  element: string;
  url: string;
  route: string;
  ws: string;
  nav?: {
    label: string;
    icon?: string;
  };
}

export interface ModuleSummary {
  id: string;
  name: string;
  version: string;
  description?: string;
  permissions: string[];
  group?: ModuleGroupInfo;
  slug: string;
  route: string;
  web?: ModuleWebInfo;
  running: boolean;
}

export interface CatalogModule {
  id: string;
  name: string;
  version: string;
  description?: string;
  group?: ModuleGroupInfo;
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

export interface ModuleLogEntry {
  at: string;
  level: 'info' | 'warn' | 'error';
  message: string;
}
