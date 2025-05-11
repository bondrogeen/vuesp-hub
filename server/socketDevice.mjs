
import { VuespDevices } from '../vuesp/index.mjs';

const devices = [
    {
        ip: '192.0.2.46',
        username: 'admin',
        password: 'admin',
    },
];

let serviceProcess = null;
let isServiceRunning = false;

export const socketDevice = (io) => {
    let vuespDevices = null;
    console.log('setupSocket');

    io.on('connection', (socket) => {
        console.log('Client connected');

        socket.on('service:start', (data, callback) => {
            console.log('service:start');

            if (isServiceRunning) {
                return callback({ status: 'error', message: 'Service already running' });
            }

            try {
                vuespDevices = new VuespDevices(devices);

                vuespDevices.on('*', payload => {
                    // console.log(payload);
                    io.emit('service:log', payload);
                });

                vuespDevices.connection();

                isServiceRunning = true;
                io.emit('service:status', { running: true });
                callback({ status: 'success', message: 'Service started' });
            } catch (error) {
                callback({ status: 'error', message: 'Start failed' });
            }
        });

        // Остановка сервиса
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

        // Запрос статуса
        socket.on('service:get-status', (data, callback) => {
            callback({ running: isServiceRunning });
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected');
        });
    });
}