import React, { useRef, useState, useEffect, useMemo } from 'react';
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
  Upload,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { useSubtitlesStore } from '@/stores/useSubtitlesStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { msToTimecode } from '@/core/srt';
import { extractYouTubeVideoId, fetchYouTubeMetadata, loadYouTubeIframeApi } from '@/core/utils/youtube';

interface VideoPlayerProps {
  onOpenVideoFile: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ onOpenVideoFile }) => {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const ytPlayerRef = useRef<any>(null);

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
  const { subtitlePreferences } = useSettingsStore();
  const { addNotification } = useNotificationStore();

  const [showUrlDialog, setShowUrlDialog] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [isYtReady, setIsYtReady] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Initialize YouTube Player when videoSource is of type 'youtube'
  useEffect(() => {
    if (videoSource?.type !== 'youtube' || !videoSource.youtubeId) {
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy?.();
        } catch (e) {
          console.warn('Error destroying YT player:', e);
        }
        ytPlayerRef.current = null;
        setIsYtReady(false);
      }
      return;
    }

    let isMounted = true;
    setPlaybackError(null);
    setIsYtReady(false);

    loadYouTubeIframeApi().then(() => {
      if (!isMounted) return;

      const container = document.getElementById('subsync-yt-player');
      if (!container || !(window as any).YT || !(window as any).YT.Player) return;

      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy?.();
        } catch {
          // ignore
        }
        ytPlayerRef.current = null;
      }

      try {
        const origin = window.location.origin.startsWith('http')
          ? window.location.origin
          : 'https://www.youtube.com';

        const player = new (window as any).YT.Player('subsync-yt-player', {
          videoId: videoSource.youtubeId,
          playerVars: {
            autoplay: 0,
            controls: 1,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
            origin,
          },
          events: {
            onReady: (event: any) => {
              if (!isMounted) return;
              setIsYtReady(true);
              const durSec = event.target.getDuration();
              if (durSec && durSec > 0) {
                setDuration(Math.floor(durSec * 1000));
              }
              try {
                event.target.setPlaybackRate?.(playbackRate);
                event.target.setVolume?.(isMuted ? 0 : Math.round(volume * 100));
              } catch {
                // ignore
              }
            },
            onStateChange: (event: any) => {
              if (!isMounted) return;
              const YTState = (window as any).YT?.PlayerState;
              if (event.data === (YTState?.PLAYING ?? 1)) {
                setIsPlaying(true);
              } else if (
                event.data === (YTState?.PAUSED ?? 2) ||
                event.data === (YTState?.ENDED ?? 0)
              ) {
                setIsPlaying(false);
              }
            },
            onError: (event: any) => {
              if (!isMounted) return;
              console.error('YouTube Player Error:', event.data);
              const errMsg = t('notifications.failedToLoadYoutube');
              setPlaybackError(errMsg);
              addNotification('error', t('notifications.errorTitle'), errMsg);
            },
          },
        });

        ytPlayerRef.current = player;
      } catch (err) {
        console.error('Failed to initialize YouTube Player:', err);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [videoSource?.type, videoSource?.youtubeId]);

  // YouTube polling time update during playback
  useEffect(() => {
    if (videoSource?.type !== 'youtube' || !isPlaying || !isYtReady) return;

    const interval = setInterval(() => {
      try {
        if (ytPlayerRef.current?.getCurrentTime) {
          const sec = ytPlayerRef.current.getCurrentTime();
          if (typeof sec === 'number' && !isNaN(sec)) {
            const timeMs = Math.floor(sec * 1000);
            if (Math.abs(currentTime - timeMs) > 30) {
              setCurrentTime(timeMs);
            }
          }
        }
      } catch {
        // ignore
      }
    }, 50);

    return () => clearInterval(interval);
  }, [videoSource?.type, isPlaying, isYtReady, currentTime, setCurrentTime]);

  // Sync isPlaying with videoRef or YouTube Player
  useEffect(() => {
    if (videoSource?.type === 'youtube') {
      if (!ytPlayerRef.current || !isYtReady) return;
      try {
        const playerState = ytPlayerRef.current.getPlayerState?.();
        const isCurrentlyPlaying = playerState === 1;
        if (isPlaying && !isCurrentlyPlaying) {
          ytPlayerRef.current.playVideo?.();
        } else if (!isPlaying && isCurrentlyPlaying) {
          ytPlayerRef.current.pauseVideo?.();
        }
      } catch (err) {
        console.warn('YT Play/Pause error:', err);
      }
      return;
    }

    if (!videoRef.current) return;
    if (isPlaying && videoRef.current.paused) {
      videoRef.current.play().catch((err: unknown) => {
        console.warn('Playback error:', err);
        setIsPlaying(false);
      });
    } else if (!isPlaying && !videoRef.current.paused) {
      videoRef.current.pause();
    }
  }, [isPlaying, isYtReady, videoSource?.type, setIsPlaying]);

  // Sync external seek (e.g. from timeline or table) to videoRef or YouTube Player
  useEffect(() => {
    if (videoSource?.type === 'youtube') {
      if (!ytPlayerRef.current || !isYtReady || !ytPlayerRef.current.getCurrentTime) return;
      try {
        const ytCurrentMs = Math.floor(ytPlayerRef.current.getCurrentTime() * 1000);
        if (Math.abs(ytCurrentMs - currentTime) > 300) {
          ytPlayerRef.current.seekTo?.(currentTime / 1000, true);
        }
      } catch {
        // ignore
      }
      return;
    }

    if (!videoRef.current) return;
    const videoCurrentMs = Math.floor(videoRef.current.currentTime * 1000);
    if (Math.abs(videoCurrentMs - currentTime) > 250) {
      videoRef.current.currentTime = currentTime / 1000;
    }
  }, [currentTime, isYtReady, videoSource?.type]);

  // Sync playbackRate with videoRef or YouTube
  useEffect(() => {
    if (videoSource?.type === 'youtube') {
      try {
        ytPlayerRef.current?.setPlaybackRate?.(playbackRate);
      } catch {
        // ignore
      }
      return;
    }

    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate, videoSource?.type]);

  // Sync volume with videoRef or YouTube
  useEffect(() => {
    if (videoSource?.type === 'youtube') {
      try {
        if (isMuted) {
          ytPlayerRef.current?.mute?.();
        } else {
          ytPlayerRef.current?.unMute?.();
          ytPlayerRef.current?.setVolume?.(Math.round(volume * 100));
        }
      } catch {
        // ignore
      }
      return;
    }

    if (videoRef.current) {
      videoRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted, videoSource?.type]);

  // Time updates from native HTML5 video element
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const timeMs = Math.floor(videoRef.current.currentTime * 1000);
    if (Math.abs(currentTime - timeMs) > 30) {
      setCurrentTime(timeMs);
    }
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    const durMs = Math.floor(videoRef.current.duration * 1000);
    setDuration(durMs);
    setPlaybackError(null);
  };

  const handleVideoError = () => {
    const errorMsg = t('notifications.failedToPlayVideo');
    setPlaybackError(errorMsg);
    addNotification('error', t('notifications.errorTitle'), errorMsg);
  };

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
      setPlaybackError(null);
      setVideoSource({
        type: 'local',
        url,
        name: file.name,
        size: file.size,
      });
    }
  };

  const handleDirectUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawUrl = urlInput.trim();
    if (!rawUrl) return;

    setIsLoadingUrl(true);
    setPlaybackError(null);

    try {
      const ytId = extractYouTubeVideoId(rawUrl);
      if (ytId) {
        // YouTube URL detected
        const meta = await fetchYouTubeMetadata(ytId);
        setVideoSource({
          type: 'youtube',
          url: rawUrl,
          youtubeId: ytId,
          name: meta.title,
          thumbnail: meta.thumbnail,
        });
        addNotification('success', t('notifications.youtubeLoaded'), meta.title);
      } else {
        // Direct media stream URL
        const parsedName = rawUrl.split('/').pop()?.split('?')[0] || 'Remote Stream';
        setVideoSource({
          type: 'url',
          url: rawUrl,
          name: parsedName,
        });
        addNotification('info', t('notifications.videoLoaded'), parsedName);
      }
      setShowUrlDialog(false);
      setUrlInput('');
    } catch (err) {
      console.error('Error submitting URL:', err);
      addNotification('error', t('notifications.errorTitle'), t('notifications.failedToPlayVideo'));
    } finally {
      setIsLoadingUrl(false);
    }
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
      className={`relative flex flex-col h-full bg-slate-950 rounded-xl overflow-hidden border transition-all ${
        isDraggingOver ? 'border-brand-apricot ring-2 ring-brand-apricot/40' : 'border-slate-800'
      }`}
    >
      {/* Video Canvas / Display Area */}
      <div className="relative flex-1 min-h-0 flex items-center justify-center bg-black overflow-hidden group">
        {videoSource ? (
          videoSource.type === 'youtube' ? (
            <div className="w-full h-full relative flex items-center justify-center bg-black">
              <div id="subsync-yt-player" className="w-full h-full" />
              {playbackError && (
                <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-6 text-center text-rose-400 z-10">
                  <AlertCircle className="w-10 h-10 mb-3 text-rose-500" />
                  <p className="text-sm font-semibold mb-2">{playbackError}</p>
                  <p className="text-xs text-slate-400 max-w-sm">
                    {t('notifications.failedToLoadYoutube')}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-full relative flex items-center justify-center">
              <video
                ref={videoRef}
                src={videoSource.url}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onError={handleVideoError}
                onClick={togglePlay}
                className="w-full h-full object-contain cursor-pointer"
                playsInline
              />
              {playbackError && (
                <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-6 text-center text-rose-400 z-10">
                  <AlertCircle className="w-10 h-10 mb-3 text-rose-500" />
                  <p className="text-sm font-semibold mb-2">{playbackError}</p>
                  <p className="text-xs text-slate-400 max-w-sm">
                    {t('player.noVideoDesc')}
                  </p>
                </div>
              )}
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
            <div className="w-16 h-16 rounded-2xl bg-brand-indigo/60 border border-brand-indigo-600/40 flex items-center justify-center mb-4 text-brand-apricot shadow-inner">
              <Video className="w-8 h-8" />
            </div>
            <p className="text-base font-semibold text-slate-200 mb-1">
              {t('player.noVideoTitle')}
            </p>
            <p className="text-xs text-slate-400 max-w-sm mb-4">
              {t('player.noVideoDesc')}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={onOpenVideoFile}
                className="flex items-center gap-2 px-4 py-2 bg-brand-teal hover:bg-brand-teal-600 text-white text-xs font-medium rounded-lg shadow-sm transition"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{t('player.chooseLocal')}</span>
              </button>
              <button
                onClick={() => setShowUrlDialog(true)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition"
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>{t('player.directUrl')}</span>
              </button>
            </div>
          </div>
        )}

        {/* Live Subtitle Overlay */}
        {activeCue && (
          <div
            className={`absolute left-0 right-0 px-6 flex justify-center pointer-events-none transition-all duration-100 z-20 ${
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

        {/* Large Play Indicator on Hover when Paused for Local/Direct Media */}
        {videoSource && !isPlaying && videoSource.type !== 'youtube' && !playbackError && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/20 transition z-10"
          >
            <div className="w-14 h-14 rounded-full bg-brand-teal/90 text-white flex items-center justify-center shadow-lg hover:scale-110 transition">
              <Play className="w-7 h-7 ml-0.5" />
            </div>
          </button>
        )}
      </div>

      {/* Direct URL or YouTube Input Modal */}
      {showUrlDialog && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-30 flex items-center justify-center p-4">
          <form
            onSubmit={handleDirectUrlSubmit}
            className="w-full max-w-md bg-brand-indigo-900 border border-brand-indigo-700 rounded-xl p-5 shadow-2xl text-slate-100"
          >
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-brand-apricot" />
              <span>{t('player.directUrlTitle')}</span>
            </h4>
            <p className="text-xs text-slate-400 mb-4">
              {t('player.directUrlDesc')}
            </p>
            <input
              type="url"
              required
              disabled={isLoadingUrl}
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder={t('player.directUrlPlaceholder')}
              className="w-full bg-slate-950 border border-brand-indigo-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-teal mb-4 disabled:opacity-50"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={isLoadingUrl}
                onClick={() => setShowUrlDialog(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition disabled:opacity-50"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={isLoadingUrl}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs bg-brand-teal hover:bg-brand-teal-600 text-white font-medium transition disabled:opacity-50"
              >
                {isLoadingUrl && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isLoadingUrl ? t('player.loadingVideo') : t('player.loadVideo')}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Video Control Bar */}
      <div className="h-12 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between text-slate-800 dark:text-slate-200 select-none transition-colors">
        {/* Playback Controls & Frame Stepping */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={togglePlay}
            disabled={!videoSource}
            title={isPlaying ? t('player.pause') : t('player.play')}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white disabled:opacity-40 transition"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>

          {/* Seek -5s / +5s */}
          <button
            onClick={() => seekRelative(-5000)}
            disabled={!videoSource}
            title={t('player.seekBack')}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-40 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => seekRelative(5000)}
            disabled={!videoSource}
            title={t('player.seekForward')}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-40 transition"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          {/* Frame Stepping (SYNC-07) */}
          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

          <button
            onClick={() => stepFrames(-1)}
            disabled={!videoSource}
            title={t('player.frameStepBackward')}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-40 transition text-xs flex items-center"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => stepFrames(1)}
            disabled={!videoSource}
            title={t('player.frameStepForward')}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-40 transition text-xs flex items-center"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          {/* Time Display */}
          <div className="flex items-center gap-1.5 font-mono text-xs text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 ml-1 shadow-sm">
            <span className="text-brand-teal dark:text-brand-apricot font-bold">{msToTimecode(currentTime)}</span>
            <span className="text-slate-400 dark:text-slate-600">/</span>
            <span className="text-slate-500 dark:text-slate-400">{duration > 0 ? msToTimecode(duration) : '00:00:00,000'}</span>
          </div>
        </div>

        {/* Right Tools: Speed, Volume, Fullscreen */}
        <div className="flex items-center gap-2">
          {/* Playback Rate */}
          <select
            value={playbackRate}
            onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-300 rounded px-1.5 py-0.5 focus:outline-none focus:border-brand-teal shadow-sm"
            title={t('player.speed')}
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
              className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
              title={isMuted ? t('player.unmute') : t('player.mute')}
            >
              {isMuted || volume === 0 ? <VolumeX className="w-3.5 h-3.5 text-rose-500" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-16 h-1 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-teal"
            />
          </div>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
            title={t('player.fullscreen')}
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
