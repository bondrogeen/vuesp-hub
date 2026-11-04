# Общий код `vuesp` и `vuesp-app`

Документ фиксирует, что уже переиспользуется, что дублируется и в каком порядке
переносить общее в модули. Главное правило: UI-код и dashboard-логику держим в
`vuesp-components` / `vuesp-dashboard-core`, протокол — в `vuesp-struct`, а
server/Electron-часть hub остаётся в `vuesp-app`.

## Общие пакеты

| Пакет | Роль |
|---|---|
| `vuesp-components` | UI-кит, app shell, dashboard cards, script editor, helpers, validate, composables |
| `vuesp-dashboard-core` | framework-agnostic dashboard resolution и построение команд |
| `vuesp-struct` | бинарный codec по `struct`-описанию |
| `c-struct-to-json` | низкоуровневый struct codec (через `vuesp-struct` и discovery hub) |

## Что уже можно переиспользовать в `vuesp-app`

- `vuesp-components/components`: `VButton`, `VTable`, `VSelect`, `VTextField`,
  `VList`, `VDropdown`, `BlockBreadcrumb`, `AppHeader`, `AppNotification`,
  `CardMain`.
- `vuesp-components/composables`: `useForm`, `useDialog`, `useSwipeDown`.
- `vuesp-components/validate`: `required`, `minLen`, `maxLen`, `minVal`,
  `maxVal`, `ip`, `isPort` и др.
- `vuesp-components/helpers`: `localGet/localSet`, `toByte`, `dateUtcToString`,
  `timeUtcToString`, `changeTheme`, `createDownloadLink`, `randomString` и др.
- `vuesp-components/types`: `IMessage*`, `IDashboardItem`, `IMenuItem`,
  `IListItem`.
- `vuesp-dashboard-core`: `resolveDashboardItem`, `buildDashboardCommands`,
  `getDataValue`, `getParamsData`.
- `vuesp-struct`: codec; hub уже использует его через `LegacyDeviceProtocol`.

## P0 — сделано

- Удалён мёртвый код hub:
  - `frontend/legacy-data/*` (не использовался);
  - `frontend/composables/usePorts.ts`, `frontend/utils/fs.ts`,
    `frontend/utils/gpio.ts`, `frontend/utils/const.ts`;
  - `frontend/utils/directives/*`;
  - `frontend/components/app/VCardGray.vue` заменён на `CardMain`;
  - неиспользуемая зависимость `electron-json-storage`.
- `DialogAddDevice` и `BlockModBus` переведены на `useForm` из
  `vuesp-components/composables`.
- `DialogAddDevice` использует `required` из `vuesp-components/validate`;
  числовые валидаторы Modbus остались локальными, чтобы не менять поведение.
- `frontend/utils/helpers.ts` сокращён: оставлены только hub-специфичные
  `api`, `sendFrameMessage`, `debounce`, `detectBrowser` и обёртка
  `changeTheme`; `jsonParse/jsonString` берутся из `vuesp-components`, а
  `localGet/localSet` оставлены локальными из-за SSR/тестовой инициализации
  `localStorage`.
- Компоненты, которые раньше находились через глобальную регистрацию,
  импортируются явно (`VButton`, `VTextField`, `VSelect`, `VDropdown`, `VList`).
- `app.use(vuesp)` убран из hub. Для этого `VDropdown` в `vuesp-components`
  импортирует директиву `v-outside` локально, а не через глобальный плагин.
  Требуется `vuesp-components >= 2.2.3`.
- `CardMain` получил `disabled` (`inert` + `aria-disabled`); `modbus.vue`
  использует его вместо локальной обёртки.
- В `vuesp-components/types` добавлен `IMessageDevice` и он включён в
  `TypeConstMessage`.
- `AppAside` в hub заменён на библиотечный; `LayoutMain` рендерит
  `createDeviceMenu` по группам, используя отдельный `AppNav` на каждую группу
  (совместимо с опубликованным `vuesp-components@2.2.3`). Локальная копия
  `AppAside.vue` удалена.
- `WebSocketStore` типизирует `INFO`/`DEVICE` через `IMessageInfo`/`IMessageDevice`
  из `vuesp-components/types`.
- `AppDialog` в hub стал тонкой обёрткой над библиотечным `VDialog` (заголовок,
  размер, close, callback/кнопка); собственная модалка больше не поддерживается.
- `vuesp-components` и `vuesp-dashboard-core` установлены в hub из registry
  (`2.2.3` и `0.1.0`), lock обновлён.
- В `vuesp-components/package.json` добавлено
  `"sideEffects": ["**/*.css"]` — после публикации библиотеки это даст
  надёжный tree-shaking у потребителей.

## P1 — следующие шаги

1. Иконки: перенести `VIcons` из `vuesp` в `vuesp-components/ui/icon` в
   tree-shakable виде; заменить `legacyIcons.ts`.
2. Dashboard: перенести `parseLegacyDashboard` и безопасный allow-list
   evaluator (из `legacyExpressions.ts`) в `vuesp-dashboard-core`; hub должен
   рендерить dashboard только через безопасный evaluator.
3. `AppStore`/уведомления: вынести `useNotifications`/`useTheme` в
   `vuesp-components/composables`.
4. При необходимости добавить `groups` в `AppNav` и перейти на один компонент
   вместо `AppNav` на группу.

## P2 — после появления transport-адаптера

- `ServiceStorage`, `ServiceSettings`, `ServiceGPIO` — переиспользовать в hub,
  когда появится адаптер между `useConnection` (device WS) и hub Socket.IO.
- `ScriptEditor`/`ScriptDialog` — если в hub появится редактирование скриптов.
- `BlockScan` — для discovery, если понадобится единый UI.

## Ограничения и риски

- Не переносить в `vuesp-components` серверный код: SQLite, `safeStorage`,
  UDP discovery, modbus, runtime, repository.
- Общие модули не должны зависеть от Vue Router/Pinia: у `vuesp` router 4/pinia 3,
  у `vuesp-app` router 5/pinia 4.
- `vuesp-components/dashboard` использует `new Function`. Hub не должен
  исполнять код из конфигурации устройства; нужен safe evaluator.
- `legacy-data` использует `eval` — в hub не использовать.

## Сборка `vuesp`

- `vuesp` собирает один JS (`inlineDynamicImports: true`), поэтому tree-shaking —
  единственная защита от лишнего кода.
- В `vuesp-components` не было `sideEffects`; добавлено. После публикации
  проверить размер `data/www` до/после.
- Не импортировать `vuesp-components` root без необходимости; использовать
  subpath-импорты (`/components`, `/dashboard`, `/helpers`, `/validate`,
  `/composables`).
- Проверять бюджет `data/www` (ориентир: не более +5–10 KB gzip на этап).
