# Модульная архитектура Vuesp Hub

Статус: черновик. Выбранный путь: **ядро + модули в отдельных процессах + IPC**, UI — **гибрид** (декларативные настройки + изолированный iframe/Web Component для сложных страниц).

## 1. Цель

- Базовая установка хаба остаётся лёгкой и рабочей без модулей.
- Пользователь устанавливает только нужные интеграции: камеры, Яндекс, modbus, smart home и т.д.
- Модули обновляются и удаляются независимо от ядра.
- Падение или утечка модуля не роняют ядро.
- Один контракт для Electron-приложения и headless-сервера.

## 2. Ядро и модули

### Ядро (всегда)

- device runtime и протоколы устройств;
- serial/network transport;
- auth, access, сессии;
- локальный HTTP + Socket.IO;
- облачный коннектор, телеметрия, realtime;
- storage и secrets;
- module host;
- UI-оболочка, навигация, темы;
- обновление ядра.

### Модули (опционально)

- `vuesp-hub.video.cameras` — камеры, ffmpeg, WebRTC/стриминг;
- `vuesp-hub.yandex` — Яндекс: Алиса и Умный дом в одном процессе и с общими аккаунтами;
- `vuesp-hub.modbus` — Modbus;
- `vuesp-hub.video` — видеопанели;
- будущие интеграции.

Ядро не импортирует код модулей и не знает об их внутренностях.

### Пространства имён

Устройства и прошивки используют `vuesp.*` (`vuesp.cam`, `vuesp.smokehouse`). Модули hub живут в отдельном пространстве:

```text
vuesp-hub.<group>.<name>       официальные модули
module.<vendor>.<group>.<name> сторонние модули
```

- `vuesp-hub.yandex` — один модуль с ветками Alisa и Smart Home;
- `vuesp-hub.video.rtc`, `vuesp-hub.video.lan`, `vuesp-hub.video.cameras`;
- сторонние: `module.acme.video.rtc` по тому же контракту.

`vuesp.*` и `vuesp-hub.*` не пересекаются, поэтому устройство и модуль не могут получить одинаковый id.

### Группы

Группа — UI-сущность, а не отдельный процесс. Модули остаются устанавливаемыми по отдельности.

```json
{
  "group": {
    "id": "vuesp-hub.video",
    "slug": "video",
    "name": "Видео",
    "icon": "video",
    "order": 30
  },
  "slug": "rtc"
}
```

- `group.id` — стабильный id группы;
- `group.slug` — часть публичного URL;
- `group.name`, `icon`, `order` — отображение;
- `slug` — имя модуля внутри группы.

Если `group` нет, модуль показывается отдельно.

### Публичные URL

```text
UI:     /modules/<group>/<slug>
API:    /api/v1/modules/<id>/proxy/*
Assets: /modules/<group>/<slug>/web/*
WS:     /modules/<group>/<slug>/ws/*
```

Примеры:

```text
/modules/video/rtc
/modules/video/lan
/modules/video/cameras
/modules/yandex/alisa
/modules/yandex/smart-home
/modules/vuesp-hub.hello        ← модуль без группы
```

- все модульные страницы живут под `/modules/*` и не могут занять core-маршрут;
- hub ведёт реестр `public route → module id`;
- при установке маршрут резервируется, конфликт отклоняется с ошибкой;
- API остаётся по каноническому id, чтобы публичный URL можно было менять без ломки API.

## 3. Формат модуля

Модуль — готовый платформенный пакет, без `npm install` на машине пользователя.

```text
vuesp-hub.video.cameras-1.2.0-linux-x64.vmod
├── manifest.json
├── server/index.cjs
├── web/index.html
├── web/assets/*
└── native/ffmpeg
```

`manifest.json`:

```json
{
  "id": "vuesp-hub.video.cameras",
  "name": "Камеры",
  "version": "1.2.0",
  "apiVersion": 1,
  "uiApiVersion": 1,
  "platforms": ["linux-x64", "win32-x64"],
  "entry": "server/index.cjs",
  "web": { "entry": "web/entry.js", "element": "vuesp-module-cameras" },
  "group": { "id": "vuesp-hub.video", "slug": "video", "name": "Видео", "icon": "video", "order": 30 },
  "slug": "cameras",
  "permissions": ["network", "camera", "files", "cloud.events"],
  "resources": { "memoryMb": 256 },
  "settings": [],
  "sha256": "...",
  "signature": "..."
}
```

