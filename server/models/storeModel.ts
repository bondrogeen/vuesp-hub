import Store from 'electron-store';

export interface StoreEntity {
    id: number;
    [key: string]: unknown;
}

export interface StoreModel {
    getAll(): Promise<StoreEntity[]>;
    getById(id: number): Promise<StoreEntity | undefined>;
    create(data: Omit<StoreEntity, 'id'>): Promise<StoreEntity>;
    update(id: number, data: Partial<StoreEntity>): Promise<StoreEntity | null>;
    delete(id: number): Promise<StoreEntity | undefined>;
}

export type StoreModelFactory = (key: string) => StoreModel;

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