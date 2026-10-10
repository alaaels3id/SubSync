export interface SubtitleCue {
  id: string;
  index: number;
  startTime: number; // in milliseconds
  endTime: number;   // in milliseconds
  text: string;
}

export interface SubtitleTrack {
  id: string;
  language: string; // 'ar', 'en', etc.
  label: string;    // 'العربية', 'English', etc.
  cues: SubtitleCue[];
  filePath?: string;
  isModified?: boolean;
}

export interface ValidationError {
  cueId: string;
  cueIndex: number;
  type: 'negative_time' | 'invalid_duration' | 'overlap' | 'empty_text' | 'exceeds_duration';
  message: string;
  conflictingCueIndex?: number;
}
