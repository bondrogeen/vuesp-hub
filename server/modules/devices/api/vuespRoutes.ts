import { Router } from 'express';
import { scanDevices } from './vuespController.ts';
import type { DeviceUiSession, DiscoveredDevice } from '@root/shared/device.ts';
import type { DeviceRepository } from '@server/modules/devices/infrastructure/deviceRepository.ts';
import { sendApiError, sendApiFailure } from '@shared/http/apiResponse.ts';

const parseDeviceRecordId = (value: string): number => {
  if (!/^[1-9]\d*$/.test(value)) throw new TypeError('Device ID must be a positive integer');
  const id = Number(value);
  if (!Number.isSafeInteger(id)) throw new TypeError('Device ID must be a positive integer');
  return id;
};

const sendDeviceFailure = (response: Parameters<typeof sendApiFailure>[0], error: unknown) =>
  sendApiFailure(response, error, 'Device API request', {
    conflictMessage: 'A device at this IP address is already registered',
  });

export const createVuespRouter = (getDeviceModel: () => Promise<DeviceRepository>) => {
  const router = Router();
  let activeScan: Promise<DiscoveredDevice[]> | undefined;

  router.get('/scan/', async (_req, res) => {
    try {
      activeScan ??= scanDevices().finally(() => {
        activeScan = undefined;
      });
      res.json(await activeScan);
    } catch (error) {
      console.error('Device scan failed:', error);
      sendApiError(res, 500, 'Device scan failed');
    }
  });

  router.get('/', async (_req, res) => {
    try {
      const model = await getDeviceModel();
      res.json(model.getAll());
    } catch (error) {
      sendDeviceFailure(res, error);
    }
  });

  router.get('/:id/ui/', async (req, res) => {
    try {
      const id = parseDeviceRecordId(req.params.id);
      const model = await getDeviceModel();
      const device = model.getById(id, { includeCredentials: true });
      if (!device) return res.status(404).json({ error: 'Device not found' });

      const credentials = `${device.username}:${device.password}`;
      const authorization = device.username || device.password
        ? `Basic ${Buffer.from(credentials).toString('base64')}`
        : '';
      const host = device.ip.includes(':') ? `[${device.ip}]` : device.ip;
      const session: DeviceUiSession = { origin: `http://${host}`, authorization };
      return res.json(session);
    } catch (error) {
      return sendDeviceFailure(res, error);
    }
  });

  router.get('/:id', async (req, res) => {
    try {
      const id = parseDeviceRecordId(req.params.id);
      const model = await getDeviceModel();
      const device = model.getById(id);
      if (device) return res.json(device);
      return res.status(404).json({ error: 'Device not found' });
    } catch (error) {
      return sendDeviceFailure(res, error);
    }
  });

  router.post('/', async (req, res) => {
    try {
      const model = await getDeviceModel();
      const device = model.create(req.body);
      return res.status(201).json(device);
    } catch (error) {
      return sendDeviceFailure(res, error);
    }
  });

  router.put('/:id', async (req, res) => {
    try {
      const id = parseDeviceRecordId(req.params.id);
      const model = await getDeviceModel();
      const device = model.update(id, req.body);
      if (device) return res.json(device);
      return res.status(404).json({ error: 'Device not found' });
    } catch (error) {
      return sendDeviceFailure(res, error);
    }
  });

  router.delete('/:id', async (req, res) => {
    try {
      const id = parseDeviceRecordId(req.params.id);
      const model = await getDeviceModel();
      const device = model.delete(id);
      if (device) return res.json(device);
      return res.status(404).json({ error: 'Device not found' });
    } catch (error) {
      return sendDeviceFailure(res, error);
    }
  });

  return router;
};
