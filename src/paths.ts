import { homedir } from 'node:os';
import path from 'node:path';

export const defaultDataDirectory = (): string => {
  if (process.env.VUESP_DATA_DIR) return process.env.VUESP_DATA_DIR;
  const home = homedir();
  if (process.platform === 'win32') return path.join(process.env.APPDATA || path.join(home, 'AppData', 'Roaming'), 'vuesp-hub');
  if (process.platform === 'darwin') return path.join(home, 'Library', 'Application Support', 'vuesp-hub');
  return path.join(process.env.XDG_DATA_HOME || path.join(home, '.local', 'share'), 'vuesp-hub');
};