Требования:

- `apiVersion` проверяется ядром;
- `platforms` — какие платформы поддерживаются;
- `permissions` подтверждает пользователь при установке;
- `signature` — подпись ed25519 официального каталога;
- `sha256` — контроль целостности.

## 4. Module Host

Компоненты ядра:

- `ModuleRegistry` — установленные модули, версии, включённость;
- `ModuleInstaller` — скачивание, проверка подписи, распаковка, атомарная установка, откат;
- `ModuleProcess` — запуск модуля в `child_process.fork` с ограниченным окружением;
- `ModuleProxy` — HTTP/WebSocket проксирование на loopback-порт модуля;
- `ModuleUiHost` — вкладки, настройки, iframe;
- `ModuleCatalog` — каталог, обновления, совместимость.

### Жизненный цикл

```text
installed -> enabled -> activating -> active -> stopping -> disabled
                \-> error -> restart/rollback
```

- одновременно работают только включённые модули;
- выключенный модуль не занимает память;
- при падении — ограниченное число перезапусков;
- логи модуля хранятся отдельно и доступны в UI.

### Процесс

- `child_process.fork` с `serialization: 'advanced'`;
- рабочая директория — папка модуля;
- отдельная папка данных: `data/module-data/<id>/` (не пересекается с кодом модуля);
- отдельные секреты: `secrets/modules/<id>.json`;
- `--max-old-space-size` из `resources.memoryMb`;
- переменные окружения ядра не передаются;
- IPC — JSON-RPC с requestId, таймаутами и версией API.

## 5. API модуля

Модуль получает `ctx`:

```ts
interface ModuleContext {
  log: Logger;
  storage: { get(key: string): Promise<unknown>; set(key: string, value: unknown): Promise<void> };
  secrets: { get(key: string): Promise<string | null>; set(key: string, value: string): Promise<void> };
  settings: { get(): Promise<Record<string, unknown>> };
  auth: { verify(token: string): Promise<unknown | null> };
  http: { fetch(input: string, init?: RequestInit): Promise<Response> };
  events: { on(event: string, handler: (payload: unknown) => void): void };
  devices: { list(): Promise<DeviceInfo[]>; send(ip: string, command: string, data?: unknown): Promise<boolean> };
  cloud: { publishTiles(...): Promise<void>; state(): Promise<CloudState> };
  routes: { serve(handler: RouteHandler): void };
  ui: { nav(...): void; page(...): void };
}
```

Правила:

- доступ к devices/cloud/secrets только при соответствующем permission;
- никакого прямого доступа к токенам ядра;
- модуль не может читать чужие папки данных;
- все вызовы ядра проходят через IPC и проверку прав.

## 6. HTTP и WebSocket

Реализовано:

- модуль вызывает `ctx.routes.serve(handler)` и получает `http.Server`, к которому может подключить Socket.IO;
- runner поднимает HTTP-сервер на `127.0.0.1:<random>` и отправляет ядру `http-ready` с портом;
- ядро проксирует динамический API по `/api/v1/modules/<id>/proxy/*` (за сессией хаба);
- статические UI-ассеты отдаются ядром из папки `web/` пакета по `/modules/<group>/<slug>/web/*`;
- WebSocket-upgrade для `/modules/<group>/<slug>/ws/*` проксируется в процесс модуля; Socket.IO ядра создаются с `destroyUpgrade: false` и не мешают модульным сокетам;
- для Socket.IO модуль получает короткоживущий токен (`GET /api/v1/modules/<id>/token`) и проверяет его через `ctx.auth.verify()` → IPC → `AuthService.verifyModuleToken()`; токен модуля не принимается как обычная сессия hub;
- SPA-маршруты `/modules` и `/modules/<group>/<slug>` остаются за Vue-роутером.

## 7. UI без iframe

Цель: страница модуля загружается и обслуживается на стороне хаба, но не выглядит как чужой iframe и не требует пересборки ядра.

### Вариант A. Web Components + Shadow DOM (рекомендуется)

Модуль собирает UI как ESM-бандл и регистрирует custom element:

