import { createHash, randomBytes } from 'node:crypto';
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { hostname } from 'node:os';
import path from 'node:path';

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
  /** Verifies a Vuesp user token and returns a long-lived LAN token. */
  mobileSession(accessToken: string): Promise<MobileSession>;
  /** Verifies a LAN token issued by this hub. */
  verifyMobileToken(token: string): MobileTokenRecord | null;
  /** Hub data for a paired mobile client. */
  mobileHub(): Promise<MobileHub>;
  /** Applies a tile action without a cloud WebSocket round-trip. */
  action(deviceId: string, tileId: string, tileKey: string, value: unknown): Promise<{ ok: boolean; error?: string; at?: number }>;
}

export interface MobileSession {
  token: string;
  hubId: string | null;
  name: string | null;
}

export interface MobileHub {
  id: string | null;
  name: string | null;
  status: 'active';
  devices: number;
  lastSeenAt: string | null;
  lastSnapshotAt: string | null;
  installedAt: string | null;
  platform: string | null;
  installationId: string | null;
  devicesList: Array<{
    hubId: string;
    deviceId: string;
    name: string;
    ip: string;
    state: Record<string, unknown>;
    tiles: PublicDashboardTile[];
    observedAt: string;
    receivedAt: string;
  }>;
}

export interface MobileTokenRecord {
  tokenHash: string;
  userId: string;
  userName: string;
  createdAt: string;
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

  const mobileFilePath = path.join(dataDirectory, 'mobile.json');
  const readMobileTokens = (): MobileTokenRecord[] => {
    try {
      if (!existsSync(mobileFilePath)) return [];
      const parsed = JSON.parse(readFileSync(mobileFilePath, 'utf8')) as { tokens?: unknown };
      if (!Array.isArray(parsed.tokens)) return [];
      return parsed.tokens.filter(
        (token): token is MobileTokenRecord =>
          isRecordValue(token) &&
          typeof token.tokenHash === 'string' &&
          typeof token.userId === 'string' &&
          typeof token.userName === 'string' &&
          typeof token.createdAt === 'string'
      );
    } catch {
      return [];
    }
  };
  const writeMobileTokens = (tokens: MobileTokenRecord[]): void => {
    mkdirSync(dataDirectory, { recursive: true, mode: 0o700 });
    writeFileSync(mobileFilePath, JSON.stringify({ tokens }, null, 2), { mode: 0o600 });
    chmodSync(mobileFilePath, 0o600);
  };
  const hashMobileToken = (token: string): string => createHash('sha256').update(token).digest('hex');

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

  const sendActionResult = (target: WebSocket, requestId: string, ok: boolean, error?: string, at?: number): void => {
    if (target.readyState !== WebSocket.OPEN) return;
    target.send(
      JSON.stringify({
        type: 'action_result',
        requestId,
        ok,
        at: at ?? Date.now(),
        ...(error ? { error } : {}),
      })
    );
  };

  const requestDeviceState = (ip?: string): void => {
    try {
      if (ip) {
        runtime.send(ip, 'INFO');
        runtime.send(ip, 'DEVICE');
        runtime.send(ip, 'PORT', { gpio: 0, command: 3 });
        return;
      }
      runtime.sendAll('INFO');
      runtime.sendAll('DEVICE');
      runtime.sendAll('PORT', { gpio: 0, command: 3 });
    } catch {
      // The device service may not be running yet.
    }
  };

