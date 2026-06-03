import { create } from 'zustand';
import { db } from '@/db';
import type { AppSettings, CurrencyCode, Theme } from '@/types';

interface SettingsState {
  settings: AppSettings | null;
  loading: boolean;
  load: () => Promise<void>;
  setTheme: (theme: Theme) => Promise<void>;
  setCurrency: (currency: CurrencyCode) => Promise<void>;
  applyThemeToDocument: () => void;
}

function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,
  loading: false,

  load: async () => {
    set({ loading: true });
    let settings = await db.settings.get('app');
    if (!settings) {
      settings = { id: 'app', theme: 'system', currency: 'INR' };
      await db.settings.put(settings);
    }
    set({ settings, loading: false });
    get().applyThemeToDocument();
  },

  setTheme: async (theme) => {
    const current = get().settings;
    if (!current) return;
    const updated = { ...current, theme };
    await db.settings.put(updated);
    set({ settings: updated });
    get().applyThemeToDocument();
  },

  setCurrency: async (currency) => {
    const current = get().settings;
    if (!current) return;
    const updated = { ...current, currency };
    await db.settings.put(updated);
    set({ settings: updated });
  },

  applyThemeToDocument: () => {
    const theme = get().settings?.theme ?? 'system';
    const resolved = resolveTheme(theme);
    document.documentElement.classList.toggle('dark', resolved === 'dark');
  },
}));
