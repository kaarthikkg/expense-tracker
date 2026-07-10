# Expense Tracker — Design Document

## Prompt

Build a modern frontend-only Expense Tracker from `Expense_Tracker_Coding_Agent_Spec.md` using React, TypeScript, Vite, Tailwind CSS, Zustand, Recharts, Dexie (IndexedDB), PWA, and GitHub Pages deployment.

**Firebase:** Hosting + Firestore + Auth; Dexie remains the local cache with optional cloud sync when signed in.

Latest prompt: add some financial background in this application dynamic.
Latest prompt: fix Vite build chunk size warning (>500 kB).
Latest prompt: add option to see monthly insights in dashboard for previous months (not only current month).
Latest prompt: add an option to select which card/bank was used for both expenses and income transactions.
Latest prompt: add a dashboard widget to show expense/income split by selected card/bank.
Latest prompt: remove the Account cash flow widget from dashboard.
Latest prompt: check how to integrate with Firebase.
Latest prompt: give me step by step guide (Firebase integration).
Latest prompt: how to check if the data is coming from firebase.
Latest prompt: yes (implement Auth + Dexie↔Firestore sync + data-source indicator).
Latest prompt: will it cost or free in firebase.

## Stack

| Layer | Choice |
|-------|--------|
| UI | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS v4 |
| State | Zustand |
| Charts | Recharts |
| Persistence | Dexie.js (IndexedDB) |
| Routing | React Router v7 |
| PWA | vite-plugin-pwa |
| Deploy | GitHub Pages (`base: /expense-tracker/`) or Firebase Hosting (`npm run deploy:firebase`) |
| Backend | Firebase Hosting, Firestore, Auth (`firebase` SDK); Dexie offline cache + sync |

## Architecture

```
src/
├── components/   # Reusable UI (layout, charts, forms, modals)
├── pages/        # Route-level views
├── hooks/        # useTheme, useFilteredExpenses, etc.
├── services/     # recurring, import/export, analytics
├── store/        # Zustand stores (sync with Dexie)
├── db/           # Dexie schema + seed
├── types/        # Shared TypeScript interfaces
├── utils/        # dates, currency, formatters
└── routes/       # App router
```

## Data Model

- **expenses** — amount, categoryId, description, date, createdAt, `type` (`expense` | `income`)
- **categories** — name, color, icon (defaults seeded on first run)
- **budgets** — monthly total + per-category monthly limits
- **goals** — savings targets with current amount
- **recurringExpenses** — frequency + template expense fields
- **settings** — theme, currency, single row id `app`
- **holdings** — investments: where (`name`), `assetType`, `investedAmount`, `currentValue`, notes
- **loans** — `name`, `loanType`, `principalAmount`, `outstandingAmount`, optional `monthlyEmi`, optional `interestRate`, `startDate`, notes

## UX

- Mobile-first bottom nav on small screens; sidebar on desktop
- Dark mode via `class` on `<html>` from settings store
- Currency symbol from settings (INR default per spec examples)
- Offline: all data local; service worker caches assets

## Response (implementation log)

