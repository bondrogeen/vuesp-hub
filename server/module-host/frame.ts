/**
 * Host document for module web components.
 *
 * The frame is embedded with `sandbox="allow-scripts"` (no
 * `allow-same-origin`), so module code runs in an opaque origin: it cannot read
 * the hub's DOM, cookies, localStorage or session. It receives only a
 * short-lived module token through `postMessage`.
 */
export const MODULE_FRAME_PATH = '/module-frame.html';

export const MODULE_FRAME_HTML = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Module</title>
    <style>
      html, body { margin: 0; padding: 0; background: transparent; color-scheme: light dark; }
      body { color: inherit; font-family: inherit; }
      * { box-sizing: border-box; }
    </style>
  </head>
  <body>
    <script>
      (function () {
        const send = function (message) { window.parent.postMessage(message, '*'); };
        window.addEventListener('error', function (event) {
          send({ type: 'module-error', message: 'frame error: ' + (event.message || 'unknown') });
        });
        window.addEventListener('unhandledrejection', function (event) {
          send({ type: 'module-error', message: 'frame rejection: ' + String(event.reason && event.reason.message || event.reason) });
        });
        const text = function (element) {
          const root = element.shadowRoot;
          const panel = root && (root.querySelector('.panel') || root.querySelector('[class]'));
          return ((panel && panel.textContent) || (root && root.textContent) || document.body.textContent || '')
            .replace(/\\s+/g, ' ').trim().slice(0, 600);
        };
        window.addEventListener('message', function (event) {
          if (event.source !== window.parent) return;
          const data = event.data || {};
          if (data.type === 'theme') {
            document.documentElement.classList.toggle('dark', data.value === 'dark');
            return;
          }
          if (data.type !== 'mount') return;
          (async function () {
            try {
              document.documentElement.classList.toggle('dark', data.theme === 'dark');
              await import(data.url);
              if (!customElements.get(data.element)) throw new Error('Custom element ' + data.element + ' is not registered');
              const element = document.createElement(data.element);
              element.style.display = 'block';
              Object.assign(element, {
                token: data.token || '',
                moduleId: data.moduleId,
                apiBase: data.apiBase,
                wsBase: data.wsBase || '',
              });
              document.body.replaceChildren(element);
              if (data.theme === 'dark') element.classList.add('dark');
              const report = function () { send({ type: 'mounted', text: text(element) }); };
              setTimeout(report, 400);
              // Module UIs often fetch their data asynchronously; report again.
              setTimeout(report, 1_500);
            } catch (error) {
              send({ type: 'module-error', message: String(error && error.message || error) });
            }
          })();
        });
        send({ type: 'ready' });
      })();
    </script>
  </body>
</html>
`;

/** CSP for the frame: it must load module bundles and talk to the module proxy. */
export const MODULE_FRAME_CSP = [
  "default-src 'none'",
  "script-src 'unsafe-inline' http: https:",
  "style-src 'unsafe-inline' http: https:",
  "img-src * data: blob:",
  "font-src * data:",
  "media-src * data: blob:",
  "connect-src http: https: ws: wss:",
  "frame-ancestors 'self'",
].join('; ');
