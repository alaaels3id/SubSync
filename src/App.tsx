import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from '@/components/layout/Header';
import { VideoPlayer } from '@/components/player/VideoPlayer';
import { SubtitleTable } from '@/components/editor/SubtitleTable';
import { Timeline } from '@/components/timeline/Timeline';
import { ExportDialog } from '@/components/dialogs/ExportDialog';
import { SettingsDialog } from '@/components/dialogs/SettingsDialog';
import { NewProjectDialog } from '@/components/dialogs/NewProjectDialog';
import { NotificationDrawer } from '@/components/notifications/NotificationDrawer';
import { ToastContainer } from '@/components/notifications/ToastContainer';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { useSubtitlesStore } from '@/stores/useSubtitlesStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useSettingsStore, applyThemeToDOM } from '@/stores/useSettingsStore';
import { parseSrt } from '@/core/srt';
import { useTranslation } from 'react-i18next';

export const App: React.FC = () => {
  const { t } = useTranslation();
  const { setVideoSource, togglePlay, seekRelative, currentTime } = usePlayerStore();
  const {
    activeTrackId,
    setTrackCues,
    undo,
    redo,
    addCue,
    selectedCueIds,
    snapCueToPlayhead,
  } = useSubtitlesStore();
  const { addNotification } = useNotificationStore();
  const { language, theme } = useSettingsStore();

  // Modals state
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);

  // Split pane resizing state (Video Player vs Subtitle Table)
  const [splitRatio, setSplitRatio] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('subsync_workspace_split_ratio');
      if (saved) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed >= 20 && parsed <= 75) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return 42; // default: 42% video player, 58% subtitle table
  });
  const [isResizing, setIsResizing] = useState(false);
  const splitContainerRef = useRef<HTMLDivElement>(null);

  // Drag handler for split pane
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!splitContainerRef.current) return;
      const rect = splitContainerRef.current.getBoundingClientRect();
      const isRtl = document.documentElement.dir === 'rtl';

      let newPercent: number;
      if (isRtl) {
        // In RTL, Video Player (first flex item) is on the right
        newPercent = ((rect.right - e.clientX) / rect.width) * 100;
      } else {
        // In LTR, Video Player (first flex item) is on the left
        newPercent = ((e.clientX - rect.left) / rect.width) * 100;
      }

      // Clamp between 20% and 75%
      const clamped = Math.min(75, Math.max(20, newPercent));
      setSplitRatio(clamped);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setSplitRatio((current) => {
        try {
          localStorage.setItem('subsync_workspace_split_ratio', current.toString());
        } catch {}
        return current;
      });
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Apply theme and direction on load and changes
  useEffect(() => {
    applyThemeToDOM(theme);
    document.documentElement.setAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', language);
  }, [theme, language]);

  // Open Video Handler (Electron native dialog or file input fallback)
  const handleOpenVideo = async () => {
    try {
      if (window.electronAPI?.openVideoDialog) {
        const file = await window.electronAPI.openVideoDialog();
        if (file) {
          setVideoSource({
            type: 'local',
            url: file.mediaUrl,
            name: file.fileName,
            path: file.filePath,
            size: file.size,
          });
          addNotification(
            'success',
            t('notifications.videoLoaded'),
            file.fileName
          );
        }
      } else {
        // Browser file picker
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'video/mp4,video/webm,video/ogg,video/quicktime';
        input.onchange = (e) => {
          const target = e.target as HTMLInputElement;
          if (target.files && target.files.length > 0) {
            const f = target.files[0];
            const url = URL.createObjectURL(f);
            setVideoSource({
              type: 'local',
              url,
              name: f.name,
              size: f.size,
            });
            addNotification(
              'success',
              t('notifications.videoLoaded'),
              f.name
            );
          }
        };
        input.click();
      }
    } catch (err) {
      console.error(err);
      addNotification('error', t('notifications.errorTitle'), t('notifications.failedToOpenVideo'));
    }
  };

  // Import SRT Handler
  const handleImportSrt = async () => {
    try {
      if (window.electronAPI?.openSrtDialog) {
        const result = await window.electronAPI.openSrtDialog();
        if (result && result.content) {
          const parsedCues = parseSrt(result.content);
          setTrackCues(activeTrackId, parsedCues);
          addNotification(
            'success',
            t('notifications.srtImported'),
            `${parsedCues.length} ${t('export.cues')} • ${result.fileName}`
          );
        }
      } else {
        // Browser file picker
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.srt,text/plain';
        input.onchange = (e) => {
          const target = e.target as HTMLInputElement;
          if (target.files && target.files.length > 0) {
            const f = target.files[0];
            const reader = new FileReader();
            reader.onload = () => {
              const content = reader.result as string;
              const parsedCues = parseSrt(content);
              setTrackCues(activeTrackId, parsedCues);
              addNotification(
                'success',
                t('notifications.srtImported'),
                `${parsedCues.length} ${t('export.cues')}`
              );
            };
            reader.readAsText(f);
          }
        };
        input.click();
      }
    } catch (err) {
      console.error(err);
      addNotification('error', t('notifications.errorTitle'), t('notifications.failedToImportSrt'));
    }
  };

  // Global Keyboard Shortcuts (FR-025, SYNC-08)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      // Space -> Toggle Play
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      }
      // Ctrl+Z or Cmd+Z -> Undo
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      // Ctrl+Y or Cmd+Y or Ctrl+Shift+Z -> Redo
      else if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        e.preventDefault();
        redo();
      }
      // 'n' -> Add cue at current playhead
      else if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        addCue({ startTime: currentTime, endTime: currentTime + 3000 });
      }
      // ArrowLeft / ArrowRight -> Seek 1s
      else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        seekRelative(-1000);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        seekRelative(1000);
      }
      // '[' -> Snap selected cue start to playhead (SYNC-08)
      else if (e.key === '[' && selectedCueIds.length > 0) {
        e.preventDefault();
        snapCueToPlayhead(selectedCueIds[0], 'start', currentTime);
      }
      // ']' -> Snap selected cue end to playhead (SYNC-08)
      else if (e.key === ']' && selectedCueIds.length > 0) {
        e.preventDefault();
        snapCueToPlayhead(selectedCueIds[0], 'end', currentTime);
      }
    },
    [togglePlay, undo, redo, addCue, seekRelative, currentTime, selectedCueIds, snapCueToPlayhead]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-100 dark:bg-brand-indigo-950 text-slate-900 dark:text-slate-100 font-sans overflow-hidden transition-colors">
      {/* Top Header */}
      <Header
        onOpenVideo={handleOpenVideo}
        onImportSrt={handleImportSrt}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenNewProject={() => setIsNewProjectOpen(true)}
      />

      {/* Main Workspace (Top Split View: Video Player + Line Editor Table) */}
      <main className="flex-1 min-h-0 flex flex-col p-2 gap-2">
        <div
          ref={splitContainerRef}
          className="flex-1 min-h-0 flex flex-row items-stretch select-none relative"
        >
          {/* Video Player Panel */}
          <div
            style={{ width: `calc(${splitRatio}% - 6px)` }}
            className="h-full flex flex-col min-h-0 overflow-hidden shrink-0"
          >
            <VideoPlayer onOpenVideoFile={handleOpenVideo} />
          </div>

          {/* Draggable Split Divider Gutter */}
          <div
            onMouseDown={(e) => {
              e.preventDefault();
              setIsResizing(true);
            }}
            onDoubleClick={() => {
              setSplitRatio(42);
              try {
                localStorage.setItem('subsync_workspace_split_ratio', '42');
              } catch {}
            }}
            title={t('common.resizeSplit')}
            className={`w-3 -mx-0.5 z-20 flex items-center justify-center cursor-col-resize group shrink-0 select-none relative transition-colors ${
              isResizing ? 'cursor-col-resize' : ''
            }`}
          >
            {/* Visual Divider Line / Pill */}
            <div
              className={`w-1 rounded-full transition-all duration-150 ${
                isResizing
                  ? 'bg-brand-teal h-16 w-1.5 shadow-[0_0_12px_rgba(0,109,119,0.8)]'
                  : 'bg-slate-300 dark:bg-slate-700/80 group-hover:bg-brand-teal group-hover:h-12 group-hover:w-1.5 group-hover:shadow-[0_0_8px_rgba(0,109,119,0.5)] h-8'
              }`}
            />
          </div>

          {/* Subtitle Table Editor Panel */}
          <div
            style={{ width: `calc(${100 - splitRatio}% - 6px)` }}
            className="h-full flex flex-col min-h-0 overflow-hidden flex-1"
          >
            <SubtitleTable />
          </div>

          {/* Fullscreen drag overlay to prevent iframe/video event capturing */}
          {isResizing && (
            <div className="fixed inset-0 z-50 cursor-col-resize select-none pointer-events-auto bg-transparent" />
          )}
        </div>

        {/* Bottom Interactive Timeline & Waveform (Height: ~180px) */}
        <div className="h-44 shrink-0">
          <Timeline />
        </div>
      </main>

      {/* Modals & Overlays */}
      <ExportDialog isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} />
      <SettingsDialog isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <NewProjectDialog
        isOpen={isNewProjectOpen}
        onClose={() => setIsNewProjectOpen(false)}
        onOpenVideoFile={handleOpenVideo}
        onImportSrt={handleImportSrt}
      />
      <NotificationDrawer />
      <ToastContainer />
    </div>
  );
};
export default App;
