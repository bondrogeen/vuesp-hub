import { onBeforeUnmount, ref, type Ref } from 'vue';
import { io, type Socket } from 'socket.io-client';

import { getToken } from '@/utils/auth.ts';
import type { CameraStreamSnapshot } from '@/types/camera';

const EMPTY_STATE: CameraStreamSnapshot = { status: 'idle', viewers: 0 };

/**
 * MSE/fMP4 player for a single camera. The socket is opened only while the
 * card is visible; disconnecting it makes the hub stop FFmpeg for that camera.
 */
export const useCameraStream = (video: Ref<HTMLVideoElement | null>) => {
  const state = ref<CameraStreamSnapshot>({ ...EMPTY_STATE });

  let socket: Socket | null = null;
  let cameraId = '';
  let wanted = false;
  let mediaSource: MediaSource | null = null;
  let sourceBuffer: SourceBuffer | null = null;
  let objectUrl = '';
  let queue: Uint8Array[] = [];
  let resetTimer: ReturnType<typeof setTimeout> | undefined;

  const cleanupMedia = () => {
    queue = [];
    sourceBuffer = null;

    if (mediaSource) {
      try {
        if (mediaSource.readyState === 'open') mediaSource.endOfStream();
      } catch {
        // The media element may already be detached.
      }
      mediaSource = null;
    }

    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      objectUrl = '';
    }

    if (video.value) {
      video.value.pause();
      video.value.removeAttribute('src');
      video.value.load();
    }
  };

  const flush = () => {
    if (!sourceBuffer || sourceBuffer.updating || !queue.length) return;
    const chunk = queue.shift();
    if (!chunk) return;

    try {
      sourceBuffer.appendBuffer(chunk as unknown as BufferSource);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'MediaSource append failed';
      wanted = false;
      socket?.disconnect();
      socket = null;
      cleanupMedia();
      state.value = { status: 'error', viewers: 0, message };
    }
  };

  const syncCurrentTime = () => {
    if (!sourceBuffer || !video.value || sourceBuffer.updating) return;
    const buffered = sourceBuffer.buffered;
    if (!buffered.length) return;

    const start = buffered.start(0);
    const end = buffered.end(buffered.length - 1);
    const current = video.value.currentTime;

    // A late viewer joins an already running fMP4 stream. Its first fragment
    // starts at a non-zero timestamp, so move the playhead into the buffered
    // range or the element stays paused at 0.
    if (current < start || current > end) {
      video.value.currentTime = start;
      video.value.play().catch(() => {});
    }
  };

  const trimBuffer = () => {
    if (!sourceBuffer || !video.value) return;
    const buffered = sourceBuffer.buffered;
    if (!buffered.length) return;

    const current = video.value.currentTime;
    if (current - buffered.start(0) > 30) {
      try {
        sourceBuffer.remove(0, current - 10);
      } catch {
        // Removal can fail while the buffer is being updated.
      }
    }
  };

  const disconnect = () => {
    wanted = false;
    if (resetTimer) {
      clearTimeout(resetTimer);
      resetTimer = undefined;
    }

    socket?.disconnect();
    socket = null;
    cleanupMedia();
    state.value = { ...EMPTY_STATE };
  };

  const connect = (id: string) => {
    const element = video.value;
    if (!element || !id) return;

    disconnect();
    wanted = true;
    cameraId = id;
    state.value = { status: 'starting', viewers: 0 };

    if (typeof MediaSource === 'undefined') {
      state.value = { status: 'error', viewers: 0, message: 'MediaSource is not supported in this browser' };
      return;
    }

    const media = new MediaSource();
    mediaSource = media;
    objectUrl = URL.createObjectURL(media);
    element.src = objectUrl;
    element.play().catch(() => {
      // Autoplay can still be blocked; the controls remain available.
    });

    media.addEventListener('sourceopen', () => {
      if (!mediaSource) return;
      try {
        sourceBuffer = mediaSource.addSourceBuffer('video/mp4; codecs="avc1.42E01F"');
        sourceBuffer.mode = 'segments';
        sourceBuffer.addEventListener('updateend', () => {
          trimBuffer();
          syncCurrentTime();
          flush();
        });
        flush();
      } catch (error) {
        state.value = {
          status: 'error',
          viewers: 0,
          message: error instanceof Error ? error.message : 'H.264 MediaSource is not supported',
        };
      }
    });

    const nextSocket = io({
      path: '/ws/stream/',
      transports: ['websocket'],
      auth: { token: getToken(), cameraId: id },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket = nextSocket;

    nextSocket.on('connect', () => {
      if (!wanted) return;
      state.value = { status: 'starting', viewers: state.value.viewers };
    });

    nextSocket.on('stream-status', (snapshot: CameraStreamSnapshot) => {
      if (!wanted) return;
      state.value = snapshot;
    });

    nextSocket.on('stream', (data: ArrayBuffer) => {
      if (!wanted) return;
      queue.push(new Uint8Array(data));
      flush();
    });

    nextSocket.on('disconnect', () => {
      if (!wanted) return;
      state.value = { status: 'starting', viewers: 0, message: 'Переподключение…' };
    });

    nextSocket.on('connect_error', (error: Error) => {
      if (!wanted) return;
      state.value = { status: 'error', viewers: 0, message: error.message };
    });

    // A new socket starts a new FFmpeg process, so the MSE buffer must be
    // rebuilt as well. Recreate the player after socket.io reconnects.
    nextSocket.io.on('reconnect', () => {
      if (!wanted) return;
      resetTimer = setTimeout(() => {
        if (wanted) connect(cameraId);
      }, 150);
    });
  };

  onBeforeUnmount(disconnect);

  return {
    state,
    connect,
    disconnect,
  };
};
