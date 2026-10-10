import { describe, it, expect } from 'vitest';

/**
 * Pure function representing the magnetic snapping math implemented in Timeline.tsx
 */
function calculateMagneticSnap({
  mode,
  rawStart,
  rawEnd,
  cueDuration,
  snapPoints,
  thresholdMs,
  isMagnetEnabled,
  altKeyHeld,
}: {
  mode: 'move' | 'resize-start' | 'resize-end';
  rawStart: number;
  rawEnd: number;
  cueDuration: number;
  snapPoints: number[];
  thresholdMs: number;
  isMagnetEnabled: boolean;
  altKeyHeld: boolean;
}) {
  const isSnapping = isMagnetEnabled && !altKeyHeld;
  let activeSnapGuide: number | null = null;
  let resultStart = rawStart;
  let resultEnd = rawEnd;

  if (mode === 'move') {
    if (isSnapping) {
      let minDiff = Infinity;
      let snappedStart: number | null = null;
      let guide: number | null = null;

      for (const pt of snapPoints) {
        // Start edge snapping to pt
        const diffStart = Math.abs(rawStart - pt);
        if (diffStart <= thresholdMs && diffStart < minDiff) {
          minDiff = diffStart;
          snappedStart = pt;
          guide = pt;
        }

        // End edge snapping to pt
        const diffEnd = Math.abs(rawEnd - pt);
        if (diffEnd <= thresholdMs && diffEnd < minDiff) {
          minDiff = diffEnd;
          snappedStart = Math.max(0, pt - cueDuration);
          guide = pt;
        }
      }

      if (snappedStart !== null) {
        resultStart = snappedStart;
        resultEnd = resultStart + cueDuration;
        activeSnapGuide = guide;
      }
    }
  } else if (mode === 'resize-start') {
    if (isSnapping) {
      let minDiff = Infinity;
      let bestSnap: number | null = null;
      for (const pt of snapPoints) {
        const diff = Math.abs(rawStart - pt);
        if (diff <= thresholdMs && diff < minDiff) {
          minDiff = diff;
          bestSnap = pt;
        }
      }
      if (bestSnap !== null) {
        resultStart = bestSnap;
        activeSnapGuide = bestSnap;
      }
    }
  } else if (mode === 'resize-end') {
    if (isSnapping) {
      let minDiff = Infinity;
      let bestSnap: number | null = null;
      for (const pt of snapPoints) {
        const diff = Math.abs(rawEnd - pt);
        if (diff <= thresholdMs && diff < minDiff) {
          minDiff = diff;
          bestSnap = pt;
        }
      }
      if (bestSnap !== null) {
        resultEnd = bestSnap;
        activeSnapGuide = bestSnap;
      }
    }
  }

  return {
    startTime: resultStart,
    endTime: resultEnd,
    guideMs: activeSnapGuide,
  };
}

describe('Timeline Magnetic Snapping Algorithm (SYNC-05)', () => {
  const thresholdMs = 150;
  // Adjacent cue boundary at 3000ms, playhead at 6000ms
  const snapPoints = [3000, 6000];

  it('snaps start edge of dragged cue to adjacent boundary within threshold', () => {
    // Cue moved close to 3000ms (at 2950ms, diff=50ms <= 150ms)
    const result = calculateMagneticSnap({
      mode: 'move',
      rawStart: 2950,
      rawEnd: 4950,
      cueDuration: 2000,
      snapPoints,
      thresholdMs,
      isMagnetEnabled: true,
      altKeyHeld: false,
    });

    expect(result.startTime).toBe(3000);
    expect(result.endTime).toBe(5000);
    expect(result.guideMs).toBe(3000);
  });

  it('snaps end edge of dragged cue to adjacent boundary within threshold', () => {
    // Cue moved so its end edge is at 3050ms (diff=50ms <= 150ms)
    const result = calculateMagneticSnap({
      mode: 'move',
      rawStart: 1050,
      rawEnd: 3050,
      cueDuration: 2000,
      snapPoints,
      thresholdMs,
      isMagnetEnabled: true,
      altKeyHeld: false,
    });

    expect(result.endTime).toBe(3000);
    expect(result.startTime).toBe(1000);
    expect(result.guideMs).toBe(3000);
  });

  it('does not snap when distance exceeds threshold', () => {
    // Cue at 2700ms (diff=300ms > 150ms threshold)
    const result = calculateMagneticSnap({
      mode: 'move',
      rawStart: 2700,
      rawEnd: 4700,
      cueDuration: 2000,
      snapPoints,
      thresholdMs,
      isMagnetEnabled: true,
      altKeyHeld: false,
    });

    expect(result.startTime).toBe(2700);
    expect(result.endTime).toBe(4700);
    expect(result.guideMs).toBeNull();
  });

  it('bypasses snapping completely when Alt key is held', () => {
    const result = calculateMagneticSnap({
      mode: 'move',
      rawStart: 2980,
      rawEnd: 4980,
      cueDuration: 2000,
      snapPoints,
      thresholdMs,
      isMagnetEnabled: true,
      altKeyHeld: true, // Alt key pressed
    });

    expect(result.startTime).toBe(2980);
    expect(result.guideMs).toBeNull();
  });

  it('snaps start edge during resize-start mode', () => {
    const result = calculateMagneticSnap({
      mode: 'resize-start',
      rawStart: 3030,
      rawEnd: 5000,
      cueDuration: 1970,
      snapPoints,
      thresholdMs,
      isMagnetEnabled: true,
      altKeyHeld: false,
    });

    expect(result.startTime).toBe(3000);
    expect(result.guideMs).toBe(3000);
  });

  it('snaps end edge during resize-end mode', () => {
    const result = calculateMagneticSnap({
      mode: 'resize-end',
      rawStart: 4000,
      rawEnd: 5960, // Close to playhead at 6000ms
      cueDuration: 1960,
      snapPoints,
      thresholdMs,
      isMagnetEnabled: true,
      altKeyHeld: false,
    });

    expect(result.endTime).toBe(6000);
    expect(result.guideMs).toBe(6000);
  });
});
