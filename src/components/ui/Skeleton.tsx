import { motion } from 'framer-motion';

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <motion.div
      animate={{ opacity: [0.5, 0.85, 0.5] }}
      transition={{ repeat: Infinity, duration: 1.5 }}
      className={`rounded-xl bg-track ${className}`}
    />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-4 md:p-8">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}
