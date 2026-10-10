import { create } from 'zustand';
import { SubtitleCue, SubtitleTrack, ValidationError } from '@/types/subtitles';
import { validateCues } from '@/core/srt';

interface SubtitlesState {
  tracks: SubtitleTrack[];
  activeTrackId: string;
  selectedCueIds: string[];
  activeCueId: string | null;
  history: SubtitleTrack[][];
  future: SubtitleTrack[][];
  errors: ValidationError[];

  // Track management
  addTrack: (language: string, label: string) => void;
  removeTrack: (id: string) => void;
  setActiveTrack: (id: string) => void;
  setTrackCues: (trackId: string, cues: SubtitleCue[]) => void;

  // Cue Selection
  setSelectedCueIds: (ids: string[]) => void;
  toggleSelectCue: (id: string, multiSelect?: boolean) => void;
  setActiveCueId: (id: string | null) => void;

  // Cue Editing (with Undo/Redo tracking)
  addCue: (cue?: Partial<SubtitleCue>) => void;
  updateCue: (id: string, updates: Partial<SubtitleCue>) => void;
  deleteCue: (id: string) => void;
  deleteSelectedCues: () => void;
  splitCue: (id: string, splitTimeMs: number) => void;
  mergeCues: (id1: string, id2: string) => void;

  // Synchronization Tools
  shiftAllCues: (offsetMs: number) => void;
  shiftSelectedCues: (offsetMs: number) => void;
  snapCueToPlayhead: (id: string, edge: 'start' | 'end', playheadMs: number) => void;
  resizeCue: (id: string, edge: 'start' | 'end', newTimeMs: number) => void;

  // Undo / Redo
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Validation
  runValidation: (videoDurationMs?: number) => void;
}

const DEFAULT_TRACK: SubtitleTrack = {
  id: 'track-ar',
  language: 'ar',
  label: 'العربية (Arabic)',
  cues: [
    {
      id: 'cue-init-1',
      index: 1,
      startTime: 1000,
      endTime: 4000,
      text: 'مرحبًا بك في SubSync Studio.',
    },
    {
      id: 'cue-init-2',
      index: 2,
      startTime: 4500,
      endTime: 7500,
      text: 'ابدأ بمزامنة الترجمة بدقة وسهولة مع الفيديو.',
    },
  ],
};

const renumberCues = (cues: SubtitleCue[]): SubtitleCue[] => {
  return cues
    .sort((a, b) => a.startTime - b.startTime)
    .map((cue, index) => ({
      ...cue,
      index: index + 1,
    }));
};

