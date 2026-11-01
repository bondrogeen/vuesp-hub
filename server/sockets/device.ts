import type { Server as SocketIOServer } from 'socket.io';
import type { DeviceRuntime } from '../../core/application/deviceRuntime.ts';
import { parseBroadcastDeviceCommand, parseTargetedDeviceCommand } from '../../shared/device.ts';
import type { ServiceSocketAcknowledgement } from '../../shared/socket.ts';

const respond = (callback: unknown, payload: ServiceSocketAcknowledgement) => {
  if (typeof callback === 'function') callback(payload);
};

const errorMessage = (error: unknown, fallback: string) => error instanceof Error ? error.message : fallback;

export const socketDevice = (io: SocketIOServer, runtime: DeviceRuntime<unknown>): (() => void) => {
  const forwardData = (payload: unknown) => io.emit('device:data', payload);
  const forwardStatus = (running: boolean) => io.emit('service:status', { running });
  runtime.on('data', forwardData);
  runtime.on('status', forwardStatus);

  io.on('connection', socket => {
    socket.emit('service:status', { running: runtime.isRunning });
    for (const payload of runtime.getSnapshot()) {
      socket.emit('device:data', payload);
    }

    socket.on('service:start', async (_data, callback) => {
      try {
        const started = await runtime.start();
        if (!started) {
          respond(callback, { status: 'error', message: 'Service already running' });
          return;
        }
        respond(callback, { status: 'success', message: 'Service started' });
      } catch (error) {
        respond(callback, { status: 'error', message: errorMessage(error, 'Start failed') });
      }
    });

    socket.on('device:send', (request: unknown, callback) => {
      if (!runtime.isRunning) {
        respond(callback, { status: 'error', message: 'Service not running' });
        return;
      }
      try {
        const { ip, name, comm, data } = parseTargetedDeviceCommand(request);
        const target = ip || name;
        if (!target) throw new TypeError('A device and command are required');
        const sent = runtime.send(target, comm, data);
        if (sent) respond(callback, { status: 'success' });
        else respond(callback, { status: 'failed' });
      } catch (error) {
        const message = error instanceof TypeError
          ? error.message
          : errorMessage(error, 'Could not send device command');
        respond(callback, { status: error instanceof TypeError ? 'failed' : 'error', message });
      }
    });

    socket.on('device:sendAll', (request: unknown, callback) => {
      if (!runtime.isRunning) {
        respond(callback, { status: 'error', message: 'Service not running' });
        return;
      }
      try {
        const { comm, data } = parseBroadcastDeviceCommand(request);
        runtime.sendAll(comm, data);
        respond(callback, { status: 'success' });
      } catch (error) {
        const message = error instanceof TypeError
          ? error.message
          : errorMessage(error, 'Could not send device command');
        respond(callback, { status: error instanceof TypeError ? 'failed' : 'error', message });
      }
    });

    socket.on('device:menus', (_data, callback) => {
      try {
        respond(callback, { status: 'success', menus: runtime.getMenu() });
      } catch (error) {
        respond(callback, { status: 'error', message: errorMessage(error, 'Could not load device menus') });
      }
    });

    socket.on('device:list', (_data, callback) => {
      try {
        respond(callback, { status: 'success', list: runtime.getList() });
      } catch (error) {
        respond(callback, { status: 'error', message: errorMessage(error, 'Could not load device list') });
      }
    });

    socket.on('service:stop', async (_data, callback) => {
      try {
        if (!(await runtime.stop())) {
          respond(callback, { status: 'error', message: 'Service not running' });
          return;
        }
        respond(callback, { status: 'success', message: 'Service stopped' });
      } catch (error) {
        respond(callback, { status: 'error', message: errorMessage(error, 'Stop failed') });
      }
    });

    socket.on('service:get-status', (_data, callback) => {
      respond(callback, { running: runtime.isRunning });
    });
  });

  return () => {
    runtime.off('data', forwardData);
    runtime.off('status', forwardStatus);
  };
};
