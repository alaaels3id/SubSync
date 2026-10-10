import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingsStore, applyThemeToDOM } from '../useSettingsStore';

describe('Zustand Store - useSettingsStore', () => {
  beforeEach(() => {
    useSettingsStore.setState({
      theme: 'dark',
      language: 'ar',
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
    });
  });

  it('updates theme between dark, light, and system', () => {
    const { setTheme } = useSettingsStore.getState();

    setTheme('light');
    expect(useSettingsStore.getState().theme).toBe('light');

    setTheme('system');
    expect(useSettingsStore.getState().theme).toBe('system');
  });

  it('updates language setting', () => {
    const { setLanguage } = useSettingsStore.getState();

    setLanguage('en');
    expect(useSettingsStore.getState().language).toBe('en');

    setLanguage('ar');
    expect(useSettingsStore.getState().language).toBe('ar');
  });

  it('updates subtitle display preferences partially', () => {
    const { updateSubtitlePreferences } = useSettingsStore.getState();

    updateSubtitlePreferences({
      fontSize: 32,
      textColor: '#FFCF99',
      position: 'top',
    });

    const prefs = useSettingsStore.getState().subtitlePreferences;
    expect(prefs.fontSize).toBe(32);
    expect(prefs.textColor).toBe('#FFCF99');
    expect(prefs.position).toBe('top');
    expect(prefs.fontFamily).toBe('Tajawal, sans-serif'); // Preserved
  });

  it('toggles notification enablement', () => {
    const { setNotificationsEnabled } = useSettingsStore.getState();

    setNotificationsEnabled(false);
    expect(useSettingsStore.getState().notificationsEnabled).toBe(false);

    setNotificationsEnabled(true);
    expect(useSettingsStore.getState().notificationsEnabled).toBe(true);
  });

  it('safely applies theme to DOM without throwing', () => {
    expect(() => applyThemeToDOM('dark')).not.toThrow();
    expect(() => applyThemeToDOM('light')).not.toThrow();
  });
});
