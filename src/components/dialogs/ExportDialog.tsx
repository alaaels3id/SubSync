import React, { useState } from 'react';
import { X, Download, AlertTriangle } from 'lucide-react';
import { useSubtitlesStore } from '@/stores/useSubtitlesStore';
import { useProjectStore } from '@/stores/useProjectStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { serializeSrt, validateCues } from '@/core/srt';
import { useTranslation } from 'react-i18next';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { tracks, activeTrackId } = useSubtitlesStore();
  const { projectName } = useProjectStore();
  const { addNotification } = useNotificationStore();

  const [selectedTrackId, setSelectedTrackId] = useState(activeTrackId);

  if (!isOpen) return null;

  const track = tracks.find((t) => t.id === selectedTrackId) || tracks[0];
  const srtContent = track ? serializeSrt(track.cues) : '';
  const validationErrors = track ? validateCues(track.cues) : [];

  const handleExport = async () => {
    if (!track) return;

    const defaultFilename = `${projectName.replace(/\s+/g, '_')}_${track.language}.srt`;

    try {
      if (window.electronAPI?.saveSrtDialog) {
        const result = await window.electronAPI.saveSrtDialog({
          content: srtContent,
          defaultName: defaultFilename,
        });

        if (result.success && result.filePath) {
          addNotification(
            'success',
            t('export.successTitle'),
            `${t('export.successMessage')} \n${result.filePath}`
          );
          onClose();
        }
      } else {
        // Browser fallback: download blob
        const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = defaultFilename;
        a.click();
        URL.revokeObjectURL(url);

        addNotification(
          'success',
          t('export.successTitle'),
          defaultFilename
        );
        onClose();
      }
    } catch (err) {
      console.error(err);
      addNotification(
        'error',
        t('export.errorTitle'),
        t('export.errorMessage')
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-brand-indigo-900 border border-brand-indigo-700 rounded-2xl shadow-2xl text-slate-100 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-brand-indigo-700/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-brand-apricot" />
            <h3 className="text-base font-semibold">
              {t('export.title')}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* Select Track / Language */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              {t('export.selectTrack')}
            </label>
            <select
              value={selectedTrackId}
              onChange={(e) => setSelectedTrackId(e.target.value)}
              className="w-full bg-slate-950 border border-brand-indigo-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-teal"
            >
              {tracks.map((tItem) => (
                <option key={tItem.id} value={tItem.id}>
                  {tItem.label} ({tItem.cues.length} {t('export.cues')})
                </option>
              ))}
            </select>
          </div>

          {/* Validation Warnings */}
          {validationErrors.length > 0 && (
            <div className="p-3 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-1">
                  {t('export.warning')} ({validationErrors.length})
                </p>
                <p className="opacity-90">
                  {t('export.warningDesc')}
                </p>
              </div>
            </div>
          )}

          {/* Preview Box */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              {t('export.preview')}
            </label>
            <pre className="h-48 bg-slate-950 border border-brand-indigo-800 rounded-lg p-3 text-[11px] font-mono text-slate-300 overflow-y-auto whitespace-pre-wrap select-text leading-relaxed">
              {srtContent || t('export.noCues')}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-brand-indigo-700/80 bg-slate-950/40 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-mono">
            {track?.cues.length} {t('export.cues')} • UTF-8
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleExport}
              disabled={!track || track.cues.length === 0}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-brand-teal hover:bg-brand-teal-600 disabled:opacity-40 text-white text-xs font-medium rounded-lg shadow-sm transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t('export.saveAndExport')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
