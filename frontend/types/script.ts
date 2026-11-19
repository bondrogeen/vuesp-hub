export interface IScriptRecord {
  id: number;
  name: string;
  code: string;
  timeoutMs: number;
  memoryMb: number;
  enabled: boolean;
}
