export interface IAutomationRule {
  id: number;
  name: string;
  enabled: boolean;
  mode: 'single' | 'restart' | 'queued';
  trigger: { type: string; [key: string]: unknown };
  conditions: Array<Record<string, unknown>>;
  actions: Array<Record<string, unknown>>;
  updatedAt?: string;
}
