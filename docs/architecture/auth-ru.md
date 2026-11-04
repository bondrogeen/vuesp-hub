# JWT-авторизация hub

Hub защищает HTTP API, `/proxy` и Socket.IO локальной JWT-авторизацией.
Статические файлы web UI и страница логина остаются публичными.

## Учётная запись

- При первом запуске создаётся `admin` с паролем `admin`.
- Пароль хранится как scrypt-хеш в `<data-dir>/auth.json` (права `0600`).
- Пароль в открытом виде нигде не сохраняется.

## JWT

- Подпись: HMAC-SHA256, срок жизни 7 дней.
- Секрет берётся из `VUESP_JWT_SECRET` или создаётся в `<data-dir>/jwt.secret` (права `0600`).
- Клиент хранит токен в `localStorage` под ключом `vuesp-auth-token`.

## API

```http
POST /api/v1/auth/login
Content-Type: application/json

{"username":"admin","password":"admin"}
```

Ответ:

```json
{
  "token": "<jwt>",
  "user": { "username": "admin" }
}
```

Дальше токен передаётся как `Authorization: Bearer <jwt>`.

```http
GET /api/v1/auth/me
Authorization: Bearer <jwt>
```

Без токена API отвечает `401 {"error":"Unauthorized"}`.

## Socket.IO

Токен передаётся в handshake:

```ts
io('/ws/device', { auth: { token } })
```

Middleware проверяет токен для `/ws/device`, `/ws/stream` и `/ws/serial`.

## Web UI

- `/auth/login` — страница входа, по умолчанию поля заполнены `admin` / `admin`.
- Router guard перенаправляет на логин, если токена нет.
- После успешного входа выполняется переход на исходный маршрут.
- В сайдбаре есть кнопка `Sign out`, которая очищает токен и возвращает на логин.
- При `401` от API токен очищается и происходит переход на `/auth/login`.

## Ограничения текущего этапа

- Нет смены пароля и управления пользователями через UI.
- Нет refresh-токенов, отзыва сессий и rate limiting для `/auth/login`.
- Токен хранится в `localStorage`; для LAN-доступа без TLS это осознанное ограничение.
