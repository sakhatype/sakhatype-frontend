# Sakhatype - План проекта для переписывания на Vue

## Обзор проекта

**Sakhatype** — веб-приложение для тренировки скорости печати с интеграцией культуры народа Саха (Якутия). Проект сочетает обучение слепому десятипальцевому методу набора с погружением в якутскую культуру через тексты, пословицы и эпосы.

### Основная цель
Создать современное, отзывчивое приложение для проверки скорости печати с системой прогресса, рейтингами и культурным контентом.

---

## Технологический стек

### Frontend Framework
- **Vue 3.5+** — Composition API, `<script setup>`
- **TypeScript 5.9** — строгая типизация
- **Vite 7** — сборщик и dev-сервер

### Управление состоянием
- **Pinia 3** — state management (stores)
- **Vue Router 4** — маршрутизация

### UI/UX
- **Tailwind CSS 4** — utility-first CSS framework
- **Reka UI** (shadcn-vue) — headless UI компоненты
- **Lucide Vue Next** — иконки
- **Chart.js + vue-chartjs** — графики и визуализация

### Утилиты
- **@vueuse/core** — коллекция Vue composables
- **class-variance-authority** — управление вариантами стилей
- **clsx + tailwind-merge** — объединение классов
- **html2canvas / dom-to-image-more** — скриншоты результатов

### Анимации
- **@motionone/vue** — анимации
- **motion-v** — дополнительные анимации

---

## Архитектура проекта

### Структура директорий

```
sakhatype-frontend/
├── public/
│   ├── fonts/              # Кастомные шрифты (Benzin, SF UI Display)
│   ├── sounds/             # Звуковые эффекты (keypress.mp3)
│   └── logo.svg, logo-b.svg
├── src/
│   ├── components/         # Переиспользуемые компоненты
│   │   ├── ui/            # UI библиотека (shadcn-vue)
│   │   ├── Header.vue
│   │   ├── Footer.vue
│   │   ├── Control.vue    # Выбор времени теста
│   │   ├── ResultsView.vue
│   │   ├── LoginDialog.vue
│   │   ├── Kbd.vue        # Подсказки клавиш
│   │   └── KeyBindingsSettings.vue
│   ├── views/             # Страницы приложения
│   │   ├── HomePage.vue   # Главная (тест печати)
│   │   ├── Leaderboard.vue
│   │   └── Profile.vue
│   ├── layouts/
│   │   └── Main.vue       # Основной layout
│   ├── stores/            # Pinia stores
│   │   ├── typingStore.js # Логика теста печати
│   │   ├── control.ts     # Настройки времени
│   │   ├── auth.ts        # Аутентификация
│   │   └── themes.ts      # Темы
│   ├── shared/            # Общие модули
│   │   ├── api/          # API клиент
│   │   │   ├── client.ts
│   │   │   ├── auth.ts
│   │   │   ├── typing.ts
│   │   │   ├── user.ts
│   │   │   └── index.ts
│   │   ├── composables/
│   │   │   ├── useSound.ts
│   │   │   └── useTheme.ts
│   │   └── ui/           # Экспорты UI компонентов
│   ├── composables/       # Vue composables
│   │   ├── useTheme.ts
│   │   └── useYakutKeyBindings.ts
│   ├── entities/          # Доменные модели
│   │   ├── user/
│   │   ├── word/
│   │   └── test-result/
│   ├── features/          # Фичи
│   │   └── auth/
│   │       └── model/
│   │           └── authStore.ts
│   ├── router/
│   │   └── index.ts
│   ├── lib/
│   │   └── utils.ts       # Утилиты (cn helper)
│   ├── App.vue
│   ├── main.ts
│   └── main.css
├── Dockerfile
├── nginx-custom.conf
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## Основные функции

### 1. Тест печати (HomePage)

#### Функционал
- **Режимы времени**: 15, 30, 60 секунд (настраивается)
- **Текстовый дисплей**:
  - Прокрутка текста по мере печати
  - Подсветка текущего символа (курсор)
  - Цветовая индикация: правильные (белые), ошибки (красные)
  - Отображение лишних символов
- **Таймер**: обратный отсчет с анимацией
- **Скрытый input** для desktop, видимый для mobile
- **Горячие клавиши**:
  - `Tab` / `Escape` — рестарт теста
  - `Ctrl + Backspace` — очистить текущее слово
  - Цифры 1-8 — замена на якутские буквы (настраивается)

#### Метрики в реальном времени
- **WPM** (Words Per Minute) — слова в минуту
- **Raw WPM** — без учета ошибок
- **CPM** (Characters Per Minute) — символы в минуту
- **Accuracy** — точность в процентах
- **Burst WPM** — максимальная скорость
- **Errors** — количество ошибок

#### Логика работы (typingStore)
```javascript
state: {
  texts: [],              // Массив текстов для печати
  words: [],              // Текущий текст разбитый на слова
  currentWordIndex: 0,    // Индекс текущего слова
  inputValue: '',         // Текущий ввод
  startTime: null,        // Время начала теста
  timeLeft: 15,           // Оставшееся время
  isTestActive: false,    // Активен ли тест
  correctChars: 0,        // Правильные символы
  totalChars: 0,          // Всего символов
  totalErrors: 0,         // Всего ошибок
  wordHistory: [],        // История слов (correct/incorrect)
  wpmHistory: [],         // История WPM по секундам
  rawHistory: [],         // История Raw WPM
  burstHistory: [],       // История Burst WPM
  errorTimestamps: [],    // Временные метки ошибок
  correctPerSecond: {},   // Правильные символы по секундам
  totalPerSecond: {},     // Всего символов по секундам
  errorsPerSecond: {}     // Ошибки по секундам
}

