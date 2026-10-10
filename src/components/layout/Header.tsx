import React from 'react';
import {
  Film,
  FolderOpen,
  FileText,
  Download,
  RotateCcw,
  RotateCw,
  Settings,
  Bell,
  Sun,
  Moon,
  Plus,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useProjectStore } from '@/stores/useProjectStore';
import { useSubtitlesStore } from '@/stores/useSubtitlesStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useNotificationStore } from '@/stores/useNotificationStore';

interface HeaderProps {
  onOpenVideo: () => void;
  onImportSrt: () => void;
  onOpenExport: () => void;
  onOpenSettings: () => void;
  onOpenNewProject: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenVideo,
  onImportSrt,
  onOpenExport,
  onOpenSettings,
  onOpenNewProject,
}) => {
  const { projectName, isDirty } = useProjectStore();
  const { tracks, activeTrackId, setActiveTrack, undo, redo, canUndo, canRedo, errors } = useSubtitlesStore();
  const { theme, setTheme, language, setLanguage } = useSettingsStore();
  const { notifications, toggleOpen } = useNotificationStore();

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="h-14 bg-white dark:bg-brand-indigo text-slate-800 dark:text-slate-100 flex items-center justify-between px-4 border-b border-slate-200 dark:border-brand-indigo-700/60 shadow-sm select-none shrink-0 z-30 transition-colors">
      {/* Brand & Project Info */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-2.5 py-1 bg-brand-indigo text-white dark:bg-brand-teal/20 dark:border dark:border-brand-teal/40 rounded-lg shadow-sm">
          <Film className="w-5 h-5 text-brand-apricot" />
          <span className="font-bold text-base tracking-wide">
            SubSync <span className="text-brand-apricot font-normal text-xs uppercase tracking-wider">Studio</span>
          </span>
        </div>

        <div className="h-5 w-px bg-slate-200 dark:bg-brand-indigo-700" />

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenNewProject}
            title={language === 'ar' ? 'مشروع جديد' : 'New Project'}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-brand-indigo-700/70 rounded-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition"
          >
            <Plus className="w-4 h-4" />
          </button>

          <span className="text-sm font-medium text-slate-800 dark:text-slate-200 max-w-[180px] truncate" title={projectName}>
            {projectName}
          </span>

          {isDirty ? (
            <span
              className="text-[11px] px-2 py-0.5 rounded-full bg-brand-mauve/20 dark:bg-brand-mauve/40 text-brand-mauve dark:text-brand-apricot border border-brand-mauve/40 dark:border-brand-mauve/60"
              title={language === 'ar' ? 'تعديلات غير محفوظة' : 'Unsaved changes'}
            >
              ● {language === 'ar' ? 'معدل' : 'Modified'}
            </span>
          ) : (
            <span
              className="flex items-center gap-1 text-[11px] text-emerald-500 dark:text-emerald-400"
              title={language === 'ar' ? 'محفوظ' : 'Saved'}
            >
              <CheckCircle2 className="w-3 h-3" />
            </span>
          )}
        </div>
      </div>

      {/* Main Action Bar */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenVideo}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-brand-indigo-700/80 dark:hover:bg-brand-indigo-600 dark:text-slate-100 text-xs font-medium rounded-lg border border-slate-200 dark:border-brand-indigo-600/50 transition shadow-sm"
        >
          <FolderOpen className="w-3.5 h-3.5 text-brand-teal" />
          <span>{language === 'ar' ? 'فتح فيديو' : 'Open Video'}</span>
        </button>

        <button
          onClick={onImportSrt}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-brand-indigo-700/80 dark:hover:bg-brand-indigo-600 dark:text-slate-100 text-xs font-medium rounded-lg border border-slate-200 dark:border-brand-indigo-600/50 transition shadow-sm"
        >
          <FileText className="w-3.5 h-3.5 text-amber-500 dark:text-brand-apricot" />
          <span>{language === 'ar' ? 'استيراد SRT' : 'Import SRT'}</span>
        </button>

        <button
          onClick={onOpenExport}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-teal hover:bg-brand-teal-600 text-white text-xs font-medium rounded-lg transition shadow-sm"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{language === 'ar' ? 'تصدير SRT' : 'Export SRT'}</span>
        </button>

        <div className="h-5 w-px bg-slate-200 dark:bg-brand-indigo-700 mx-1" />

        {/* Undo / Redo */}
        <div className="flex items-center gap-1">
          <button
            onClick={undo}
            disabled={!canUndo()}
            title={language === 'ar' ? 'تراجع (Ctrl+Z)' : 'Undo (Ctrl+Z)'}
            className={`p-1.5 rounded-md transition ${
              canUndo()
                ? 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-brand-indigo-700 hover:text-slate-900 dark:hover:text-white'
                : 'text-slate-400 dark:text-slate-500 cursor-not-allowed'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={redo}
            disabled={!canRedo()}
            title={language === 'ar' ? 'إعادة (Ctrl+Y)' : 'Redo (Ctrl+Y)'}
            className={`p-1.5 rounded-md transition ${
              canRedo()
                ? 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-brand-indigo-700 hover:text-slate-900 dark:hover:text-white'
                : 'text-slate-400 dark:text-slate-500 cursor-not-allowed'
            }`}
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Track / Language Switcher */}
        {tracks.length > 1 && (
          <select
            value={activeTrackId}
            onChange={(e) => setActiveTrack(e.target.value)}
            className="bg-slate-100 dark:bg-brand-indigo-900 border border-slate-300 dark:border-brand-indigo-700 text-xs text-slate-800 dark:text-slate-200 rounded-md px-2 py-1 focus:outline-none focus:border-brand-teal"
          >
            {tracks.map((track) => (
              <option key={track.id} value={track.id}>
                {track.label} ({track.cues.length})
              </option>
            ))}
          </select>
        )}

        {/* Validation Errors Indicator */}
        {errors.length > 0 && (
          <div
            className="flex items-center gap-1 px-2 py-1 rounded bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/30 text-xs cursor-pointer"
            title={language === 'ar' ? `يوجد ${errors.length} تنبيه في التوقيت` : `${errors.length} timing issues`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{errors.length}</span>
          </div>
        )}
      </div>

      {/* Right Controls: Language, Theme, Notifications, Settings */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
          className="text-xs px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-brand-indigo-700/60 dark:hover:bg-brand-indigo-700 text-slate-700 dark:text-slate-200 font-medium transition"
          title={language === 'ar' ? 'التبديل إلى الإنجليزية' : 'Switch to Arabic'}
        >
          {language === 'ar' ? 'English' : 'عربي'}
        </button>

        {/* Explicit Theme Toggle (Dark / Light) */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-brand-indigo-700/60 dark:hover:bg-brand-indigo-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition"
          title={theme === 'dark' ? (language === 'ar' ? 'التبديل إلى الوضع الفاتح' : 'Switch to Light Mode') : (language === 'ar' ? 'التبديل إلى الوضع الداكن' : 'Switch to Dark Mode')}
        >
          {theme === 'dark' ? (
            <>
              <Moon className="w-3.5 h-3.5 text-brand-apricot" />
              <span>{language === 'ar' ? 'داكن' : 'Dark'}</span>
            </>
          ) : (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>{language === 'ar' ? 'فاتح' : 'Light'}</span>
            </>
          )}
        </button>

        <button
          onClick={toggleOpen}
          className="relative p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-brand-indigo-700 transition"
          title={language === 'ar' ? 'مركز الإشعارات' : 'Notification Center'}
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-brand-teal text-[10px] font-bold flex items-center justify-center text-white">
              {unreadCount}
            </span>
          )}
        </button>

        <button
          onClick={onOpenSettings}
          className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-brand-indigo-700 transition"
          title={language === 'ar' ? 'الإعدادات' : 'Settings'}
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
