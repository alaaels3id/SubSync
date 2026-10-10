import { describe, it, expect, beforeEach } from 'vitest';
import { usePlayerStore } from '../usePlayerStore';

describe('Zustand Store - usePlayerStore', () => {
  beforeEach(() => {
    usePlayerStore.setState({
      videoSource: null,
      currentTime: 0,
      duration: 10000,
      isPlaying: false,
      playbackRate: 1.0,
      volume: 1.0,
      isMuted: false,
      loop: false,
    });
  });

  it('initializes with default playback values', () => {
    const state = usePlayerStore.getState();
    expect(state.currentTime).toBe(0);
    expect(state.isPlaying).toBe(false);
    expect(state.playbackRate).toBe(1.0);
    expect(state.volume).toBe(1.0);
    expect(state.isMuted).toBe(false);
  });

  it('updates currentTime clamped within [0, duration]', () => {
    const { setCurrentTime } = usePlayerStore.getState();

    setCurrentTime(4500);
    expect(usePlayerStore.getState().currentTime).toBe(4500);

    // Clamp below 0
    setCurrentTime(-500);
    expect(usePlayerStore.getState().currentTime).toBe(0);

    // Clamp above duration (10000ms)
    setCurrentTime(15000);
    expect(usePlayerStore.getState().currentTime).toBe(10000);
  });

  it('seeks relative to current time', () => {
    const { setCurrentTime, seekRelative } = usePlayerStore.getState();
    setCurrentTime(3000);

    seekRelative(2000);
    expect(usePlayerStore.getState().currentTime).toBe(5000);

    seekRelative(-1500);
    expect(usePlayerStore.getState().currentTime).toBe(3500);
  });

  it('steps frame-by-frame forward and backward', () => {
    const { setCurrentTime, stepFrames } = usePlayerStore.getState();
    setCurrentTime(1000);

    // 1 frame at 25 fps = 40ms
    stepFrames(1, 25);
    expect(usePlayerStore.getState().currentTime).toBe(1040);

    stepFrames(-2, 25);
    expect(usePlayerStore.getState().currentTime).toBe(960);
  });

  it('toggles play state and updates playback rate', () => {
    const { togglePlay, setPlaybackRate } = usePlayerStore.getState();

    togglePlay();
    expect(usePlayerStore.getState().isPlaying).toBe(true);

    togglePlay();
    expect(usePlayerStore.getState().isPlaying).toBe(false);

    setPlaybackRate(1.5);
    expect(usePlayerStore.getState().playbackRate).toBe(1.5);
  });

  it('controls volume and mute toggling', () => {
    const { setVolume, toggleMute } = usePlayerStore.getState();

    setVolume(0.7);
    expect(usePlayerStore.getState().volume).toBe(0.7);
    expect(usePlayerStore.getState().isMuted).toBe(false);

    toggleMute();
    expect(usePlayerStore.getState().isMuted).toBe(true);

    toggleMute();
    expect(usePlayerStore.getState().isMuted).toBe(false);

    // Setting volume to 0 sets isMuted to true
    setVolume(0);
    expect(usePlayerStore.getState().isMuted).toBe(true);
  });

  it('sets video source and resets playback state', () => {
    const { setCurrentTime, setIsPlaying, setVideoSource } = usePlayerStore.getState();
    setCurrentTime(5000);
    setIsPlaying(true);

    setVideoSource({
      type: 'local',
      name: 'movie.mp4',
      url: 'media-loader:///path/to/movie.mp4',
      size: 1048576,
    });

    const state = usePlayerStore.getState();
    expect(state.videoSource?.name).toBe('movie.mp4');
    expect(state.currentTime).toBe(0);
    expect(state.isPlaying).toBe(false);
  });
});
