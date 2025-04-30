// controllers/userController.js
import { vuespModel } from '../models/index.mjs';
// import { io } from '../server.mjs';

export default {
    async getAll(req, res) {
        try {
            const users = await vuespModel.getAll();
            res.json(users);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async create(req, res) {
        try {
            const newUser = await vuespModel.create(req.body);
            // io.emit('user:created', newUser);
            res.status(201).json(newUser);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    async update(req, res) {
        try {
            const updatedUser = await vuespModel.update(
                Number(req.params.id),
                req.body
            );
            if (updatedUser) {
                // io.emit('user:updated', updatedUser);
                res.json(updatedUser);
            } else {
                res.status(404).json({ error: 'User not found' });
            }
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    async delete(req, res) {
        try {
            const success = await vuespModel.delete(Number(req.params.id));
            if (success) {
                // io.emit('user:deleted', Number(req.params.id));
                res.status(204).end();
            } else {
                res.status(404).json({ error: 'User not found' });
            }
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};