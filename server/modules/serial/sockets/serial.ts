import type { Server, Socket } from 'socket.io';

import Serial from '../application/ServiceSerial.ts';

const serial = new Serial();

const key = 'serial';

type SerialOptions = Parameters<InstanceType<typeof Serial>['connection']>[0];
type Ack = (response: { status?: string | boolean; message?: string; data?: unknown; options?: unknown }) => void;
interface SettingsStore {
    get<T>(key: string, defaultValue?: T): T | undefined;
    set(key: string, value: unknown): void;
}

export const socketSerial = (io: Server, store: SettingsStore) => {
    let savedOptions: unknown = store.get(key) ?? {};

    io.on('connection', (socket: Socket) => {
        socket.on('serial:start', (options: SerialOptions, callback: Ack) => {
            if (serial.getStatus()) return callback({ status: 'error', message: 'Service already running' });

            try {
                serial.connection(options)
                savedOptions = options
                store.set(key, options);

                serial.on('data', (data: unknown) => {
                    console.log(data);

                    io.emit('serial:data', { data });
                })

                serial.on('error', (err: Error) => {
                    io.emit('serial:error', { data: err.message });
                });

                serial.on('close', () => {
                    io.emit('serial:close', { data: 'close' });
                });

                io.emit('serial:status', { status: serial.getStatus(), options: savedOptions });
                callback({ status: 'success', message: 'Service started' });
            } catch (error) {
                callback({ status: 'error', message: 'serial:start' });
            }
        });

        socket.on('serial:list', async (_data: unknown, callback: Ack) => {
            try {
                const ports = await serial.getList()
                callback({ data: ports.map(p => p) });
            } catch (error) {
                callback({ status: 'error', message: 'serial:list' });
            }
        });

        socket.on('serial:send', (data: unknown, callback: Ack) => {
            if (!serial.getStatus()) return callback({ status: 'error', message: 'Service not running' });

            try {
                serial.write(data as Buffer)
            } catch (error) {
                callback({ status: 'error', message: 'serial:send' });
            }
        });

        socket.on('serial:status', (_data: unknown, callback: Ack) => {
            callback({ status: serial.getStatus(), options: savedOptions });
            io.emit('serial:status', { status: serial.getStatus(), options: savedOptions });
        });

        socket.on('serial:stop', async (_data: unknown, callback: Ack) => {
            if (!serial.getStatus()) return callback({ status: 'error', message: 'Service not running' });

            try {
                await serial.disconnection()
                io.emit('serial:status', { status: serial.getStatus(), options: savedOptions });
                callback({ status: 'success', message: 'Service stopped' });
            } catch (error) {
                callback({ status: 'error', message: 'Stop failed' });
            }
        });
    });
}
