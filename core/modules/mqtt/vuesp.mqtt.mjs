// import mqtt from 'mqtt';

export default class MqttModule {
    constructor(core) {
        this.core = core;
        this.client = null;
        this.config = {
            host: 'mqtt://localhost',
            port: 1883,
            username: '',
            password: ''
        };
    }

    async init() {
        try {
            this.client = mqtt.connect(this.config.host, {
                port: this.config.port,
                username: this.config.username,
                password: this.config.password
            });

            this.client.on('connect', () => {
                this.core.log('MQTT connected');
                this.client.subscribe('smart-home/+/control');
            });

            this.client.on('message', (topic, message) => {
                this.handleMessage(topic, message.toString());
            });

            this.client.on('error', (error) => {
                this.core.log(`MQTT error: ${error.message}`, 'error');
            });

            // Регистрируем сервис
            this.core.registerService('mqtt', this);
            this.core.log('MQTT module initialized');
        } catch (error) {
            this.core.log(`MQTT initialization failed: ${error.message}`, 'error');
        }
    }

    handleMessage(topic, message) {
        try {
            const [, , deviceId] = topic.split('/');
            const state = JSON.parse(message);

            const deviceManager = this.core.getService('device-manager');
            if (deviceManager && deviceManager.updateDeviceState(deviceId, state)) {
                this.core.log(`Device updated via MQTT: ${deviceId}`);
            }
        } catch (error) {
            this.core.log(`Error processing MQTT message: ${error.message}`, 'error');
        }
    }

    publishState(deviceId, state) {
        const topic = `smart-home/${deviceId}/state`;
        this.client.publish(topic, JSON.stringify(state));
        this.core.log(`State published to MQTT: ${deviceId}`, 'debug');
    }

    async destroy() {
        if (this.client) {
            this.client.end();
            this.core.log('MQTT connection closed');
        }
    }
}