// import { SerialPort } from 'serialport'
const { SerialPort } = require('serialport')

console.log(SerialPort);


// import Store from 'electron-store';
// const store = new Store();

let isServiceRunning = false;
let _options = {};

export const socketSerial = (io) => {
    console.log('socketSerial');

    let port = null;
    io.on('connection', (socket) => {
        console.log('Client connected 111');

        socket.on('serial:start', (options, callback) => {
            console.log(options);
            if (isServiceRunning) return callback({ status: 'error', message: 'Service already running' });

            try {

                port = new SerialPort(options)
                _options = options
                isServiceRunning = true;

                port.on('readable', function () {
                    io.emit('serial:readable', { data: port.read() });
                })

                port.on('data', function (data) {
                    io.emit('serial:data', { data });
                })

                port.on('error', err => {
                    io.emit('serial:error', { data: err.message });
                });

                port.on('close', () => {
                    io.emit('serial:close', { data: 'close' });
                });

                io.emit('serial:status', { status: true });
                callback({ status: 'success', message: 'Service started' });
            } catch (error) {
                console.log(error);
                
                callback({ status: 'error', message: 'serial:start' });
            }
        });

        socket.on('serial:list', async (data, callback) => {
            try {
                const ports = await SerialPort.list();
                callback({ data: ports.map(p => p) });
            } catch (error) {
                callback({ status: 'error', message: 'serial:list' });
            }
        });

        socket.on('serial:send', (data, callback) => {
            if (!isServiceRunning) return callback({ status: 'error', message: 'Service not running' });

            try {
                port.write(data)
            } catch (error) {
                callback({ status: 'error', message: 'serial:send' });
            }
        });

        socket.on('serial:status', (_, callback) => {
            callback({ status: isServiceRunning, options: _options });
            io.emit('serial:status', { status: isServiceRunning, options: _options });
        });

        socket.on('serial:stop', (_, callback) => {
            if (!isServiceRunning) return callback({ status: 'error', message: 'Service not running' });

            try {
                port.close();
                port = null;
                isServiceRunning = false;
                io.emit('serial:status', { status: false, options: _options });
                callback({ status: 'success', message: 'Service stopped' });
            } catch (error) {
                callback({ status: 'error', message: 'Stop failed' });
            }
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected');
        });
    });
}
110605
