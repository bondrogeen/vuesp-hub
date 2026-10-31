import { EventEmitter } from 'node:events';
import { SerialPort } from 'serialport';

type SerialOptions = ConstructorParameters<typeof SerialPort>[0];
type SerialPortInstance = InstanceType<typeof SerialPort>;

export default class Serial extends EventEmitter {
  static #instance: Serial | null = null;
  #port: SerialPortInstance | null = null;
  #isServiceRunning = false;
  #options: SerialOptions | undefined;
  #buffer: number[] = [];

  constructor() {
    super();
    if (Serial.#instance) return Serial.#instance;
    Serial.#instance = this;
  }

  static getInstance(): Serial | null {
    return Serial.#instance;
  }

  connection(options: SerialOptions): boolean {
    if (this.#isServiceRunning) return false;
    this.#options = options;

    try {
      const port = new SerialPort(options);
      this.#port = port;
      this.#isServiceRunning = true;
      port.on('data', data => {
        this.#buffer.push(...data);
        this.emit('data', data);
      });
      port.on('error', error => this.emit('error', error));
      port.on('close', () => {
        this.#isServiceRunning = false;
        this.emit('close');
      });
      this.emit('status', { status: true, options: this.#options });
      return true;
    } catch (error) {
      this.#port = null;
      this.#isServiceRunning = false;
      this.emit('error', error);
      throw error;
    }
  }

  async disconnection(): Promise<boolean> {
    const port = this.#port;
    if (!this.#isServiceRunning || !port) return false;

    await new Promise<void>((resolve, reject) => {
      port.close(error => error ? reject(error) : resolve());
    });
    this.#port = null;
    this.#isServiceRunning = false;
    this.emit('status', { status: false, options: this.#options });
    return true;
  }

  getList(): ReturnType<typeof SerialPort.list> {
    return SerialPort.list();
  }

  write(data: Buffer | Uint8Array | string): boolean {
    if (!this.#isServiceRunning || !this.#port) return false;
    try {
      this.#port.write(data);
      return true;
    } catch (error) {
      this.emit('error', error);
      return false;
    }
  }

  writeAsync(data: number[] | Buffer | Uint8Array): Promise<number[] | false> {
    const port = this.#port;
    if (!this.#isServiceRunning || !port) return Promise.resolve(false);
    this.#buffer = [];
    const buffer = Array.isArray(data) ? Buffer.from(data) : data;

    return new Promise((resolve, reject) => {
      port.write(buffer, error => {
        if (error) {
          reject(error);
          return;
        }
        setTimeout(() => resolve([...this.#buffer]), 1000);
      });
    });
  }

  getStatus(): boolean {
    return this.#isServiceRunning;
  }
}
