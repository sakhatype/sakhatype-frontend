<p align="center">
  <img src="icon.png" alt="Sakhatype — логотип" width="200" />
</p>

# Sakhatype — фронтенд

Веб-клиент **Sakhatype**: тренажёр скорости печати с упором на **якутский язык** (саӄа тыл), режимы по времени и по словам, таблица лидеров, профили пользователей и многопользовательская арена по WebSocket.

Репозиторий содержит только фронтенд (SvelteKit). Для полноценной работы нужен бэкенд с совместимым REST/WebSocket API (в разработке по умолчанию ожидается сервер на `http://localhost:8000`).

<p align="center">
  <img src="screenshot.png" alt="Главный экран: режим времени, якутский текст и подсказка раскладки (например 5 → ҕ)" width="920" />
</p>
<p align="center"><em>Главная: тёмная тема, сетка, режимы «время / слова», подсказки для саӄа-символов</em></p>

---

## Стек

| Технология | Назначение |
|------------|------------|
| [SvelteKit](https://kit.svelte.dev/) 2 | маршрутизация, сборка |
| [Svelte](https://svelte.dev/) 5 | UI |
| [Vite](https://vitejs.dev/) 5 | dev-сервер и бандл |
| [Tailwind CSS](https://tailwindcss.com/) 3 | стили |
| [Skeleton](https://www.skeleton.dev/) | UI-кит и темы |
| [Lucide Svelte](https://lucide.dev/) | иконки |
| [@floating-ui/dom](https://floating-ui.com/) | позиционирование всплывающих элементов |

Сборка: **adapter-static** (`@sveltejs/adapter-static`) — статический вывод в каталог `build`, `fallback: 'index.html'` для SPA-поведения на хостинге.

В `src/routes/+layout.js` отключены SSR и пререндер (`ssr: false`, `prerender: false`): приложение работает как клиентский SPA.

---

## Быстрый старт

Требования: **Node.js** 18+ (рекомендуется актуальный LTS).

```bash
npm install
npm run dev
```

Откройте в браузере адрес, который выведет Vite (обычно `http://localhost:5173`).

### Скрипты

| Команда | Описание |
|---------|----------|
| `npm run dev` | режим разработки с HMR |
| `npm run build` | production-сборка в `build/` |
| `npm run preview` | локальный просмотр собранного приложения |

---

## Переменные окружения

| Переменная | Описание |
|------------|----------|
| `VITE_API_URL` | Базовый URL API. Если не задан, используется `'/api'` (относительный путь к тому же хосту, что и фронт). |

В **разработке** `vite.config.js` проксирует:

- `http://localhost:5173/api` → `http://localhost:8000`
- WebSocket ` /api/arena/ws` → `ws://localhost:8000`

То есть локально бэкенд можно не трогать в конфиге фронта, если он слушает порт **8000**.

В **продакшене** задайте `VITE_API_URL` на полный URL API (например `https://api.example.com`) или настройте reverse proxy так, чтобы путь `/api` вёл на ваш бэкенд. Для арены WebSocket-URL строится из `VITE_API_URL` (см. `src/routes/arena/+page.svelte`) или из `location.host` при относительном API.

---

## Структура проекта

```
src/
├── app.css                 # глобальные стили, Tailwind
├── app.html                # HTML-оболочка
├── lib/
│   ├── components/
│   │   ├── layout/         # Header, Footer
│   │   ├── modals/         # модальные окна (профиль, друзья, раскладка, аватар)
│   │   └── typing/         # TypingArea, ModeSelector, ResultDisplay, график WPM, история
│   ├── stores/
│   │   ├── user.js         # сессия, токен, login/register/logout
│   │   ├── typing.js       # состояние текущего теста
│   │   └── settings.js     # режим, тема, саӄа-бинды, звук (localStorage: dotx_settings)
│   └── utils/
│       ├── api.js          # HTTP-клиент к бэкенду
│       ├── sakha.js        # маппинг клавиш для якутских символов
│       ├── wordDifficulty.js
│       ├── sound.js
│       └── ...
└── routes/
    ├── +layout.svelte      # оболочка: шапка, тема, фон
    ├── +layout.js          # SPA: без SSR/prerender
    ├── +page.svelte        # главная: тренажёр
    ├── auth/+page.svelte   # вход / регистрация
    ├── leaderboard/+page.svelte
    ├── arena/+page.svelte  # комнаты, WebSocket-игра
    └── profile/[username]/+page.svelte
```

Алиасы (см. `svelte.config.js`): `$lib`, `$components`, `$stores`, `$utils`.

---

## Маршруты и функциональность

| Маршрут | Назначение |
|---------|------------|
| `/` | Выбор режима (время / количество слов), сложность, область набора, экран результата (WPM, точность), отправка результата на сервер для авторизованных |
| `/auth` | Регистрация и вход |
| `/leaderboard` | Таблица рекордов с фильтром по режиму |
| `/arena` | Список комнат, создание, игра по WebSocket (`/api/arena/ws/...`) |
| `/profile/[username]` | Публичный профиль |

**Настройки** (store `settings.js`): режим и длительность теста, сложность слов, якутская раскладка через цифровые бинды, кастомные привязки клавиш, тема светлая/тёмная, звук, плавный карет, подсказки клавиш.

---

## Слой API (`src/lib/utils/api.js`)

База запросов: `import.meta.env.VITE_API_URL || '/api'`.

Основные методы объекта `api`:

- **Аутентификация:** `register`, `login`, `getMe`
- **Набор:** `getWords(language, count, difficulty)`, `submitResult`, `getHistory`
- **Лидерборд:** `getLeaderboard(mode, modeValue, limit)`
- **Профиль:** `getProfile`, `updateProfile`, `getAchievements`
- **Арена:** `createRoom`, `listRooms`

Часть UI (например панель друзей, загрузка аватара) может вызывать дополнительные методы `api` — их контракт должен совпадать с вашим бэкендом.

---

## Лицензия и версия

Версия пакета в `package.json`: **2.0.0**. Уточните лицензию в отдельном файле `LICENSE`, если планируете открытую публикацию.
