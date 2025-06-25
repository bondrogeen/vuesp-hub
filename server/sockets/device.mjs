
import { VuespDevices } from '../../vuesp/index.mjs';

import Store from 'electron-store';
const store = new Store();

let isServiceRunning = false;

export const socketDevice = (io) => {
    let vuespDevices = null;
    console.log('setupSocket');

    io.on('connection', (socket) => {
        console.log('Client connected');

        socket.on('service:start', (data, callback) => {
            if (isServiceRunning) {
                return callback({ status: 'error', message: 'Service already running' });
            }
            try {
                const devices = store.get('device') || []
                vuespDevices = new VuespDevices(devices);
                vuespDevices.on('*', payload => {
                    io.emit('device:data', payload);
                });
                vuespDevices.connection();

                isServiceRunning = true;
                io.emit('service:status', { running: true });
                callback({ status: 'success', message: 'Service started' });
            } catch (error) {
                callback({ status: 'error', message: 'Start failed' });
            }
        });

        socket.on('device:send', ({ ip, name, comm, data }, callback) => {
            if (!isServiceRunning) {
                return callback({ status: 'error', message: 'Service not running' });
            }
            console.log({ ip, name, comm, data });
            if (!(ip || name), !comm) return callback({ status: 'failed', message: '!(ip || name), !comm' });

            try {
                console.log('vuespDevices.onSend');
                vuespDevices.onSend(ip || name, comm, data);
            } catch (error) {
                callback({ status: 'error', message: 'Start failed' });
            }
        });

        socket.on('device:sendAll', ({ comm, data }, callback) => {
            if (!isServiceRunning) {
                return callback({ status: 'error', message: 'Service not running' });
            }
            console.log({ comm, data });
            if (!comm) return callback({ status: 'failed', message: '!comm' });

            try {
                console.log('vuespDevices.sendAll');
                vuespDevices.onSendAll(comm, data);
                // callback({ status: 'success', message: 'Service started' });
            } catch (error) {
                callback({ status: 'error', message: 'Start failed' });
            }
        });

        socket.on('device:menus', (_, callback) => {
            try {
                if (!isServiceRunning) {
                    return callback({ status: 'error', message: 'Service not running' });
                }
                const menus = vuespDevices.getMenu();
                callback({ status: 'success', menus });
            } catch (error) {
                callback({ status: 'error', message: 'Start failed' });
            }
        });

        socket.on('device:list', (_, callback) => {
            try {
                if (!isServiceRunning) {
                    return callback({ status: 'error', message: 'Service not running' });
                }
                const list = vuespDevices.getList();
                callback({ status: 'success', list });
            } catch (error) {
                callback({ status: 'error', message: 'Start failed' });
            }
        });

        socket.on('service:stop', (data, callback) => {
            if (!isServiceRunning) {
                return callback({ status: 'error', message: 'Service not running' });
            }
            try {
                vuespDevices.disconnection();
                isServiceRunning = false;
                io.emit('service:status', { running: false });
                callback({ status: 'success', message: 'Service stopped' });
            } catch (error) {
                callback({ status: 'error', message: 'Stop failed' });
            }
        });

        socket.on('service:get-status', (data, callback) => {
            callback({ running: isServiceRunning });
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected');
        });
    });
}