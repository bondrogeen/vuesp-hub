export interface IModuleGroupInfo {
  id: string;
  slug?: string;
  name: string;
  icon?: string;
  order?: number;
}

export interface IModuleWebInfo {
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

export interface IModuleSummary {
  id: string;
  name: string;
  version: string;
  description?: string;
  permissions: string[];
  group?: IModuleGroupInfo;
  slug: string;
  route: string;
  web?: IModuleWebInfo;
  running: boolean;
}

export interface ICatalogModule {
  id: string;
  name: string;
  version: string;
  description?: string;
  group?: IModuleGroupInfo;
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

export interface IModuleLogEntry {
  at: string;
  level: 'info' | 'warn' | 'error';
  message: string;
}
