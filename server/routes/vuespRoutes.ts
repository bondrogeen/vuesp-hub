import { Router } from 'express';
import { scanDevices } from '../controllers/vuespController.ts';
import type { DeviceRepository } from '../models/deviceRepository.ts';

export const createVuespRouter = (getDeviceModel: () => Promise<DeviceRepository>) => {
  const router = Router();
  let activeScan;

  const errorMessage = error => error instanceof Error ? error.message : 'Unexpected error';

  router.get('/scan/', async (_req, res) => {
    try {
      activeScan ??= scanDevices().finally(() => {
        activeScan = null;
      });
      res.json(await activeScan);
    } catch (error) {
      res.status(500).json({ error: `Device scan failed: ${errorMessage(error)}` });
    }
  });

  router.get('/', async (_req, res) => {
    try {
      const model = await getDeviceModel();
      res.json(model.getAll());
    } catch (error) {
      res.status(500).json({ error: errorMessage(error) });
    }
  });

  router.get('/:id', async (req, res) => {
    try {
      const model = await getDeviceModel();
      const device = model.getById(req.params.id);
      if (device) return res.json(device);
      return res.status(404).json({ error: 'Device not found' });
    } catch (error) {
      return res.status(500).json({ error: errorMessage(error) });
    }
  });

  router.post('/', async (req, res) => {
    try {
      const model = await getDeviceModel();
      const device = model.create(req.body);
      return res.status(201).json(device);
    } catch (error) {
      const isDuplicate = error?.code === 'SQLITE_CONSTRAINT_UNIQUE';
      const status = isDuplicate ? 409 : error instanceof TypeError ? 400 : 500;
      return res.status(status).json({
        error: isDuplicate ? 'A device at this IP address is already registered' : errorMessage(error),
      });
    }
  });

  router.put('/:id', async (req, res) => {
    try {
      const model = await getDeviceModel();
      const device = model.update(req.params.id, req.body);
      if (device) return res.json(device);
      return res.status(404).json({ error: 'Device not found' });
    } catch (error) {
      const isDuplicate = error?.code === 'SQLITE_CONSTRAINT_UNIQUE';
      const status = isDuplicate ? 409 : error instanceof TypeError ? 400 : 500;
      return res.status(status).json({
        error: isDuplicate ? 'A device at this IP address is already registered' : errorMessage(error),
      });
    }
  });

  router.delete('/:id', async (req, res) => {
    try {
      const model = await getDeviceModel();
      const device = model.delete(req.params.id);
      if (device) return res.json(device);
      return res.status(404).json({ error: 'Device not found' });
    } catch (error) {
      return res.status(500).json({ error: errorMessage(error) });
    }
  });

  return router;
};
