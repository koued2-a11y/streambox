"use client";

import { useEffect, useRef, useState } from "react";

interface VideoPlayerProps {
  src: string;
  poster?: string;
}

function buildUrl(path?: string) {
  if (!path) return undefined;
  if (path.startsWith("http")) return path;
  return `${process.env.NEXT_PUBLIC_API_URL?.replace("/api", "")}${path}`;
}

export default function VideoPlayer({ src, poster }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);

  const srcUrl = buildUrl(src);
  const posterUrl = buildUrl(poster);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onLoaded = () => setDuration(video.duration || 0);
    const onTime = () => setCurrentTime(video.currentTime || 0);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);

    video.addEventListener("loadedmetadata", onLoaded);
    video.addEventListener("timeupdate", onTime);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);

    return () => {
      video.removeEventListener("loadedmetadata", onLoaded);
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
    };
  }, [srcUrl]);

  const togglePlay = async () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) await v.play(); else v.pause();
  };

  const seek = (time: number) => {
    const v = videoRef.current; if (!v) return; v.currentTime = Math.max(0, Math.min(time, duration));
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    seek(pct * duration);
  };

  const toggleMute = () => {
    const v = videoRef.current; if (!v) return; v.muted = !v.muted; setMuted(v.muted);
  };

  const handleVolume = (val: number) => {
    const v = videoRef.current; if (!v) return; v.volume = Math.max(0, Math.min(1, val)); setVolume(v.volume); setMuted(v.volume === 0);
  };

  const toggleFullscreen = async () => {
    const el = containerRef.current;
    if (!el) return;
    // @ts-ignore
    if (!document.fullscreenElement) await el.requestFullscreen?.(); else await document.exitFullscreen?.();
  };

  // Picture-in-Picture
  const enterPip = async () => {
    const v = videoRef.current;
    if (!v) return;
    // @ts-ignore
    if (document.pictureInPictureElement) {
      // @ts-ignore
      await document.exitPictureInPicture();
    } else if ((v as any).requestPictureInPicture) {
      try { await (v as any).requestPictureInPicture(); } catch (e) { console.warn('PiP failed', e); }
    }
  };

  // Double click -> toggle fullscreen
  const handleDoubleClick = () => {
    toggleFullscreen();
  };

  // Subtitles: try to load a .vtt alongside the video URL
  const [subtitleUrl, setSubtitleUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    async function probeVtt() {
      if (!srcUrl) return;
      try {
        const candidate = srcUrl.endsWith('.mp4') || srcUrl.endsWith('.webm') ? srcUrl.replace(/\.(mp4|webm)$/, '.vtt') : `${srcUrl}.vtt`;
        const resp = await fetch(candidate, { method: 'HEAD' });
        if (resp.ok) setSubtitleUrl(candidate);
      } catch (e) {
        // ignore
      }
    }
    probeVtt();
  }, [srcUrl]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") { e.preventDefault(); togglePlay(); }
      if (e.key === "f") toggleFullscreen();
      if (e.key === "m") toggleMute();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [duration]);

  const progressPct = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div ref={containerRef} onDoubleClick={handleDoubleClick} className="player-container w-full bg-black rounded-lg overflow-hidden relative">
      <video
        ref={videoRef}
        className="w-full h-full bg-black"
        preload="metadata"
        poster={posterUrl}
        src={srcUrl}
        playsInline
      >
        Votre navigateur ne supporte pas la lecture vidéo.
        {subtitleUrl && (
          // @ts-ignore
          <track src={subtitleUrl} kind="subtitles" srcLang="fr" label="FR" default />
        )}
      </video>

      {!playing && (
        <button onClick={togglePlay} aria-label="Play" className="big-play absolute inset-0 m-auto w-28 h-28 rounded-full bg-black/60 flex items-center justify-center">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 3v18l15-9L5 3z" fill="#fff"/></svg>
        </button>
      )}

      <div className="controls absolute left-0 right-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent opacity-100">
        <div className="flex items-center gap-3">
          <button onClick={togglePlay} className="text-white">
            {playing ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="6" y="6" width="4" height="12" fill="white"/><rect x="14" y="6" width="4" height="12" fill="white"/></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M5 3v18l15-9L5 3z" fill="white"/></svg>
            )}
          </button>
          <div className="text-xs text-gray-200">{new Date(currentTime * 1000).toISOString().substr(11, 8)}</div>
          <div className="flex-1" onClick={handleProgressClick}>
            <div className="w-full h-2 bg-gray-600 rounded cursor-pointer">
              <div className="h-2 bg-primary rounded" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
          <div className="text-xs text-gray-200">{new Date(duration * 1000).toISOString().substr(11, 8)}</div>
          <div className="flex items-center gap-2 ml-3">
            <button onClick={toggleMute} className="text-white">{muted || volume === 0 ? '🔇' : '🔊'}</button>
            <input aria-label="Volume" type="range" min={0} max={1} step={0.01} value={volume} onChange={(e) => handleVolume(Number(e.target.value))} />
            <button onClick={enterPip} title="Picture-in-Picture" className="text-white">⧉</button>
            <button onClick={toggleFullscreen} className="text-white">⤢</button>
          </div>
        </div>
      </div>
    </div>
  );
}

