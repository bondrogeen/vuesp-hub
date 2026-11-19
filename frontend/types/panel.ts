export type TPanelWidgetType = 'info' | 'button' | 'dimmer' | 'list' | 'input' | 'chart' | 'custom';

export interface IPanelWidgetPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface IPanelWidget {
  id: string;
  type: TPanelWidgetType;
  entityId: string;
  pos: IPanelWidgetPosition;
  options?: Record<string, unknown>;
}

export interface IPanel {
  schemaVersion: number;
  id: number;
  name: string;
  areaId?: string;
  icon?: string;
  widgets: IPanelWidget[];
  updatedAt: string;
}

export interface IPanelInput {
  name: string;
  areaId?: string;
  icon?: string;
  widgets: IPanelWidget[];
}
