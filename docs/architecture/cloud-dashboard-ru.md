# Облачный дашборд хаба

## Принцип

Хаб остаётся источником истины: он хранит конфигурацию дашборда устройства,
исполняет выражения `get`/`set` и общается с устройством. В личный кабинет
уходят только уже разрешённые безопасные плитки.

В облако **не передаются**:

- сырое состояние устройства (`state`);
- выражения плиток (`args`, `get`, `getTo`, `set`, `meta`);
- любые служебные поля, которых нет в публичной схеме плитки.

Публичная плитка содержит только то, что нужно для отрисовки и действия:

```ts
interface PublicDashboardTile {
  key: string;         // уникальный ключ: <deviceUuid>:<index>
  id: string;
  name: string;
  type: string;        // button | dimmer | info | input | list | date
  entityType: string;  // switch | number | sensor | text | select
  icon?: string;       // исходное имя иконки устройства
  viewIcon: string;    // имя из общего набора VisionIcon
  opts?: Record<string, unknown>;
  value?: unknown;     // разрешённое значение для отображения
  valueTo?: unknown;   // форматированное значение
}
```

`key` нужен потому, что `id` плитки не уникален внутри устройства: на BMS,
например, две строки `device.status3`. Ключ строится из UUID устройства и
позиции плитки в дашборде.

`viewIcon` — единый источник иконок: хаб сам маппит `icon` в имя из набора
`VisionIcon` и публикует результат. ЛК не содержит собственного маппинга и
рисует ровно то же, что и хаб.

## Снимок

Хаб отправляет снимок по WebSocket `wss://api.vuesp.ru/hub` (HTTP
`POST /telemetry/snapshots` остаётся fallback):

```json
{
  "type": "snapshot",
  "hubId": "...",
  "hubName": "Home",
  "observedAt": 1700000000000,
  "devices": [
    {
      "deviceId": "uuid",
      "name": "Lamp",
      "ip": "192.168.1.10",
      "observedAt": 1700000000000,
      "tiles": []
    }
  ]
}
```

Backend хранит только последний снимок на устройство и отдаёт его владельцу
или администратору через `GET /my/hubs/:id`.

## Действие

```text
LK
  POST /my/hubs/:hubId/devices/:deviceId/action  { tileId, tileKey, value }
    → backend проверяет владельца и наличие устройства
    → HubGateway.requestAction()
    → WS { type: 'action', requestId, deviceId, tileId, tileKey, value }
      → hub находит плитку по уникальному tileKey (fallback: tileId)
      → buildTileCommands() исполняет set на хабе
      → runtime.send(ip, comm, data)
    → WS { type: 'action_result', requestId, ok, error? }
  ← { ok: true }
```

Значение действия — только `string | number | boolean`. Неизвестные плитки,
плитки без `set` и отключённые устройства возвращают `ok: false`.

## Выбор плиток и лимит

Пользователь выбирает публикуемые плитки на странице хаба **«Облако»**:

- хаб отдаёт полный список плиток и текущий выбор через `GET /cloud/tiles`;
- сохранение — `PUT /cloud/tiles` с массивом ключей;
- выбор хранится в `cloud.json` в поле `publishedTiles`;
- после сохранения хаб сразу перепубликовывает снимок.

`buildPublishedTiles()` фильтрует плитки по allowlist и только потом применяет
лимит **20 плиток** (`MAX_PUBLISHED_TILES`). Backend дополнительно отклоняет
снимок, в котором больше 20 плиток.

Если у существующего хаба ещё нет `publishedTiles`, по умолчанию публикуются
первые 20 плиток — прежнее поведение сохраняется до первого сохранения выбора.

## Единый источник плиток

- Внешний вид плиток задают компоненты `vuesp-components` (`CardButton`,
  `CardDimmer`, `CardInfo`, `CardInput`, `CardList`, `CardDate`).
- Хаб и ЛК используют одни и те же компоненты, поэтому кнопки, диммеры,
  списки и поля выглядят и ведут себя одинаково.
- `shared/dashboardTiles.ts` — единственный источник разрешения значений,
  построения команд, публичной схемы плитки и маппинга `viewIcon`.
- ЛК не исполняет выражения и не маппит иконки: он получает готовый
  `PublicDashboardTile` и рисует его.
- Мобильный клиент должен использовать тот же контракт `PublicDashboardTile`
  (`key`, `type`, `viewIcon`, `opts`, `value`, `valueTo`) и те же компоненты,
  если клиент веб-технологический.
