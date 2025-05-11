import Store from 'electron-store';
const store = new Store();

export default (key) => ({
    getAll: async () => {
        return Promise.resolve(store.get(key) || []);
    },

    getById(id) {
        const devices = store.get(key) || [];
        const user = devices.find(i => i.id === id);
        return Promise.resolve(user);
    },

    create(data) {
        const devices = store.get(key) || [];
        const max = devices.length ? Math.max(...devices.map(i => i.id)) : 0
        const item = { ...data, id: max + 1 };
        devices.push(item);
        store.set(key, devices);
        return Promise.resolve(item);
    },

    update(id, data) {
        const devices = store.get(key) || [];
        const index = devices.findIndex(u => u.id === id);
        if (index === -1) return Promise.resolve(null);
        devices[index] = { ...devices[index], ...data };
        store.set(key, devices);
        return Promise.resolve(devices[index]);
    },

    delete(id) {
        let devices = store.get(key) || [];
        const device = devices.find(i => i.id === id);
        devices = devices.filter(i => i.id !== id);
        store.set(key, devices);
        return Promise.resolve(device);

    }
});