import { describe, it, expect, beforeEach } from 'vitest';
import { useSubtitlesStore } from '../useSubtitlesStore';

describe('Zustand Store - useSubtitlesStore', () => {
  beforeEach(() => {
    // Reset state before each test
    useSubtitlesStore.setState({
      tracks: [
        {
          id: 'track-ar',
          language: 'ar',
          label: 'العربية (Arabic)',
          cues: [],
        },
      ],
      activeTrackId: 'track-ar',
      selectedCueIds: [],
      activeCueId: null,
      history: [],
      future: [],
      errors: [],
    });
  });

  it('starts with empty cues by default', () => {
    const state = useSubtitlesStore.getState();
    const activeTrack = state.tracks.find((t) => t.id === state.activeTrackId);
    expect(activeTrack?.cues).toEqual([]);
    expect(state.selectedCueIds).toEqual([]);
  });

  it('adds a new cue with auto-incremented index', () => {
    const { addCue } = useSubtitlesStore.getState();
    addCue({ startTime: 1000, endTime: 3000, text: 'السطر الأول' });

    let state = useSubtitlesStore.getState();
    let track = state.tracks.find((t) => t.id === state.activeTrackId)!;
    expect(track.cues.length).toBe(1);
    expect(track.cues[0].index).toBe(1);
    expect(track.cues[0].text).toBe('السطر الأول');

    // Add second cue
    addCue({ startTime: 3500, endTime: 6000, text: 'السطر الثاني' });
    state = useSubtitlesStore.getState();
    track = state.tracks.find((t) => t.id === state.activeTrackId)!;
    expect(track.cues.length).toBe(2);
    expect(track.cues[1].index).toBe(2);
    expect(track.cues[1].text).toBe('السطر الثاني');
  });

  it('updates an existing cue and re-sorts by start time', () => {
    const { addCue, updateCue } = useSubtitlesStore.getState();
    addCue({ startTime: 5000, endTime: 7000, text: 'Cue B' });
    addCue({ startTime: 1000, endTime: 3000, text: 'Cue A' });

    const track = useSubtitlesStore.getState().tracks[0];
    const cueB = track.cues.find((c) => c.text === 'Cue B')!;

    // Move Cue B earlier than Cue A
    updateCue(cueB.id, { startTime: 500, endTime: 900 });

    const updatedTrack = useSubtitlesStore.getState().tracks[0];
    expect(updatedTrack.cues[0].id).toBe(cueB.id);
    expect(updatedTrack.cues[0].index).toBe(1);
    expect(updatedTrack.cues[1].index).toBe(2);
  });

  it('deletes a cue and renumbers remaining cues sequentially', () => {
    const { addCue, deleteCue } = useSubtitlesStore.getState();
    addCue({ startTime: 1000, endTime: 2000, text: '1' });
    addCue({ startTime: 3000, endTime: 4000, text: '2' });
    addCue({ startTime: 5000, endTime: 6000, text: '3' });

    const track = useSubtitlesStore.getState().tracks[0];
    const secondCueId = track.cues[1].id;

    deleteCue(secondCueId);

    const updatedTrack = useSubtitlesStore.getState().tracks[0];
    expect(updatedTrack.cues.length).toBe(2);
    expect(updatedTrack.cues[0].text).toBe('1');
    expect(updatedTrack.cues[0].index).toBe(1);
    expect(updatedTrack.cues[1].text).toBe('3');
    expect(updatedTrack.cues[1].index).toBe(2);
  });

  it('splits a cue in two parts with split words', () => {
    const { addCue, splitCue } = useSubtitlesStore.getState();
    addCue({ startTime: 1000, endTime: 5000, text: 'مرحبا بكم في التطبيق' });

    const cue = useSubtitlesStore.getState().tracks[0].cues[0];
    splitCue(cue.id, 3000);

    const cues = useSubtitlesStore.getState().tracks[0].cues;
    expect(cues.length).toBe(2);
    expect(cues[0].startTime).toBe(1000);
    expect(cues[0].endTime).toBe(3000);
    expect(cues[1].startTime).toBe(3000);
    expect(cues[1].endTime).toBe(5000);
    expect(cues[0].text).toBe('مرحبا بكم');
    expect(cues[1].text).toBe('في التطبيق');
  });

  it('merges two adjacent cues together', () => {
    const { addCue, mergeCues } = useSubtitlesStore.getState();
    addCue({ startTime: 1000, endTime: 2500, text: 'الجزء الأول' });
    addCue({ startTime: 3000, endTime: 4500, text: 'الجزء الثاني' });

    const [c1, c2] = useSubtitlesStore.getState().tracks[0].cues;
    mergeCues(c1.id, c2.id);

    const cues = useSubtitlesStore.getState().tracks[0].cues;
    expect(cues.length).toBe(1);
    expect(cues[0].startTime).toBe(1000);
    expect(cues[0].endTime).toBe(4500);
    expect(cues[0].text).toBe('الجزء الأول الجزء الثاني');
  });

  it('shifts all cues by offsetMs without allowing negative start times', () => {
    const { addCue, shiftAllCues } = useSubtitlesStore.getState();
    addCue({ startTime: 1000, endTime: 2000, text: 'Cue 1' });
    addCue({ startTime: 3000, endTime: 4000, text: 'Cue 2' });

    // Shift +500ms
    shiftAllCues(500);
    let cues = useSubtitlesStore.getState().tracks[0].cues;
    expect(cues[0].startTime).toBe(1500);
    expect(cues[0].endTime).toBe(2500);
    expect(cues[1].startTime).toBe(3500);
    expect(cues[1].endTime).toBe(4500);

    // Shift -2000ms (clamped at 0)
    shiftAllCues(-2000);
    cues = useSubtitlesStore.getState().tracks[0].cues;
    expect(cues[0].startTime).toBe(0);
    expect(cues[0].endTime).toBe(500);
  });

  it('snaps cue start and end to playhead position while preserving duration', () => {
    const { addCue, snapCueToPlayhead } = useSubtitlesStore.getState();
    addCue({ startTime: 1000, endTime: 3000, text: 'Snap Cue' }); // duration: 2000ms

    const cueId = useSubtitlesStore.getState().tracks[0].cues[0].id;

    // Snap start to 2000ms (moves whole cue to [2000, 4000])
    snapCueToPlayhead(cueId, 'start', 2000);
    let cue = useSubtitlesStore.getState().tracks[0].cues[0];
    expect(cue.startTime).toBe(2000);
    expect(cue.endTime).toBe(4000);

    // Snap end to 4500ms (moves whole cue to [2500, 4500])
    snapCueToPlayhead(cueId, 'end', 4500);
    cue = useSubtitlesStore.getState().tracks[0].cues[0];
    expect(cue.startTime).toBe(2500);
    expect(cue.endTime).toBe(4500);
  });

  it('supports undo and redo functionality', () => {
    const { addCue, updateCue, undo, redo, canUndo, canRedo } = useSubtitlesStore.getState();

    expect(canUndo()).toBe(false);
    expect(canRedo()).toBe(false);

    addCue({ startTime: 1000, endTime: 2000, text: 'Initial' });
    const cueId = useSubtitlesStore.getState().tracks[0].cues[0].id;

    updateCue(cueId, { text: 'Modified' });
    expect(useSubtitlesStore.getState().tracks[0].cues[0].text).toBe('Modified');
    expect(canUndo()).toBe(true);

    // Undo update
    undo();
    expect(useSubtitlesStore.getState().tracks[0].cues[0].text).toBe('Initial');
    expect(canRedo()).toBe(true);

    // Redo update
    redo();
    expect(useSubtitlesStore.getState().tracks[0].cues[0].text).toBe('Modified');
  });

  it('manages multiple tracks and track selection', () => {
    const { addTrack, setActiveTrack, removeTrack } = useSubtitlesStore.getState();
    addTrack('en', 'English');

    const state = useSubtitlesStore.getState();
    expect(state.tracks.length).toBe(2);

    const enTrack = state.tracks.find((t) => t.language === 'en')!;
    setActiveTrack(enTrack.id);
    expect(useSubtitlesStore.getState().activeTrackId).toBe(enTrack.id);

    removeTrack(enTrack.id);
    expect(useSubtitlesStore.getState().tracks.length).toBe(1);
    expect(useSubtitlesStore.getState().activeTrackId).toBe('track-ar');
  });
});