  const action = async (
    deviceId: string,
    tileId: string,
    tileKey: string,
    value: unknown
  ): Promise<{ ok: boolean; error?: string; at?: number }> => {
    if (!deviceId || (!tileId && !tileKey)) return { ok: false, error: 'Invalid action payload' };
    if (value !== null && !['string', 'number', 'boolean'].includes(typeof value)) {
      return { ok: false, error: 'Unsupported action value' };
    }

    try {
      const record = (await getDeviceModel()).getAll().find(device => device.uuid === deviceId);
      if (!record) return { ok: false, error: 'Unknown device' };

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
      if (!isRecordValue(item)) return { ok: false, error: 'Unknown tile' };

      const commands = buildTileCommands(item as unknown as DashboardItem, value, sender?.getState(record.ip) ?? {});
      if (!commands.length) return { ok: false, error: 'This tile cannot be changed' };

      let ok = true;
      for (const command of commands) {
        if (!runtime.send(record.ip, command.comm, command.data)) ok = false;
      }
      if (ok) {
        // Ask the device for its new state so the cloud snapshot follows
        // immediately instead of waiting for the regular sensor debounce.
        requestDeviceState(record.ip);
        return { ok: true, at: Date.now() };
      }
      return { ok: false, error: 'Device is not connected' };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'Action failed' };
    }
  };

  const handleAction = async (target: WebSocket, message: Record<string, unknown>): Promise<void> => {
    const requestId = typeof message.requestId === 'string' ? message.requestId : '';
    if (!requestId) return;

    const deviceId = typeof message.deviceId === 'string' ? message.deviceId : '';
    const tileId = typeof message.tileId === 'string' ? message.tileId : '';
    const tileKey = typeof message.tileKey === 'string' ? message.tileKey : '';
    const result = await action(deviceId, tileId, tileKey, message.value);
    sendActionResult(target, requestId, result.ok, result.error, result.at);
  };

  const mobileSession = async (accessToken: string): Promise<MobileSession> => {
    if (!config) throw new Error('Cloud is not connected');
    const token = accessToken.trim();
    if (!token) throw new Error('Access token is required');

    const response = await fetchImpl(joinUrl(config.url, '/auth/hub/access'), {
      method: 'POST',
      headers: {
        authorization: `Bearer ${config.token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ accessToken: token }),
    });
    if (!response.ok) {
      throw new Error(response.status === 401 || response.status === 403 ? 'Access denied' : `Cloud request failed (${response.status})`);
    }

    const data = (await response.json()) as { hubId?: unknown; user?: { id?: unknown; name?: unknown } };
    const hubId = typeof data.hubId === 'string' ? data.hubId : config.hubId || null;
    const mobileToken = randomBytes(32).toString('base64url');
    const record: MobileTokenRecord = {
      tokenHash: hashMobileToken(mobileToken),
      userId: typeof data.user?.id === 'string' ? data.user.id : '',
      userName: typeof data.user?.name === 'string' ? data.user.name : '',
      createdAt: new Date().toISOString(),
    };
    writeMobileTokens([record, ...readMobileTokens()].slice(0, 20));

    return { token: mobileToken, hubId, name: config.name ?? null };
  };

  const verifyMobileToken = (token: string): MobileTokenRecord | null => {
    const value = token.trim();
    if (!value) return null;
    const hash = hashMobileToken(value);
    return readMobileTokens().find(record => record.tokenHash === hash) ?? null;
  };

  const mobileHub = async (): Promise<MobileHub> => {
    const tiles = await listTiles();
    const selected = new Set(tiles.selected);
    const hubId = config?.hubId || null;
    const now = new Date().toISOString();
    const devicesList = tiles.devices
      .map(device => ({
        ...device,
        tiles: device.tiles.filter(tile => selected.has(tile.key)),
      }))
      .filter(device => device.tiles.length > 0)
      .map(device => ({
      hubId: hubId ?? '',
      deviceId: device.deviceId,
      name: device.name,
      ip: device.ip,
      state: {},
      tiles: device.tiles,
        observedAt: now,
        receivedAt: now,
      }));

    return {
      id: hubId,
      name: config?.name ?? null,
      status: 'active',
      devices: devicesList.length,
      lastSeenAt: now,
      lastSnapshotAt: now,
      installedAt: null,
      platform: 'Vuesp Hub · LAN',
      installationId: null,
      devicesList,
    };
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

  return {
    status,
    start,
    stop,
    startPairing,
    disconnect,
    listTiles,
    setPublishedTiles,
    mobileSession,
    verifyMobileToken,
    mobileHub,
    action,
  };
};