actions: {
  initTest()              // Инициализация теста
  startTimer()            // Запуск таймера
  endTest()               // Завершение теста
  processInput(value)     // Обработка ввода
  setTime(time)           // Установка времени
}
```

#### Звуковые эффекты
- `keypress.mp3` — звук нажатия клавиши
- Отдельные звуки для правильных/неправильных символов
- Переключатель звука в Footer

### 2. Результаты теста (ResultsView)

#### Отображаемые данные
- **Основные метрики**:
  - WPM (крупно)
  - Raw WPM
  - Accuracy %
  - Burst WPM
  - Total Errors
- **Графики** (Chart.js):
  - WPM по времени
  - Raw WPM по времени
  - Burst WPM по времени
  - Ошибки по времени
- **Действия**:
  - Рестарт теста
  - Сохранение результата (если авторизован)
  - Скриншот результатов

### 3. Аутентификация

#### Компоненты
- **LoginDialog** — модальное окно входа/регистрации
- **authStore** (Pinia) — управление состоянием аутентификации

#### API endpoints
```typescript
POST /api/auth/register
  Body: { username: string, password: string }
  Response: UserResponse

POST /api/auth/login
  Body: FormData (username, password)
  Response: { access_token: string, token_type: string, username: string }

GET /api/users/me
  Headers: Authorization: Bearer <token>
  Response: UserResponse
```

#### Хранение токена
- `localStorage.setItem('token', token)`
- `localStorage.setItem('username', username)`
- Автоматическая установка в API client headers

### 4. Профиль пользователя (Profile)

#### Отображаемые данные
- **Аватар** — первая буква username с градиентом
- **Информация**:
  - Username
  - Уровень (Level)
  - Опыт (XP) с прогресс-баром
  - Дата регистрации
- **Статистика**:
  - Пройдено тестов
  - Лучший WPM
  - Общее время практики
- **Последние тесты** (10 шт):
  - WPM, Accuracy, Time mode, Дата

#### Система уровней
- 1 уровень = 1000 XP
- Прогресс-бар до следующего уровня
- Badge с текущим уровнем

### 5. Лидерборд (Leaderboard)

#### Функционал
- **Вкладки**:
  - WPM (по умолчанию)
  - Accuracy (закомментирована)
- **Поиск** по username
- **Сортировка** по колонкам:
  - Username
  - Level
  - Total Tests
  - WPM / Accuracy
- **Медали** для топ-3:
  - 🥇 Золото
  - 🥈 Серебро
  - 🥉 Бронза
- **Адаптивный дизайн**:
  - Desktop: таблица
  - Mobile: карточки

#### API endpoints
```typescript
GET /api/leaderboard/wpm?limit=100
  Response: LeaderboardEntry[]

GET /api/leaderboard/accuracy?limit=100
  Response: LeaderboardEntry[]

