import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Clock,
  Volume2
} from 'lucide-react';
import { useSubtitlesStore } from '@/stores/useSubtitlesStore';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { formatDisplayTime } from '@/core/srt';
import { SubtitleCue } from '@/types/subtitles';
import { useTranslation } from 'react-i18next';

export const Timeline: React.FC = () => {
  const { t } = useTranslation();
  const {
    tracks,
    activeTrackId,
    selectedCueIds,
    toggleSelectCue,
    updateCue,
    shiftAllCues,
    snapCueToPlayhead,
  } = useSubtitlesStore();

  const { currentTime, duration, setCurrentTime } = usePlayerStore();

  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const trackContainerRef = useRef<HTMLDivElement>(null);

  // Zoom level: pixels per second (e.g. 40px = 1 sec, up to 250px)
  const [pixelsPerSecond, setPixelsPerSecond] = useState<number>(60);
  const [showWaveform, setShowWaveform] = useState<boolean>(true);

  // Dragging state
  const [dragState, setDragState] = useState<{
    cueId: string;
    mode: 'move' | 'resize-start' | 'resize-end';
    initialMouseX: number;
    initialStartTime: number;
    initialEndTime: number;
  } | null>(null);

  const activeTrack = tracks.find((t) => t.id === activeTrackId);
  const cues = activeTrack ? activeTrack.cues : [];

  // Effective timeline total duration (at least 60 seconds or video duration or last cue end + 10s)
  const maxCueEndTime = useMemo(() => {
    return cues.reduce((max, c) => Math.max(max, c.endTime), 0);
  }, [cues]);

  const effectiveDurationMs = Math.max(duration > 0 ? duration : 60000, maxCueEndTime + 10000);
  const totalTimelineWidthPx = (effectiveDurationMs / 1000) * pixelsPerSecond;

  // Convert milliseconds to pixel position
  const msToPixels = useCallback(
    (ms: number) => {
      return (ms / 1000) * pixelsPerSecond;
    },
    [pixelsPerSecond]
  );

  // Convert pixel position to milliseconds
  const pixelsToMs = useCallback(
    (px: number) => {
      return Math.round((px / pixelsPerSecond) * 1000);
    },
    [pixelsPerSecond]
  );

  // Auto-scroll timeline to follow playhead if playing
  useEffect(() => {
    if (!timelineContainerRef.current) return;
    const playheadPx = msToPixels(currentTime);
    const container = timelineContainerRef.current;
    const currentScroll = container.scrollLeft;
    const containerWidth = container.clientWidth;

    // Keep playhead within visible 20%-80% window
    if (playheadPx > currentScroll + containerWidth * 0.8 || playheadPx < currentScroll) {
      container.scrollTo({
        left: Math.max(0, playheadPx - containerWidth * 0.3),
        behavior: 'smooth',
      });
    }
  }, [currentTime, msToPixels]);

  // Click on ruler or background to seek video
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (dragState) return;
    if (!trackContainerRef.current) return;
    const rect = trackContainerRef.current.getBoundingClientRect();
    const clickPx = e.clientX - rect.left;
    const newMs = Math.max(0, pixelsToMs(clickPx));
    setCurrentTime(newMs);
  };

  // Start dragging a cue block (move or resize)
  const handleCueMouseDown = (
    e: React.MouseEvent,
    cue: SubtitleCue,
    mode: 'move' | 'resize-start' | 'resize-end'
  ) => {
    e.stopPropagation();
    toggleSelectCue(cue.id, e.shiftKey || e.metaKey || e.ctrlKey);

    setDragState({
      cueId: cue.id,
      mode,
      initialMouseX: e.clientX,
      initialStartTime: cue.startTime,
      initialEndTime: cue.endTime,
    });
  };

  // Global mouse move and mouse up for fluid dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState) return;

      const deltaPx = e.clientX - dragState.initialMouseX;
      const deltaMs = pixelsToMs(deltaPx);

      if (dragState.mode === 'move') {
        const cueDuration = dragState.initialEndTime - dragState.initialStartTime;
        const newStart = Math.max(0, dragState.initialStartTime + deltaMs);
        const newEnd = newStart + cueDuration;
        updateCue(dragState.cueId, { startTime: newStart, endTime: newEnd });
      } else if (dragState.mode === 'resize-start') {
        const newStart = Math.max(0, Math.min(dragState.initialStartTime + deltaMs, dragState.initialEndTime - 100));
        updateCue(dragState.cueId, { startTime: newStart });
      } else if (dragState.mode === 'resize-end') {
        const newEnd = Math.max(dragState.initialStartTime + 100, dragState.initialEndTime + deltaMs);
        updateCue(dragState.cueId, { endTime: newEnd });
      }
    };

    const handleMouseUp = () => {
      if (dragState) {
        setDragState(null);
      }
    };

    if (dragState) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, pixelsToMs, updateCue]);

  // Generate ruler tick marks
  const rulerTicks = useMemo(() => {
    const ticks: { sec: number; px: number; label: string; isMajor: boolean }[] = [];
    const stepSec = pixelsPerSecond < 40 ? 5 : pixelsPerSecond < 90 ? 2 : 1;
    const totalSec = Math.ceil(effectiveDurationMs / 1000);

    for (let s = 0; s <= totalSec; s += stepSec) {
      const px = s * pixelsPerSecond;
      const isMajor = s % (stepSec * 5) === 0 || s === 0;
      ticks.push({
        sec: s,
        px,
        label: formatDisplayTime(s * 1000),
        isMajor,
      });
    }
    return ticks;
  }, [effectiveDurationMs, pixelsPerSecond]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-inner select-none transition-colors">
      {/* Timeline Controls Header */}
      <div className="h-10 bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 px-3 flex items-center justify-between shrink-0 text-xs">
        {/* Left: Quick Sync Tools */}
        <div className="flex items-center gap-2">
          {/* Global Offset buttons (SYNC-04) */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 rounded-lg p-0.5 border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => shiftAllCues(-500)}
              title={t('timeline.offsetMinus500')}
              className="px-2 py-0.5 rounded text-[11px] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            >
              -500ms
            </button>
            <button
              onClick={() => shiftAllCues(-100)}
              title={t('timeline.offsetMinus100')}
              className="px-1.5 py-0.5 rounded text-[11px] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            >
              -100ms
            </button>
            <span className="text-slate-300 dark:text-slate-600 px-0.5 text-[10px]">|</span>
            <button
              onClick={() => shiftAllCues(100)}
              title={t('timeline.offsetPlus100')}
              className="px-1.5 py-0.5 rounded text-[11px] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            >
              +100ms
            </button>
            <button
              onClick={() => shiftAllCues(500)}
              title={t('timeline.offsetPlus500')}
              className="px-2 py-0.5 rounded text-[11px] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            >
              +500ms
            </button>
          </div>

          {/* Snap Selected to Playhead (SYNC-03) */}
          {selectedCueIds.length > 0 && (
            <button
              onClick={() => snapCueToPlayhead(selectedCueIds[0], 'start', currentTime)}
              className="flex items-center gap-1 px-2.5 py-1 bg-brand-teal/10 dark:bg-brand-teal/20 text-brand-teal dark:text-brand-teal-300 border border-brand-teal/30 dark:border-brand-teal/40 rounded-lg hover:bg-brand-teal/20 transition text-xs font-medium"
              title={t('timeline.snapTitle')}
            >
              <Clock className="w-3.5 h-3.5 text-brand-teal dark:text-brand-apricot" />
              <span>{t('timeline.snapToPlayhead')}</span>
            </button>
          )}

          {/* Waveform Toggle Button (SYNC-06) */}
          <button
            onClick={() => setShowWaveform(!showWaveform)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs transition ${
              showWaveform
                ? 'bg-brand-mauve/15 dark:bg-brand-mauve/20 border-brand-mauve/30 dark:border-brand-mauve/40 text-brand-mauve dark:text-brand-apricot font-medium'
                : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            title={t('timeline.toggleWaveform')}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>{t('timeline.waveform')}</span>
          </button>
        </div>

        {/* Right: Zoom controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPixelsPerSecond((prev) => Math.max(20, prev - 15))}
            className="p-1 rounded text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            title={t('timeline.zoomOut')}
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <input
            type="range"
            min="20"
            max="200"
            value={pixelsPerSecond}
            onChange={(e) => setPixelsPerSecond(parseInt(e.target.value, 10))}
            className="w-24 h-1 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-teal"
            title={t('timeline.zoomTitle')}
          />

          <button
            onClick={() => setPixelsPerSecond((prev) => Math.min(220, prev + 15))}
            className="p-1 rounded text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            title={t('timeline.zoomIn')}
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Interactive Timeline Track Canvas Container */}
      <div
        ref={timelineContainerRef}
        className="flex-1 overflow-x-auto overflow-y-hidden relative bg-slate-50 dark:bg-slate-950 timeline-grid-pattern"
      >
        <div
          ref={trackContainerRef}
          onClick={handleTimelineClick}
          style={{ width: `${Math.max(totalTimelineWidthPx, 1000)}px` }}
          className="relative h-full flex flex-col cursor-pointer min-w-full"
        >
          {/* Time Ruler (Seconds markers) */}
          <div className="h-6 bg-slate-100/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 relative shrink-0">
            {rulerTicks.map((tick) => (
              <div
                key={tick.sec}
                style={{ left: `${tick.px}px` }}
                className="absolute top-0 bottom-0 pointer-events-none flex flex-col justify-end"
              >
                <div
                  className={`w-px ${
                    tick.isMajor ? 'h-3.5 bg-slate-400 dark:bg-slate-500' : 'h-2 bg-slate-300 dark:bg-slate-700'
                  }`}
                />
                {tick.isMajor && (
                  <span className="absolute left-1 top-0.5 text-[9px] font-mono text-slate-600 dark:text-slate-400 select-none">
                    {tick.label}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Audio Waveform Background Visualizer (SYNC-06) */}
          {showWaveform && (
            <div className="h-12 bg-slate-100/70 dark:bg-brand-indigo-950/60 border-b border-slate-200 dark:border-slate-800/80 relative flex items-center overflow-hidden opacity-80">
              {/* Synthetic audio waveform bars based on timeline width */}
              <svg className="w-full h-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="waveformGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#006D77" stopOpacity="0.8" />
                    <stop offset="50%" stopColor="#FFCF99" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#713E5A" stopOpacity="0.4" />
                  </linearGradient>
                </defs>
                {/* Visual Audio Peak Bars */}
                {Array.from({ length: Math.floor(totalTimelineWidthPx / 6) }).map((_, i) => {
                  const seed = Math.sin(i * 0.25) * 10 + Math.cos(i * 0.8) * 6 + 18;
                  const barHeight = Math.max(4, Math.min(42, seed));
                  const x = i * 6;
                  return (
                    <rect
                      key={i}
                      x={x}
                      y={(48 - barHeight) / 2}
                      width={3.5}
                      height={barHeight}
                      rx={1}
                      fill="url(#waveformGrad)"
                    />
                  );
                })}
              </svg>
            </div>
          )}

          {/* Subtitle Cue Blocks Track */}
          <div className="flex-1 relative min-h-[56px] py-1">
            {cues.map((cue) => {
              const leftPx = msToPixels(cue.startTime);
              const widthPx = Math.max(18, msToPixels(cue.endTime - cue.startTime));
              const isSelected = selectedCueIds.includes(cue.id);
              const isCurrent = currentTime >= cue.startTime && currentTime <= cue.endTime;

              return (
                <div
                  key={cue.id}
                  style={{
                    left: `${leftPx}px`,
                    width: `${widthPx}px`,
                  }}
                  onMouseDown={(e) => handleCueMouseDown(e, cue, 'move')}
                  className={`absolute top-1.5 bottom-1.5 rounded-lg border transition-shadow cursor-grab active:cursor-grabbing flex items-center justify-between px-2 select-none overflow-hidden group shadow-md ${
                    isSelected
                      ? 'bg-brand-mauve border-brand-apricot ring-2 ring-brand-apricot/40 z-20 text-white'
                      : isCurrent
                      ? 'bg-brand-teal/90 border-brand-teal-300 text-white z-15'
                      : 'bg-brand-indigo-800/90 hover:bg-brand-indigo-700 border-brand-indigo-600 text-slate-200 z-10'
                  }`}
                >
                  {/* Left Resize Handle (Start Time) */}
                  <div
                    onMouseDown={(e) => handleCueMouseDown(e, cue, 'resize-start')}
                    title={t('timeline.dragStart')}
                    className="absolute left-0 top-0 bottom-0 w-2.5 bg-black/20 hover:bg-brand-apricot cursor-ew-resize opacity-0 group-hover:opacity-100 transition z-30 flex items-center justify-center"
                  >
                    <div className="w-0.5 h-3 bg-white/70 rounded-full" />
                  </div>

                  {/* Cue Label / Text Snippet */}
                  <div className="flex-1 min-w-0 pointer-events-none px-1 text-right" dir="auto">
                    <span className="font-mono text-[10px] opacity-70 block truncate">
                      #{cue.index} ({((cue.endTime - cue.startTime) / 1000).toFixed(1)}s)
                    </span>
                    <span className="text-xs font-medium truncate block leading-tight">
                      {cue.text || '...'}
                    </span>
                  </div>

                  {/* Right Resize Handle (End Time) */}
                  <div
                    onMouseDown={(e) => handleCueMouseDown(e, cue, 'resize-end')}
                    title={t('timeline.dragEnd')}
                    className="absolute right-0 top-0 bottom-0 w-2.5 bg-black/20 hover:bg-brand-apricot cursor-ew-resize opacity-0 group-hover:opacity-100 transition z-30 flex items-center justify-center"
                  >
                    <div className="w-0.5 h-3 bg-white/70 rounded-full" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Synchronized Playhead (Red Line + Needle) */}
          <div
            style={{ left: `${msToPixels(currentTime)}px` }}
            className="absolute top-0 bottom-0 w-0.5 bg-brand-apricot z-30 pointer-events-none shadow-[0_0_8px_rgba(255,207,153,0.8)]"
          >
            {/* Playhead Top Badge */}
            <div className="absolute -top-0 -left-2.5 w-5 h-5 bg-brand-apricot text-brand-indigo-950 font-mono text-[9px] font-bold rounded-b flex items-center justify-center shadow-lg">
              ▼
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
