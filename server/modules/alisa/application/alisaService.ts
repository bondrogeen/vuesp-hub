import { createHash, randomUUID } from 'node:crypto';
import YandexDevices from 'alisa-npm';

import type { SecretProvider } from '@shared/secrets/secretProvider.ts';
import { createAlisaTokenStore } from '@server/modules/alisa/infrastructure/alisaTokenStore.ts';
import { createPassportQrLogin, type PassportQrLogin, type QrLoginStart } from '@server/modules/alisa/infrastructure/yandexPassport.ts';

export interface AlisaDevice {
  id: string;
  ip: string;
  platform: string;
  port: number;
  connected: boolean;
  accountId?: string;
  accountLogin?: string | null;
}

export interface AlisaMessage {
  id: string;
  ip: string;
  platform: string;
  port: number;
  connected: boolean;
  type: string;
  data?: {
    state?: {
      aliceState?: string;
      playing?: boolean;
      volume?: number;
      playerState?: { title?: string; extra?: { coverURI?: string } };
    };
  };
}

export interface AlisaAccountState {
  id: string;
  login: string | null;
  token: boolean;
  devicesCount: number;
  initError: string | null;
  persisted: boolean;
  persistError: string | null;
}

export interface AlisaState {
  token: boolean;
  accounts: AlisaAccountState[];
  devices: AlisaDevice[];
  localDevices: AlisaDevice[];
  cloudDevices: unknown[];
  data: Record<string, AlisaMessage>;
  configured: boolean;
  qrEnabled: boolean;
  login: string | null;
  expiresAt: string | null;
  persisted: boolean;
  initError: string | null;
  persistError: string | null;
}

export interface AlisaQrStatus {
  status: 'pending' | 'ok';
  state: AlisaState;
}

export interface AlisaMusicPlaylist {
  id: string;
  title: string;
  trackCount: number;
  coverUrl: string | null;
}

export interface AlisaMusicTrack {
  id: string;
  title: string;
  artists: string;
  durationMs: number;
  coverUrl: string | null;
  available: boolean;
  liked?: boolean;
}

export interface AlisaMusicCollection extends AlisaMusicPlaylist {
  source: string;
}

export interface AlisaWaveBatch {
  tracks: AlisaMusicTrack[];
  batchId: string | null;
  lastTrackId: string | null;
}

export interface SmartHomeCapability {
  type: string;
  instance: string | null;
  retrievable: boolean;
  state: unknown;
  range?: { min: number; max: number; precision: number };
  modes?: string[];
  unit?: string;
}

export interface SmartHomeProperty {
  type: string;
  instance: string | null;
  value: unknown;
  unit?: string;
}

export interface SmartHomeDevice {
  id: string;
  name: string;
  type: string;
  room: string | null;
  capabilities: SmartHomeCapability[];
  properties: SmartHomeProperty[];
}

export interface SmartHomeState {
  rooms: Array<{ id: string; name: string }>;
  devices: SmartHomeDevice[];
}

export interface AlisaStreamResponse {
  status: number;
  headers: Record<string, string>;
  body: ReadableStream<Uint8Array> | null;
}

export interface AlisaService {
  state(userId: number): Promise<AlisaState>;
  startQr(userId: number): Promise<QrLoginStart>;
  pollQr(userId: number, id: string): Promise<AlisaQrStatus>;
  init(userId: number, token: string): Promise<AlisaState>;
  forget(userId: number, accountId?: string): Promise<AlisaState>;
  scan(userId: number): Promise<AlisaDevice[]>;
  connect(userId: number, accountId?: string): Promise<AlisaState>;
  disconnect(userId: number, accountId?: string): Promise<AlisaState>;
  send(userId: number, deviceId: string, payload: unknown): void;
  musicPlaylists(userId: number, accountId?: string): Promise<AlisaMusicPlaylist[]>;
  musicCollections(userId: number, accountId?: string): Promise<AlisaMusicCollection[]>;
  musicTracks(userId: number, accountId: string | undefined, playlistId: string): Promise<AlisaMusicTrack[]>;
  musicWave(userId: number, accountId?: string, queue?: string): Promise<AlisaWaveBatch>;
  musicWaveFeedback(userId: number, accountId: string, type: string, batchId?: string, trackId?: string, totalPlayedSeconds?: number): Promise<void>;
  likeTrack(userId: number, accountId: string, trackId: string, liked: boolean): Promise<void>;
  playWave(userId: number, accountId: string, deviceId: string): void;
  playPlaylist(userId: number, accountId: string, deviceId: string, playlistId: string): void;
  playTrack(userId: number, accountId: string, deviceId: string, trackId: string): void;
  smartHome(userId: number, accountId?: string): Promise<SmartHomeState>;
  smartHomeAction(userId: number, accountId: string, deviceId: string, type: string, state: Record<string, unknown>): Promise<void>;
  createStreamToken(userId: number, accountId: string, trackId: string): Promise<{ url: string }>;
  streamTrack(key: string, range?: string): Promise<AlisaStreamResponse>;
  dispose(): void;
}