```text
/modules/video/cameras/web/entry.js
```

```js
class VuespCamerasElement extends HTMLElement { ... }
customElements.define('vuesp-module-cameras', VuespCamerasElement);
```

Ядро:

- проксирует `/modules/<group>/<slug>/web/*` на процесс модуля;
- динамически импортирует `entry.js`;
- создаёт `<vuesp-module-cameras>` в route `/modules/<group>/<slug>`;
- передаёт тему, локаль, `basePath` и короткоживущий module token через свойства;
- слушает события `navigate`, `toast`, `request-auth`.

Плюсы:

- нет iframe, полноценная интеграция в shell;
- Shadow DOM изолирует CSS;
- модуль может быть на Vue (`defineCustomElement`), Lit, vanilla или другом фреймворке;
- не нужно делить Vue-рантайм и версии;
- модуль обновляется независимо.

Минусы:

- JS выполняется в origin хаба, поэтому это не security boundary;
- внутренний роутинг модуля нужно синхронизировать с роутером shell;
- размер бандла модуля включает его фреймворк (или нужен import map).

### Официальные модули: light DOM и vuesp-components

Для доверенных официальных модулей можно не создавать Shadow DOM:

```js
defineCustomElement(CameraApp, { shadowRoot: false });
```

Плюсы:

- модуль может импортировать `VButton`, `VTextField`, `VCheckbox`, `VLoader` из `vuesp-components`;
- глобальная тема, dark mode и CSS компонентов работают без адаптации;
- Tailwind-классы модуля совпадают с shell.

Минусы:

- CSS модуля глобальный, поэтому официальный модуль должен использовать уникальные имена для своих классов;
- это не граница безопасности; community-модули остаются в Shadow DOM или iframe.

Так сделаны камеры: `vuesp-module-cameras` — Vue `defineCustomElement` в light DOM, Tailwind 4 и компоненты `vuesp-components`.

### Вариант B. Module Federation

Модуль публикует remote-entry, ядро подключает его через federation и получает Vue-компонент/роут.

Плюсы:

- общий Vue-рантайм и дизайн-система;
- привычная разработка Vue-компонентов;
- можно шарить общие зависимости.

Минусы:

- жёсткая связка версий Vue/Vite/UI-библиотеки;
- сложнее обновлять модули независимо;
- CSS-изоляции по умолчанию нет;
- сложнее отлаживать и тестировать.

Подходит, только если модули действительно должны делить общие Vue-компоненты и состояние.

### Вариант C. Полноценное microfrontend-приложение

Модуль — отдельное SPA, которое хаб проксирует по `/modules/<group>/<slug>/`. Переход — обычная навигация, без iframe.

Плюсы:

- максимальная независимость;
- любая архитектура и роутер;
- хорошо для тяжёлых страниц: камеры, видео, карты.

Минусы:

- шапка/навигация/тема либо дублируются, либо подключаются через общий SDK;
- переход между shell и модулем — полная загрузка страницы;
- хуже ощущается как одно приложение.

### Вариант D. Отдельный origin

Модуль обслуживается на `http://127.0.0.1:<port>` или отдельном поддомене. Ссылка открывается в новой вкладке или в текущей без iframe.

Плюсы:

- настоящая origin-изоляция;
- можно безопасно пускать community-модули;
- не влияет на CSP и DOM shell.

Минусы:

- нет общей шапки и переходов;
- нужен отдельный механизм auth/темы;
- хуже UX для маленьких настроек.

### Вариант E. HTML-фрагменты / SSR-вставка

Модуль отдаёт HTML, ядро вставляет его в контейнер.

Не рекомендую для интерактивных страниц: XSS, конфликты CSS/JS, сложно с WebSocket и WebRTC. Допустимо только для статического контента.

### Рекомендация

- Основной путь — **Web Components + Shadow DOM (A)**.
- Для тяжёлых страниц (камеры/видео) — тот же custom element, но с собственным внутренним роутером или полноэкранным режимом (C).
- **iframe** оставить только как fallback для неподписанных/community-модулей.
- **Module Federation** не вводить, пока нет реальной потребности делить Vue-компоненты и состояние.
- Для auth модуль получает не главный токен хаба, а короткоживущий module token; доступ к API — через прокси ядра с проверкой permissions.

