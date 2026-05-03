# Scrum Poker

<p align="center">
  <strong>Покер для планирования командных задач в реальном времени</strong>
</p>

<p align="center">
  <marquee behavior="scroll" direction="left">🃏 Создайте комнату · 🔗 Поделитесь ссылкой · ✅ Голосуйте · 👀 Открывайте карты · 📊 Смотрите результат</marquee>
</p>

## ✨ Возможности

- 🃏 Стандартная Fibonacci-like колода: `1, 2, 3, 5, 8, 13, 21, ?, ☕`
- ⚡ Real-time комнаты через WebSocket `/api/ws`
- 🔐 Голоса скрыты до раскрытия раунда
- 👑 Host-only действия: показать карты и начать новый раунд
- ✅ Настройка: может ли ведущий голосовать
- 📱 QR-код и копирование ссылки для приглашения
- 🧠 Без базы данных: состояние комнат хранится в памяти сервера

## 🧰 Стек

- Nuxt 4
- Vue 3 `<script setup>`
- Pinia
- Tailwind CSS v4
- Nitro WebSockets / `crossws`
- `lucide-vue-next`
- `qrcode`
- Docker + Docker Compose

## 🚀 Быстрый старт

```bash
npm install
npm run dev
```

Приложение будет доступно на:

```text
http://localhost:3007
```

## 📦 Команды

```bash
npm run dev       # dev server на 3007
npm run build     # production build
npm run preview   # preview build на 3007
```

## 🐳 Docker

Запуск через Makefile:

```bash
make up
```

Остановка:

```bash
make down
```

Эквивалентные команды:

```bash
docker compose up --build -d --remove-orphans
docker compose down --remove-orphans
```

Docker-контейнер слушает порт `3007`, и наружу проброшен тот же порт:

```text
http://localhost:3007
```

## ⚙️ Переменные окружения

```env
HOST=0.0.0.0
PORT=3007
NODE_ENV=production
```

## 🌐 Nginx Reverse Proxy

Пример nginx reverse proxy для Nuxt/Nitro + WebSocket `/api/ws`:

```nginx
map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}

server {
    listen 80;
    server_name poker.example.com;

    client_max_body_size 5m;

    location / {
        proxy_pass http://127.0.0.1:3007;

        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;

        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
        proxy_buffering off;
    }
}
```

## 🏗️ Архитектура

- `server/utils/rooms.ts` хранит комнаты в памяти и сериализует безопасный room state.
- `server/routes/api/ws.ts` обрабатывает WebSocket-команды комнаты.
- `app/composables/useRoomSocket.ts` управляет подключением, reconnect и ping.
- `app/stores/room.ts` хранит клиентское состояние комнаты.
- `app/pages/room/[id].vue` собирает основной room UI.

## 🔒 Важный инвариант

Во время голосования сервер не отдаёт значения голосов. Значения появляются только после `reveal_votes`.

```ts
vote: room.status === 'revealed' ? user.vote : null
```
