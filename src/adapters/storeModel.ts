import Store from 'electron-store';

import type { StoreEntity } from '../../server/shared/stores/types.ts';

export type { StoreEntity, StoreModel, StoreModelFactory } from '../../server/shared/stores/types.ts';

const store = new Store<Record<string, StoreEntity[]>>();

const storeModel = <T extends StoreEntity = StoreEntity>(key: string) => ({
    getAll: async (): Promise<T[]> => store.get(key, []) as T[],

    getById(id: number): Promise<T | undefined> {
        const devices = store.get(key, []);
        const user = devices.find(i => i.id === id) as T | undefined;
        return Promise.resolve(user);
    },

    create(data: Omit<T, 'id'>): Promise<T> {
        const devices = store.get(key, []);
        const max = devices.length ? Math.max(...devices.map(i => i.id)) : 0
        const item = { ...data, id: max + 1 } as T;
        devices.push(item);
        store.set(key, devices);
        return Promise.resolve(item);
    },

    update(id: number, data: Partial<T>): Promise<T | null> {
        const devices = store.get(key, []);
        const index = devices.findIndex(u => u.id === id);
        if (index === -1) return Promise.resolve(null);
        devices[index] = { ...devices[index], ...data } as T;
        store.set(key, devices);
        return Promise.resolve(devices[index] as T);
    },

    delete(id: number): Promise<T | undefined> {
        let devices = store.get(key, []);
        const device = devices.find(i => i.id === id) as T | undefined;
        devices = devices.filter(i => i.id !== id);
        store.set(key, devices);
        return Promise.resolve(device);

    }
});

export default storeModel;