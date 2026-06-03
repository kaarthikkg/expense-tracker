import { AppRouter } from '@/routes/AppRouter';
import { useInitApp } from '@/hooks/useInitApp';
import { DashboardSkeleton } from '@/components/ui/Skeleton';

export default function App() {
  const { ready } = useInitApp();

  if (!ready) {
    return <DashboardSkeleton />;
  }

  return <AppRouter />;
}
