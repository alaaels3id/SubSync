import { SubtitleCue } from '@/types/subtitles';
import { msToTimecode } from './timecode';

/**
 * Serializes subtitle cues into standard SRT format.
 * Cues are sorted by start time and numbered sequentially.
 */
export function serializeSrt(cues: SubtitleCue[]): string {
  if (!cues || cues.length === 0) return '';

  // Sort cues chronologically by startTime
  const sorted = [...cues].sort((a, b) => a.startTime - b.startTime);

  const blocks: string[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const cue = sorted[i];
    const index = i + 1;
    const startTimeStr = msToTimecode(cue.startTime);
    const endTimeStr = msToTimecode(cue.endTime);
    const text = cue.text.trim();

    blocks.push(`${index}\n${startTimeStr} --> ${endTimeStr}\n${text}`);
  }

  return blocks.join('\n\n') + '\n';
}
