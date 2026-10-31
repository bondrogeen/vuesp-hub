declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string;

interface Window {
  YaAuthSuggest: {
    init(
      options: { client_id: string; response_type: string; redirect_uri: string },
      loginUrl: string,
    ): Promise<{ handler: () => Promise<unknown> }>;
  };
}

interface Navigator {
  serial?: {
    requestPort(): Promise<{
      getInfo(): { usbProductId?: number; usbVendorId?: number };
      open(options: { baudRate: number; bufferSize?: number; dataBits?: number; parity?: string; stopBits?: number }): Promise<void>;
      close(): Promise<void>;
      readable: ReadableStream<Uint8Array> | null;
      writable: WritableStream<Uint8Array> | null;
    }>;
  };
}

declare module 'vue-router/auto-routes' {
  export const routes: import('vue-router').RouteRecordRaw[];
  export function handleHotUpdate(router: import('vue-router').Router): void;
}
