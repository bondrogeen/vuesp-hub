const MODULE_ID = (() => {
  const match = new URL(import.meta.url).pathname.match(/\/modules\/([^/]+)\//);
  return match ? decodeURIComponent(match[1]) : 'vuesp-hub.hello';
})();

const API_BASE = `/api/v1/modules/${MODULE_ID}/proxy`;

const styles = `
  :host {
    display: block;
    color: var(--color-vision-text, #1f2937);
    font-family: inherit;
  }
  .panel {
    border: 1px solid var(--color-vision-border, rgba(148, 163, 184, .35));
    background: var(--color-vision-card, rgba(255, 255, 255, .7));
    border-radius: 12px;
    padding: 16px;
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .title {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
  }
  .muted {
    margin: 4px 0 0;
    color: var(--color-vision-muted, #64748b);
    font-size: 12px;
  }
  .stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 8px;
    margin-top: 16px;
  }
  .stat {
    border-radius: 8px;
    background: var(--color-vision-bg-soft, rgba(148, 163, 184, .12));
    padding: 12px;
  }
  .stat span {
    display: block;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: .04em;
    color: var(--color-vision-muted, #64748b);
  }
  .stat strong {
    display: block;
    margin-top: 4px;
    font-size: 16px;
  }
  button {
    border: 0;
    border-radius: 8px;
    background: var(--color-vision-primary, #06b6d4);
    color: #fff;
    cursor: pointer;
    font: inherit;
    font-size: 13px;
    padding: 8px 12px;
  }
  button:disabled {
    cursor: progress;
    opacity: .6;
  }
  .error {
    margin-top: 12px;
    color: var(--color-vision-danger, #e11d48);
    font-size: 12px;
  }
`;

class VuespModuleHello extends HTMLElement {
  #shadow;
  #state;
  #error;
  #loading = false;

  constructor() {
    super();
    this.#shadow = this.attachShadow({ mode: 'open' });
    this.token = '';
  }

  connectedCallback() {
    this.#render();
    void this.#load();
  }

  async #load() {
    this.#loading = true;
    this.#error = undefined;
    this.#render();
    try {
      const response = await fetch(`${API_BASE}/state`, {
        headers: this.token ? { authorization: `Bearer ${this.token}` } : {},
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      this.#state = await response.json();
    } catch (error) {
      this.#error = error instanceof Error ? error.message : String(error);
    } finally {
      this.#loading = false;
      this.#render();
    }
  }

  #render() {
    const state = this.#state;
    const rows = state
      ? `
        <div class="stat"><span>Module</span><strong>${state.id}</strong></div>
        <div class="stat"><span>Version</span><strong>${state.version}</strong></div>
        <div class="stat"><span>Starts</span><strong>${state.starts}</strong></div>
        <div class="stat"><span>PID</span><strong>${state.pid}</strong></div>
        <div class="stat"><span>Uptime</span><strong>${state.uptime}s</strong></div>
      `
      : '';

    this.#shadow.innerHTML = `
      <style>${styles}</style>
      <section class="panel">
        <div class="row">
          <div>
            <h2 class="title">Hello module</h2>
            <p class="muted">Web Component UI served by the hub, data from the module process.</p>
          </div>
          <button type="button" ${this.#loading ? 'disabled' : ''}>${this.#loading ? 'Loading…' : 'Refresh'}</button>
        </div>
        ${state ? `<div class="stats">${rows}</div>` : ''}
        ${this.#error ? `<p class="error">${this.#error}</p>` : ''}
      </section>
    `;

    this.#shadow.querySelector('button')?.addEventListener('click', () => void this.#load());
  }
}

if (!customElements.get('vuesp-module-hello')) {
  customElements.define('vuesp-module-hello', VuespModuleHello);
}
