import { SubtitleCue, ValidationError } from '@/types/subtitles';

/**
 * Validates an array of subtitle cues and returns any syntax or timing issues.
 */
export function validateCues(cues: SubtitleCue[], videoDurationMs?: number): ValidationError[] {
  const errors: ValidationError[] = [];

  // Sort copy to check for chronological overlaps
  const sorted = [...cues].sort((a, b) => a.startTime - b.startTime);

  for (let i = 0; i < sorted.length; i++) {
    const cue = sorted[i];

    // Check negative time
    if (cue.startTime < 0 || cue.endTime < 0) {
      errors.push({
        cueId: cue.id,
        cueIndex: cue.index,
        type: 'negative_time',
        message: 'لا يمكن أن يكون وقت البداية أو النهاية سالباً (Cannot have negative timestamps)',
      });
    }

    // Check end time > start time
    if (cue.endTime <= cue.startTime) {
      errors.push({
        cueId: cue.id,
        cueIndex: cue.index,
        type: 'invalid_duration',
        message: 'يجب أن يكون وقت النهاية بعد وقت البداية (End time must be greater than start time)',
      });
    }

    // Check empty text
    if (!cue.text || cue.text.trim().length === 0) {
      errors.push({
        cueId: cue.id,
        cueIndex: cue.index,
        type: 'empty_text',
        message: 'نص الترجمة فارغ (Subtitle text is empty)',
      });
    }

    // Check exceeds video duration
    if (videoDurationMs && videoDurationMs > 0 && cue.endTime > videoDurationMs) {
      errors.push({
        cueId: cue.id,
        cueIndex: cue.index,
        type: 'exceeds_duration',
        message: 'يتجاوز وقت الترجمة مدة الفيديو الكلية (Cue exceeds video duration)',
      });
    }

    // Check overlaps with previous cue
    if (i > 0) {
      const prevCue = sorted[i - 1];
      if (cue.startTime < prevCue.endTime) {
        errors.push({
          cueId: cue.id,
          cueIndex: cue.index,
          type: 'overlap',
          message: `تداخل زمني مع السطر رقم ${prevCue.index} (Overlap with cue #${prevCue.index})`,
          conflictingCueIndex: prevCue.index,
        });
      }
    }
  }

  return errors;
}