const QUASAR_HOSTS = ['quasar.yandex.net', 'quasar.yandex.ru', 'quasar.yandex.com'];

interface MusicAccountStatus {
  result?: { account?: { uid?: number; login?: string } };
}

interface MusicPlaylistRaw {
  uid?: number;
  kind?: number;
  title?: string;
  trackCount?: number;
  cover?: { itemsUri?: string[] };
  ogImage?: string;
}

interface MusicTrackRaw {
  id?: string | number;
  title?: string;
  available?: boolean;
  durationMs?: number;
  coverUri?: string;
  albums?: Array<{ coverUri?: string }>;
  artists?: Array<{ name?: string }>;
}

interface MusicLandingEntity {
  type?: string;
  data?: Record<string, unknown>;
}

interface MusicLandingBlock {
  title?: string;
  type?: string;
  entities?: MusicLandingEntity[];
}

interface MusicLandingResponse {
  result?: { blocks?: MusicLandingBlock[] };
}

interface MusicRotorItem {
  type?: string;
  track?: MusicTrackRaw;
  liked?: boolean;
}

interface MusicRotorResponse {
  result?: {
    sequence?: MusicRotorItem[];
    batchId?: string;
  };
}

interface SmartHomeRawCapability {
  type?: unknown;
  retrievable?: unknown;
  state?: unknown;
  parameters?: {
    instance?: unknown;
    unit?: unknown;
    range?: { min?: unknown; max?: unknown; precision?: unknown };
    modes?: Array<{ value?: unknown }>;
  };
}

interface SmartHomeRawProperty {
  type?: unknown;
  parameters?: { instance?: unknown; unit?: unknown };
  state?: { value?: unknown } | null;
}

interface SmartHomeRawDevice {
  id?: unknown;
  name?: unknown;
  type?: unknown;
  room?: unknown;
  capabilities?: SmartHomeRawCapability[];
  properties?: SmartHomeRawProperty[];
}

interface SmartHomeUserInfo {
  rooms?: Array<{ id?: unknown; name?: unknown }>;
  devices?: SmartHomeRawDevice[];
}

interface Session {
  id: string;
  alisa: YandexDevices;
  token: string;
  data: Record<string, AlisaMessage>;
  login: string | null;
  expiresAt: string | null;
  persisted: boolean;
  persistError: string | null;
  initError: string | null;
  initialized: boolean;
}

const emptyState = (): AlisaState => ({
  token: false,
  accounts: [],
  devices: [],
  localDevices: [],
  cloudDevices: [],
  data: {},
  configured: true,
  qrEnabled: true,
  login: null,
  expiresAt: null,
  persisted: false,
  initError: null,
  persistError: null,
});

