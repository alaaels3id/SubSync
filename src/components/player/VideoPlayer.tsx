import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCcw,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Video,
  Link as LinkIcon,
  Upload
} from 'lucide-react';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { useSubtitlesStore } from '@/stores/useSubtitlesStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { msToTimecode } from '@/core/srt';

interface VideoPlayerProps {
  onOpenVideoFile: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ onOpenVideoFile }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    videoSource,
    currentTime,
    duration,
    isPlaying,
    playbackRate,
    volume,
    isMuted,
    setCurrentTime,
    setDuration,
    setIsPlaying,
    togglePlay,
    setPlaybackRate,
    setVolume,
    toggleMute,
    stepFrames,
    seekRelative,
    setVideoSource,
  } = usePlayerStore();

  const { tracks, activeTrackId } = useSubtitlesStore();
  const { subtitlePreferences, language } = useSettingsStore();

  const [showUrlDialog, setShowUrlDialog] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Sync isPlaying with videoRef
  useEffect(() => {
    if (!videoRef.current) return;
    if (isPlaying && videoRef.current.paused) {
      videoRef.current.play().catch((err) => {
        console.warn('Playback error:', err);
        setIsPlaying(false);
      });
    } else if (!isPlaying && !videoRef.current.paused) {
      videoRef.current.pause();
    }
  }, [isPlaying, setIsPlaying]);

  // Sync playbackRate with videoRef
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // Sync volume with videoRef
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Time updates from video element
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const timeMs = Math.floor(videoRef.current.currentTime * 1000);
    // Only update if difference > 30ms to prevent jitter
    if (Math.abs(currentTime - timeMs) > 30) {
      setCurrentTime(timeMs);
    }
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    const durMs = Math.floor(videoRef.current.duration * 1000);
    setDuration(durMs);
  };

  // Sync external seek (e.g. from timeline or table) to videoRef
  useEffect(() => {
    if (!videoRef.current) return;
    const videoCurrentMs = Math.floor(videoRef.current.currentTime * 1000);
    if (Math.abs(videoCurrentMs - currentTime) > 250) {
      videoRef.current.currentTime = currentTime / 1000;
    }
  }, [currentTime]);

  // Find currently active subtitle cue for live overlay
  const activeCue = useMemo(() => {
    const activeTrack = tracks.find((t) => t.id === activeTrackId);
    if (!activeTrack) return null;
    return activeTrack.cues.find((cue) => currentTime >= cue.startTime && currentTime <= cue.endTime);
  }, [tracks, activeTrackId, currentTime]);

  // Handle Drag & Drop video file
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const url = URL.createObjectURL(file);
      setVideoSource({
        type: 'local',
        url,
        name: file.name,
        size: file.size,
      });
    }
  };

  const handleDirectUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    setVideoSource({
      type: 'url',
      url: urlInput.trim(),
      name: urlInput.trim().split('/').pop() || 'Remote Stream',
    });
    setShowUrlDialog(false);
    setUrlInput('');
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
  };

  return (
    <div
      ref={containerRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative flex flex-col bg-slate-950 rounded-xl overflow-hidden border transition-all ${
        isDraggingOver ? 'border-brand-apricot ring-2 ring-brand-apricot/40' : 'border-slate-800'
      }`}
    >
      {/* Video Canvas / Display Area */}
      <div className="relative flex-1 min-h-[260px] max-h-[440px] flex items-center justify-center bg-black overflow-hidden group">
        {videoSource ? (
          <video
            ref={videoRef}
            src={videoSource.url}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onClick={togglePlay}
            className="w-full h-full object-contain cursor-pointer"
            playsInline
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
            <div className="w-16 h-16 rounded-2xl bg-brand-indigo/60 border border-brand-indigo-600/40 flex items-center justify-center mb-4 text-brand-apricot shadow-inner">
              <Video className="w-8 h-8" />
            </div>
            <p className="text-base font-semibold text-slate-200 mb-1">
              {language === 'ar' ? 'لم يتم تحميل أي فيديو' : 'No Video Loaded'}
            </p>
            <p className="text-xs text-slate-400 max-w-sm mb-4">
              {language === 'ar'
                ? 'اسحب وأفلت ملف فيديو هنا، أو اختر ملفاً من جهازك أو استخدم رابطاً مباشراً.'
                : 'Drag and drop a video file here, or select from your computer or stream URL.'}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={onOpenVideoFile}
                className="flex items-center gap-2 px-4 py-2 bg-brand-teal hover:bg-brand-teal-600 text-white text-xs font-medium rounded-lg shadow-sm transition"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'اختيار ملف محلي' : 'Choose Local File'}</span>
              </button>
              <button
                onClick={() => setShowUrlDialog(true)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition"
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'رابط وسائط مباشر' : 'Direct Media URL'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Live Subtitle Overlay */}
        {activeCue && (
          <div
            className={`absolute left-0 right-0 px-6 flex justify-center pointer-events-none transition-all duration-100 ${
              subtitlePreferences.position === 'top' ? 'top-6' : 'bottom-12'
            }`}
          >
            <div
              style={{
                fontSize: `${subtitlePreferences.fontSize}px`,
                color: subtitlePreferences.textColor,
                backgroundColor: subtitlePreferences.backgroundColor,
                opacity: 0.95,
                fontFamily: subtitlePreferences.fontFamily,
                textShadow: subtitlePreferences.textShadow ? '0 2px 4px rgba(0,0,0,0.8)' : 'none',
              }}
              className="px-4 py-1.5 rounded-lg max-w-[85%] text-center whitespace-pre-wrap leading-relaxed shadow-lg backdrop-blur-[2px]"
            >
              {activeCue.text}
            </div>
          </div>
        )}

        {/* Large Play Indicator on Hover when Paused */}
        {videoSource && !isPlaying && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/20 transition"
          >
            <div className="w-14 h-14 rounded-full bg-brand-teal/90 text-white flex items-center justify-center shadow-lg hover:scale-110 transition">
              <Play className="w-7 h-7 ml-0.5" />
            </div>
          </button>
        )}
      </div>

      {/* Direct URL Input Modal */}
      {showUrlDialog && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-20 flex items-center justify-center p-4">
          <form
            onSubmit={handleDirectUrlSubmit}
            className="w-full max-w-md bg-brand-indigo-900 border border-brand-indigo-700 rounded-xl p-5 shadow-2xl text-slate-100"
          >
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-brand-apricot" />
              <span>{language === 'ar' ? 'تشغيل من رابط وسائط مباشر' : 'Play from Direct Media URL'}</span>
            </h4>
            <p className="text-xs text-slate-400 mb-4">
              {language === 'ar'
                ? 'أدخل رابطاً مباشراً لملف فيديو (MP4, WebM, HLS). لا تدعم صفحات YouTube أو مواقع البث المحمية.'
                : 'Enter a direct playable media link (MP4, WebM). Webpages & DRM streams are not supported.'}
            </p>
            <input
              type="url"
              required
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/video.mp4"
              className="w-full bg-slate-950 border border-brand-indigo-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-teal mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowUrlDialog(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg text-xs bg-brand-teal hover:bg-brand-teal-600 text-white font-medium transition"
              >
                {language === 'ar' ? 'تشغيل' : 'Load Video'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Video Control Bar */}
      <div className="h-12 bg-slate-900 border-t border-slate-800 px-4 flex items-center justify-between text-slate-200 select-none">
        {/* Playback Controls & Frame Stepping */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={togglePlay}
            disabled={!videoSource}
            title={isPlaying ? (language === 'ar' ? 'إيقاف مؤقت (Space)' : 'Pause (Space)') : (language === 'ar' ? 'تشغيل (Space)' : 'Play (Space)')}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white disabled:opacity-40 transition"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>

          {/* Seek -5s / +5s */}
          <button
            onClick={() => seekRelative(-5000)}
            disabled={!videoSource}
            title={language === 'ar' ? 'تأخير 5 ثوانٍ (←)' : 'Seek -5s (←)'}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white disabled:opacity-40 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => seekRelative(5000)}
            disabled={!videoSource}
            title={language === 'ar' ? 'تقديم 5 ثوانٍ (→)' : 'Seek +5s (→)'}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white disabled:opacity-40 transition"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          {/* Frame Stepping (SYNC-07) */}
          <div className="h-4 w-px bg-slate-800 mx-1" />

          <button
            onClick={() => stepFrames(-1)}
            disabled={!videoSource}
            title={language === 'ar' ? 'إطار للخلف (Frame Step Backward)' : 'Frame -1'}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white disabled:opacity-40 transition text-xs flex items-center"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => stepFrames(1)}
            disabled={!videoSource}
            title={language === 'ar' ? 'إطار للأمام (Frame Step Forward)' : 'Frame +1'}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white disabled:opacity-40 transition text-xs flex items-center"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          {/* Time Display */}
          <div className="flex items-center gap-1.5 font-mono text-xs text-slate-300 px-2 py-0.5 rounded bg-slate-950/60 border border-slate-800 ml-1">
            <span className="text-brand-apricot">{msToTimecode(currentTime)}</span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-400">{duration > 0 ? msToTimecode(duration) : '00:00:00,000'}</span>
          </div>
        </div>

        {/* Right Tools: Speed, Volume, Fullscreen */}
        <div className="flex items-center gap-2">
          {/* Playback Rate */}
          <select
            value={playbackRate}
            onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
            className="bg-slate-800 border border-slate-700 text-[11px] text-slate-300 rounded px-1.5 py-0.5 focus:outline-none focus:border-brand-teal"
            title={language === 'ar' ? 'سرعة التشغيل' : 'Playback Speed'}
          >
            <option value="0.5">0.5x</option>
            <option value="0.75">0.75x</option>
            <option value="1.0">1.0x</option>
            <option value="1.25">1.25x</option>
            <option value="1.5">1.5x</option>
            <option value="2.0">2.0x</option>
          </select>

          {/* Volume */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleMute}
              className="p-1 text-slate-400 hover:text-white transition"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-teal"
            />
          </div>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
            title={language === 'ar' ? 'ملء الشاشة' : 'Fullscreen'}
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
