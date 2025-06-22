import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'node:path';

import { socketDevice } from './sockets/device.mjs'
import { socketStream } from './sockets/stream.mjs'
import { socketSerial } from './sockets/serial.mjs'
import router from './routes/index.mjs'
import proxy from './routes/proxy.mjs'

const port = 3005

export const server = () => {
    let httpServer;

    const createExpress = async () => {
        const app = express();

        app.use(express.json());
        app.use(express.static(path.join(__dirname, 'src/public')));

        httpServer = createServer(app);
        const ioDevice = new Server(httpServer, { path: "/ws/device/", cors: { origin: "*", methods: ["GET", "POST"] } });
        const ioStream = new Server(httpServer, { path: "/ws/stream/", cors: { origin: "*", methods: ["GET", "POST"] } });
        const ioSerial = new Server(httpServer, { path: "/ws/serial/", cors: { origin: "*", methods: ["GET", "POST"] } });


        app.use('/api/v1', router);
        app.use('/proxy', proxy);
        socketDevice(ioDevice);
        socketStream(ioStream);
        socketSerial(ioSerial);

        httpServer.listen(port, () => {
            console.log(`Server started on port ${port}`);
        });
    }

    const closeExpress = () => {
        httpServer.close();
    }

    return {
        createExpress,
        closeExpress
    }
}