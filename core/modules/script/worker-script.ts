import { parentPort } from 'node:worker_threads';

const port = parentPort;
if (!port) {
  throw new Error('Script worker requires a parent port');
}

interface ScriptTask {
  code: string;
  context: Record<string, unknown>;
}

// Безопасная среда выполнения
const SAFE_GLOBALS = {
    console: {
        log: (...args: unknown[]) => {
            port.postMessage({
                log: {
                    message: args.join(' '),
                    level: 'info'
                }
            });
        },
        error: (...args: unknown[]) => {
            port.postMessage({
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
port.on('message', async ({ code, context }: ScriptTask) => {
    try {
        // Создаем безопасный контекст
        const sandbox = Object.assign({}, SAFE_GLOBALS, context);

        // Заворачиваем код в асинхронную функцию
        const wrappedCode = `
            return (async () => {
                ${code}
            })();
        `;

        // Создаем функцию в безопасном контексте
        const fn = new Function(...Object.keys(sandbox), wrappedCode);

        // Выполняем функцию с безопасными аргументами
        const result = await fn(...Object.values(sandbox));

        port.postMessage({ result });
    } catch (error) {
        port.postMessage({
            error: `Script execution failed: ${error instanceof Error ? error.message : String(error)}`
        });
    }
});