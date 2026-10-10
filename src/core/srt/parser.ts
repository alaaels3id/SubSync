import { SubtitleCue } from '@/types/subtitles';
import { timecodeToMs } from './timecode';

/**
 * Robust SRT parser that supports UTF-8, Arabic text, CRLF/LF line breaks, and multiline subtitles.
 */
export function parseSrt(content: string): SubtitleCue[] {
  if (!content) return [];

  // Strip BOM if present
  const cleaned = content.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Split into raw subtitle blocks separated by blank lines
  const rawBlocks = cleaned.split(/\n\s*\n/);
  const cues: SubtitleCue[] = [];
  let sequentialIndex = 1;

  for (const block of rawBlocks) {
    const lines = block.trim().split('\n');
    if (lines.length < 2) continue;

    let timeLineIdx = -1;
    let match: RegExpMatchArray | null = null;

    // Look for the line containing the "-->" timestamp arrow
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const m = line.match(/^(\d{1,2}:\d{2}:\d{2}[,.]\d{1,3})\s*-->\s*(\d{1,2}:\d{2}:\d{2}[,.]\d{1,3})/);
      if (m) {
        timeLineIdx = i;
        match = m;
        break;
      }
    }

    if (timeLineIdx === -1 || !match) continue;

    const startMs = timecodeToMs(match[1]);
    const endMs = timecodeToMs(match[2]);

    // Subtitle text is everything after the timestamp line
    const textLines = lines.slice(timeLineIdx + 1);
    const text = textLines.join('\n').trim();

    cues.push({
      id: `cue-${Date.now()}-${sequentialIndex}-${Math.random().toString(36).slice(2, 7)}`,
      index: sequentialIndex,
      startTime: startMs,
      endTime: endMs,
      text: text,
    });

    sequentialIndex++;
  }

  return cues;
}
