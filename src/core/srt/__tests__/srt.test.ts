import { describe, it, expect } from 'vitest';
import { msToTimecode, timecodeToMs, parseSrt, serializeSrt, validateCues } from '../index';
import { SubtitleCue } from '@/types/subtitles';

describe('Subtitle Engine - Timecodes', () => {
  it('converts ms to standard SRT timecode with leading zeros', () => {
    expect(msToTimecode(0)).toBe('00:00:00,000');
    expect(msToTimecode(1500)).toBe('00:00:01,500');
    expect(msToTimecode(65432)).toBe('00:01:05,432');
    expect(msToTimecode(3661005)).toBe('01:01:01,005');
  });

  it('converts SRT timecode to milliseconds', () => {
    expect(timecodeToMs('00:00:01,500')).toBe(1500);
    expect(timecodeToMs('00:01:05,432')).toBe(65432);
    expect(timecodeToMs('01:01:01,005')).toBe(3661005);
  });
});

describe('Subtitle Engine - SRT Parser & Serializer', () => {
  const sampleSrt = `1
00:00:01,500 --> 00:00:04,000
مرحبًا بك في SubSync Studio.

2
00:00:04,500 --> 00:00:07,000
ابدأ بمزامنة الترجمة مع الفيديو.
`;

  it('correctly parses Arabic SRT with timestamps', () => {
    const cues = parseSrt(sampleSrt);
    expect(cues.length).toBe(2);
    expect(cues[0].startTime).toBe(1500);
    expect(cues[0].endTime).toBe(4000);
    expect(cues[0].text).toBe('مرحبًا بك في SubSync Studio.');

    expect(cues[1].startTime).toBe(4500);
    expect(cues[1].endTime).toBe(7000);
    expect(cues[1].text).toBe('ابدأ بمزامنة الترجمة مع الفيديو.');
  });

  it('serializes cues into valid SRT format with sequential numbering', () => {
    const cues: SubtitleCue[] = [
      { id: '1', index: 99, startTime: 1500, endTime: 4000, text: 'سطر أول' },
      { id: '2', index: 12, startTime: 4500, endTime: 7000, text: 'سطر ثانٍ' },
    ];

    const serialized = serializeSrt(cues);
    expect(serialized).toContain('1\n00:00:01,500 --> 00:00:04,000\nسطر أول');
    expect(serialized).toContain('2\n00:00:04,500 --> 00:00:07,000\nسطر ثانٍ');
  });
});

describe('Subtitle Engine - Validator', () => {
  it('detects timing overlaps between cues', () => {
    const overlappingCues: SubtitleCue[] = [
      { id: '1', index: 1, startTime: 1000, endTime: 4000, text: 'مقطع 1' },
      { id: '2', index: 2, startTime: 3500, endTime: 6000, text: 'مقطع 2' }, // starts before 1 ends
    ];

    const errors = validateCues(overlappingCues);
    expect(errors.some((e) => e.type === 'overlap')).toBe(true);
  });

  it('detects negative timestamps and invalid durations', () => {
    const invalidCues: SubtitleCue[] = [
      { id: '1', index: 1, startTime: 5000, endTime: 2000, text: 'خطأ نهاية' },
      { id: '2', index: 2, startTime: 6000, endTime: 8000, text: '' }, // empty text
    ];

    const errors = validateCues(invalidCues);
    expect(errors.some((e) => e.type === 'invalid_duration')).toBe(true);
    expect(errors.some((e) => e.type === 'empty_text')).toBe(true);
  });
});
