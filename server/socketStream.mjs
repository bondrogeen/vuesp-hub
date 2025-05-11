const { spawn } = require('child_process');

const RTSP_URL = 'rtsp://admin:Ab110605@192.0.2.52:554/ISAPI/Streaming/Channels/101';
let ffmpegProcess = null;
let clientsCount = 0;

// Запуск FFmpeg процесса
function startStreaming(io) {
    console.log('Starting FFmpeg stream...');

    ffmpegProcess = spawn('ffmpeg', [
        '-rtsp_transport', 'tcp',
        '-i', RTSP_URL,
        '-q', '0',
        '-f', 'mpegts',
        '-codec:v', 'mpeg1video',
        '-b:v', '800k',
        '-codec:a', 'mp2',
        '-muxdelay', '1',
        '-'
    ]);

    // Обработка ошибок FFmpeg
    ffmpegProcess.stderr.on('data', (data) => {
        console.error(`FFmpeg error: ${data}`);
    });

    // Отправка данных клиентам
    ffmpegProcess.stdout.on('data', (data) => {
        io.emit('stream', data);
    });

    ffmpegProcess.on('close', (code) => {
        console.log(`FFmpeg process exited with code ${code}`);
        ffmpegProcess = null;
    });
}

// Остановка FFmpeg процесса
function stopStreaming() {
    if (ffmpegProcess) {
        console.log('Stopping FFmpeg stream...');
        ffmpegProcess.kill('SIGINT');
        ffmpegProcess = null;
    }
}

export const socketStream = (io) => {



    console.log('socketStream');

    io.on('connection', (socket) => {
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
}