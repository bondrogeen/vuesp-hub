let users = [];
let currentId = 1;

export default {
    getAll() {
        return Promise.resolve([...users]);
    },

    getById(id) {
        const user = users.find(u => u.id === id);
        return Promise.resolve(user);
    },

    create(user) {
        const newUser = { ...user, id: currentId++ };
        users.push(newUser);
        return Promise.resolve(newUser);
    },

    update(id, updatedUser) {
        const index = users.findIndex(u => u.id === id);
        if (index === -1) return Promise.resolve(null);
        users[index] = { ...users[index], ...updatedUser };
        return Promise.resolve(users[index]);
    },

    delete(id) {
        users = users.filter(u => u.id !== id);
        return Promise.resolve(true);
    }
};