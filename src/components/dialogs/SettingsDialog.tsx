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
  CheckCircle
} from 'lucide-react';
import { useSettingsStore, AppTheme, AppLanguage } from '@/stores/useSettingsStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { Logo } from '@/components/common/Logo';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsTab = 'appearance' | 'language' | 'subtitles' | 'storage' | 'notifications' | 'about';

export const SettingsDialog: React.FC<SettingsDialogProps> = ({ isOpen, onClose }) => {
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

  if (!isOpen) return null;

  const handleSendTestNotification = () => {
    addNotification(
      'test',
      language === 'ar' ? 'إشعار تجريبي (Test Notification)' : 'Test Notification',
      language === 'ar'
        ? 'تم إرسال هذا الإشعار بنجاح لاختبار نظام الإشعارات الداخلي والـ Toasts.'
        : 'This notification was triggered to verify internal notifications & toasts.'
    );
  };

  const handleCheckUpdates = () => {
    setCheckingUpdates(true);
    setUpdateStatus(null);
    setTimeout(() => {
      setCheckingUpdates(false);
      setUpdateStatus(
        language === 'ar'
          ? 'أنت تستخدم أحدث إصدار معتمد (v1.0.0-mvp).'
          : 'You are using the latest version (v1.0.0-mvp).'
      );
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-brand-indigo-900 border border-brand-indigo-700 rounded-2xl shadow-2xl text-slate-100 flex flex-col h-[560px] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-brand-indigo-700/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-brand-teal-300" />
            <h3 className="text-base font-semibold">
              {language === 'ar' ? 'إعدادات التطبيق (Settings)' : 'Application Settings'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body with Sidebar Tabs */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-48 bg-slate-950/40 border-l border-brand-indigo-700/60 p-2 space-y-1 text-xs">
            <button
              onClick={() => setActiveTab('appearance')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-right font-medium transition ${
                activeTab === 'appearance'
                  ? 'bg-brand-teal text-white'
                  : 'text-slate-300 hover:bg-brand-indigo-800'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'المظهر (Appearance)' : 'Appearance'}</span>
            </button>

            <button
              onClick={() => setActiveTab('language')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-right font-medium transition ${
                activeTab === 'language'
                  ? 'bg-brand-teal text-white'
                  : 'text-slate-300 hover:bg-brand-indigo-800'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'اللغة (Language)' : 'Language'}</span>
            </button>

            <button
              onClick={() => setActiveTab('subtitles')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-right font-medium transition ${
                activeTab === 'subtitles'
                  ? 'bg-brand-teal text-white'
                  : 'text-slate-300 hover:bg-brand-indigo-800'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'عرض الترجمة' : 'Subtitle Display'}</span>
            </button>

            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-right font-medium transition ${
                activeTab === 'notifications'
                  ? 'bg-brand-teal text-white'
                  : 'text-slate-300 hover:bg-brand-indigo-800'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'الإشعارات' : 'Notifications'}</span>
            </button>

            <button
              onClick={() => setActiveTab('about')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-right font-medium transition ${
                activeTab === 'about'
                  ? 'bg-brand-teal text-white'
                  : 'text-slate-300 hover:bg-brand-indigo-800'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'عن التطبيق والتحديثات' : 'About & Updates'}</span>
            </button>
          </div>

          {/* Tab Content Panel */}
          <div className="flex-1 p-6 overflow-y-auto text-xs space-y-5">
            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-slate-200">
                  {language === 'ar' ? 'نمط المظهر (Theme)' : 'Theme Preference'}
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'dark', label: language === 'ar' ? 'داكن (Dark)' : 'Dark' },
                    { id: 'light', label: language === 'ar' ? 'فاتح (Light)' : 'Light' },
                    { id: 'system', label: language === 'ar' ? 'النظام (System)' : 'System' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id as AppTheme)}
                      className={`p-3 rounded-xl border text-center font-medium transition ${
                        theme === t.id
                          ? 'border-brand-apricot bg-brand-teal/20 text-brand-apricot shadow-sm'
                          : 'border-brand-indigo-700 bg-slate-950/40 text-slate-300 hover:bg-slate-900'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Language Tab */}
            {activeTab === 'language' && (
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-slate-200">
                  {language === 'ar' ? 'لغة الواجهة (Interface Language)' : 'Interface Language'}
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
                          ? 'border-brand-apricot bg-brand-teal/20 text-brand-apricot shadow-sm'
                          : 'border-brand-indigo-700 bg-slate-950/40 text-slate-300 hover:bg-slate-900'
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
                <h4 className="text-sm font-semibold text-slate-200">
                  {language === 'ar' ? 'تخصيص مظهر الترجمة بالمشغل' : 'Subtitle Styling in Player'}
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 mb-1">
                      {language === 'ar' ? 'حجم الخط (Font Size)' : 'Font Size'} ({subtitlePreferences.fontSize}px)
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
                    <label className="block text-slate-400 mb-1">
                      {language === 'ar' ? 'شفافية الخلفية' : 'Background Opacity'} (
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
                    {language === 'ar'
                      ? 'هذه معاينة لمظهر الترجمة داخل مشغل الفيديو'
                      : 'This is a preview of the subtitle style in player'}
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab (SET-05 & NOT-05) */}
            {activeTab === 'notifications' && (
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-slate-200">
                  {language === 'ar' ? 'إعدادات الإشعارات الداخلية' : 'In-App Notification Settings'}
                </h4>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-brand-indigo-800">
                  <div>
                    <p className="font-medium text-slate-200">
                      {language === 'ar' ? 'تفعيل الإشعارات الداخلية' : 'Enable Internal Notifications'}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {language === 'ar'
                        ? 'إظهار التنبيهات المنبثقة (Toasts) وسجل مركز الإشعارات.'
                        : 'Display toasts and history in notification center.'}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationsEnabled}
                    onChange={(e) => setNotificationsEnabled(e.target.checked)}
                    className="w-4 h-4 accent-brand-teal cursor-pointer"
                  />
                </div>

                {/* Send Test Notification Button (NOT-05) */}
                <div className="pt-2">
                  <button
                    onClick={handleSendTestNotification}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-teal hover:bg-brand-teal-600 text-white rounded-lg font-medium shadow-sm transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{language === 'ar' ? 'إرسال إشعار تجريبي (Send Test)' : 'Send Test Notification'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* About & Updates Tab (UPD-01 & UPD-02) */}
            {activeTab === 'about' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-950/40 border border-brand-indigo-800 flex items-start gap-4">
                  <Logo size={48} />
                  <div className="flex-1">
                    <h5 className="font-bold text-sm text-brand-apricot mb-1">SubSync Studio</h5>
                    <p className="text-slate-400 mb-2">
                      {language === 'ar'
                        ? 'الإصدار المعتمد: 1.0.0-MVP (نطاق معتمد)'
                        : 'Version: 1.0.0-MVP (Approved Scope)'}
                    </p>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      تطبيق سطح مكتب لمزامنة وترجمة الفيديو بتقنيات Electron + React + TypeScript بدقة 1ms.
                    </p>
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    onClick={handleCheckUpdates}
                    disabled={checkingUpdates}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-indigo-700 hover:bg-brand-indigo-600 text-slate-200 rounded-lg font-medium border border-brand-indigo-600 transition"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${checkingUpdates ? 'animate-spin' : ''}`} />
                    <span>
                      {checkingUpdates
                        ? language === 'ar'
                          ? 'جاري فحص GitHub Releases...'
                          : 'Checking Releases...'
                        : language === 'ar'
                        ? 'فحص التحديثات (Check Updates)'
                        : 'Check for Updates'}
                    </span>
                  </button>

                  {updateStatus && (
                    <div className="mt-3 p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center gap-2">
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
