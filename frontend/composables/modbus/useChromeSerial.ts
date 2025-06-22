export const useChromeSerial = (onSend: (data: any) => void) => {
  let port;
  let reader;
  let writer;

  const connectChrome = async (options) => {
    try {
      if (!navigator?.serial) return;
      port = await navigator.serial.requestPort();
      const { usbProductId, usbVendorId } = port.getInfo();
      console.log(usbProductId, usbVendorId);
      await port.open(options);
      readData();
    } catch (error) {
      console.error(error);
    }
  };

  const readData = async () => {
    try {
      reader = port.readable.getReader();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        onSend(value);
      }
    } catch (error) {
      console.error(error);
    } finally {
      reader?.releaseLock();
    }
  };

  const onWriteChrome = async (arr: number[]) => {
    try {
      if (!writer) writer = port.writable.getWriter();

      const data = new Uint8Array(arr);
      await writer.write(data);
    } catch (error) {
      console.error(error);
    }
  };

  const disconnectChrome = async () => {
    try {
      await reader?.cancel();
      await writer?.close();
      await port?.close();
    } catch (error) {
      console.error(error);
    }
  };

  return { connectChrome, disconnectChrome, onWriteChrome };
};
