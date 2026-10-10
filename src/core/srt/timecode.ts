/**
 * Converts milliseconds to standard SRT timecode (HH:MM:SS,mmm)
 */
export function msToTimecode(ms: number): string {
  if (isNaN(ms) || ms < 0) {
    ms = 0;
  }

  const totalSeconds = Math.floor(ms / 1000);
  const milliseconds = Math.floor(ms % 1000);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number, z = 2) => String(n).padStart(z, '0');

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)},${pad(milliseconds, 3)}`;
}

/**
 * Converts SRT timecode (HH:MM:SS,mmm or HH:MM:SS.mmm) to milliseconds
 */
export function timecodeToMs(timecode: string): number {
  if (!timecode) return 0;
  const match = timecode.trim().match(/^(\d{1,2}):(\d{2}):(\d{2})[,.](\d{1,3})$/);
  if (!match) return 0;

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const seconds = parseInt(match[3], 10);
  const millisStr = match[4].padEnd(3, '0');
  const millis = parseInt(millisStr, 10);

  return hours * 3600000 + minutes * 60000 + seconds * 1000 + millis;
}

/**
 * Format milliseconds for compact display (MM:SS or HH:MM:SS)
 */
export function formatDisplayTime(ms: number): string {
  if (isNaN(ms) || ms < 0) ms = 0;
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => String(n).padStart(2, '0');

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}
