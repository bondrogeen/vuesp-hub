import { hostname } from 'node:os';

import WebSocket from 'ws';

import { readOrCreateHubId, TelemetrySender, type TelemetryDeviceModel, type TelemetryDevicePayload, type TelemetryEventSource, type TelemetryPayload } from '@server/modules/telemetry/application/telemetrySender.ts';
import type { SecretProvider } from '@shared/secrets/secretProvider.ts';
import { buildTileCommands, resolvePublicTiles, type CloudTileGroup, type CloudTilesResult, type PublicDashboardTile } from '@root/shared/dashboardTiles.ts';
import { isRecordValue } from '@root/shared/device.ts';
import type { DashboardItem } from 'vuesp-dashboard-core';
import { createCloudConfigStore, type CloudConfig, type CloudConfigStore } from '../infrastructure/cloudConfigStore.ts';

const DEFAULT_CLOUD_URL = 'https://api.vuesp.ru';
const PAIR_POLL_MS = 2000;
const HEARTBEAT_MS = 30_000;
const RECONNECT_MIN_MS = 2000;
const RECONNECT_MAX_MS = 60_000;

/**
 * MVP guard: a hub publishes at most this many tiles to the cloud. The limit
 * keeps cloud snapshots bounded while the per-tile selection UI is being built.
 */
export const MAX_PUBLISHED_TILES = 20;

export type CloudState = 'disconnected' | 'pairing' | 'connected' | 'error';

export interface CloudStatus {
  state: CloudState;
  connected: boolean;
  pairing: boolean;
  hubId: string | null;
  name: string | null;
  url: string | null;
  code?: string;
  expiresAt?: string;
  lastError?: string;
  lastHeartbeat?: string;
}

export interface CloudService {
  status(): CloudStatus;
  start(): void;
  stop(): Promise<void>;
  startPairing(): Promise<CloudStatus>;
  disconnect(): Promise<CloudStatus>;
  /** All resolvable tiles plus the current publication selection. */
  listTiles(): Promise<CloudTilesResult>;
  /** Replaces the allowlist of published tile keys. */
  setPublishedTiles(keys: string[]): Promise<CloudStatus>;
}

export interface CloudServiceOptions {
  dataDirectory: string;
  secretProvider: SecretProvider;
  runtime: CloudRuntime;
  getDeviceModel: () => Promise<TelemetryDeviceModel>;
  bootstrap?: { url: string; token: string; hubName?: string };
  fetchImpl?: typeof fetch;
}

/** The cloud channel needs the runtime's event stream plus device list/commands. */
export interface CloudRuntime extends TelemetryEventSource {
  getList(): unknown[];
  send(target: string, command: string, data?: Record<string, unknown>): boolean;
  sendAll(command: string, data?: Record<string, unknown>): boolean;
}

/** Outbound snapshot: tiles only, never the raw device state. */
type CloudDevicePayload = Omit<TelemetryDevicePayload, 'state'> & { tiles: PublicDashboardTile[] };
type CloudPayload = Omit<TelemetryPayload, 'devices'> & { devices: CloudDevicePayload[] };

interface PairingState {
  sessionId: string;
  secret: string;
  code: string;
  expiresAt: string;
  timer: ReturnType<typeof setInterval>;
}

const joinUrl = (base: string, path: string): string => `${base.replace(/\/+$/, '')}${path}`;

const toSocketUrl = (base: string): string => {
  const url = new URL(base);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.pathname = '/hub';
  url.search = '';
  url.hash = '';
  return url.toString();
};

