import type Core from '../../core.ts';

interface MqttClient {
  on(event: string, listener: (...args: unknown[]) => void): this;
  subscribe(topic: string): void;
  publish(topic: string, message: string): void;
  end(): void;
}

interface MqttOptions {
  host: string;
  port: number;
  username: string;
  password: string;
}

type MqttConnect = (host: string, options: Omit<MqttOptions, 'host'>) => MqttClient;

export default class MqttModule {
  private readonly core: Core;
  private readonly connect?: MqttConnect;
  private readonly config: MqttOptions = {
    host: 'mqtt://localhost',
    port: 1883,
    username: '',
    password: '',
  };
  private client: MqttClient | null = null;

  constructor(core: Core, connect?: MqttConnect) {
    this.core = core;
    this.connect = connect;
  }

  async init(): Promise<void> {
    if (!this.connect) {
      throw new Error('MQTT transport is not configured');
    }

    this.client = this.connect(this.config.host, {
      port: this.config.port,
      username: this.config.username,
      password: this.config.password,
    });

    this.client.on('connect', () => {
      this.core.log('MQTT connected');
      this.client?.subscribe('smart-home/+/control');
    });
    this.client.on('message', (topic, message) => {
      this.handleMessage(String(topic), String(message));
    });
    this.client.on('error', error => {
      this.core.log(`MQTT error: ${error instanceof Error ? error.message : String(error)}`, 'error');
    });

    this.core.registerService('mqtt', this);
    this.core.log('MQTT module initialized');
  }

  private handleMessage(topic: string, message: string): void {
    try {
      const [, , deviceId] = topic.split('/');
      const state: unknown = JSON.parse(message);
      this.core.log(`Received MQTT state for ${deviceId}`);
      this.core.emit('mqtt:state', { deviceId, state });
    } catch (error) {
      this.core.log(`Error processing MQTT message: ${error instanceof Error ? error.message : String(error)}`, 'error');
    }
  }

  publishState(deviceId: string, state: unknown): void {
    if (!this.client) throw new Error('MQTT client is not connected');
    this.client.publish(`smart-home/${deviceId}/state`, JSON.stringify(state));
  }

  async destroy(): Promise<void> {
    this.client?.end();
    this.client = null;
  }
}
