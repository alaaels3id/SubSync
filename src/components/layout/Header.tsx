import {
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
import { useTranslation } from 'react-i18next';
import { Logo } from '@/components/common/Logo';
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
  const { t } = useTranslation();
  const { projectName, isDirty } = useProjectStore();
  const { tracks, activeTrackId, setActiveTrack, undo, redo, canUndo, canRedo, errors } = useSubtitlesStore();
  const { theme, setTheme, language, setLanguage } = useSettingsStore();
  const { notifications, toggleOpen } = useNotificationStore();

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="h-14 bg-white dark:bg-brand-indigo text-slate-800 dark:text-slate-100 flex items-center justify-between px-4 border-b border-slate-200 dark:border-brand-indigo-700/60 shadow-sm select-none shrink-0 z-30 transition-colors">
      {/* Brand & Project Info */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-2 py-1 bg-brand-indigo/10 dark:bg-brand-teal/20 border border-brand-teal/30 rounded-lg shadow-sm">
          <Logo size={22} />
          <span className="font-bold text-base tracking-wide text-brand-indigo-900 dark:text-white">
            SubSync <span className="text-brand-teal dark:text-brand-apricot font-normal text-xs uppercase tracking-wider">Studio</span>
          </span>
        </div>

        <div className="h-5 w-px bg-slate-200 dark:bg-brand-indigo-700" />

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenNewProject}
            title={t('header.newProject')}
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
              title={t('header.modified')}
            >
              ● {t('header.modified')}
            </span>
          ) : (
            <span
              className="flex items-center gap-1 text-[11px] text-emerald-500 dark:text-emerald-400"
              title={t('header.saved')}
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
          <span>{t('header.openVideo')}</span>
        </button>

        <button
          onClick={onImportSrt}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-brand-indigo-700/80 dark:hover:bg-brand-indigo-600 dark:text-slate-100 text-xs font-medium rounded-lg border border-slate-200 dark:border-brand-indigo-600/50 transition shadow-sm"
        >
          <FileText className="w-3.5 h-3.5 text-amber-500 dark:text-brand-apricot" />
          <span>{t('header.importSrt')}</span>
        </button>

        <button
          onClick={onOpenExport}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-teal hover:bg-brand-teal-600 text-white text-xs font-medium rounded-lg transition shadow-sm"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{t('header.exportSrt')}</span>
        </button>

        <div className="h-5 w-px bg-slate-200 dark:bg-brand-indigo-700 mx-1" />

        {/* Undo / Redo */}
        <div className="flex items-center gap-1">
          <button
            onClick={undo}
            disabled={!canUndo()}
            title={t('header.undo')}
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
            title={t('header.redo')}
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
            title={`${errors.length} ${t('header.timingIssues')}`}
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
          title={language === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
        >
          {language === 'ar' ? 'English' : 'عربي'}
        </button>

        {/* Explicit Theme Toggle (Dark / Light) */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-brand-indigo-700/60 dark:hover:bg-brand-indigo-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition"
          title={theme === 'dark' ? t('header.switchToLight') : t('header.switchToDark')}
        >
          {theme === 'dark' ? (
            <>
              <Moon className="w-3.5 h-3.5 text-brand-apricot" />
              <span>{t('common.dark')}</span>
            </>
          ) : (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>{t('common.light')}</span>
            </>
          )}
        </button>

        <button
          onClick={toggleOpen}
          className="relative p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-brand-indigo-700 transition"
          title={t('header.notificationCenter')}
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
          title={t('header.settings')}
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
