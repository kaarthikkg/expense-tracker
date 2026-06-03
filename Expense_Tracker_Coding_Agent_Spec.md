# Expense Tracker Project Specification

## Project Overview

Build a modern frontend-only Expense Tracker application using:

- React
- TypeScript
- Vite
- Tailwind CSS
- Zustand
- Recharts
- IndexedDB (via Dexie.js)
- GitHub Pages deployment

The application must be mobile responsive, support dark mode, work offline, and require no backend.

---

## Core Requirements

### Dashboard

Display:

- Total spending this month
- Total spending today
- Budget remaining
- Top spending category
- Recent transactions
- Monthly spending trend chart
- Category-wise spending pie chart

---

### Expense Management

Features:

- Add expense
- Edit expense
- Delete expense
- View expense details
- Search expenses
- Filter by:
  - Date range
  - Category
  - Amount range

Expense fields:

```ts
interface Expense {
  id: string;
  amount: number;
  categoryId: string;
  description: string;
  date: string;
  createdAt: string;
}
```

---

### Category Management

Default categories:

- Food
- Fuel
- Shopping
- Entertainment
- Bills
- Travel
- Health
- Others

Allow users to:

- Create custom categories
- Edit categories
- Delete categories

---

### Budget Management

Users should be able to:

- Set monthly budgets
- Set category-specific budgets
- Track remaining budget
- View progress bars

Example:

Food Budget: ₹8,000
Spent: ₹5,200
Remaining: ₹2,800

---

### Savings Goals

Users can create savings goals.

Example:

- Goal Name
- Target Amount
- Current Saved Amount
- Progress Percentage

---

### Recurring Expenses

Support:

- Daily
- Weekly
- Monthly
- Yearly

Automatically create future recurring entries.

---

### Reports & Analytics

Generate:

- Daily reports
- Monthly reports
- Yearly reports

Visualizations:

- Pie charts
- Line charts
- Budget utilization charts

Insights:

- Highest spending category
- Highest spending day
- Month-over-month comparison
- Spending trend analysis

Example:

"You spent 22% more on food this month compared to last month."

---

### Data Import / Export

Export:

- JSON
- CSV

Import:

- JSON backup files

---

### Settings

Support:

- Dark mode
- Currency selection
- Data backup
- Data restore

---

## Storage Requirements

Use IndexedDB with Dexie.js.

No backend.

No server-side database.

Data should remain on the user's device.

---

## Suggested IndexedDB Schema

```ts
expenses
categories
budgets
goals
settings
recurringExpenses
```

---

## State Management

Use Zustand.

Suggested stores:

- expenseStore
- categoryStore
- budgetStore
- goalStore
- settingsStore

---

## UI Requirements

- Mobile-first responsive design
- Modern dashboard layout
- Clean analytics view
- Accessible components
- Fast performance
- Offline support

---

## PWA Requirements

Support:

- Installable application
- Offline usage
- Cached assets
- App manifest

---

## GitHub Pages Deployment

Application must support deployment to GitHub Pages.

Vite configuration:

```ts
export default defineConfig({
  base: "/expense-tracker/",
});
```

Deployment should be automated through GitHub Actions.

---

## Recommended Folder Structure

```text
src/
├── components/
├── pages/
├── hooks/
├── services/
├── store/
├── db/
├── types/
├── utils/
├── routes/
└── assets/
```

---

## Technical Expectations

- Strict TypeScript
- Reusable components
- Custom hooks
- Clean architecture
- Feature-based organization
- No hardcoded data
- Strong typing throughout

---

## Deliverables

1. Fully functional expense tracker.
2. IndexedDB persistence.
3. Responsive UI.
4. Dark mode.
5. Charts and analytics.
6. Savings goals.
7. Budget management.
8. Recurring expenses.
9. Import/export functionality.
10. PWA support.
11. GitHub Pages deployment configuration.
