# lead-web (Next.js)

## Быстрый старт
```bash
# в корне рядом с backend
cd lead-web
cp .env.local.example .env.local  # отредактируй API_BASE
npm i
npm run dev
```

Открой http://localhost:3000 — сначала войди, затем переходи к /projects.

## Переменные окружения
- `NEXT_PUBLIC_API_BASE` — базовый URL backend (например, http://localhost:3000).

## Страницы
- `/` — логин (`POST /api/auth/login` -> { token })
- `/projects` — список проектов (`GET /api/projects`)
- `/projects/[id]` — задачи проекта (`GET /api/tasks?projectId=:id`)
- `/tasks/[id]` — карточка задачи: лента записей, добавление отчёта и фото

