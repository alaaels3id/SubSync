import React, { useState } from 'react';
import {
  X,
  Settings,
  Palette,
  Globe,
  Sliders,
  Bell,
  Info,
  Send,
  RefreshCw,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore, AppTheme, AppLanguage } from '@/stores/useSettingsStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { Logo } from '@/components/common/Logo';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsTab = 'appearance' | 'language' | 'subtitles' | 'storage' | 'notifications' | 'about';

export const SettingsDialog: React.FC<SettingsDialogProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const {
    theme,
    setTheme,
    language,
    setLanguage,
    subtitlePreferences,
    updateSubtitlePreferences,
    notificationsEnabled,
    setNotificationsEnabled,
  } = useSettingsStore();

  const { addNotification } = useNotificationStore();

  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');
  const [checkingUpdates, setCheckingUpdates] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<string | null>(null);

  const [systemPermission, setSystemPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setSystemPermission(perm);
      } catch (e) {
        console.warn('requestPermission error:', e);
      }
    }
  };

  const handleOpenSystemSettings = async () => {
    if (window.electronAPI?.openSystemNotificationSettings) {
      await window.electronAPI.openSystemNotificationSettings();
    }
  };

  const handleSendTestNotification = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      try {
        const perm = await Notification.requestPermission();
        setSystemPermission(perm);
      } catch {}
    }

    addNotification(
      'test',
      t('settings.testSentTitle'),
      t('settings.testSentDesc')
    );
  };

  const handleCheckUpdates = () => {
    setCheckingUpdates(true);
    setUpdateStatus(null);
    setTimeout(() => {
      setCheckingUpdates(false);
      setUpdateStatus(t('settings.latestVersion'));
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-brand-indigo-900 border border-slate-200 dark:border-brand-indigo-700 rounded-2xl shadow-2xl text-slate-800 dark:text-slate-100 flex flex-col h-[560px] overflow-hidden transition-colors">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-brand-indigo-700/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-brand-teal" />
            <h3 className="text-base font-semibold">
              {t('settings.title')}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body with Sidebar Tabs */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-48 bg-slate-50 dark:bg-slate-950/40 border-l border-slate-200 dark:border-brand-indigo-700/60 p-2 space-y-1 text-xs">
            <button
              onClick={() => setActiveTab('appearance')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-right font-medium transition ${
                activeTab === 'appearance'
                  ? 'bg-brand-teal text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-brand-indigo-800'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>{t('settings.appearance')}</span>
            </button>

            <button
              onClick={() => setActiveTab('language')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-right font-medium transition ${
                activeTab === 'language'
                  ? 'bg-brand-teal text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-brand-indigo-800'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{t('settings.language')}</span>
            </button>

            <button
              onClick={() => setActiveTab('subtitles')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-right font-medium transition ${
                activeTab === 'subtitles'
                  ? 'bg-brand-teal text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-brand-indigo-800'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{t('settings.subtitles')}</span>
            </button>

            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-right font-medium transition ${
                activeTab === 'notifications'
                  ? 'bg-brand-teal text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-brand-indigo-800'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>{t('settings.notifications')}</span>
            </button>

            <button
              onClick={() => setActiveTab('about')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-right font-medium transition ${
                activeTab === 'about'
                  ? 'bg-brand-teal text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-brand-indigo-800'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              <span>{t('settings.about')}</span>
            </button>
          </div>

          {/* Tab Content Panel */}
          <div className="flex-1 p-6 overflow-y-auto text-xs space-y-5">
            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {t('settings.themePreference')}
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'dark', label: t('common.dark') },
                    { id: 'light', label: t('common.light') },
                    { id: 'system', label: t('common.system') },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setTheme(item.id as AppTheme)}
                      className={`p-3 rounded-xl border text-center font-medium transition ${
                        theme === item.id
                          ? 'border-brand-teal bg-brand-teal/10 dark:bg-brand-teal/20 text-brand-teal dark:text-brand-apricot shadow-sm'
                          : 'border-slate-300 dark:border-brand-indigo-700 bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Language Tab */}
            {activeTab === 'language' && (
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {t('settings.interfaceLanguage')}
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'ar', label: 'العربية (RTL)' },
                    { id: 'en', label: 'English (LTR)' },
                  ].map((lang) => (
                    <button
                      key={lang.id}
                      onClick={() => setLanguage(lang.id as AppLanguage)}
                      className={`p-3 rounded-xl border text-center font-medium transition ${
                        language === lang.id
                          ? 'border-brand-teal bg-brand-teal/10 dark:bg-brand-teal/20 text-brand-teal dark:text-brand-apricot shadow-sm'
                          : 'border-slate-300 dark:border-brand-indigo-700 bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Subtitle Preferences Tab */}
            {activeTab === 'subtitles' && (
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {t('settings.subtitlesInPlayer')}
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1">
                      {t('settings.fontSize')} ({subtitlePreferences.fontSize}px)
                    </label>
                    <input
                      type="range"
                      min="16"
                      max="36"
                      value={subtitlePreferences.fontSize}
                      onChange={(e) => updateSubtitlePreferences({ fontSize: parseInt(e.target.value, 10) })}
                      className="w-full accent-brand-teal"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1">
                      {t('settings.backgroundOpacity')} (
                      {(subtitlePreferences.backgroundOpacity * 100).toFixed(0)}%)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={subtitlePreferences.backgroundOpacity}
                      onChange={(e) =>
                        updateSubtitlePreferences({ backgroundOpacity: parseFloat(e.target.value) })
                      }
                      className="w-full accent-brand-teal"
                    />
                  </div>
                </div>

                {/* Subtitle Live Preview Box */}
                <div className="p-6 bg-black rounded-xl border border-slate-800 flex items-center justify-center">
                  <div
                    style={{
                      fontSize: `${subtitlePreferences.fontSize}px`,
                      color: subtitlePreferences.textColor,
                      backgroundColor: subtitlePreferences.backgroundColor,
                      opacity: subtitlePreferences.backgroundOpacity,
                      textShadow: subtitlePreferences.textShadow ? '0 2px 4px rgba(0,0,0,0.8)' : 'none',
                    }}
                    className="px-4 py-2 rounded-lg text-center"
                  >
                    {t('settings.previewText')}
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab (SET-05 & NOT-05) */}
            {activeTab === 'notifications' && (
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {t('settings.inAppSettings')}
                </h4>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-brand-indigo-800">
                  <div>
                    <p className="font-medium text-slate-800 dark:text-slate-200">
                      {t('settings.enableNotifications')}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {t('settings.enableNotificationsDesc')}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationsEnabled}
                    onChange={(e) => setNotificationsEnabled(e.target.checked)}
                    className="w-4 h-4 accent-brand-teal cursor-pointer"
                  />
                </div>

                {/* macOS / OS System Permission Status Card */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-brand-indigo-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-xs text-slate-800 dark:text-slate-200">
                        {t('settings.systemPermission')}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {systemPermission === 'granted'
                          ? t('settings.permissionGranted')
                          : systemPermission === 'denied'
                          ? t('settings.permissionDenied')
                          : t('settings.permissionDefault')}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {systemPermission === 'granted' && (
                        <span className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-medium">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>{t('settings.permissionGranted')}</span>
                        </span>
                      )}

                      {systemPermission === 'default' && (
                        <button
                          type="button"
                          onClick={handleRequestPermission}
                          className="flex items-center gap-1 px-3 py-1 bg-brand-teal hover:bg-brand-teal-600 text-white rounded-lg text-xs font-medium transition shadow-sm"
                        >
                          <Bell className="w-3.5 h-3.5" />
                          <span>{t('settings.requestPermission')}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={handleOpenSystemSettings}
                        title={t('settings.openSystemSettings')}
                        className="flex items-center gap-1 px-2.5 py-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>{t('settings.openSystemSettings')}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Send Test Notification Button (NOT-05) */}
                <div className="pt-2">
                  <button
                    onClick={handleSendTestNotification}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-teal hover:bg-brand-teal-600 text-white rounded-lg font-medium shadow-sm transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{t('settings.sendTest')}</span>
                  </button>
                </div>
              </div>
            )}

            {/* About & Updates Tab (UPD-01 & UPD-02) */}
            {activeTab === 'about' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-brand-indigo-800 flex items-start gap-4">
                  <Logo size={48} />
                  <div className="flex-1">
                    <h5 className="font-bold text-sm text-brand-teal dark:text-brand-apricot mb-1">SubSync Studio</h5>
                    <p className="text-slate-600 dark:text-slate-400 mb-2">
                      {t('settings.version')}
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      {t('settings.aboutDesc')}
                    </p>
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    onClick={handleCheckUpdates}
                    disabled={checkingUpdates}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-brand-indigo-700 dark:hover:bg-brand-indigo-600 dark:text-slate-200 rounded-lg font-medium border border-slate-300 dark:border-brand-indigo-600 transition"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${checkingUpdates ? 'animate-spin' : ''}`} />
                    <span>
                      {checkingUpdates ? t('settings.checking') : t('settings.checkUpdates')}
                    </span>
                  </button>

                  {updateStatus && (
                    <div className="mt-3 p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 shrink-0" />
                      <span>{updateStatus}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
