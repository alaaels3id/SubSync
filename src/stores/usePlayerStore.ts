import { create } from 'zustand';

export interface VideoSource {
  type: 'local' | 'url' | 'youtube';
  url: string;
  name: string;
  path?: string;
  size?: number;
  youtubeId?: string;
  thumbnail?: string;
}

interface PlayerState {
  videoSource: VideoSource | null;
  currentTime: number; // in milliseconds
  duration: number;    // in milliseconds
  isPlaying: boolean;
  playbackRate: number;
  volume: number;
  isMuted: boolean;
  loop: boolean;

  setVideoSource: (source: VideoSource | null) => void;
  setCurrentTime: (timeMs: number) => void;
  setDuration: (durationMs: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  togglePlay: () => void;
  setPlaybackRate: (rate: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  stepFrames: (frames: number, fps?: number) => void;
  seekRelative: (offsetMs: number) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  videoSource: null,
  currentTime: 0,
  duration: 0,
  isPlaying: false,
  playbackRate: 1.0,
  volume: 1.0,
  isMuted: false,
  loop: false,

  setVideoSource: (source) => set({ videoSource: source, currentTime: 0, isPlaying: false }),
  setCurrentTime: (timeMs) => set({ currentTime: Math.max(0, Math.min(timeMs, get().duration || Infinity)) }),
  setDuration: (durationMs) => set({ duration: Math.max(0, durationMs) }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setPlaybackRate: (rate) => set({ playbackRate: rate }),
  setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)), isMuted: volume === 0 }),
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),

  stepFrames: (frames, fps = 25) => {
    const frameDurationMs = 1000 / fps;
    const newTime = get().currentTime + frames * frameDurationMs;
    get().setCurrentTime(newTime);
  },

  seekRelative: (offsetMs) => {
    const newTime = get().currentTime + offsetMs;
    get().setCurrentTime(newTime);
  },
}));
