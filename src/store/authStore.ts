import { create } from 'zustand';
import {
  createUserWithEmailAndPassword,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from 'firebase/auth';
import { getFirebaseAuth, isFirebaseConfigured } from '@/lib/firebase';

export type AuthUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
};

interface AuthState {
  user: AuthUser | null;
  ready: boolean;
  error: string | null;
  configured: boolean;
  init: () => () => void;
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (email: string, password: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

function toAuthUser(user: User): AuthUser {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
  };
}

/** Popups are unreliable on mobile / installed PWAs — use full-page redirect instead. */
function prefersRedirectAuth(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator &&
      (navigator as Navigator & { standalone?: boolean }).standalone === true);
  return mobile || standalone;
}

function mapAuthError(error: unknown): string {
  if (!(error instanceof Error)) return 'Authentication failed';
  const code = 'code' in error ? String((error as { code?: string }).code) : '';
  switch (code) {
    case 'auth/invalid-email':
      return 'Invalid email address';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters';
    case 'auth/popup-closed-by-user':
      return 'Sign-in popup was closed';
    case 'auth/popup-blocked':
      return 'Sign-in popup was blocked. Try again, or use email sign-in.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized for Google sign-in. Add it in Firebase Console → Authentication → Settings.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is disabled. Enable it in Firebase Console → Authentication.';
    default:
      return error.message || 'Authentication failed';
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  ready: false,
  error: null,
  configured: isFirebaseConfigured(),

  init: () => {
    if (!isFirebaseConfigured()) {
      set({ ready: true, configured: false, user: null });
      return () => undefined;
    }

    const auth = getFirebaseAuth();

    // Complete Google redirect sign-in (mobile / PWA) if we just returned from Google
    void getRedirectResult(auth).catch((error) => {
      set({ error: mapAuthError(error) });
    });

    const unsub = onAuthStateChanged(auth, (user) => {
      set({
        user: user ? toAuthUser(user) : null,
        ready: true,
        configured: true,
        error: null,
      });
    });
    return unsub;
  },

  signInEmail: async (email, password) => {
    set({ error: null });
    try {
      await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
    } catch (error) {
      const message = mapAuthError(error);
      set({ error: message });
      throw new Error(message);
    }
  },

  signUpEmail: async (email, password) => {
    set({ error: null });
    try {
      await createUserWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
    } catch (error) {
      const message = mapAuthError(error);
      set({ error: message });
      throw new Error(message);
    }
  },

  signInGoogle: async () => {
    set({ error: null });
    const auth = getFirebaseAuth();
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      if (prefersRedirectAuth()) {
        await signInWithRedirect(auth, provider);
        return;
      }
      await signInWithPopup(auth, provider);
    } catch (error) {
      const code = error instanceof Error && 'code' in error
        ? String((error as { code?: string }).code)
        : '';
      // Popup blocked / failed → fall back to redirect
      if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
        try {
          await signInWithRedirect(auth, provider);
          return;
        } catch (redirectError) {
          const message = mapAuthError(redirectError);
          set({ error: message });
          throw new Error(message);
        }
      }
      const message = mapAuthError(error);
      set({ error: message });
      throw new Error(message);
    }
  },

  signOut: async () => {
    set({ error: null });
    await signOut(getFirebaseAuth());
  },

  clearError: () => set({ error: null }),
}));
