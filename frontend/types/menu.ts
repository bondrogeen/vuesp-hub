export type IconName =
  | 'IconChevron'
  | 'IconDots'
  | 'IconSearch'
  | 'IconUpdate'
  | 'IconDashboard'
  | 'IconDevice'
  | 'IconVideo'
  | 'IconList'
  | 'IconHome'
  | 'IconScript'
  | 'IconStorage'
  | 'IconGpio'
  | 'IconUser'
  | 'IconSettings'
  | 'IconPuzzle';

export interface MenuChildType {
  name: string;
  icon?: IconName;
  path?: string;
  /** Hide the item unless this module is installed and running. */
  moduleId?: string;
  children?: MenuChildType[];
}

export interface MenuItemType {
  name: string;
  icon: IconName;
  path?: string;
  /** Hide the item unless this module is installed and running. */
  moduleId?: string;
  children?: MenuChildType[];
}

export interface MenuType {
  key?: string;
  title: string;
  items: MenuItemType[];
}

export interface BreadcrumbType {
  name: string;
  path?: string;
}
