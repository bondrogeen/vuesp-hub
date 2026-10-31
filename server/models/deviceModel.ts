import { app, safeStorage } from 'electron';
import Store from 'electron-store';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

import { createDeviceRepository } from './deviceRepository.ts';

interface LegacyDevice {
  id?: number;
  deviceId?: number;
  name?: string;
  ip?: string;
  firmware?: number[];
  username?: string;
  password?: string;
}

interface LegacyStore {
  device: LegacyDevice[];
}

let repositoryPromise: ReturnType<typeof createDeviceRepository> | undefined;

const encryptPassword = password => {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('Secure credential storage is unavailable. Configure an OS keyring before saving device credentials.');
  }
  return safeStorage.encryptString(password).toString('base64');
};

const decryptPassword = password => {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('Secure credential storage is unavailable. Configure an OS keyring to access saved device credentials.');
  }
  return safeStorage.decryptString(Buffer.from(password, 'base64'));
};

export const getDeviceModel = () => {
  if (!repositoryPromise) {
    const legacyStore = new Store<LegacyStore>();
    const legacyDevices = legacyStore.get('device', []);
    const databasePath = path.join(app.getPath('userData'), 'vuesp.sqlite');
    mkdirSync(path.dirname(databasePath), { recursive: true });
    repositoryPromise = createDeviceRepository({
      databasePath,
      legacyDevices,
      encryptPassword,
      decryptPassword,
    }).then(model => {
      if (Array.isArray(legacyDevices)) {
        const addresses = legacyDevices.map(device => device?.ip);
        const importedAddresses = new Set(model.getAll().map(device => device.ip));
        if (addresses.every((ip, index) => ip && addresses.indexOf(ip) === index && importedAddresses.has(ip))) {
          legacyStore.delete('device');
        }
      }
      return model;
    }).catch(error => {
      repositoryPromise = undefined;
      throw error;
    });
  }
  return repositoryPromise;
};

export const closeDeviceModel = async () => {
  const repository = await repositoryPromise;
  repository?.close();
  repositoryPromise = undefined;
};