export const useSubtitlesStore = create<SubtitlesState>((set, get) => ({
  tracks: [DEFAULT_TRACK],
  activeTrackId: 'track-ar',
  selectedCueIds: ['cue-init-1'],
  activeCueId: null,
  history: [],
  future: [],
  errors: [],

  addTrack: (language, label) => {
    const newTrack: SubtitleTrack = {
      id: `track-${language}-${Date.now()}`,
      language,
      label,
      cues: [],
    };
    set((state) => ({
      tracks: [...state.tracks, newTrack],
      activeTrackId: newTrack.id,
    }));
  },

  removeTrack: (id) => {
    set((state) => {
      const remaining = state.tracks.filter((t) => t.id !== id);
      if (remaining.length === 0) return state;
      return {
        tracks: remaining,
        activeTrackId: state.activeTrackId === id ? remaining[0].id : state.activeTrackId,
      };
    });
  },

  setActiveTrack: (id) => set({ activeTrackId: id, selectedCueIds: [] }),

  setTrackCues: (trackId, cues) => {
    const currentTracks = get().tracks;
    const renumbered = renumberCues(cues);
    set((state) => ({
      history: [...state.history.slice(-20), currentTracks],
      future: [],
      tracks: state.tracks.map((t) => (t.id === trackId ? { ...t, cues: renumbered, isModified: true } : t)),
    }));
    get().runValidation();
  },

  setSelectedCueIds: (ids) => set({ selectedCueIds: ids }),

  toggleSelectCue: (id, multiSelect = false) => {
    set((state) => {
      if (multiSelect) {
        const exists = state.selectedCueIds.includes(id);
        return {
          selectedCueIds: exists
            ? state.selectedCueIds.filter((cueId) => cueId !== id)
            : [...state.selectedCueIds, id],
        };
      }
      return { selectedCueIds: [id] };
    });
  },

  setActiveCueId: (id) => set({ activeCueId: id }),

  addCue: (cueData) => {
    const { tracks, activeTrackId, history } = get();
    const track = tracks.find((t) => t.id === activeTrackId);
    if (!track) return;

    // Default 2 seconds after the last cue or starting at 0
    const lastCue = track.cues[track.cues.length - 1];
    const startTime = cueData?.startTime ?? (lastCue ? lastCue.endTime + 500 : 0);
    const endTime = cueData?.endTime ?? startTime + 3000;

    const newCue: SubtitleCue = {
      id: `cue-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      index: track.cues.length + 1,
      startTime,
      endTime,
      text: cueData?.text ?? 'سطر ترجمة جديد...',
    };

    const updatedCues = renumberCues([...track.cues, newCue]);

    set({
      history: [...history.slice(-20), tracks],
      future: [],
      tracks: tracks.map((t) => (t.id === activeTrackId ? { ...t, cues: updatedCues, isModified: true } : t)),
      selectedCueIds: [newCue.id],
    });
    get().runValidation();
  },

  updateCue: (id, updates) => {
    const { tracks, activeTrackId, history } = get();
    const track = tracks.find((t) => t.id === activeTrackId);
    if (!track) return;

    const updatedCues = track.cues.map((cue) => {
      if (cue.id !== id) return cue;
      return { ...cue, ...updates };
    });

    set({
      history: [...history.slice(-20), tracks],
      future: [],
      tracks: tracks.map((t) =>
        t.id === activeTrackId ? { ...t, cues: renumberCues(updatedCues), isModified: true } : t
      ),
    });
    get().runValidation();
  },

  deleteCue: (id) => {
    const { tracks, activeTrackId, history } = get();
    const track = tracks.find((t) => t.id === activeTrackId);
    if (!track) return;

    const filtered = track.cues.filter((cue) => cue.id !== id);

    set({
      history: [...history.slice(-20), tracks],
      future: [],
      tracks: tracks.map((t) =>
        t.id === activeTrackId ? { ...t, cues: renumberCues(filtered), isModified: true } : t
      ),
      selectedCueIds: get().selectedCueIds.filter((cid) => cid !== id),
    });
    get().runValidation();
  },

  deleteSelectedCues: () => {
    const { tracks, activeTrackId, selectedCueIds, history } = get();
    const track = tracks.find((t) => t.id === activeTrackId);
    if (!track || selectedCueIds.length === 0) return;

    const filtered = track.cues.filter((cue) => !selectedCueIds.includes(cue.id));

    set({
      history: [...history.slice(-20), tracks],
      future: [],
      tracks: tracks.map((t) =>
        t.id === activeTrackId ? { ...t, cues: renumberCues(filtered), isModified: true } : t
      ),
      selectedCueIds: [],
    });
    get().runValidation();
  },

  splitCue: (id, splitTimeMs) => {
    const { tracks, activeTrackId, history } = get();
    const track = tracks.find((t) => t.id === activeTrackId);
    if (!track) return;

    const target = track.cues.find((c) => c.id === id);
    if (!target || splitTimeMs <= target.startTime || splitTimeMs >= target.endTime) return;

    const words = target.text.split(' ');
    const half = Math.ceil(words.length / 2);
    const textPart1 = words.slice(0, half).join(' ');
    const textPart2 = words.slice(half).join(' ');

    const cue1: SubtitleCue = {
      ...target,
      endTime: splitTimeMs,
      text: textPart1 || target.text,
    };

    const cue2: SubtitleCue = {
      id: `cue-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      index: target.index + 1,
      startTime: splitTimeMs,
      endTime: target.endTime,
      text: textPart2 || '...',
    };

    const updated = track.cues.flatMap((c) => (c.id === id ? [cue1, cue2] : [c]));

    set({
      history: [...history.slice(-20), tracks],
      future: [],
      tracks: tracks.map((t) =>
        t.id === activeTrackId ? { ...t, cues: renumberCues(updated), isModified: true } : t
      ),
      selectedCueIds: [cue2.id],
    });
    get().runValidation();
  },

  mergeCues: (id1, id2) => {
    const { tracks, activeTrackId, history } = get();
    const track = tracks.find((t) => t.id === activeTrackId);
    if (!track) return;

    const cue1 = track.cues.find((c) => c.id === id1);
    const cue2 = track.cues.find((c) => c.id === id2);
    if (!cue1 || !cue2) return;

    const mergedStartTime = Math.min(cue1.startTime, cue2.startTime);
    const mergedEndTime = Math.max(cue1.endTime, cue2.endTime);
    const mergedText = cue1.startTime < cue2.startTime
      ? `${cue1.text} ${cue2.text}`
      : `${cue2.text} ${cue1.text}`;

    const mergedCue: SubtitleCue = {
      ...cue1,
      startTime: mergedStartTime,
      endTime: mergedEndTime,
      text: mergedText.trim(),
    };

    const updated = track.cues
      .filter((c) => c.id !== id2)
      .map((c) => (c.id === id1 ? mergedCue : c));

    set({
      history: [...history.slice(-20), tracks],
      future: [],
      tracks: tracks.map((t) =>
        t.id === activeTrackId ? { ...t, cues: renumberCues(updated), isModified: true } : t
      ),
      selectedCueIds: [mergedCue.id],
    });
    get().runValidation();
  },

  shiftAllCues: (offsetMs) => {
    const { tracks, activeTrackId, history } = get();
    const track = tracks.find((t) => t.id === activeTrackId);
    if (!track) return;

    const updated = track.cues.map((cue) => ({
      ...cue,
      startTime: Math.max(0, cue.startTime + offsetMs),
      endTime: Math.max(100, cue.endTime + offsetMs),
    }));

    set({
      history: [...history.slice(-20), tracks],
      future: [],
      tracks: tracks.map((t) =>
        t.id === activeTrackId ? { ...t, cues: renumberCues(updated), isModified: true } : t
      ),
    });
    get().runValidation();
  },

  shiftSelectedCues: (offsetMs) => {
    const { tracks, activeTrackId, selectedCueIds, history } = get();
    const track = tracks.find((t) => t.id === activeTrackId);
    if (!track || selectedCueIds.length === 0) return;

    const updated = track.cues.map((cue) => {
      if (!selectedCueIds.includes(cue.id)) return cue;
      return {
        ...cue,
        startTime: Math.max(0, cue.startTime + offsetMs),
        endTime: Math.max(100, cue.endTime + offsetMs),
      };
    });

    set({
      history: [...history.slice(-20), tracks],
      future: [],
      tracks: tracks.map((t) =>
        t.id === activeTrackId ? { ...t, cues: renumberCues(updated), isModified: true } : t
      ),
    });
    get().runValidation();
  },

  snapCueToPlayhead: (id, edge, playheadMs) => {
    const { tracks, activeTrackId, history } = get();
    const track = tracks.find((t) => t.id === activeTrackId);
    if (!track) return;

    const updated = track.cues.map((cue) => {
      if (cue.id !== id) return cue;
      if (edge === 'start') {
        const duration = cue.endTime - cue.startTime;
        return {
          ...cue,
          startTime: playheadMs,
          endTime: playheadMs + duration,
        };
      } else {
        const duration = cue.endTime - cue.startTime;
        return {
          ...cue,
          startTime: Math.max(0, playheadMs - duration),
          endTime: playheadMs,
        };
      }
    });

    set({
      history: [...history.slice(-20), tracks],
      future: [],
      tracks: tracks.map((t) =>
        t.id === activeTrackId ? { ...t, cues: renumberCues(updated), isModified: true } : t
      ),
    });
    get().runValidation();
  },

  resizeCue: (id, edge, newTimeMs) => {
    const { tracks, activeTrackId, history } = get();
    const track = tracks.find((t) => t.id === activeTrackId);
    if (!track) return;

    const updated = track.cues.map((cue) => {
      if (cue.id !== id) return cue;
      if (edge === 'start') {
        const validStart = Math.min(newTimeMs, cue.endTime - 100);
        return { ...cue, startTime: Math.max(0, validStart) };
      } else {
        const validEnd = Math.max(newTimeMs, cue.startTime + 100);
        return { ...cue, endTime: validEnd };
      }
    });

    set({
      history: [...history.slice(-20), tracks],
      future: [],
      tracks: tracks.map((t) =>
        t.id === activeTrackId ? { ...t, cues: renumberCues(updated), isModified: true } : t
      ),
    });
    get().runValidation();
  },

  undo: () => {
    const { history, future, tracks } = get();
    if (history.length === 0) return;

    const previous = history[history.length - 1];
    const newHistory = history.slice(0, -1);

    set({
      history: newHistory,
      future: [tracks, ...future.slice(0, 20)],
      tracks: previous,
    });
    get().runValidation();
  },

  redo: () => {
    const { history, future, tracks } = get();
    if (future.length === 0) return;

    const next = future[0];
    const newFuture = future.slice(1);

    set({
      history: [...history, tracks],
      future: newFuture,
      tracks: next,
    });
    get().runValidation();
  },

  canUndo: () => get().history.length > 0,
  canRedo: () => get().future.length > 0,

  runValidation: (videoDurationMs) => {
    const { tracks, activeTrackId } = get();
    const track = tracks.find((t) => t.id === activeTrackId);
    if (!track) {
      set({ errors: [] });
      return;
    }
    const errors = validateCues(track.cues, videoDurationMs);
    set({ errors });
  },
}));
