import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { DataSourceBadge } from '@/components/sync/DataSourceBadge';
import { useAuthStore } from '@/store/authStore';
import { useSyncStore } from '@/store/syncStore';

function formatSyncedAt(iso: string | null): string {
  if (!iso) return 'Never';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function CloudSyncCard() {
  const configured = useAuthStore((s) => s.configured);
  const user = useAuthStore((s) => s.user);
  const authError = useAuthStore((s) => s.error);
  const signInEmail = useAuthStore((s) => s.signInEmail);
  const signUpEmail = useAuthStore((s) => s.signUpEmail);
  const signInGoogle = useAuthStore((s) => s.signInGoogle);
  const signOut = useAuthStore((s) => s.signOut);
  const clearError = useAuthStore((s) => s.clearError);

  const status = useSyncStore((s) => s.status);
  const lastSyncedAt = useSyncStore((s) => s.lastSyncedAt);
  const syncError = useSyncStore((s) => s.error);
  const message = useSyncStore((s) => s.message);
  const pushNow = useSyncStore((s) => s.pushNow);
  const pullNow = useSyncStore((s) => s.pullNow);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  const syncing = status === 'syncing' || busy;

  if (!configured) {
    return (
      <Card title="Cloud sync" subtitle="Firebase not configured" action={<DataSourceBadge />}>
        <p className="text-sm text-fg-secondary">
          Copy <code className="text-fg">.env.example</code> to <code className="text-fg">.env</code>,
          fill in your Firebase web app keys, then restart the dev server.
        </p>
      </Card>
    );
  }

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    clearError();
    try {
      await fn();
    } catch {
      /* errors stored in auth/sync stores */
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title="Cloud sync" subtitle="Sign in to sync Dexie ↔ Firestore" action={<DataSourceBadge />}>
      {user ? (
        <div className="space-y-4">
          <div className="text-sm text-fg-secondary">
            <p>
              Signed in as{' '}
              <span className="font-medium text-fg">{user.email ?? user.displayName ?? user.uid}</span>
            </p>
            <p className="mt-1 text-xs text-fg-muted">Last sync: {formatSyncedAt(lastSyncedAt)}</p>
            {message && <p className="mt-2 text-xs text-accent">{message}</p>}
            {(authError || syncError) && (
              <p className="mt-2 text-xs text-danger">{authError ?? syncError}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button disabled={syncing} onClick={() => void run(pushNow)}>
              Upload to Firebase
            </Button>
            <Button variant="secondary" disabled={syncing} onClick={() => void run(pullNow)}>
              Download from Firebase
            </Button>
            <Button
              variant="ghost"
              disabled={syncing}
              onClick={() => void run(async () => signOut())}
            >
              Sign out
            </Button>
          </div>
          <p className="text-xs text-fg-muted">
            Local edits auto-upload a few seconds after you change data (while signed in and online).
            Check Firestore under <code className="text-fg">{'users/<your-uid>'}</code> in the
            Firebase Console.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-fg-secondary">
            Data stays on this device until you sign in. After sign-in, existing cloud data is
            downloaded; otherwise your local data is uploaded.
          </p>
          <div className="flex gap-2 text-xs">
            <button
              type="button"
              className={mode === 'signin' ? 'font-semibold text-accent' : 'text-fg-muted'}
              onClick={() => setMode('signin')}
            >
              Sign in
            </button>
            <span className="text-fg-muted">·</span>
            <button
              type="button"
              className={mode === 'signup' ? 'font-semibold text-accent' : 'text-fg-muted'}
              onClick={() => setMode('signup')}
            >
              Create account
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="Password"
              type="password"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {(authError || syncError) && (
            <p className="text-xs text-danger">{authError ?? syncError}</p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={syncing || !email || !password}
              onClick={() =>
                void run(async () => {
                  if (mode === 'signup') await signUpEmail(email, password);
                  else await signInEmail(email, password);
                })
              }
            >
              {mode === 'signup' ? 'Create account' : 'Sign in'}
            </Button>
            <Button variant="secondary" disabled={syncing} onClick={() => void run(signInGoogle)}>
              Continue with Google
            </Button>
          </div>
          <p className="text-xs text-fg-muted">
            Enable Email/Password and Google in Firebase Console → Authentication → Sign-in method.
            Add <code className="text-fg">localhost</code> and your hosting domain under Authorized
            domains.
          </p>
        </div>
      )}
    </Card>
  );
}
