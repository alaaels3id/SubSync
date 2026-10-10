import React, { useState, useMemo, useRef } from 'react';
import {
  Plus,
  Trash2,
  Copy,
  Scissors,
  Merge,
  Search,
  X,
  Clock,
  AlertTriangle,
  PlayCircle
} from 'lucide-react';
import { useSubtitlesStore } from '@/stores/useSubtitlesStore';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { msToTimecode, timecodeToMs } from '@/core/srt';
import { SubtitleCue } from '@/types/subtitles';
import { useTranslation } from 'react-i18next';

export const SubtitleTable: React.FC = () => {
  const { t } = useTranslation();
  const {
    tracks,
    activeTrackId,
    selectedCueIds,
    toggleSelectCue,
    addCue,
    updateCue,
    deleteCue,
    deleteSelectedCues,
    splitCue,
    mergeCues,
    snapCueToPlayhead,
    errors,
  } = useSubtitlesStore();

  const { currentTime, setCurrentTime } = usePlayerStore();

  // Search & Replace state
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // Time editing state
  const [editingTimeId, setEditingTimeId] = useState<{ id: string; type: 'start' | 'end' } | null>(null);
  const [timeInputVal, setTimeInputVal] = useState('');

  // Table container ref for auto-scrolling to active cue
  const activeRowRef = useRef<HTMLTableRowElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const activeTrack = tracks.find((t) => t.id === activeTrackId);
  const cues = activeTrack ? activeTrack.cues : [];

  // Filtered cues based on search query
  const filteredCues = useMemo(() => {
    if (!searchQuery.trim()) return cues;
    return cues.filter((cue) => cue.text.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [cues, searchQuery]);

  // Find active cue index during playback
  const activeCue = useMemo(() => {
    return cues.find((c) => currentTime >= c.startTime && currentTime <= c.endTime);
  }, [cues, currentTime]);

  // Handle Search & Replace All
  const handleReplaceAll = () => {
    if (!searchQuery.trim()) return;
    for (const cue of cues) {
      if (cue.text.includes(searchQuery)) {
        const newText = cue.text.replaceAll(searchQuery, replaceQuery);
        updateCue(cue.id, { text: newText });
      }
    }
  };

  const handleSeekToCue = (startMs: number) => {
    setCurrentTime(startMs);
  };

  const startEditTime = (cue: SubtitleCue, type: 'start' | 'end') => {
    setEditingTimeId({ id: cue.id, type });
    setTimeInputVal(msToTimecode(type === 'start' ? cue.startTime : cue.endTime));
  };

  const saveEditTime = (id: string, type: 'start' | 'end') => {
    const ms = timecodeToMs(timeInputVal);
    if (type === 'start') {
      updateCue(id, { startTime: ms });
    } else {
      updateCue(id, { endTime: ms });
    }
    setEditingTimeId(null);
  };

  // Duplicate cue
  const handleDuplicate = (cue: SubtitleCue) => {
    addCue({
      startTime: cue.endTime + 200,
      endTime: cue.endTime + 200 + (cue.endTime - cue.startTime),
      text: cue.text,
    });
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900/90 rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner overflow-hidden select-none transition-colors">
      {/* Table Toolbar */}
      <div className="h-11 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 flex items-center justify-between shrink-0 gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => addCue({ startTime: currentTime, endTime: currentTime + 3000 })}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-brand-teal/90 hover:bg-brand-teal text-white text-xs font-medium rounded-lg shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('table.addLine')}</span>
          </button>

          {selectedCueIds.length > 0 && (
            <button
              onClick={deleteSelectedCues}
              className="flex items-center gap-1 px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-600 dark:text-rose-300 text-xs font-medium rounded-lg border border-rose-500/30 transition"
              title={t('table.deleteSelected')}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>
                {t('common.delete')} ({selectedCueIds.length})
              </span>
            </button>
          )}

          {/* Merge Selected (if 2 are selected) */}
          {selectedCueIds.length === 2 && (
            <button
              onClick={() => mergeCues(selectedCueIds[0], selectedCueIds[1])}
              className="flex items-center gap-1 px-2.5 py-1 bg-brand-mauve/20 hover:bg-brand-mauve/40 text-brand-mauve dark:text-slate-200 text-xs font-medium rounded-lg border border-brand-mauve/40 transition"
              title={t('table.mergeTitle')}
            >
              <Merge className="w-3.5 h-3.5 text-brand-mauve dark:text-brand-apricot" />
              <span>{t('table.merge')}</span>
            </button>
          )}
        </div>

        {/* Right Tools: Search toggle, Cues count */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition ${
              showSearch ? 'bg-brand-teal text-white' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800'
            }`}
            title={t('table.findAndReplace')}
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          <span className="text-[11px] text-slate-600 dark:text-slate-400 font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            {cues.length} {t('table.linesCount')}
          </span>
        </div>
      </div>

      {/* Expandable Search & Replace Bar */}
      {showSearch && (
        <div className="bg-slate-100 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 p-2.5 flex items-center gap-2 text-xs">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute right-2.5 top-2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('table.searchPlaceholder')}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md pr-8 pl-2 py-1 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-teal"
            />
          </div>

          <div className="flex-1">
            <input
              type="text"
              value={replaceQuery}
              onChange={(e) => setReplaceQuery(e.target.value)}
              placeholder={t('table.replacePlaceholder')}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md px-2 py-1 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-teal"
            />
          </div>

          <button
            onClick={handleReplaceAll}
            disabled={!searchQuery.trim()}
            className="px-3 py-1 bg-brand-teal hover:bg-brand-teal-600 disabled:opacity-40 text-white rounded-md font-medium transition"
          >
            {t('table.replaceAll')}
          </button>

          <button
            onClick={() => {
              setShowSearch(false);
              setSearchQuery('');
            }}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Cues Table List */}
      <div ref={tableContainerRef} className="flex-1 overflow-y-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="sticky top-0 bg-slate-100/90 dark:bg-slate-900/95 backdrop-blur-sm z-10 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="py-2 px-3 w-12 text-center">#</th>
              <th className="py-2 px-2 w-28 text-center">{t('table.start')}</th>
              <th className="py-2 px-2 w-28 text-center">{t('table.end')}</th>
              <th className="py-2 px-2 w-20 text-center">{t('table.duration')}</th>
              <th className="py-2 px-3 text-right">{t('table.subtitleText')}</th>
              <th className="py-2 px-3 w-28 text-center">{t('table.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-sans">
            {filteredCues.map((cue) => {
              const isSelected = selectedCueIds.includes(cue.id);
              const isActive = activeCue?.id === cue.id;
              const durationMs = cue.endTime - cue.startTime;
              const cueErrors = errors.filter((e) => e.cueId === cue.id);
              const hasError = cueErrors.length > 0;

              return (
                <tr
                  key={cue.id}
                  ref={isActive ? activeRowRef : undefined}
                  onClick={(e) => toggleSelectCue(cue.id, e.shiftKey || e.metaKey || e.ctrlKey)}
                  className={`group transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-brand-teal/15 ring-1 ring-inset ring-brand-teal/50'
                      : isSelected
                      ? 'bg-brand-indigo-100 dark:bg-brand-indigo-700/40 text-brand-indigo-950 dark:text-white font-medium'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {/* Index / Seek Button */}
                  <td className="py-2 px-3 text-center font-mono text-[11px] text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSeekToCue(cue.startTime);
                      }}
                      title={t('table.jumpVideo')}
                      className="inline-flex items-center justify-center p-0.5 rounded hover:bg-brand-teal/20 hover:text-brand-teal transition"
                    >
                      {isActive ? <PlayCircle className="w-3.5 h-3.5 text-brand-teal dark:text-brand-apricot" /> : cue.index}
                    </button>
                  </td>

                  {/* Start Time */}
                  <td className="py-2 px-2 text-center font-mono text-[11px]">
                    {editingTimeId?.id === cue.id && editingTimeId.type === 'start' ? (
                      <input
                        type="text"
                        autoFocus
                        value={timeInputVal}
                        onChange={(e) => setTimeInputVal(e.target.value)}
                        onBlur={() => saveEditTime(cue.id, 'start')}
                        onKeyDown={(e) => e.key === 'Enter' && saveEditTime(cue.id, 'start')}
                        className="w-24 bg-white dark:bg-slate-950 border border-brand-teal rounded px-1 py-0.5 text-center text-brand-teal dark:text-brand-apricot font-bold"
                      />
                    ) : (
                      <span
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          startEditTime(cue, 'start');
                        }}
                        className="cursor-text px-1 py-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition text-slate-700 dark:text-slate-300"
                        title={t('table.doubleClickEdit')}
                      >
                        {msToTimecode(cue.startTime)}
                      </span>
                    )}
                  </td>

                  {/* End Time */}
                  <td className="py-2 px-2 text-center font-mono text-[11px]">
                    {editingTimeId?.id === cue.id && editingTimeId.type === 'end' ? (
                      <input
                        type="text"
                        autoFocus
                        value={timeInputVal}
                        onChange={(e) => setTimeInputVal(e.target.value)}
                        onBlur={() => saveEditTime(cue.id, 'end')}
                        onKeyDown={(e) => e.key === 'Enter' && saveEditTime(cue.id, 'end')}
                        className="w-24 bg-white dark:bg-slate-950 border border-brand-teal rounded px-1 py-0.5 text-center text-brand-teal dark:text-brand-apricot font-bold"
                      />
                    ) : (
                      <span
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          startEditTime(cue, 'end');
                        }}
                        className="cursor-text px-1 py-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition text-slate-700 dark:text-slate-300"
                        title={t('table.doubleClickEdit')}
                      >
                        {msToTimecode(cue.endTime)}
                      </span>
                    )}
                  </td>

                  {/* Duration */}
                  <td className="py-2 px-2 text-center font-mono text-[11px] text-slate-500 dark:text-slate-400">
                    {(durationMs / 1000).toFixed(2)}s
                  </td>

                  {/* Subtitle Text with direct inline editing */}
                  <td className="py-2 px-3 text-right">
                    <div className="relative">
                      <textarea
                        rows={Math.max(1, cue.text.split('\n').length)}
                        value={cue.text}
                        onChange={(e) => updateCue(cue.id, { text: e.target.value })}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full bg-transparent hover:bg-slate-100/70 dark:hover:bg-slate-950/40 focus:bg-white dark:focus:bg-slate-950 border border-transparent focus:border-brand-teal rounded px-2 py-1 text-slate-900 dark:text-slate-100 text-xs resize-none focus:outline-none transition leading-relaxed font-sans"
                        placeholder={t('table.enterSubtitlePlaceholder')}
                        dir="auto"
                      />

                      {/* Error Warning Badge */}
                      {hasError && (
                        <div
                          className="absolute left-1 top-2 flex items-center text-rose-400 cursor-help"
                          title={cueErrors.map((e) => e.message).join('\n')}
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-2 px-3 text-center">
                    <div className="flex items-center justify-center gap-1 opacity-60 group-hover:opacity-100 transition">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          snapCueToPlayhead(cue.id, 'start', currentTime);
                        }}
                        title={t('table.snapStart')}
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-brand-apricot transition"
                      >
                        <Clock className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          splitCue(cue.id, cue.startTime + (cue.endTime - cue.startTime) / 2);
                        }}
                        title={t('table.split')}
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
                      >
                        <Scissors className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicate(cue);
                        }}
                        title={t('table.duplicate')}
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteCue(cue.id);
                        }}
                        title={t('table.delete')}
                        className="p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {filteredCues.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500">
                  {t('table.noCuesMessage')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
