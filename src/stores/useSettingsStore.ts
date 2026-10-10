import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

export function applyThemeToDOM(theme: AppTheme) {
  if (typeof document === 'undefined') return;
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
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
        applyThemeToDOM(theme);
      },

      setLanguage: (language) => {
        set({ language });
        if (typeof document !== 'undefined') {
          document.documentElement.setAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');
          document.documentElement.setAttribute('lang', language);
        }
      },

      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),

      updateSubtitlePreferences: (prefs) =>
        set((state) => ({
          subtitlePreferences: { ...state.subtitlePreferences, ...prefs },
        })),
    }),
    {
      name: 'subsync_app_settings',
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyThemeToDOM(state.theme);
          if (typeof document !== 'undefined') {
            document.documentElement.setAttribute('dir', state.language === 'ar' ? 'rtl' : 'ltr');
            document.documentElement.setAttribute('lang', state.language);
          }
        }
      },
    }
  )
);
