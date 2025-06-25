import Serial from '../services/serial/ServiceSerial.mjs';

console.log(Serial);

const serial = new Serial();

export default () => ({
    async send(req, res) {
        try {
            const data = req.query.data
            console.log(data);

            const list = await serial.getList()

            console.log(11111111);
            const t = await serial.writeAsync([1, 4, 0, 0, 0, 1, 49, 202])

            console.log(34434343434);
            console.log(t);
            res.status(200).json({ t });

        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
});