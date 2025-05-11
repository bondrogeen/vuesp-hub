export interface MenuChildType {
  name: string;
  path?: string;
}

export interface MenuItemType {
  name: string;
  icon: string;
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