### Сборка UI на Tailwind

Модуль может собирать Web Component через Vite + Tailwind 4:

```text
src/web/entry.js    исходник
src/web/style.css   @import 'tailwindcss' + 'vuesp-components/theme.css'
web/entry.js        собранный ESM-бандл
```

- Tailwind генерирует токены на `:root, :host`, поэтому они работают внутри Shadow DOM;
- CSS импортируется как `?inline` и вставляется в `<style>` внутри shadow root;
- hub ставит класс `dark` на custom element и синхронизирует его с темой приложения;
- `npm run build:ui` в `vuesp-modules` собирает UI, `npm run build` затем пакует `.vmod`.

### Контракт UI-модуля

```json
{
  "web": {
    "entry": "web/entry.js",
    "element": "vuesp-module-cameras",
    "route": "/modules/video/cameras",
    "nav": { "label": "Камеры", "icon": "click" }
  },
  "uiApiVersion": 1
}
```

- ядро проверяет `uiApiVersion`;
- при несовместимости модуль не включается, показывается причина;
- модуль не получает доступ к DOM shell за пределами своего контейнера;
- тема передаётся через CSS-переменные, которые наследуются в Shadow DOM.

## 8. Безопасность

- Официальный каталог и подпись ed25519.
- Проверка SHA-256 перед установкой.
- Пользователь подтверждает permissions.
- Модуль — отдельный процесс с ограниченным окружением.
- Отдельные папки данных и секретов.
- Ограничение памяти и перезапусков.
- Community-модули — отдельный режим с предупреждением; по умолчанию только официальные.
- Статические UI-ассеты модуля (`/modules/<group>/<slug>/web/*`) отдаются без сессии, как часть локального интерфейса; динамический API модуля всегда идёт через `/api/v1/modules/<id>/proxy/*` с проверкой сессии.
- Web Component официального модуля выполняется в origin хаба и не является границей безопасности; для неподписанных модулей позже используем iframe/отдельный origin.
- Возможность отозвать/удалить модуль и очистить его данные.

## 9. Каталог и обновления

`modules.vuesp.ru` отдаёт:

```text
GET /v1/modules
GET /v1/modules/:id
GET /v1/modules/:id/versions
GET /v1/modules/:id/:version/download
```

- фильтрация по платформе и `apiVersion`;
- release notes;
- подпись и checksum;
- ядро проверяет совместимость перед обновлением;
- откат на предыдущую версию;
- автообновление — опционально.

### Зависимости и ассеты

- JS-код и UI собираются в `.vmod`; `node_modules` в пакет не попадают.
- Маленькие общие пакеты (`socket.io`, `express`) модуль получает из hub через `NODE_PATH`/SDK.
- Тяжёлые и платформенные файлы объявляются в `manifest.json` как `assets`:

```json
{
  "assets": [
    {
      "id": "ffmpeg",
      "platforms": ["linux-x64"],
      "url": "https://modules.vuesp.ru/assets/ffmpeg-linux-x64",
      "sha256": "…",
      "size": 41234567,
      "installTo": "native/ffmpeg",
      "mode": "0755"
    }
  ]
}
```

- Hub скачивает ассет, проверяет размер и SHA-256, кэширует в `data/module-cache/<sha256>`, копирует в `installTo` и выставляет права.
- `installTo` не может выходить за папку модуля.
- Ассет без подходящей платформы пропускается только при `optional: true`, иначе установка отклоняется.
- Для локальной разработки поддерживаются `file:` URL и локальный `catalog.json`.

### Каталог и установка в один клик

`/api/v1/modules/catalog` отдаёт каталог, `/api/v1/modules/catalog/install` скачивает и ставит выбранный модуль.

```text
VUESP_MODULES_CATALOG=https://modules.vuesp.ru/catalog.json
VUESP_MODULES_CATALOG=/path/to/vuesp-modules/catalog/catalog.json
```

- UI `/modules` → «Каталог» → «Установить»;
- hub сам выбирает артефакт и проверяет `sha256`;
- локальный файл каталога удобен для разработки и offline-установки;
- для production каталог должен быть HTTPS.

### Репозитории и доставка

Официальные модули живут в монорепозитории `vuesp-modules`:

