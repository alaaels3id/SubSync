import { create } from 'zustand';

export type AppTheme = 'dark' | 'light' | 'system';
export type AppLanguage = 'ar' | 'en';

export interface SubtitlePreferences {
  fontSize: number;
  textColor: string;
  backgroundColor: string;
  backgroundOpacity: number;
  fontFamily: string;
  textShadow: boolean;
  position: 'bottom' | 'top';
}

interface SettingsState {
  theme: AppTheme;
  language: AppLanguage;
  notificationsEnabled: boolean;
  subtitlePreferences: SubtitlePreferences;

  setTheme: (theme: AppTheme) => void;
  setLanguage: (lang: AppLanguage) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  updateSubtitlePreferences: (prefs: Partial<SubtitlePreferences>) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: 'dark', // Space Indigo dark theme as default
  language: 'ar', // Arabic default with RTL
  notificationsEnabled: true,
  subtitlePreferences: {
    fontSize: 24,
    textColor: '#FFFFFF',
    backgroundColor: '#000000',
    backgroundOpacity: 0.65,
    fontFamily: 'Tajawal, sans-serif',
    textShadow: true,
    position: 'bottom',
  },

  setTheme: (theme) => {
    set({ theme });
    // Update HTML class
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', prefersDark);
    }
  },

  setLanguage: (language) => {
    set({ language });
    document.documentElement.setAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', language);
  },

  setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),

  updateSubtitlePreferences: (prefs) =>
    set((state) => ({
      subtitlePreferences: { ...state.subtitlePreferences, ...prefs },
    })),
}));
