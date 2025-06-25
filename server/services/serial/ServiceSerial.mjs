import { EventEmitter } from 'node:events';
const { SerialPort } = require('serialport')


export default class Serial extends EventEmitter {
    static #instance = null;
    #port = null;
    #isServiceRunning = false;
    #options = {};
    #buffer;

    constructor() {
        super();
        if (!Serial.#instance) {
            Serial.#instance = this;
        }
        this.#buffer = [];
        return Serial.#instance;
    }

    static getInstance() {
        return Serial.#instance;
    }

    connection(options) {
        if (this.#isServiceRunning) return false
        this.#options = options
        try {
            this.#port = new SerialPort(options)
            this.#isServiceRunning = true;

            this.#port.on('data', (data) => {
                this.#buffer.push(...Array.from(data));
                this.emit('data', data);
            })

            this.#port.on('error', (err) => {
                this.emit('error', err);
            });

            this.#port.on('close', () => {
                this.emit('close');
            });

            this.emit('status', { status: this.#isServiceRunning, options: this.options });
            return true
        } catch (error) {
            console.error(error);
        }
    }

    disconnection() {
        if (!isServiceRunning) return false
        try {
            this.#port.close();
            this.#port = null;
            this.#isServiceRunning = false;
            this.emit('status', { status: false, options: this.options });
        } catch (error) {
            console.error(error);
        }
    };

    async getList() {
        try {
            const ports = await SerialPort.list();
            return ports.map(p => p)
        } catch (error) {
            console.error(error);
        }
    }

    write(data) {
        if (!this.#isServiceRunning) return false;
        try {
            this.#port.write(data)
        } catch (error) {
            return false
        }
    }
    writeAsync(data) {
        if (!this.#isServiceRunning) return false;
        try {
            this.#buffer = []
            this.#port.write(data)
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    console.log('this.#buffer');
                    console.log(this.#buffer);

                    resolve(this.#buffer)
                }, 1000)
            })
        } catch (error) {
            return false
        }
    }

    getStatus() {
        return this.#isServiceRunning;
    };

}