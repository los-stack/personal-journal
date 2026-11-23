# Personal Journal

Мінімалістичний веб-додаток для щоденних текстових нотаток і фіксації думок з фокусом на швидкість запису, простоту та приватність.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Database-green?style=flat-square&logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8?style=flat-square&logo=tailwindcss)

## Можливості

- **Швидкий запис** — миттєве створення нотаток без зайвих кроків
- **Вибір настрою** — фіксуйте емоційний стан для кожного запису
- **Групування за датами** — автоматична організація записів
- **Пошук і фільтри** — знаходьте записи за текстом, настроєм і датою
- **Експорт у Markdown і PDF** — зберігайте всі записи або поточні результати фільтрації
- **Темна/світла тема** — адаптується до системних налаштувань
- **Приватність** — Row Level Security забезпечує доступ лише до власних записів
- **Адаптивний дизайн** — працює на будь-якому пристрої

## Технології

| Категорія      | Технологія                |
| -------------- | ------------------------- |
| Framework      | Next.js 16 (App Router)   |
| Мова           | TypeScript                |
| База даних     | Supabase (PostgreSQL)     |
| Автентифікація | Supabase Auth             |
| Стилізація     | Tailwind CSS 4, shadcn/ui |
| Валідація      | Zod                       |

## Встановлення

### Передумови

- Node.js 20+
- npm або pnpm
- Обліковий запис [Supabase](https://supabase.com)

### Крок 1: Клонування репозиторію

```bash
git clone https://github.com/los-stack/personal-journal.git
cd personal-journal
```

### Крок 2: Встановлення залежностей

```bash
npm install
```

### Крок 3: Налаштування змінних середовища

Створіть файл `.env.local` у корені проекту:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> Ці значення можна знайти у вашому Supabase проекті: **Settings → API**

### Крок 4: Налаштування бази даних

У Supabase Dashboard відкрийте **SQL Editor**, створіть запит, вставте вміст
файлу `supabase/migrations/20261123121500_create_journal_entries.sql` і натисніть
**Run**. Міграція створює таблицю записів та Row Level Security політики, які
дозволяють кожному користувачу працювати лише з власними записами.

### Крок 5: Налаштування посилань авторизації

У Supabase Dashboard відкрийте **Authentication → URL Configuration** і додайте
`http://localhost:3000/**` до **Redirect URLs**. Для production окремо додайте
URL вашого сайту.

### Крок 6: Запуск

```bash
npm run dev
```

Відкрийте [http://localhost:3000](http://localhost:3000)

## Структура проекту

```
├── app/
│   ├── auth/
│   │   ├── callback/
│   │   ├── error/
│   │   ├── forgot-password/
│   │   ├── login/
│   │   ├── sign-up/
│   │   ├── sign-up-success/
│   │   └── update-password/
│   ├── insights/
│   ├── settings/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── journal/
│   │   ├── account-settings.tsx
│   │   ├── header.tsx
│   │   ├── entry-editor.tsx
│   │   ├── entry-card.tsx
│   │   ├── entry-list.tsx
│   │   └── journal-page.tsx
│   └── ui/
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── actions.ts
│   ├── types.ts
│   └── utils.ts
├── supabase/
│   └── migrations/
│       └── 20261123121500_create_journal_entries.sql
└── middleware.ts
```
