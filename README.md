# Expense Tracker

A modern, frontend-only personal expense tracker built with React, TypeScript, Vite, Tailwind CSS, Zustand, Recharts, and Dexie (IndexedDB).

## Features

- Dashboard with spending stats, trends, and category charts
- Full expense CRUD with search and filters
- Category management (defaults + custom)
- Monthly and per-category budgets with progress bars
- Savings goals
- Recurring expenses (daily / weekly / monthly / yearly)
- Reports and analytics with insights
- JSON / CSV export, monthly **Excel (.xlsx)** export, and JSON import
- Dark mode, currency selection, offline PWA

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:5173/](http://localhost:5173/) (dev uses `/`; production build uses `/expense-tracker/` for GitHub Pages).

## Build

```bash
npm run build
npm run preview
```

## GitHub Pages

1. Push this repo to GitHub.
2. Enable **Settings → Pages → GitHub Actions**.
3. The workflow in `.github/workflows/deploy.yml` deploys on push to `main`.

Live URL: `https://<username>.github.io/expense-tracker/`

> Update `base` in `vite.config.ts` if your repository name differs from `expense-tracker`.

## Tech stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4
- Zustand
- Recharts
- Dexie.js (IndexedDB)
- vite-plugin-pwa

All data stays in the browser — no backend required.
