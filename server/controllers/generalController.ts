export default (model) => ({

    async getById(req, res) {
        try {
            const user = await model.getById(Number(req.params.id));
            user ? res.json(user) : res.status(404).json({ error: 'Not found' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    async getAll(req, res) {
        try {
            const users = await model.getAll();
            res.json(users);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    async create(req, res) {
        try {
            const newUser = await model.create(req.body);
            res.status(201).json(newUser);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },
    async update(req, res) {
        try {
            const updatedUser = await model.update(Number(req.params.id), req.body);
            if (updatedUser) {
                res.json(updatedUser);
            } else {
                res.status(404).json({ error: 'Not found' });
            }
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },
    async delete(req, res) {
        try {
            const success = await model.delete(Number(req.params.id));
            if (success) {
                res.status(200).json(success);
            } else {
                res.status(404).json({ error: 'Not found' });
            }
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
});