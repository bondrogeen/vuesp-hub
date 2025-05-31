import Struct from 'c-struct-to-json';

const dgram = require('dgram');
// const socket = dgram.createSocket('udp4');
const BROADCAST_PORT = 12345;
const BROADCAST_ADDR = '255.255.255.255';

const struct = [
    { name: 'command', type: 'uint8_t' },
    { name: 'firmware', type: 'uint8_t', length: 3 },
    { name: 'deviceId', type: 'uint32_t' },
    { name: 'name', type: 'char', length: 20 },
]

export default () => ({
    async scan(req, res) {
        try {
            const socket = dgram.createSocket('udp4');
            let count = 0
            const devices = []

            socket.bind(BROADCAST_PORT, () => {
                socket.setBroadcast(true);
            });

            socket.on('message', (msg, rinfo) => {
                const data = new Struct(struct).setBuffer(msg.buffer).getObject()
                if (data.command === 98 && !devices.find(i => i.ip === rinfo.address)) {
                    devices.push({ ...data, ip: rinfo.address })
                }
                // console.log(`Получено от ${rinfo.address}:`, msg.toString());
            });

            socket.on('error', (err) => {
                console.error('Ошибка сокета:', err);
            });

            const send = () => {
                const buffer = new Struct(struct).setObject({ command: 99 }).getBuffer()
                const dataview = new DataView(buffer);
                socket.send(dataview, BROADCAST_PORT, BROADCAST_ADDR);

                if (count < 2) {
                    setTimeout(() => { send() }, 3000);
                } else {
                    socket.close()
                    res.json(devices)
                }
                count++
            }

            send()
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
});