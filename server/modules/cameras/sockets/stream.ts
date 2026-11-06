import { spawn, type ChildProcessByStdio } from 'node:child_process';
import type { Readable } from 'node:stream';

import ffmpegStatic from 'ffmpeg-static';
import type { Server, Socket } from 'socket.io';

import type { CameraRecord, CameraStore } from '../application/cameraStore.ts';

export type CameraStreamStatus = 'idle' | 'starting' | 'live' | 'error';

export interface CameraStreamSnapshot {
  status: CameraStreamStatus;
  viewers: number;
  message?: string;
}

type FFmpegProcess = ChildProcessByStdio<null, Readable, Readable>;

interface CameraStream {
  process: FFmpegProcess;
  clients: number;
  startedAt: number;
  stopping: boolean;
  live: boolean;
  stderr: string;
  initSegment?: Buffer;
  idleTimer?: NodeJS.Timeout;
}

export interface CameraStreamManager {
  attach(io: Server): void;
  stop(cameraId: string): void;
  stopAll(): void;
  snapshot(cameraId: string): CameraStreamSnapshot;
}

const ffmpegPath = (process.env.VUESP_FFMPEG_PATH?.trim() || ffmpegStatic || 'ffmpeg').replace('app.asar', 'app.asar.unpacked');

const IDLE_STOP_MS = 10_000;

const buildArgs = (camera: CameraRecord): string[] => {
  const input = [
    '-hide_banner',
    '-loglevel', 'warning',
    '-rtsp_transport', 'tcp',
    '-fflags', 'nobuffer',
    '-flags', 'low_delay',
    '-i', camera.url,
    '-an',
  ];

  if (!camera.transcode) {
    return [
      ...input,
      '-c:v', 'copy',
      '-f', 'mp4',
      '-movflags', 'frag_keyframe+empty_moov+default_base_moof',
      '-frag_duration', '200000',
      '-',
    ];
  }

  // Transcode to H.264 baseline so every Chromium/Firefox MSE implementation
  // can play it. Keep the card-friendly 1280px / 15 fps envelope to save CPU.
  return [
    ...input,
    '-vf', 'scale=1280:720:force_original_aspect_ratio=decrease',
    '-r', '15',
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-tune', 'zerolatency',
    '-profile:v', 'baseline',
    '-level', '3.1',
    '-pix_fmt', 'yuv420p',
    '-g', '30',
    '-keyint_min', '30',
    '-sc_threshold', '0',
    '-b:v', '1000k',
    '-maxrate', '1200k',
    '-bufsize', '2400k',
    '-f', 'mp4',
    '-movflags', 'frag_keyframe+empty_moov+default_base_moof',
    '-frag_duration', '200000',
    '-',
  ];
};

