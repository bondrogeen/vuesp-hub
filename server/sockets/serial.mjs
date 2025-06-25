// const { SerialPort } = require('serialport')
import Store from 'electron-store';

import Serial from '../services/serial/ServiceSerial.mjs';

const serial = new Serial();

const store = new Store();
const key = 'serial'

let _options = {};

export const socketSerial = (io) => {
    let port = null;
    _options = store.get(key) || {}

    io.on('connection', (socket) => {
        socket.on('serial:start', (options, callback) => {
            if (serial.getStatus()) return callback({ status: 'error', message: 'Service already running' });

            try {
                serial.connection(options)
                _options = options
                store.set(key, options);

                serial.on('data', (data) => {
                    console.log(data);

                    io.emit('serial:data', { data });
                })

                serial.on('error', err => {
                    io.emit('serial:error', { data: err.message });
                });

                serial.on('close', () => {
                    io.emit('serial:close', { data: 'close' });
                });

                io.emit('serial:status', { status: serial.getStatus(), options: _options });
                callback({ status: 'success', message: 'Service started' });
            } catch (error) {
                callback({ status: 'error', message: 'serial:start' });
            }
        });

        socket.on('serial:list', async (data, callback) => {
            try {
                const ports = await serial.getList()
                callback({ data: ports.map(p => p) });
            } catch (error) {
                callback({ status: 'error', message: 'serial:list' });
            }
        });

        socket.on('serial:send', (data, callback) => {
            if (!serial.getStatus()) return callback({ status: 'error', message: 'Service not running' });

            try {
                serial.write(data)
            } catch (error) {
                callback({ status: 'error', message: 'serial:send' });
            }
        });

        socket.on('serial:status', (_, callback) => {
            callback({ status: serial.getStatus(), options: _options });
            io.emit('serial:status', { status: serial.getStatus(), options: _options });
        });

        socket.on('serial:stop', (_, callback) => {
            if (!serial.getStatus()) return callback({ status: 'error', message: 'Service not running' });

            try {
                serial.disconnection()
                io.emit('serial:status', { status: serial.getStatus(), options: _options });
                callback({ status: 'success', message: 'Service stopped' });
            } catch (error) {
                callback({ status: 'error', message: 'Stop failed' });
            }
        });
    });
}
