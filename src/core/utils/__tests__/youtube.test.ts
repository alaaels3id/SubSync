import { describe, it, expect } from 'vitest';
import { extractYouTubeVideoId } from '../youtube';

describe('YouTube Utility - extractYouTubeVideoId', () => {
  it('extracts ID from standard watch URL', () => {
    expect(extractYouTubeVideoId('https://www.youtube.com/watch?v=W7vcrIwE14U')).toBe('W7vcrIwE14U');
  });

  it('extracts ID with extra parameters', () => {
    expect(extractYouTubeVideoId('https://www.youtube.com/watch?v=W7vcrIwE14U&t=45s&feature=shared')).toBe('W7vcrIwE14U');
  });

  it('extracts ID from youtu.be short URL', () => {
    expect(extractYouTubeVideoId('https://youtu.be/W7vcrIwE14U')).toBe('W7vcrIwE14U');
    expect(extractYouTubeVideoId('https://youtu.be/W7vcrIwE14U?t=10')).toBe('W7vcrIwE14U');
  });

  it('extracts ID from shorts URL', () => {
    expect(extractYouTubeVideoId('https://www.youtube.com/shorts/W7vcrIwE14U')).toBe('W7vcrIwE14U');
  });

  it('extracts ID from embed URL', () => {
    expect(extractYouTubeVideoId('https://www.youtube.com/embed/W7vcrIwE14U')).toBe('W7vcrIwE14U');
  });

  it('accepts raw 11-character video ID', () => {
    expect(extractYouTubeVideoId('W7vcrIwE14U')).toBe('W7vcrIwE14U');
  });

  it('returns null for invalid or non-YouTube URLs', () => {
    expect(extractYouTubeVideoId('')).toBeNull();
    expect(extractYouTubeVideoId('https://example.com/video.mp4')).toBeNull();
    expect(extractYouTubeVideoId('https://vimeo.com/123456')).toBeNull();
  });
});
