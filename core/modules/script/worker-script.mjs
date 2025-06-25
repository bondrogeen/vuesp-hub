import { parentPort, workerData } from 'worker_threads';

// Безопасная среда выполнения
const SAFE_GLOBALS = {
    console: {
        log: (...args) => {
            parentPort.postMessage({
                log: {
                    message: args.join(' '),
                    level: 'info'
                }
            });
        },
        error: (...args) => {
            parentPort.postMessage({
                log: {
                    message: args.join(' '),
                    level: 'error'
                }
            });
        }
    },
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    Date,
    Math,
    JSON,
    Array,
    Object,
    Map,
    Set,
    Error,
    RegExp,
    Promise,
    String,
    Number,
    Boolean
};

// Обработчик сообщений
parentPort.on('message', async ({ code, context }) => {
    try {
        // Создаем безопасный контекст
        const sandbox = Object.assign({}, SAFE_GLOBALS, context);

        // Заворачиваем код в асинхронную функцию
        const wrappedCode = `
            (async () => {
                ${code}
            })();
        `;

        // Создаем функцию в безопасном контексте
        const fn = new Function(...Object.keys(sandbox), wrappedCode);

        // Выполняем функцию с безопасными аргументами
        const result = await fn(...Object.values(sandbox));

        parentPort.postMessage({ result });
    } catch (error) {
        parentPort.postMessage({
            error: `Script execution failed: ${error.message}`
        });
    }
});