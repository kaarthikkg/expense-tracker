import { create } from 'zustand';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
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
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(getFirebaseAuth(), provider);
    } catch (error) {
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