export const createAlisaService = ({
  dataDirectory,
  secretProvider,
}: {
  dataDirectory: string;
  secretProvider: SecretProvider;
}): AlisaService => {
  const store = createAlisaTokenStore({ dataDirectory });
  const qrLogin: PassportQrLogin = createPassportQrLogin();
  const sessions = new Map<number, Map<string, Session>>();
  const qrOwners = new Map<string, number>();
  const musicUid = new Map<string, number>();
  const musicCache = new Map<string, { at: number; playlists: AlisaMusicPlaylist[] }>();
  const musicCollectionsCache = new Map<string, { at: number; collections: AlisaMusicCollection[] }>();
  const smartHomeCache = new Map<string, { at: number; data: SmartHomeState }>();
  const streamKeys = new Map<string, { userId: number; accountId: string; trackId: string; expiresAt: number }>();
  const directLinks = new Map<string, { at: number; url: string }>();

  let quasarHost = 0;
  let quasarHostUntil = 0;

  const fetchQuasar = async (path: string, token: string): Promise<Record<string, unknown>> => {
    if (!token) throw new Error('Yandex token is missing');
    if (Date.now() > quasarHostUntil) quasarHost = 0;

    let lastError = '';
    for (let offset = 0; offset < QUASAR_HOSTS.length; offset += 1) {
      const index = (quasarHost + offset) % QUASAR_HOSTS.length;
      const host = QUASAR_HOSTS[index];
      try {
        const response = await fetch(`https://${host}${path}`, {
          headers: {
            Authorization: `OAuth ${token}`,
            'X-Yandex-Token': token,
            'User-Agent': 'vuesp-hub',
          },
          signal: AbortSignal.timeout(15_000),
        });
        const text = await response.text();
        if (response.status === 429) {
          lastError = 'Yandex API rate limit (429)';
          continue;
        }
        if (!response.ok) {
          lastError = `Yandex API request failed (${response.status})`;
          continue;
        }
        const parsed = JSON.parse(text) as Record<string, unknown>;
        if (parsed.status === 'error') {
          lastError = typeof parsed.error === 'string' ? parsed.error : 'Yandex API request failed';
          continue;
        }
        quasarHost = index;
        quasarHostUntil = Date.now() + 60_000;
        return parsed;
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
      }
    }

    throw new Error(lastError || 'Yandex API is unavailable');
  };

  const fetchMusic = async <T>(path: string, token: string): Promise<T> => {
    const response = await fetch(`https://api.music.yandex.net${path}`, {
      headers: {
        Authorization: `OAuth ${token}`,
        'User-Agent': 'vuesp-hub',
      },
      signal: AbortSignal.timeout(15_000),
    });
    if (response.status === 429) throw new Error('Yandex Music rate limit (429)');
    if (!response.ok) throw new Error(`Yandex Music request failed (${response.status})`);
    return (await response.json()) as T;
  };

  const postMusic = async <T>(path: string, token: string, body: unknown): Promise<T> => {
    const response = await fetch(`https://api.music.yandex.net${path}`, {
      method: 'POST',
      headers: {
        Authorization: `OAuth ${token}`,
        'User-Agent': 'vuesp-hub',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });
    if (response.status === 429) throw new Error('Yandex Music rate limit (429)');
    if (!response.ok) throw new Error(`Yandex Music request failed (${response.status})`);
    const text = await response.text();
    if (!text) return {} as T;
    return JSON.parse(text) as T;
  };

  const postMusicForm = async <T>(path: string, token: string, body: Record<string, string>): Promise<T> => {
    const response = await fetch(`https://api.music.yandex.net${path}`, {
      method: 'POST',
      headers: {
        Authorization: `OAuth ${token}`,
        'User-Agent': 'vuesp-hub',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(body).toString(),
      signal: AbortSignal.timeout(15_000),
    });
    if (response.status === 429) throw new Error('Yandex Music rate limit (429)');
    if (!response.ok) throw new Error(`Yandex Music request failed (${response.status})`);
    const text = await response.text();
    if (!text) return {} as T;
    try {
      return JSON.parse(text) as T;
    } catch {
      return text as unknown as T;
    }
  };

  const toMusicTrack = (track: MusicTrackRaw, liked?: boolean): AlisaMusicTrack => {
    const cover = track.coverUri ?? track.albums?.[0]?.coverUri ?? '';
    return {
      id: String(track.id),
      title: track.title ?? 'Track',
      artists: (track.artists ?? [])
        .map((artist) => artist.name)
        .filter((name): name is string => Boolean(name))
        .join(', '),
      durationMs: typeof track.durationMs === 'number' ? track.durationMs : 0,
      coverUrl: cover ? `https://${cover.replace('%%', '200x200')}` : null,
      available: track.available !== false,
      liked,
    };
  };

  const resolveMusicUid = async (userId: number, session: Session): Promise<number> => {
    const cacheKey = `${userId}:${session.id}`;
    let uid = musicUid.get(cacheKey);
    if (!uid) {
      const status = await fetchMusic<MusicAccountStatus>('/account/status', session.token);
      uid = status.result?.account?.uid;
      if (!uid) throw new Error('Could not determine the Yandex Music account');
      musicUid.set(cacheKey, uid);
    }
    return uid;
  };

  const fetchSmartHome = async (token: string): Promise<SmartHomeUserInfo> => {
    const response = await fetch('https://api.iot.yandex.net/v1.0/user/info', {
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'vuesp-hub',
      },
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) throw new Error(`Yandex Smart Home request failed (${response.status})`);
    return (await response.json()) as SmartHomeUserInfo;
  };

  const mapSmartHome = (data: SmartHomeUserInfo): SmartHomeState => {
    const rooms = (data.rooms ?? [])
      .map((room) => ({ id: String(room.id ?? ''), name: String(room.name ?? '') }))
      .filter((room) => room.id);
    const roomNames = new Map(rooms.map((room) => [room.id, room.name]));

    const devices = (data.devices ?? [])
      .map((device): SmartHomeDevice => {
        const capabilities = (device.capabilities ?? [])
          .map((capability): SmartHomeCapability => {
            const parameters = capability.parameters ?? {};
            const range = parameters.range
              ? {
                  min: Number(parameters.range.min ?? 0),
                  max: Number(parameters.range.max ?? 100),
                  precision: Number(parameters.range.precision ?? 1),
                }
              : undefined;
            const modes = Array.isArray(parameters.modes)
              ? parameters.modes.map((mode) => (typeof mode.value === 'string' ? mode.value : '')).filter(Boolean)
              : undefined;

            return {
              type: String(capability.type ?? ''),
              instance: typeof parameters.instance === 'string' ? parameters.instance : null,
              retrievable: capability.retrievable === true,
              state: capability.state ?? null,
              ...(range ? { range } : {}),
              ...(modes ? { modes } : {}),
              ...(typeof parameters.unit === 'string' ? { unit: parameters.unit } : {}),
            };
          })
          .filter((capability) => capability.type);

        const properties = (device.properties ?? [])
          .map((property): SmartHomeProperty => ({
            type: String(property.type ?? ''),
            instance: typeof property.parameters?.instance === 'string' ? property.parameters.instance : null,
            value: property.state?.value ?? null,
            ...(typeof property.parameters?.unit === 'string' ? { unit: property.parameters.unit } : {}),
          }))
          .filter((property) => property.type);

        return {
          id: String(device.id ?? ''),
          name: String(device.name ?? 'Устройство'),
          type: String(device.type ?? ''),
          room: typeof device.room === 'string' ? (roomNames.get(device.room) ?? null) : null,
          capabilities,
          properties,
        };
      })
      .filter((device) => device.id);

    return { rooms, devices };
  };

  const createSession = (
    id: string,
    token: string,
    meta: { login: string | null; expiresAt: string | null; persisted: boolean }
  ): Session => {
    const alisa = new YandexDevices();
    const data: Record<string, AlisaMessage> = {};
    const session: Session = {
      id,
      alisa,
      token,
      data,
      login: meta.login,
      expiresAt: meta.expiresAt,
      persisted: meta.persisted,
      persistError: null,
      initError: null,
      initialized: false,
    };

    alisa.on('data', (message: AlisaMessage) => {
      if (message.id) data[message.id] = message;
    });

    // The package's built-in client only tries one host and crashes on the
    // "limited" plain-text response. It also does not send X-Yandex-Token,
    // which the QR-issued x-token needs for Quasar.
    alisa.getDeviceList = async () => fetchQuasar('/glagol/device_list', session.token);
    alisa.getAllToken = async (devices: Array<Record<string, unknown>>) => {
      const resolved = await Promise.all(
        devices.map(async (device): Promise<Record<string, unknown> | null> => {
          const id = typeof device.id === 'string' ? device.id : '';
          const platform = typeof device.platform === 'string' ? device.platform : '';
          try {
            const token = await fetchQuasar(
              `/glagol/token?device_id=${encodeURIComponent(id)}&platform=${encodeURIComponent(platform)}`,
              session.token
            );
            const value = typeof token.token === 'string' ? token.token : '';
            return value ? { ...device, token: value } : null;
          } catch {
            return null;
          }
        })
      );

      return resolved.filter((item): item is Record<string, unknown> => item !== null);
    };

    return session;
  };

  const loadSessions = (userId: number): Map<string, Session> => {
    const existing = sessions.get(userId);
    if (existing) return existing;

    const map = new Map<string, Session>();
    for (const stored of store.list(userId)) {
      try {
        const token = secretProvider.decrypt(stored.accessToken);
        map.set(
          stored.id,
          createSession(stored.id, token, {
            login: stored.login,
            expiresAt: stored.expiresAt,
            persisted: true,
          })
        );
      } catch {
        store.remove(userId, stored.id);
      }
    }
    sessions.set(userId, map);
    return map;
  };

  const allSessions = (userId: number): Session[] => [...loadSessions(userId).values()];

  const saveSession = (userId: number, session: Session): void => {
    try {
      store.save(userId, {
        id: session.id,
        login: session.login,
        accessToken: secretProvider.encrypt(session.token),
        refreshToken: null,
        expiresAt: session.expiresAt,
        updatedAt: new Date().toISOString(),
      });
      session.persisted = true;
      session.persistError = null;
    } catch (error) {
      session.persisted = false;
      session.persistError = error instanceof Error ? error.message : String(error);
    }
  };

  const initialize = async (session: Session): Promise<boolean> => {
    try {
      const ok = await session.alisa.setToken(session.token);
      session.initialized = Boolean(ok);
      session.initError = ok ? null : 'Yandex token was rejected or the API is rate-limited';
      return Boolean(ok);
    } catch (error) {
      session.initialized = false;
      session.initError = error instanceof Error ? error.message : String(error);
      return false;
    }
  };

  const toState = (userId: number): AlisaState => {
    const map = loadSessions(userId);
    if (!map.size) return emptyState();

    const accounts: AlisaAccountState[] = [];
    const devices: AlisaDevice[] = [];
    const localDevices: AlisaDevice[] = [];
    const cloudDevices: unknown[] = [];
    const data: Record<string, AlisaMessage> = {};

    for (const session of map.values()) {
      const current = session.alisa.getState();
      accounts.push({
        id: session.id,
        login: session.login,
        token: Boolean(session.token),
        devicesCount: current.devices.length,
        initError: session.initError,
        persisted: session.persisted,
        persistError: session.persistError,
      });
      for (const device of current.devices) {
        devices.push({ ...device, accountId: session.id, accountLogin: session.login });
      }
      for (const device of current.localDevices) {
        localDevices.push({ ...device, accountId: session.id, accountLogin: session.login });
      }
      cloudDevices.push(...(current.cloudDevices ?? []));
      Object.assign(data, session.data);
    }

    accounts.sort((left, right) => (left.login ?? left.id).localeCompare(right.login ?? right.id));
    devices.sort((left, right) => {
      const account = (left.accountLogin ?? left.accountId ?? '').localeCompare(right.accountLogin ?? right.accountId ?? '');
      if (account) return account;
      const platform = left.platform.localeCompare(right.platform);
      if (platform) return platform;
      const ip = left.ip.localeCompare(right.ip, undefined, { numeric: true });
      if (ip) return ip;
      return left.id.localeCompare(right.id);
    });

    const first = accounts[0];
    return {
      token: accounts.length > 0,
      accounts,
      devices,
      localDevices,
      cloudDevices,
      data,
      configured: true,
      qrEnabled: true,
      login: first?.login ?? null,
      expiresAt: null,
      persisted: accounts.every((account) => account.persisted),
      initError: accounts.find((account) => account.initError)?.initError ?? null,
      persistError: accounts.find((account) => account.persistError)?.persistError ?? null,
    };
  };

  const findSessionForDevice = (userId: number, deviceId: string): Session | null => {
    for (const session of allSessions(userId)) {
      const current = session.alisa.getState();
      if (current.devices.some((device) => device.id === deviceId || device.ip === deviceId)) return session;
    }
    return null;
  };

  const migrateLegacySession = async (userId: number): Promise<void> => {
    const map = loadSessions(userId);
    const legacy = map.get('legacy');
    if (!legacy) return;

    try {
      const status = await fetchMusic<MusicAccountStatus>('/account/status', legacy.token);
      const uid = status.result?.account?.uid;
      if (!uid) return;
      const id = String(uid);
      if (map.has(id)) {
        map.delete('legacy');
        store.remove(userId, 'legacy');
        return;
      }
      const login = typeof status.result?.account?.login === 'string' ? status.result.account.login : null;
      map.delete('legacy');
      legacy.id = id;
      if (login) legacy.login = login;
      map.set(id, legacy);
      store.remove(userId, 'legacy');
      saveSession(userId, legacy);
    } catch {
      // Keep the legacy id when the Music API is temporarily unavailable.
    }
  };

  const addAccount = async (userId: number, token: string): Promise<AlisaState> => {
    const status = await fetchMusic<MusicAccountStatus>('/account/status', token);
    const uid = status.result?.account?.uid;
    const id = uid ? String(uid) : `account-${Date.now()}`;
    const login = typeof status.result?.account?.login === 'string' ? status.result.account.login : null;

    const map = loadSessions(userId);
    const previous = map.get(id);
    if (previous) previous.alisa.disconnection();

    const session = createSession(id, token, { login, expiresAt: null, persisted: false });
    map.set(id, session);
    saveSession(userId, session);
    musicUid.delete(`${userId}:${id}`);
    musicCache.delete(`${userId}:${id}`);
    musicCollectionsCache.delete(`${userId}:${id}`);
    smartHomeCache.delete(`${userId}:${id}`);

    const ok = await initialize(session);
    if (!ok) throw new Error(session.initError || 'Yandex token was rejected or the API is rate-limited');
    return toState(userId);
  };

  return {
    async state(userId) {
      await migrateLegacySession(userId);
      return toState(userId);
    },

    async startQr(userId) {
      const result = await qrLogin.start();
      qrOwners.set(result.id, userId);
      return result;
    },

    async pollQr(userId, id) {
      const owner = qrOwners.get(id);
      if (owner !== userId) throw new Error('QR login session not found');
      try {
        const result = await qrLogin.poll(id);
        if (result.status === 'pending') {
          return { status: 'pending', state: toState(userId) };
        }
        qrOwners.delete(id);
        if (!result.xToken) throw new Error('Passport did not return an x-token');
        const state = await addAccount(userId, result.xToken);
        return { status: 'ok', state };
      } catch (error) {
        qrOwners.delete(id);
        qrLogin.drop(id);
        throw error;
      }
    },

    async init(userId, token) {
      return addAccount(userId, token);
    },

    async forget(userId, accountId) {
      const map = loadSessions(userId);
      const targets = accountId ? [map.get(accountId)].filter((session): session is Session => Boolean(session)) : allSessions(userId);
      for (const session of targets) {
        session.alisa.disconnection();
        map.delete(session.id);
        store.remove(userId, session.id);
        musicUid.delete(`${userId}:${session.id}`);
        musicCache.delete(`${userId}:${session.id}`);
        musicCollectionsCache.delete(`${userId}:${session.id}`);
        smartHomeCache.delete(`${userId}:${session.id}`);
      }
      if (!map.size) {
        store.removeAll(userId);
        sessions.delete(userId);
      }
      return toState(userId);
    },

    async scan(userId) {
      const first = allSessions(userId)[0];
      if (!first) throw new Error('Yandex account is not linked');
      return first.alisa.findDeviceList();
    },

    async connect(userId, accountId) {
      await migrateLegacySession(userId);
      const map = loadSessions(userId);
      const targets = accountId ? [map.get(accountId)].filter((session): session is Session => Boolean(session)) : allSessions(userId);
      if (!targets.length) throw new Error('Yandex account is not linked');

      await Promise.all(
        targets.map(async (session) => {
          if (!session.initialized) {
            const ok = await initialize(session);
            if (!ok) throw new Error(session.initError || 'Yandex token was rejected or the API is rate-limited');
          }
          await session.alisa.connection();
        })
      );
      return toState(userId);
    },

    async disconnect(userId, accountId) {
      const map = loadSessions(userId);
      const targets = accountId ? [map.get(accountId)].filter((session): session is Session => Boolean(session)) : allSessions(userId);
      for (const session of targets) {
        session.alisa.disconnection();
        session.initialized = false;
      }
      return toState(userId);
    },

    send(userId, deviceId, payload) {
      const session = findSessionForDevice(userId, deviceId);
      if (!session) throw new Error('Speaker not found');
      session.alisa.onSend(deviceId, payload);
    },

    async musicPlaylists(userId, accountId) {
      await migrateLegacySession(userId);
      const map = loadSessions(userId);
      const session = accountId ? map.get(accountId) : allSessions(userId)[0];
      if (!session) throw new Error('Yandex account is not linked');

      const cacheKey = `${userId}:${session.id}`;
      const cached = musicCache.get(cacheKey);
      if (cached && Date.now() - cached.at < 5 * 60 * 1000) return cached.playlists;

      let uid = musicUid.get(cacheKey);
      if (!uid) {
        const status = await fetchMusic<MusicAccountStatus>('/account/status', session.token);
        uid = status.result?.account?.uid;
        if (!uid) throw new Error('Could not determine the Yandex Music account');
        musicUid.set(cacheKey, uid);
      }

      const result = await fetchMusic<{ result?: MusicPlaylistRaw[] }>(`/users/${uid}/playlists/list`, session.token);
      const playlists = (result.result ?? [])
        .filter((playlist): playlist is MusicPlaylistRaw & { kind: number } => typeof playlist.kind === 'number')
        .map((playlist) => {
          const owner = typeof playlist.uid === 'number' ? playlist.uid : uid;
          const cover = playlist.ogImage ?? playlist.cover?.itemsUri?.[0] ?? '';
          return {
            id: `${owner}:${playlist.kind}`,
            title: playlist.title ?? 'Playlist',
            trackCount: typeof playlist.trackCount === 'number' ? playlist.trackCount : 0,
            coverUrl: cover ? `https://${cover.replace('%%', '400x400')}` : null,
          };
        });

      musicCache.set(cacheKey, { at: Date.now(), playlists });
      return playlists;
    },

    async musicCollections(userId, accountId) {
      await migrateLegacySession(userId);
      const map = loadSessions(userId);
      const session = accountId ? map.get(accountId) : allSessions(userId)[0];
      if (!session) throw new Error('Yandex account is not linked');

      const cacheKey = `${userId}:${session.id}`;
      const cached = musicCollectionsCache.get(cacheKey);
      if (cached && Date.now() - cached.at < 5 * 60 * 1000) return cached.collections;

      const result = await fetchMusic<MusicLandingResponse>(
        '/landing3?blocks=personalplaylists,new-playlists',
        session.token
      );
      const collections = new Map<string, AlisaMusicCollection>();

      for (const block of result.result?.blocks ?? []) {
        const source = block.title || block.type || 'Яндекс Музыка';
        for (const entity of block.entities ?? []) {
          const raw = entity.type === 'personal-playlist' && entity.data?.data ? entity.data.data : entity.data;
          if (!raw || typeof raw !== 'object') continue;
          const playlist = raw as {
            uid?: unknown;
            kind?: unknown;
            title?: unknown;
            trackCount?: unknown;
            ogImage?: unknown;
            cover?: { itemsUri?: unknown[] };
          };
          if (typeof playlist.uid !== 'number' || typeof playlist.kind !== 'number') continue;
          const id = `${playlist.uid}:${playlist.kind}`;
          if (collections.has(id)) continue;
          const cover = (typeof playlist.ogImage === 'string' ? playlist.ogImage : '') ||
            (Array.isArray(playlist.cover?.itemsUri) && typeof playlist.cover.itemsUri[0] === 'string' ? playlist.cover.itemsUri[0] : '');
          collections.set(id, {
            id,
            title: typeof playlist.title === 'string' ? playlist.title : 'Playlist',
            trackCount: typeof playlist.trackCount === 'number' ? playlist.trackCount : 0,
            coverUrl: cover ? `https://${cover.replace('%%', '400x400')}` : null,
            source,
          });
        }
      }

      const list = [...collections.values()];
      musicCollectionsCache.set(cacheKey, { at: Date.now(), collections: list });
      return list;
    },

    async musicTracks(userId, accountId, playlistId) {
      await migrateLegacySession(userId);
      const map = loadSessions(userId);
      const session = accountId ? map.get(accountId) : allSessions(userId)[0];
      if (!session) throw new Error('Yandex account is not linked');

      const match = /^(\d+):(\d+)$/.exec(playlistId);
      if (!match) throw new Error('Invalid playlist id');
      const [, uid, kind] = match;

      const result = await fetchMusic<{ result?: { tracks?: Array<{ track?: MusicTrackRaw }> } }>(
        `/users/${uid}/playlists/${kind}`,
        session.token
      );

      return (result.result?.tracks ?? [])
        .map((item) => item.track)
        .filter((track): track is MusicTrackRaw & { id: string | number } => track !== undefined && track.id !== undefined)
        .map((track) => toMusicTrack(track));
    },

    async musicWave(userId, accountId, queue) {
      await migrateLegacySession(userId);
      const session = accountId ? loadSessions(userId).get(accountId) : allSessions(userId)[0];
      if (!session) throw new Error('Yandex account is not linked');

      const query = new URLSearchParams({ settings2: 'true' });
      if (queue) query.set('queue', queue);

      const result = await fetchMusic<MusicRotorResponse>(
        `/rotor/station/user:onyourwave/tracks?${query.toString()}`,
        session.token
      );
      const tracks = (result.result?.sequence ?? [])
        .filter((item): item is MusicRotorItem & { track: MusicTrackRaw & { id: string | number } } =>
          item.type === 'track' && item.track !== undefined && item.track.id !== undefined)
        .map((item) => toMusicTrack(item.track, item.liked === true));

      return {
        tracks,
        batchId: result.result?.batchId ?? null,
        lastTrackId: tracks.at(-1)?.id ?? null,
      };
    },

    async musicWaveFeedback(userId, accountId, type, batchId, trackId, totalPlayedSeconds) {
      const session = loadSessions(userId).get(accountId);
      if (!session) throw new Error('Yandex account is not linked');
      const query = batchId ? `?batch-id=${encodeURIComponent(batchId)}` : '';
      await postMusic(`/rotor/station/user:onyourwave/feedback${query}`, session.token, {
        type,
        timestamp: new Date().toISOString(),
        ...(trackId ? { trackId } : {}),
        ...(totalPlayedSeconds !== undefined ? { totalPlayedSeconds } : {}),
      });
    },

    async likeTrack(userId, accountId, trackId, liked) {
      await migrateLegacySession(userId);
      const session = loadSessions(userId).get(accountId);
      if (!session) throw new Error('Yandex account is not linked');
      if (!/^\d+$/.test(trackId)) throw new Error('Invalid track id');
      const uid = await resolveMusicUid(userId, session);
      const action = liked ? 'add-multiple' : 'remove';
      await postMusicForm(`/users/${uid}/likes/tracks/${action}`, session.token, { 'track-ids': trackId });
    },

    playWave(userId, accountId, deviceId) {
      const session = loadSessions(userId).get(accountId);
      if (!session) throw new Error('Yandex account is not linked');
      session.alisa.onSend(deviceId, { command: 'sendText', text: 'включи мою волну' });
    },

    playPlaylist(userId, accountId, deviceId, playlistId) {
      const session = loadSessions(userId).get(accountId);
      if (!session) throw new Error('Yandex account is not linked');
      if (!/^\d+:\d+$/.test(playlistId)) throw new Error('Invalid playlist id');
      session.alisa.onSend(deviceId, { command: 'playMusic', id: playlistId, type: 'playlist' });
    },

    playTrack(userId, accountId, deviceId, trackId) {
      const session = loadSessions(userId).get(accountId);
      if (!session) throw new Error('Yandex account is not linked');
      if (!/^\d+$/.test(trackId)) throw new Error('Invalid track id');
      session.alisa.onSend(deviceId, { command: 'playMusic', id: trackId, type: 'track' });
    },

    async smartHome(userId, accountId) {
      await migrateLegacySession(userId);
      const map = loadSessions(userId);
      const session = accountId ? map.get(accountId) : allSessions(userId)[0];
      if (!session) throw new Error('Yandex account is not linked');

      const cacheKey = `${userId}:${session.id}`;
      const cached = smartHomeCache.get(cacheKey);
      if (cached && Date.now() - cached.at < 30_000) return cached.data;

      const data = mapSmartHome(await fetchSmartHome(session.token));
      smartHomeCache.set(cacheKey, { at: Date.now(), data });
      return data;
    },

    async createStreamToken(userId, accountId, trackId) {
      const session = loadSessions(userId).get(accountId);
      if (!session) throw new Error('Yandex account is not linked');
      if (!/^\d+$/.test(trackId)) throw new Error('Invalid track id');
      const key = randomUUID();
      streamKeys.set(key, { userId, accountId, trackId, expiresAt: Date.now() + 5 * 60 * 1000 });
      return { url: `/api/v1/alisa/music/stream/${key}` };
    },

    async streamTrack(key, range) {
      const entry = streamKeys.get(key);
      if (!entry || entry.expiresAt < Date.now()) {
        streamKeys.delete(key);
        throw new Error('Stream link expired');
      }

      const session = loadSessions(entry.userId).get(entry.accountId);
      if (!session) throw new Error('Yandex account is not linked');

      const cacheKey = `${entry.userId}:${entry.trackId}`;
      let direct = directLinks.get(cacheKey);
      if (!direct || Date.now() - direct.at > 50_000) {
        const info = await fetchMusic<{
          result?: Array<{ codec?: string; bitrateInKbps?: number; preview?: boolean; downloadInfoUrl?: string }>;
        }>(`/tracks/${entry.trackId}/download-info`, session.token);

        const variants = (info.result ?? []).filter((variant) => typeof variant.downloadInfoUrl === 'string');
        const mp3 = variants
          .filter((variant) => variant.codec === 'mp3' && variant.preview !== true)
          .sort((left, right) => (right.bitrateInKbps ?? 0) - (left.bitrateInKbps ?? 0));
        const variant = mp3[0] ?? variants[0];
        if (!variant?.downloadInfoUrl) throw new Error('No audio stream available');

        const xmlResponse = await fetch(variant.downloadInfoUrl, { signal: AbortSignal.timeout(15_000) });
        const xml = await xmlResponse.text();
        const host = /<host>(.*?)<\/host>/.exec(xml)?.[1];
        const filePath = /<path>(.*?)<\/path>/.exec(xml)?.[1];
        const ts = /<ts>(.*?)<\/ts>/.exec(xml)?.[1];
        const s = /<s>(.*?)<\/s>/.exec(xml)?.[1];
        if (!host || !filePath || !ts || !s) throw new Error('Invalid audio manifest');

        const sign = createHash('md5').update(`XGRlBW9FXlekgbPrRHuSiA${filePath.slice(1)}${s}`).digest('hex');
        direct = { at: Date.now(), url: `https://${host}/get-mp3/${sign}/${ts}${filePath}` };
        directLinks.set(cacheKey, direct);
      }

      const response = await fetch(direct.url, {
        headers: {
          ...(range ? { Range: range } : {}),
          'User-Agent': 'vuesp-hub',
        },
        signal: AbortSignal.timeout(30_000),
      });

      const headers: Record<string, string> = {};
      for (const name of ['content-type', 'content-length', 'content-range', 'accept-ranges']) {
        const value = response.headers.get(name);
        if (value) headers[name] = value;
      }
      headers['cache-control'] = 'no-store';

      return { status: response.status, headers, body: response.body };
    },

    async smartHomeAction(userId, accountId, deviceId, type, state) {
      const session = loadSessions(userId).get(accountId);
      if (!session) throw new Error('Yandex account is not linked');
      if (!type.startsWith('devices.capabilities.')) throw new Error('Invalid capability type');

      const response = await fetch('https://api.iot.yandex.net/v1.0/devices/actions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.token}`,
          'Content-Type': 'application/json',
          'User-Agent': 'vuesp-hub',
        },
        body: JSON.stringify({ devices: [{ id: deviceId, actions: [{ type, state }] }] }),
        signal: AbortSignal.timeout(30_000),
      });
      const data = (await response.json().catch(() => ({}))) as { status?: string; message?: string };
      if (!response.ok || data.status === 'error') {
        throw new Error(data.message || `Yandex Smart Home action failed (${response.status})`);
      }
      smartHomeCache.delete(`${userId}:${session.id}`);
    },

    dispose() {
      for (const map of sessions.values()) {
        for (const session of map.values()) session.alisa.disconnection();
      }
      sessions.clear();
      qrOwners.clear();
      streamKeys.clear();
      directLinks.clear();
      smartHomeCache.clear();
      musicCache.clear();
      musicCollectionsCache.clear();
    },
  };
};
