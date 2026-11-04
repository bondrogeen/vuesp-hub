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
  | 'IconSettings';

export interface MenuChildType {
  name: string;
  icon?: IconName;
  path?: string;
  children?: MenuChildType[];
}

export interface MenuItemType {
  name: string;
  icon: IconName;
  path?: string;
  children?: MenuChildType[];
}

export interface MenuType {
  title: string;
  items: MenuItemType[];
}

export interface BreadcrumbType {
  name: string;
  path?: string;
}
