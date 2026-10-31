import Serial from '../services/serial/ServiceSerial.ts';

const serial = new Serial();

const key = 'serial'

export const socketSerial = (io, store) => {
    let port = null;
    let savedOptions = store.get(key) || {}

    io.on('connection', (socket) => {
        socket.on('serial:start', (options, callback) => {
            if (serial.getStatus()) return callback({ status: 'error', message: 'Service already running' });

            try {
                serial.connection(options)
                savedOptions = options
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

                io.emit('serial:status', { status: serial.getStatus(), options: savedOptions });
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
            callback({ status: serial.getStatus(), options: savedOptions });
            io.emit('serial:status', { status: serial.getStatus(), options: savedOptions });
        });

        socket.on('serial:stop', async (_, callback) => {
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
