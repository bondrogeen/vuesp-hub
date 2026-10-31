interface LightDevice {
  id: string;
  type: string;
}

interface SunriseDeviceManager {
  getAllDevices(): LightDevice[];
  updateDeviceState(id: string, state: { on?: boolean; brightness?: number }): void;
}

export const scheduleSunrise = (deviceManager: SunriseDeviceManager): void => {
  const now = new Date();
  const targetTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 7, 0, 0);
  if (now > targetTime) targetTime.setDate(targetTime.getDate() + 1);

  setTimeout(() => {
    const lights = deviceManager.getAllDevices().filter(device => device.type === 'light');
    for (const light of lights) {
      deviceManager.updateDeviceState(light.id, { on: true, brightness: 0 });
      let brightness = 0;
      const interval = setInterval(() => {
        brightness += 5;
        if (brightness > 100) {
          clearInterval(interval);
          return;
        }
        deviceManager.updateDeviceState(light.id, { brightness });
      }, 1000);
    }
  }, targetTime.getTime() - now.getTime());
};