export const createCloudService = ({
  dataDirectory,
  secretProvider,
  runtime,
  getDeviceModel,
  bootstrap,
  fetchImpl = fetch,
}: CloudServiceOptions): CloudService => {
  const store: CloudConfigStore = createCloudConfigStore({ dataDirectory, secretProvider });
  const localHubId = readOrCreateHubId(dataDirectory);
  const baseUrl = (bootstrap?.url ?? DEFAULT_CLOUD_URL).replace(/\/+$/, '');

  let config: CloudConfig | null = null;
  let pairing: PairingState | null = null;
  let sender: TelemetrySender | null = null;
  let socket: WebSocket | null = null;
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  let reconnect: ReturnType<typeof setTimeout> | undefined;
  let reconnectDelay = RECONNECT_MIN_MS;
  let stopped = true;
  let state: CloudState = 'disconnected';
  let lastError = '';
  let lastHeartbeat = '';

  const status = (): CloudStatus => ({
    state,
    connected: state === 'connected',
    pairing: state === 'pairing',
    hubId: config?.hubId || null,
    name: config?.name ?? null,
    url: config?.url ?? baseUrl,
    ...(pairing ? { code: pairing.code, expiresAt: pairing.expiresAt } : {}),
    ...(lastError ? { lastError } : {}),
    ...(lastHeartbeat ? { lastHeartbeat } : {}),
  });

  const stopHeartbeat = (): void => {
    if (heartbeat) clearInterval(heartbeat);
    heartbeat = undefined;
  };

  const stopReconnect = (): void => {
    if (reconnect) clearTimeout(reconnect);
    reconnect = undefined;
  };

  const stopPairing = (): void => {
    if (pairing) clearInterval(pairing.timer);
    pairing = null;
    if (state === 'pairing') state = config ? 'connected' : 'disconnected';
  };

  const closeSocket = (): void => {
    stopHeartbeat();
    if (socket) {
      socket.removeAllListeners();
      try {
        socket.close();
      } catch {
        // Ignore close errors during shutdown.
      }
    }
    socket = null;
  };

  const stopSender = (): void => {
    sender?.stop();
    sender = null;
  };

  const readDeviceList = (): Map<string, Record<string, unknown>> => {
    const map = new Map<string, Record<string, unknown>>();
    try {
      for (const entry of runtime.getList()) {
        if (isRecordValue(entry) && typeof entry.ip === 'string') map.set(entry.ip, entry);
      }
    } catch {
      // The device service may be stopped while the cloud channel is connected.
    }
    return map;
  };

  /**
   * Publishes the selected tiles (or the first 20 for older hubs without an
   * allowlist). Registry and tile order are stable, so the same tiles are
   * selected on each flush. Only resolved presentation data leaves the hub.
   */
  const buildPublishedTiles = async (): Promise<Map<string, PublicDashboardTile[]>> => {
    const selected = new Map<string, PublicDashboardTile[]>();
    const list = readDeviceList();
    const records = (await getDeviceModel()).getAll();

    const allowed = Array.isArray(config?.publishedTiles) ? new Set(config.publishedTiles) : null;
    let remaining = MAX_PUBLISHED_TILES;

    for (const record of records) {
      if (remaining <= 0) break;
      const entry = list.get(record.ip);
      const resolved = resolvePublicTiles(entry?.list, sender?.getState(record.ip) ?? {}, record.uuid);
      const tiles = (allowed ? resolved.filter(tile => allowed.has(tile.key)) : resolved).slice(0, remaining);
      if (!tiles.length) continue;
      selected.set(record.ip, tiles);
      remaining -= tiles.length;
    }
    return selected;
  };

  const listTiles = async (): Promise<CloudTilesResult> => {
    const list = readDeviceList();
    const records = (await getDeviceModel()).getAll();

    const devices: CloudTileGroup[] = records.map(record => ({
      deviceId: record.uuid,
      name: record.name || record.ip,
      ip: record.ip,
      online: list.has(record.ip),
      tiles: resolvePublicTiles(list.get(record.ip)?.list, sender?.getState(record.ip) ?? {}, record.uuid),
    }));

    const defaults = devices
      .flatMap(device => device.tiles.map(tile => tile.key))
      .slice(0, MAX_PUBLISHED_TILES);

    return {
      devices,
      selected: (Array.isArray(config?.publishedTiles) ? config.publishedTiles : defaults).slice(0, MAX_PUBLISHED_TILES),
      max: MAX_PUBLISHED_TILES,
    };
  };

  const setPublishedTiles = async (keys: string[]): Promise<CloudStatus> => {
    if (!config) throw new Error('Cloud is not connected');

    const unique = [...new Set(keys.map(key => key.trim()).filter(Boolean))];
    if (unique.length > MAX_PUBLISHED_TILES) {
      throw new Error(`At most ${MAX_PUBLISHED_TILES} tiles can be published`);
    }

    config = { ...config, publishedTiles: unique };
    store.write(config);
    sender?.resend();
    return status();
  };

  const sendActionResult = (target: WebSocket, requestId: string, ok: boolean, error?: string): void => {
    if (target.readyState !== WebSocket.OPEN) return;
    target.send(JSON.stringify({ type: 'action_result', requestId, ok, at: Date.now(), ...(error ? { error } : {}) }));
  };

  const requestDeviceState = (): void => {
    try {
      runtime.sendAll('INFO');
      runtime.sendAll('DEVICE');
      runtime.sendAll('PORT', { gpio: 0, command: 3 });
    } catch {
      // The device service may not be running yet.
    }
  };

  const handleAction = async (target: WebSocket, message: Record<string, unknown>): Promise<void> => {
    const requestId = typeof message.requestId === 'string' ? message.requestId : '';
    if (!requestId) return;

    const deviceId = typeof message.deviceId === 'string' ? message.deviceId : '';
    const tileId = typeof message.tileId === 'string' ? message.tileId : '';
    const tileKey = typeof message.tileKey === 'string' ? message.tileKey : '';
    const value = message.value;

    if (!deviceId || (!tileId && !tileKey)) {
      sendActionResult(target, requestId, false, 'Invalid action payload');
      return;
    }
    if (value !== null && !['string', 'number', 'boolean'].includes(typeof value)) {
      sendActionResult(target, requestId, false, 'Unsupported action value');
      return;
    }

    try {
      const record = (await getDeviceModel()).getAll().find(device => device.uuid === deviceId);
      if (!record) {
        sendActionResult(target, requestId, false, 'Unknown device');
        return;
      }

      const entry = readDeviceList().get(record.ip);
      const items = Array.isArray(entry?.list) ? entry.list : [];

      // Dashboard ids are not unique (e.g. two `device.status3` rows on the BMS),
      // so prefer the unique key and fall back to the id for older clients.
      let item: unknown;
      if (tileKey) {
        item = items.find(
          (candidate, index) => isRecordValue(candidate) && `${record.uuid}:${index}` === tileKey
        );
      }
      if (!isRecordValue(item) && tileId) {
        item = items.find(candidate => isRecordValue(candidate) && candidate.id === tileId);
      }
      if (!isRecordValue(item)) {
        sendActionResult(target, requestId, false, 'Unknown tile');
        return;
      }

      const commands = buildTileCommands(item as unknown as DashboardItem, value, sender?.getState(record.ip) ?? {});
      if (!commands.length) {
        sendActionResult(target, requestId, false, 'This tile cannot be changed');
        return;
      }

      let ok = true;
      for (const command of commands) {
        if (!runtime.send(record.ip, command.comm, command.data)) ok = false;
      }
      sendActionResult(target, requestId, ok, ok ? undefined : 'Device is not connected');
    } catch (error) {
      sendActionResult(target, requestId, false, error instanceof Error ? error.message : 'Action failed');
    }
  };

  const sendPayload = async (payload: TelemetryPayload): Promise<void> => {
    if (!config) return;

    const published = await buildPublishedTiles();
    const outbound: CloudPayload = {
      hubId: payload.hubId,
      hubName: payload.hubName,
      observedAt: payload.observedAt,
      devices: payload.devices.map(({ state: _state, ...device }) => ({
        ...device,
        tiles: published.get(device.ip) ?? [],
      })),
    };

    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'snapshot', ...outbound }));
      return;
    }

    const response = await fetchImpl(joinUrl(config.url, '/telemetry/snapshots'), {
      method: 'POST',
      headers: {
        authorization: `Bearer ${config.token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(outbound),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
  };

  const scheduleReconnect = (): void => {
    if (stopped || !config || reconnect) return;
    state = 'disconnected';
    reconnect = setTimeout(() => {
      reconnect = undefined;
      openSocket();
    }, reconnectDelay);
    reconnect.unref?.();
    reconnectDelay = Math.min(reconnectDelay * 2, RECONNECT_MAX_MS);
  };

  const openSocket = (): void => {
    if (stopped || !config) return;
    closeSocket();

    try {
      const ws = new WebSocket(toSocketUrl(config.url), {
        headers: { authorization: `Bearer ${config.token}` },
      });
      socket = ws;

      ws.on('open', () => {
        if (socket !== ws) return;
        state = 'connected';
        lastError = '';
        reconnectDelay = RECONNECT_MIN_MS;
        lastHeartbeat = new Date().toISOString();
        ws.send(JSON.stringify({ type: 'hello', hubName: config?.name, installationId: localHubId, platform: process.platform }));
        // Ask devices for their current state; the cloud dashboard may be the
        // only client, so it cannot rely on the local UI to request it.
        requestDeviceState();
        // Device dashboards are loaded asynchronously after the runtime starts;
        // republish once they are likely ready so the cloud receives tile lists.
        const resync = setTimeout(() => {
          if (socket !== ws) return;
          requestDeviceState();
          sender?.resend();
        }, 5000);
        resync.unref?.();
        stopHeartbeat();
        heartbeat = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'heartbeat', at: Date.now() }));
          }
        }, HEARTBEAT_MS);
        heartbeat.unref?.();
      });

      ws.on('message', raw => {
        if (socket !== ws) return;
        try {
          const message = JSON.parse(raw.toString()) as Record<string, unknown>;
          if (message.type === 'heartbeat_ack') lastHeartbeat = new Date().toISOString();
          if (message.type === 'error' && typeof message.message === 'string') {
            lastError = message.message;
            console.warn(`Cloud channel error: ${message.message}`);
          }
          if (message.type === 'action') void handleAction(ws, message);
        } catch {
          // Ignore malformed server frames.
        }
      });

      ws.on('close', () => {
        if (socket !== ws) return;
        socket = null;
        stopHeartbeat();
        scheduleReconnect();
      });

      ws.on('error', error => {
        if (socket !== ws) return;
        lastError = error.message;
        state = 'error';
      });
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      state = 'error';
      scheduleReconnect();
    }
  };

  const connect = (): void => {
    if (!config) return;
    stopSender();
    sender = new TelemetrySender({
      runtime,
      getDeviceModel,
      url: config.url,
      token: config.token,
      hubName: config.name,
      dataDirectory,
      fetchImpl,
      transport: sendPayload,
    });
    sender.start();
    openSocket();
  };

  const pollPairing = async (): Promise<void> => {
    if (!pairing) return;
    try {
      const response = await fetchImpl(joinUrl(baseUrl, `/hub/pair/sessions/${encodeURIComponent(pairing.sessionId)}`), {
        headers: { 'x-pair-secret': pairing.secret },
      });
      if (!response.ok) {
        lastError = response.status === 404 ? 'Pairing code expired' : `Pairing request failed (${response.status})`;
        stopPairing();
        state = 'error';
        return;
      }
      const result = (await response.json()) as { status?: string; token?: string; hubId?: string; name?: string };
      if (result.status !== 'linked' || !result.token || !result.hubId) return;

      config = {
        url: baseUrl,
        hubId: result.hubId,
        name: result.name || hostname(),
        token: result.token,
        pairedAt: new Date().toISOString(),
      };
      try {
        store.write(config);
      } catch {
        lastError = 'Secure storage is unavailable; the cloud token is kept in memory only';
      }
      stopPairing();
      state = 'disconnected';
      connect();
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  };

  const startPairing = async (): Promise<CloudStatus> => {
    if (pairing) return status();
    stopReconnect();
    stopSender();
    closeSocket();
    state = 'pairing';
    lastError = '';

    try {
      const response = await fetchImpl(joinUrl(baseUrl, '/hub/pair/start'), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: hostname(), installationId: localHubId, platform: process.platform }),
      });
      if (!response.ok) throw new Error(`Pairing request failed (${response.status})`);
      const result = (await response.json()) as { sessionId: string; secret: string; code: string; expiresAt: string };
      const timer = setInterval(() => void pollPairing(), PAIR_POLL_MS);
      timer.unref?.();
      pairing = { ...result, timer };
      return status();
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      state = 'error';
      return status();
    }
  };

  const disconnect = async (): Promise<CloudStatus> => {
    stopPairing();
    stopReconnect();
    stopSender();
    closeSocket();
    store.clear();
    config = null;
    state = 'disconnected';
    lastError = '';
    lastHeartbeat = '';
    return status();
  };

  const start = (): void => {
    if (!stopped) return;
    stopped = false;
    config = store.read();
    if (!config && bootstrap?.token) {
      config = {
        url: baseUrl,
        hubId: '',
        name: bootstrap.hubName || hostname(),
        token: bootstrap.token,
        pairedAt: new Date().toISOString(),
      };
      try {
        store.write(config);
      } catch {
        // If secure storage is unavailable, keep the bootstrap config in memory.
      }
    }
    if (config) connect();
  };

  const stop = async (): Promise<void> => {
    stopped = true;
    stopPairing();
    stopReconnect();
    stopSender();
    closeSocket();
  };

  return { status, start, stop, startPairing, disconnect, listTiles, setPublishedTiles };
};
