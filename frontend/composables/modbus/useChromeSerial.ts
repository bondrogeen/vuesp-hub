interface SerialOptions {
  baudRate: number;
  dataBits?: number;
  stopBits?: number;
  parity?: string;
  bufferSize?: number;
  flowControl?: string;
}

interface SerialPortInfo {
  usbProductId?: number;
  usbVendorId?: number;
}

interface ChromeSerialPort {
  getInfo(): SerialPortInfo;
  open(options: SerialOptions): Promise<void>;
  close(): Promise<void>;
  readable: ReadableStream<Uint8Array> | null;
  writable: WritableStream<Uint8Array> | null;
}

interface SerialNavigator extends Navigator {
  serial?: {
    requestPort(): Promise<ChromeSerialPort>;
  };
}

export const useChromeSerial = (onSend: (data: Uint8Array) => void) => {
  let port: ChromeSerialPort | null = null;
  let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  let writer: WritableStreamDefaultWriter<Uint8Array> | null = null;

  const readData = async () => {
    const readable = port?.readable;
    if (!readable) return;

    const currentReader = readable.getReader();
    reader = currentReader;

    try {
      while (true) {
        const { value, done } = await currentReader.read();
        if (done) break;
        if (value) onSend(value);
      }
    } catch (error) {
      console.error(error);
    } finally {
      currentReader.releaseLock();
      if (reader === currentReader) reader = null;
    }
  };

  const connectChrome = async (options: SerialOptions) => {
    try {
      const serial = (navigator as SerialNavigator).serial;
      if (!serial) return;

      port = await serial.requestPort();
      await port.open(options);
      await readData();
    } catch (error) {
      console.error(error);
    }
  };

  const onWriteChrome = async (arr: number[]) => {
    try {
      if (!writer) {
        const writable = port?.writable;
        if (!writable) return;
        writer = writable.getWriter();
      }

      const data = new Uint8Array(arr);
      await writer.write(data);
    } catch (error) {
      console.error(error);
    }
  };

  const disconnectChrome = async () => {
    try {
      await reader?.cancel();
      reader = null;
      await writer?.close();
      writer = null;
      await port?.close();
      port = null;
    } catch (error) {
      console.error(error);
    }
  };

  return { connectChrome, disconnectChrome, onWriteChrome };
};
