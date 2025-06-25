// Автоматическое включение света утром
const deviceManager = core.getService('device-manager');
const lighting = core.getService('lighting');

if (!deviceManager || !lighting) {
    throw new Error('Required services not available');
}

// Имитация восхода солнца
function simulateSunrise() {
    const lights = deviceManager.getAllDevices().filter(d => d.type === 'light');
    
    lights.forEach(light => {
        deviceManager.updateDeviceState(light.id, { on: true, brightness: 0 });
        
        // Плавное увеличение яркости
        let brightness = 0;
        const interval = setInterval(() => {
            brightness += 5;
            if (brightness > 100) {
                clearInterval(interval);
            } else {
                deviceManager.updateDeviceState(light.id, { brightness });
            }
        }, 1000);
    });
}

// Запуск каждое утро в 7:00
const now = new Date();
const targetTime = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    7, 0, 0
);

if (now > targetTime) {
    targetTime.setDate(targetTime.getDate() + 1);
}

const delay = targetTime - now;
setTimeout(simulateSunrise, delay);