- Greenfield scaffold from spec; no prior codebase.
- Stores hydrate from Dexie on app load; mutations write through to DB then refresh store.
- Recurring job runs on app init: creates missing expense rows for due recurring items.
- GitHub Actions: build + deploy via GitHub Pages artifact on push to `main`.
- Mobile bottom nav: Dashboard, Expenses, Budgets, More (links to Categories, Goals, Recurring, Reports, Settings).
- Dashboard: **+ Add expense** in header and empty-state CTA; opens same `ExpenseForm` modal as Expenses page.
- Monthly Excel export (`xlsx`): **All expenses** sheet lists every expense in the month (full rows from DB); plus All income, All transactions, category summaries, Overview.
- Duplicate categories: dedupe on app init (by name, keeps category with most expenses); block duplicate names on add/edit.
- Categories: starter set seeded **only when DB has zero categories** (deleted names are not re-added); all categories editable/deletable; delete with reassignment when in use; optional `kind` (expense / income / both); custom color picker; no hardcoded Food/Salary defaults in forms.
- Dexie v2: index `categoryId` on `recurringExpenses` (required for category dedupe migrations).
- **Income logging**: `type` on transactions; expense/income toggle in form; default income categories (Salary, Freelance, etc.); budgets/analytics use expenses only; dashboard shows income + net cash flow. New income entries default category to **Salary**.
- **Light mode**: CSS variable tokens (`:root` / `.dark`) for surfaces, text, charts, glass panels; readable contrast on white panels.
- **2026 UI redesign** (“Finance Command Center”): dark-first cockpit aesthetic (#0B1020), glass panels, Framer Motion, widget dashboard (month spending, momentum, insights, etc.), gradient area charts, timeline expense list, mobile FAB + bottom nav. No changes to routes, stores, or business logic.
- Dashboard: removed **Financial Health** score, **Spending Velocity**, and **Monthly Burn Rate** widgets (and related metrics).
- `npm run build` passes; PWA service worker generated by vite-plugin-pwa.
- Dashboard **This month spending** widget: shows current calendar month expense total (`monthTotal`), month label, and monthly budget progress when a total budget exists for the month.
- Dashboard **redesign**: summary stat row (spent, income, net, goals), **Recharts donut pie** for category spending (`CategoryPieChart`), daily area trend, insights + recent transactions in a clean two-column layout. Removed cluttered widget grid / bar chart on dashboard.
- Recent transactions: list **all** expenses sorted by date then `createdAt` (newest first); expense store uses `sortExpensesByRecent`; scrollable panel on dashboard (was capped at 5).
- Pie chart: `monthSpendingByCategory` + strict `isInMonth` date range; only categories with expenses in current month; Recharts remount key + no animation to avoid stale/ghost slices.
- Pie chart no longer hides categories 7+ as **Other** by default — all categories show by name; optional `maxSlices` groups tail as **More categories (N)** with a breakdown in the legend.
- **Portfolio tracking** (`/portfolio`): Dexie `holdings` (v4); each row is **where invested** + **total invested** + **current total value** (no symbols/units); summary & allocation pie; JSON backup v2. No live market API.
- **Loan tracking** (`/loans`): Dexie `loans` (v5); original amount, **outstanding balance**, optional **monthly EMI** (checkbox — off for non-EMI loans); repayment progress; totals for outstanding & monthly EMI; pie by loan type; JSON backup v3.
- **Net worth**: `computeNetWorth` — portfolio **current value** (assets) minus loan **outstanding** (liabilities); **NetWorthPanel** on dashboard; compact strip on Portfolio & Loans pages.
- **Cards & banks on transactions**: added `paymentSources` model + store + Dexie table and linked `paymentSourceId` on transactions for both expense and income entries. Users can manage accounts on `/accounts`, pick an account in the transaction form, filter/view by account on expenses screens, see account labels in timeline/dashboard recent transactions, and include account data in JSON/CSV import-export.
- **Dashboard account split widget**: added and then removed per request; dashboard remains focused on overall monthly summaries while keeping card/bank tagging in transaction forms and transaction views.

### Firebase setup

- **Config files:** `firebase.json` (Hosting → `dist`, Firestore rules), `.firebaserc`, `firestore.rules`, `firestore.indexes.json`.
- **SDK:** `src/lib/firebase.ts` — lazy init for Auth + Firestore; `isFirebaseConfigured()` guards usage until `.env` is filled.
- **Env:** copy `.env.example` → `.env` with web app credentials from Firebase Console.
- **Build modes:** `npm run build` → GitHub Pages (`/expense-tracker/`); `npm run build:firebase` → Firebase Hosting (`/`).
- **Deploy:** `npm run deploy:firebase` (requires Firebase CLI login + linked project).
- **Data model (Firestore, future):** `users/{uid}/…` subcollections; rules require auth and match `request.auth.uid == userId`. App still uses Dexie locally.

#### Link Firebase project (one-time)

```bash
npx -y firebase-tools@latest login
npx -y firebase-tools@latest projects:create   # or use an existing project ID
npx -y firebase-tools@latest use --add <PROJECT_ID>
npx -y firebase-tools@latest apps:create web expense-tracker
npx -y firebase-tools@latest apps:sdkconfig WEB <APP_ID>   # paste into .env
npm run deploy:firebase
```

### Run locally

```bash
npm install
npm run dev
```

Visit `http://localhost:5173/` (dev). Production: `https://<user>.github.io/expense-tracker/`

### Agent response — Firebase integration check (2026-07-09)

**Verdict:** Firebase is partially integrated already. SDK + Hosting/Firestore config + lazy Auth/Firestore helpers exist; CLI login, `.env` credentials, and cloud sync UI/logic are still missing.

**Already in place**
- `firebase` npm package; `src/lib/firebase.ts` (`isFirebaseConfigured`, `getFirebaseAuth`, `getFirebaseDb`)
- `.env.example`, `firebase.json`, `.firebaserc` (default project `expense-tracker-app`), `firestore.rules` (`users/{uid}/…`), deploy scripts
- App remains Dexie offline-first; Auth/Firestore not used by pages/stores yet

**Blockers found**
- Firebase CLI not authenticated (`firebase login` needed)
- No local `.env` (copy from `.env.example` + fill web app config)

**Next steps for full integration**
1. Login + confirm/create project, register web app, fill `.env` via `apps:sdkconfig`
2. Enable Auth + Firestore in console; deploy rules/hosting with `npm run deploy:firebase`
3. Implement sign-in UI + Dexie ↔ Firestore sync (not built yet)

### Agent response — Firebase step-by-step guide (2026-07-09)

Provided a numbered guide covering: CLI login → project → web app → `.env` → enable Auth/Firestore → deploy Hosting/rules → verify. Noted that sign-in UI + Dexie sync are not implemented yet.

### Agent response — Is data from Firebase? (2026-07-09)

**Verdict:** No. App loads all data from Dexie (IndexedDB) via Zustand stores in `useInitApp`. `getFirebaseDb` / `getFirebaseAuth` are never called outside `src/lib/firebase.ts`. Deploy succeeded for Hosting + rules on `expense-tracker-5ae2e`, but Firestore has no app reads/writes yet. Explained how to verify in DevTools Network/Application and Firebase Console.

### Agent response — Auth + cloud sync + data-source badge (2026-07-09)

Implemented end-to-end cloud sync:

- **Auth:** `src/store/authStore.ts` — email/password + Google; Settings → Cloud sync card
- **Sync:** `src/services/cloudSync.ts` + `src/store/syncStore.ts` — on sign-in pull cloud if present else push local; debounced Dexie hooks auto-upload; manual Upload/Download
- **Firestore paths:** `users/{uid}/{expenses|categories|…}/{id}` + `settings/app` + `sync/meta`
- **UI:** `DataSourceBadge` (sidebar + mobile) shows Local / Firebase / Syncing; `CloudSyncCard` on Settings
- **Auth config:** `firebase.json` auth providers (email + Google); enable providers in Console if deploy auth fails
- **Verify:** badge = Firebase after sign-in; Network → firestore; Console → Firestore `users/{uid}`

#### How to use
1. Enable Email/Password (+ Google) in Firebase Console → Authentication
2. Authorized domains: `localhost`, `expense-tracker-5ae2e.web.app`
3. `npm run dev` → Settings → Cloud sync → sign in
4. Badge should switch to **Firebase**; check Console for documents under your uid

### Agent response — Firebase cost (2026-07-09)

**Verdict:** Free for personal use on Spark plan. Auth (email/Google), Firestore, and Hosting have generous no-cost quotas. App won’t auto-charge; exceeding Spark limits pauses that service until reset/upgrade. Personal expense sync stays well under free tiers. Official pricing: https://firebase.google.com/pricing/

### Prompt — Monthly insights for previous months (2026-07-09)

Add option to see monthly insights on the dashboard; currently only current month insights are shown — need previous months’ data.

### Agent response — Dashboard month picker (2026-07-09)

- Dashboard: **Monthly insights** bar with Prev / Next, native month picker (capped at current month), and **This month** reset
- `useDashboardMetrics(…, monthKey)` drives spent, income, net, category pie, daily trend, budget, and insights for the selected month
- `generateInsights` / `monthOverMonthChange` accept optional `monthKey` so MoM comparisons use the prior month relative to the selection
- `shiftMonthKey` helper in `utils/dates.ts`
- Net worth panel and recent transactions list stay global (not month-filtered)

### Agent response — Chunk size warning (2026-07-09)

**Verdict:** Harmless Rollup notice — one JS chunk exceeded 500 kB. Fixed via `manualChunks` in `vite.config.ts` (firebase, charts, xlsx, motion, dexie, react-vendor). Build no longer warns; largest chunks are now under the limit (firebase ~468 kB, charts ~421 kB).

### Prompt — Dynamic financial background (2026-07-09)

Add some financial background in this application that is dynamic.

### Agent response — Dynamic financial background (2026-07-09)

- Added `FinancialBackground` (fixed, non-interactive layer behind all pages): animated market chart lines, soft candlestick silhouettes, floating ticker labels (NIFTY / SENSEX / USD-INR / GOLD / CPI), drifting accent glows, grid, and a light scan sweep
- Wired into `AppLayout`; content stays above via `z-10`; sidebar/nav slightly more translucent so the backdrop shows through
- Theme tokens in `index.css` for light/dark; CSS drift animations + `prefers-reduced-motion` guard for glow/scan

### Prompt — Drive background from real spending (2026-07-09)

User chose: driven by real spending data (from options stronger / quieter / data-driven).

### Agent response — Data-driven financial background (2026-07-09)

- `useFinanceBackgroundData` reads expenses, categories, budgets for the current month
- Chart paths = daily spend (solid) + daily income (dashed); candles from daily spend deltas
- Floating tickers show live SPENT / IN / NET / TOP category / BURN%
- Mood tint: surplus (green), deficit (amber), overBudget (red), balanced (blue), empty (muted)
- Updates automatically when transactions or budgets change
