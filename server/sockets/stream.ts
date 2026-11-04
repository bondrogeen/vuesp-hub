import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import type { Server, Socket } from 'socket.io';

const RTSP_URL = 'rtsp://admin:Ab110605@192.0.2.52:554/ISAPI/Streaming/Channels/101';
let ffmpegProcess: ChildProcessWithoutNullStreams | null = null;
let clientsCount = 0;

// Запуск FFmpeg процесса
function startStreaming(io: Server): void {
  console.log('Starting FFmpeg stream...');

  const ffmpeg = spawn('ffmpeg', [
    '-rtsp_transport', 'tcp',
    '-i', RTSP_URL,
    '-q', '0',
    '-f', 'mpegts',
    '-codec:v', 'mpeg1video',
    '-b:v', '800k',
    '-codec:a', 'mp2',
    '-muxdelay', '1',
    '-',
  ]);
  ffmpegProcess = ffmpeg;

  // Обработка ошибок FFmpeg
  ffmpeg.stderr.on('data', (data: Buffer) => {
    console.error(`FFmpeg error: ${data}`);
  });

  ffmpeg.on('error', (error: Error) => {
    console.error(`FFmpeg failed to start: ${error.message}`);
    ffmpegProcess = null;
  });

  // Отправка данных клиентам
  ffmpeg.stdout.on('data', (data: Buffer) => {
    io.emit('stream', data);
  });

  ffmpeg.on('close', (code: number | null) => {
    console.log(`FFmpeg process exited with code ${code}`);
    ffmpegProcess = null;
  });
}

// Остановка FFmpeg процесса
function stopStreaming(): void {
  if (ffmpegProcess) {
    console.log('Stopping FFmpeg stream...');
    ffmpegProcess.kill('SIGINT');
    ffmpegProcess = null;
  }
}

export const socketStream = (io: Server): void => {
  io.on('connection', (socket: Socket) => {
    console.log('Client socketStream connected');

    clientsCount++;
    if (clientsCount === 1) {
      startStreaming(io);
    }

    socket.on('disconnect', () => {
      console.log('Client socketStream disconnected');
      clientsCount = Math.max(0, clientsCount - 1);
      if (clientsCount === 0 && ffmpegProcess) {
        stopStreaming();
      }
    });
  });
};
