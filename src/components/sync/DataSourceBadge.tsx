import { useSyncStore } from '@/store/syncStore';
import { useAuthStore } from '@/store/authStore';

export function DataSourceBadge({ compact = false }: { compact?: boolean }) {
  const dataSource = useSyncStore((s) => s.dataSource);
  const status = useSyncStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const configured = useAuthStore((s) => s.configured);

  if (!configured) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-md border border-cockpit-border bg-cockpit-elevated/60 font-mono text-[10px] uppercase tracking-wider text-fg-muted ${
          compact ? 'px-1.5 py-0.5' : 'px-2 py-1'
        }`}
        title="Add Firebase env vars to enable cloud sync"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-fg-muted" />
        Local
      </span>
    );
  }

  const isFirebase = dataSource === 'firebase' && user;
  const label =
    status === 'syncing'
      ? 'Syncing…'
      : status === 'offline'
        ? 'Offline'
        : isFirebase
          ? 'Firebase'
          : 'Local';

  const dot =
    status === 'syncing'
      ? 'bg-accent animate-pulse'
      : status === 'error'
        ? 'bg-danger'
        : status === 'offline'
          ? 'bg-warning'
          : isFirebase
            ? 'bg-success'
            : 'bg-fg-muted';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border border-cockpit-border bg-cockpit-elevated/60 font-mono text-[10px] uppercase tracking-wider text-fg-secondary ${
        compact ? 'px-1.5 py-0.5' : 'px-2 py-1'
      }`}
      title={
        user
          ? `Signed in as ${user.email ?? user.uid} · source: ${dataSource}`
          : 'Not signed in · local IndexedDB only'
      }
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