export const redactCameraText = (value: string): string => value.replace(/rtsps?:\/\/[^\s"'<>]+/gi, 'rtsp://***');

const lastStderrLine = (stderr: string): string => {
  const lines = stderr
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);
  return lines.at(-1) ?? '';
};

const takeInitSegment = (buffer: Buffer): { init: Buffer; rest: Buffer } | null => {
  let offset = 0;

  while (buffer.length - offset >= 8) {
    const size = buffer.readUInt32BE(offset);
    if (size < 8) return null;

    const type = buffer.toString('ascii', offset + 4, offset + 8);
    if (type === 'moof') {
      return { init: buffer.subarray(0, offset), rest: buffer.subarray(offset) };
    }

    if (offset + size > buffer.length) return null;
    offset += size;
  }

  return null;
};

const cameraIdFromSocket = (socket: Socket): string => {
  const auth = socket.handshake.auth as { cameraId?: unknown } | undefined;
  const query = socket.handshake.query.cameraId;
  const value = auth?.cameraId ?? query;
  return typeof value === 'string' ? value : '';
};

export const createCameraStreamManager = ({ cameraStore }: { cameraStore: CameraStore }): CameraStreamManager => {
  const streams = new Map<string, CameraStream>();
  const snapshots = new Map<string, CameraStreamSnapshot>();
  let io: Server | undefined;

  const publish = (cameraId: string, snapshot: CameraStreamSnapshot) => {
    snapshots.set(cameraId, snapshot);
    io?.to(cameraId).emit('stream-status', snapshot);
  };

  const stop = (cameraId: string) => {
    const stream = streams.get(cameraId);
    if (!stream) {
      publish(cameraId, { status: 'idle', viewers: 0 });
      return;
    }

    if (stream.idleTimer) {
      clearTimeout(stream.idleTimer);
      stream.idleTimer = undefined;
    }

    stream.stopping = true;
    streams.delete(cameraId);
    publish(cameraId, { status: 'idle', viewers: stream.clients });

    stream.process.kill('SIGTERM');
    const timer = setTimeout(() => {
      if (!stream.process.killed) stream.process.kill('SIGKILL');
    }, 2500);
    timer.unref?.();
    stream.process.once('close', () => clearTimeout(timer));
  };

  const start = (camera: CameraRecord) => {
    const existing = streams.get(camera.id);
    if (existing) {
      if (existing.idleTimer) {
        clearTimeout(existing.idleTimer);
        existing.idleTimer = undefined;
      }
      return existing;
    }

    const process = spawn(ffmpegPath, buildArgs(camera), { stdio: ['ignore', 'pipe', 'pipe'] });
    const stream: CameraStream = {
      process,
      clients: 0,
      startedAt: Date.now(),
      stopping: false,
      live: false,
      stderr: '',
    };
    streams.set(camera.id, stream);
    publish(camera.id, { status: 'starting', viewers: 0 });

    process.once('spawn', () => {
      stream.live = true;
      publish(camera.id, { status: 'live', viewers: stream.clients });
    });

    let initBuffer = Buffer.alloc(0);
    process.stdout.on('data', (chunk: Buffer) => {
      if (stream.initSegment) {
        io?.to(camera.id).emit('stream', chunk);
        return;
      }

      initBuffer = Buffer.concat([initBuffer, chunk]);
      const parsed = takeInitSegment(initBuffer);
      if (!parsed) {
        if (initBuffer.length > 2 * 1024 * 1024) {
          console.warn(`[camera ${camera.name}] fMP4 init segment was not found`);
          initBuffer = Buffer.alloc(0);
        }
        return;
      }

      stream.initSegment = parsed.init;
      initBuffer = Buffer.alloc(0);
      io?.to(camera.id).emit('stream', parsed.init);
      if (parsed.rest.length) io?.to(camera.id).emit('stream', parsed.rest);
    });

    process.stderr.on('data', (chunk: Buffer) => {
      stream.stderr = `${stream.stderr}${chunk.toString()}`.slice(-4096);
      const line = redactCameraText(lastStderrLine(stream.stderr));
      if (line) console.warn(`[camera ${camera.name}] ${line}`);
    });

    process.once('error', (error: Error) => {
      streams.delete(camera.id);
      publish(camera.id, { status: 'error', viewers: stream.clients, message: redactCameraText(error.message) });
    });

    process.once('close', (code, signal) => {
      if (stream.idleTimer) {
        clearTimeout(stream.idleTimer);
        stream.idleTimer = undefined;
      }

      const current = streams.get(camera.id);
      if (current === stream) streams.delete(camera.id);

      if (stream.stopping) {
        publish(camera.id, { status: 'idle', viewers: stream.clients });
        return;
      }

      const detail = redactCameraText(lastStderrLine(stream.stderr));
      const message = detail || `FFmpeg exited with code ${code ?? 'null'}${signal ? ` (${signal})` : ''}`;
      publish(camera.id, { status: 'error', viewers: stream.clients, message });
    });

    return stream;
  };

  const snapshot = (cameraId: string): CameraStreamSnapshot => {
    const stream = streams.get(cameraId);
    if (stream) {
      return snapshots.get(cameraId) ?? { status: 'starting', viewers: stream.clients };
    }
    return snapshots.get(cameraId) ?? { status: 'idle', viewers: 0 };
  };

  return {
    attach(server) {
      io = server;

      io.on('connection', (socket: Socket) => {
        const cameraId = cameraIdFromSocket(socket);
        const camera = cameraId ? cameraStore.get(cameraId) : undefined;

        if (!camera) {
          socket.emit('stream-status', { status: 'error', viewers: 0, message: 'Camera not found' });
          socket.disconnect(true);
          return;
        }

        const stream = start(camera);
        stream.clients += 1;
        socket.join(cameraId);

        if (stream.initSegment) {
          socket.emit('stream', stream.initSegment);
        }

        if (stream.live) {
          publish(cameraId, { status: 'live', viewers: stream.clients });
        } else {
          publish(cameraId, { status: 'starting', viewers: stream.clients });
        }

        socket.on('disconnect', () => {
          stream.clients = Math.max(0, stream.clients - 1);
          if (stream.clients > 0) {
            publish(cameraId, { status: snapshot(cameraId).status, viewers: stream.clients });
            return;
          }

          // Keep FFmpeg warm for a short grace period. A page reload disconnects
          // the old socket and immediately opens a new one; reusing the warm
          // process avoids re-opening RTSP and races on cameras that allow only
          // one connection.
          if (stream.idleTimer) clearTimeout(stream.idleTimer);
          stream.idleTimer = setTimeout(() => {
            const current = streams.get(cameraId);
            if (current === stream && stream.clients === 0) stop(cameraId);
          }, IDLE_STOP_MS);
          stream.idleTimer.unref?.();
          publish(cameraId, { status: 'idle', viewers: 0 });
        });
      });
    },

    stop,

    stopAll() {
      for (const cameraId of streams.keys()) stop(cameraId);
    },

    snapshot,
  };
};

/** Backwards-compatible name used by server.ts. */
export const socketStream = (io: Server, manager: CameraStreamManager): void => {
  manager.attach(io);
};