interface LeaderboardEntry {
  username: string
  best_wpm: number
  best_accuracy: number
  level: number
  total_tests: number
}
```

### 6. Темы (Dark/Light mode)

#### Реализация
- **useTheme composable**:
  ```typescript
  const isDark = ref(localStorage.getItem('theme') === 'dark')
  const toggleDark = () => { isDark.value = !isDark.value }
  watch(isDark, (val) => localStorage.setItem('theme', val ? 'dark' : 'light'))
  ```
- **Tailwind классы**: условное применение через `:class`
- **Цветовая схема**:
  - Dark: `bg-[#0a0a0a]`, `text-white`
  - Light: `bg-gray-50`, `text-gray-900`

### 7. Якутский ввод

#### Маппинг клавиш (useYakutKeyBindings)
```typescript
const yakutKeyMap = ref({
  '1': 'ҕ',  // Якутская буква ҕ
  '2': 'ҥ',  // Якутская буква ҥ
  '3': 'ө',  // Якутская буква ө
  '4': 'һ',  // Якутская буква һ
  '5': 'ү',  // Якутская буква ү
  '6': 'ӱ',  // Якутская буква ӱ
  '7': 'ӧ',  // Якутская буква ӧ
  '8': 'ҕ'   // Дубликат
})
```

#### Настройки
- **KeyBindingsSettings** компонент
- Сохранение в localStorage
- Переключение в модальном окне (Footer)

---

## API интеграция

### API Client (shared/api/client.ts)

```typescript
class ApiClient {
  private token: string | null

  setToken(token: string)
  clearToken()
  getHeaders(): Record<string, string>
  async request<T>(endpoint: string, options?: RequestInit): Promise<T>
}

export const apiClient = new ApiClient()
```

### Endpoints

#### Auth API
- `POST /api/auth/register` — регистрация
- `POST /api/auth/login` — вход
- `GET /api/users/me` — текущий пользователь

#### Typing API
- `GET /api/words?limit=100` — получить слова
- `POST /api/results` — сохранить результат
- `GET /api/results/user/:username?limit=50` — результаты пользователя

#### User API
- `GET /api/users/:username` — профиль пользователя

#### Leaderboard API
- `GET /api/leaderboard/wpm?limit=100`
- `GET /api/leaderboard/accuracy?limit=100`

### Типы данных

```typescript
// Test Result
interface TestResultCreate {
  wpm: number
  raw_wpm: number
  accuracy: number
  burst_wpm: number
  total_errors: number
  time_mode: number
  test_duration: number
  consistency: number
}

// User
interface UserResponse {
  username: string
  total_tests: number
  total_time_seconds: number
  best_wpm: number
  best_accuracy: number
  total_experience: number
  level: number
  created_at: string
}

// Leaderboard
interface LeaderboardEntry {
  username: string
  best_wpm: number
  best_accuracy: number
  level: number
  total_tests: number
}
```

---

## UI компоненты (shadcn-vue)

### Используемые компоненты
- **Alert** / **AlertDialog** — уведомления и диалоги
- **Badge** — бейджи (уровни, статусы)
- **Button** — кнопки
- **Card** — карточки контента
- **Dialog** — модальные окна
- **DropdownMenu** — выпадающие меню
- **Input** — поля ввода
- **Label** — метки
- **Progress** — прогресс-бары
- **Tabs** — вкладки
- **Table** — таблицы
- **Toggle** / **ToggleGroup** — переключатели

### Кастомные компоненты
- **Kbd** — отображение клавиш клавиатуры
- **KbdGroup** — группа клавиш

---

## Роутинг

```typescript
const routes = [
  {
    path: '/',
    component: MainLayout,
    children: [
      { path: '', name: 'Home', component: HomePage },
      { path: 'leaderboard/:filter?', name: 'Leaderboard', component: Leaderboard },
      { path: 'profile', name: 'Profile', component: Profile }
    ]
  }
]
```

---

## Стилизация

### Tailwind CSS
- **Конфигурация**: Tailwind CSS 4 с `@tailwindcss/vite`
- **Кастомные цвета**: определены в `main.css`
- **Шрифты**:
  - Benzin (Bold, Regular) — основной шрифт
  - SF UI Display — дополнительный
- **Адаптивность**: mobile-first подход

### CSS переменные (main.css)
```css
@font-face {
  font-family: 'Benzin';
  src: url('/fonts/Benzin-Regular.woff2') format('woff2');
}

.benzin {
  font-family: 'Benzin', monospace;
}
```

---

## Деплой

### Docker
```dockerfile
FROM node:24-alpine as build-stage
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install
COPY . ./
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN yarn build

FROM nginx:alpine
COPY nginx-custom.conf /etc/nginx/conf.d/default.conf
COPY --from=build-stage /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Environment Variables
```env
VITE_API_URL=http://localhost:8080
```

---

## Особенности реализации

### 1. Typing Test Logic
- **Скользящее окно** для расчета WPM (3 секунды)
- **Посекундное отслеживание** метрик
- **История слов** для отображения правильных/неправильных символов
- **Автоматическая прокрутка** текста при печати

### 2. Performance
- **Debounce** для обновления графиков
- **Lazy loading** компонентов
- **Мемоизация** вычисляемых свойств

### 3. Accessibility
- **Keyboard navigation**
- **Focus management**
- **ARIA labels** (где применимо)

### 4. Mobile Support
- **Адаптивный layout**
- **Touch-friendly** элементы
- **Видимый input** на мобильных устройствах

---

## Roadmap для переписывания

### Этап 1: Настройка проекта
1. Инициализация Vite + Vue 3 + TypeScript
2. Установка зависимостей (Pinia, Router, Tailwind, UI библиотека)
3. Настройка конфигурации (vite.config.ts, tsconfig.json)
4. Создание структуры директорий

### Этап 2: Core функционал
1. API client и типы
2. Stores (auth, typing, control, themes)
3. Composables (useTheme, useSound, useYakutKeyBindings)
4. Router setup

### Этап 3: UI компоненты
1. Установка shadcn-vue компонентов
2. Создание layout (Main, Header, Footer)
3. Кастомные компоненты (Control, Kbd, KeyBindingsSettings)

### Этап 4: Страницы
1. HomePage (typing test)
2. ResultsView
3. Leaderboard
4. Profile
5. LoginDialog

### Этап 5: Интеграция
1. Подключение API
2. Тестирование функционала
3. Оптимизация производительности

### Этап 6: Финализация
1. Адаптивность
2. Accessibility
3. Анимации
4. Звуковые эффекты
5. Docker setup

---

## Зависимости

### Production
```json
{
  "@motionone/vue": "^10.16.4",
  "@tailwindcss/vite": "^4.1.16",
  "@tanstack/vue-table": "^8.21.3",
  "@vueuse/core": "^14.0.0",
  "chart.js": "^4.5.1",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "dom-to-image-more": "^3.7.2",
  "html-to-image": "^1.11.13",
  "html2canvas": "^1.4.1",
  "lucide-vue-next": "^0.547.0",
  "motion-v": "^1.7.4",
  "pinia": "^3.0.3",
  "reka-ui": "^2.6.0",
  "tailwind-merge": "^3.3.1",
  "tailwindcss": "^4.1.16",
  "vue": "^3.5.22",
  "vue-chartjs": "^5.3.2",
  "vue-router": "^4.6.3"
}
```

### Development
```json
{
  "@tsconfig/node22": "^22.0.2",
  "@types/node": "^24.9.1",
  "@vitejs/plugin-vue": "^6.0.1",
  "@vue/tsconfig": "^0.8.1",
  "prettier": "3.6.2",
  "typescript": "~5.9.0",
  "vite": "^7.1.11",
  "vite-plugin-vue-devtools": "^8.0.3",
  "vue-tsc": "^3.1.1"
}
```

---

## Заключение

Проект Sakhatype — это полнофункциональное приложение для тренировки печати с уникальной культурной составляющей. Архитектура построена на современных технологиях Vue 3 ecosystem с акцентом на производительность, типобезопасность и user experience.

Ключевые преимущества текущей реализации:
- ✅ Чистая архитектура (Feature-Sliced Design)
- ✅ TypeScript для надежности
- ✅ Композиционный API для переиспользования логики
- ✅ Адаптивный дизайн
- ✅ Темная/светлая тема
- ✅ Система прогресса и геймификация
- ✅ Интеграция с backend API
- ✅ Docker-ready deployment
