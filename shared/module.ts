export interface ModuleWebNav {
  label: string;
  icon?: string;
}

export interface ModuleGroup {
  id: string;
  /** Short group name used in the UI and public URL, for example `video`. */
  slug?: string;
  name: string;
  icon?: string;
  order?: number;
}

export interface ModuleWebManifest {
  /** Entry file relative to the module directory, for example `web/entry.js`. */
  entry: string;
  /** Custom element tag registered by the entry bundle. */
  element: string;
  route?: string;
  nav?: ModuleWebNav;
}

export interface ModuleAsset {
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

export interface ModuleManifest {
  id: string;
  name: string;
  version: string;
  apiVersion: number;
  entry: string;
  platforms?: string[];
  permissions?: string[];
  resources?: { memoryMb?: number };
  web?: string | ModuleWebManifest;
  uiApiVersion?: number;
  group?: ModuleGroup;
  /** Short module name inside its group; also used in the public route. */
  slug?: string;
  assets?: ModuleAsset[];
  settings?: unknown[];
  description?: string;
}

export interface ModuleLogEntry {
  at: string;
  level: 'info' | 'warn' | 'error';
  message: string;
}

export interface ModuleInfo {
  manifest: ModuleManifest;
  directory: string;
  running: boolean;
  logs: ModuleLogEntry[];
}

/** Public module shape sent to the hub UI. */
export interface ModuleSummary {
  id: string;
  name: string;
  version: string;
  description?: string;
  permissions: string[];
  group?: ModuleGroup;
  slug: string;
  /** Public UI route, for example `/modules/video/cameras`. */
  route: string;
  web?: {
    entry: string;
    element: string;
    url: string;
    route: string;
    ws: string;
    nav?: ModuleWebNav;
  };
  running: boolean;
}
