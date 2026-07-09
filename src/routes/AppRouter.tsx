import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { ExpensesPage } from '@/pages/ExpensesPage';
import { CategoriesPage } from '@/pages/CategoriesPage';
import { BudgetsPage } from '@/pages/BudgetsPage';
import { GoalsPage } from '@/pages/GoalsPage';
import { RecurringPage } from '@/pages/RecurringPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { MorePage } from '@/pages/MorePage';
import { PortfolioPage } from '@/pages/PortfolioPage';
import { LoansPage } from '@/pages/LoansPage';
import { PaymentSourcesPage } from '@/pages/PaymentSourcesPage';

function routerBasename(): string | undefined {
  const base = import.meta.env.BASE_URL;
  if (base === '/') return undefined;
  return base.replace(/\/$/, '');
}

export function AppRouter() {
  return (
    <BrowserRouter basename={routerBasename()}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="expenses" element={<ExpensesPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="budgets" element={<BudgetsPage />} />
          <Route path="portfolio" element={<PortfolioPage />} />
          <Route path="loans" element={<LoansPage />} />
          <Route path="accounts" element={<PaymentSourcesPage />} />
          <Route path="goals" element={<GoalsPage />} />
          <Route path="recurring" element={<RecurringPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="more" element={<MorePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
