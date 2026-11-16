export type TIconName =
  | 'more'
  | 'search'
  | 'refresh'
  | 'dashboard'
  | 'cpu'
  | 'video'
  | 'list-check'
  | 'home'
  | 'script'
  | 'storage'
  | 'gpio'
  | 'user'
  | 'settings'
  | 'box';

export interface IMenuChildType {
  name: string;
  icon?: TIconName;
  path?: string;
  /** Hide the item unless this module is installed and running. */
  moduleId?: string;
  children?: IMenuChildType[];
}

export interface IMenuItemType {
  name: string;
  icon: TIconName;
  path?: string;
  /** Hide the item unless this module is installed and running. */
  moduleId?: string;
  children?: IMenuChildType[];
}

export interface IMenuType {
  key?: string;
  title: string;
  items: IMenuItemType[];
}

export interface IBreadcrumbType {
  name: string;
  path?: string;
}
