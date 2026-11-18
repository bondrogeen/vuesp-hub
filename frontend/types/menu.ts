import { ICON_NAMES } from 'vuesp-components/components';

export type TIconName = (typeof ICON_NAMES)[number];


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