```text
vuesp-modules/
├── modules/
│   ├── alisa/
│   ├── smart-home/
│   ├── cameras/
│   ├── video-rtc/
│   └── video-lan/
├── packages/
│   ├── module-sdk/       типы ctx, тестовый harness
│   └── module-build/     сборка .vmod, checksum, подпись
└── catalog/
    └── catalog.json      генерируется при релизе
```

- CI собирает `.vmod` для каждой платформы;
- артефакты публикуются в GitHub Releases;
- `catalog.json` хранит id, версию, платформу, sha256, подпись и ссылку на скачивание;
- `modules.vuesp.ru` отдаёт каталог и редиректит на Release asset;
- community-модули — отдельные репозитории и отдельный trust level в каталоге;
- общий SDK и build-скрипты не дублируются между официальными модулями.

## 10. Ресурсы и производительность

- Цель: базовая сборка не содержит `ffmpeg-static`, `alisa-npm` и другие тяжёлые зависимости. Сейчас `ffmpeg-static` ещё общий; при упаковке `.vmod` он переедет в пакет модуля.
- Каждый включённый модуль — один процесс; выключенный — ноль ресурсов.
- Общие зависимости (`ws`, `express`, `socket.io`) предоставляет ядро через SDK, чтобы не дублировать их в каждом модуле; при конфликте версий модуль может нести свои.
- Нативные бинарники — только под платформу модуля.
- Ленивый старт, остановка неактивных модулей, лимит памяти.

## 11. Совместимость

- `ModuleApiV1` — стабильный контракт.
- Семантическое версионирование модулей и ядра.
- Матрица совместимости `apiVersion`.
- Контрактные тесты SDK.
- Шаблон модуля и локальная разработка через `--module-dir`.

## 12. Миграция

1. ✅ Вынести `ModuleHost` и контракт, добавить тестовый модуль.
2. ✅ Вынести `cameras`: реестр, FFmpeg-стриминг, HTTP API и Socket.IO работают в процессе модуля; id `vuesp-hub.video.cameras`, публичный URL `/modules/video/cameras`; данные переносятся из старого `cameras.json` и `vuesp.cameras`.
3. Перевести `alisa` в модуль (сеть, без нативных зависимостей).
4. ✅ UI-хост, установка из файла/каталога, включение/выключение и логи.
5. Каталог подключён; остались подписи, автообновление и откат.
6. Постепенно вынести `modbus`, `video`, `smart-home`.
7. ✅ Перенести UI камер из shell в Web Component модуля.

После каждого шага базовая версия должна оставаться рабочей.

## 13. MVP первой итерации

Сделано:

- `ModuleHost`: registry, установка из папки и gzip `.vmod`, запуск/остановка, логи, удаление;
- отдельный процесс на модуль, `ready`/`shutdown`, JSON-RPC `storage.get/set`, `ctx.log`, `ctx.http.fetch`;
- `ctx.routes.serve` + HTTP-прокси `/api/v1/modules/<id>/proxy/*`;
- статические UI-ассеты `/modules/<id>/web/*`;
- Web Components UI: модуль отдаёт ESM-entry и регистрирует custom element;
- страницы хаба `/modules` и `/modules/<group>/<slug>`, установка из файла `.vmod` (выбор на компьютере) или по локальному пути, старт/стоп, логи, удаление;
- после удаления или выключения модуля его пункт навигации исчезает без перезагрузки страницы;
- тестовый модуль `modules-dev/hello` с UI и API;
- тесты ModuleHost: установка из папки/архива, запуск, storage, HTTP-прокси;
- `npm run smoke:ui` в headless Chrome проверяет, что модульный Web Component монтируется и получает данные из процесса модуля.

Дальше:

- ✅ вынести `cameras` с FFmpeg и WebSocket-прокси;
- ✅ ввести `vuesp-hub.*`, группы модулей и публичные маршруты `/modules/<group>/<slug>`;
- ✅ установка `.vmod` через выбор файла в интерфейсе;
- ✅ UI камер вынесен в Web Component; `/video` удалён из shell;
- ✅ каталог модулей и установка в один клик;
- вынести `alisa` в модуль;
- подписи ed25519, автообновление и откат;
- лимиты памяти и автоперезапуск при падении;
- `ffmpeg-static` в пакет модуля, а не в базовую установку hub.
