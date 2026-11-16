export interface IModuleWebNav {
  label: string;
  icon?: string;
}

export interface IModuleGroup {
  id: string;
  /** Short group name used in the UI and public URL, for example `video`. */
  slug?: string;
  name: string;
  icon?: string;
  order?: number;
}

export interface IModuleWebManifest {
  /** Entry file relative to the module directory, for example `web/entry.js`. */
  entry: string;
  /** Custom element tag registered by the entry bundle. */
  element: string;
  route?: string;
  nav?: IModuleWebNav;
}

export interface IModuleAsset {
  id: string;
  url: string;
  sha256: string;
  /** Optional expected size in bytes. */
  size?: number;
  /** Destination inside the extracted module package. */
  installTo: string;
  /** Unix mode, for example `0755`. */
  mode?: string;
  /** Only install on these platforms, for example `linux-x64`. */
  platforms?: string[];
  /** Missing asset for this platform is not fatal. */
  optional?: boolean;
}

export interface IModuleManifest {
  id: string;
  name: string;
  version: string;
  apiVersion: number;
  entry: string;
  platforms?: string[];
  permissions?: string[];
  resources?: { memoryMb?: number };
  web?: string | IModuleWebManifest;
  uiApiVersion?: number;
  group?: IModuleGroup;
  /** Short module name inside its group; also used in the public route. */
  slug?: string;
  assets?: IModuleAsset[];
  settings?: unknown[];
  description?: string;
}

export interface IModuleLogEntry {
  at: string;
  level: 'info' | 'warn' | 'error';
  message: string;
}

export interface IModuleInfo {
  manifest: IModuleManifest;
  directory: string;
  running: boolean;
  logs: IModuleLogEntry[];
}

/** Public module shape sent to the hub UI. */
export interface IModuleSummary {
  id: string;
  name: string;
  version: string;
  description?: string;
  permissions: string[];
  group?: IModuleGroup;
  slug: string;
  /** Public UI route, for example `/modules/video/cameras`. */
  route: string;
  web?: {
    entry: string;
    element: string;
    url: string;
    route: string;
    ws: string;
    nav?: IModuleWebNav;
  };
  running: boolean;
}
