# KIKS

Детская PWA-игра. Mobile-first, управление через MediaPipe.

## Стек

- Vite + React + TypeScript
- Tailwind CSS v4 (Vite-плагин)
- MediaPipe Tasks Vision (камера / жесты — будут подключены в следующих фазах)

## Локальный запуск

```bash
npm install
npm run dev
```

Vite слушает на всех интерфейсах (`server.host: true`), так что можно открывать
с телефона по `http://<ip-компьютера>:5173`.

## Скрипты

- `npm run dev` — dev-сервер
- `npm run build` — production-сборка (`tsc -b && vite build`)
- `npm run preview` — превью production-сборки
- `npm run lint` — ESLint

## Phase 1 (текущая)

Скелет приложения: экран выбора профиля с двумя кнопками-заглушками
(«Атай» и «Эмили»). Tailwind и MediaPipe установлены, но игр пока нет.
PWA-манифест и иконки на месте.
