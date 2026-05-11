"use client";

import { useEffect, useRef } from "react";

const getVideoMimeType = (url: string) => {
  if (/\.webm(\?|#|$)/i.test(url)) return "video/webm";
  if (/\.ogg(\?|#|$)/i.test(url)) return "video/ogg";
  if (/\.mov(\?|#|$)/i.test(url)) return "video/quicktime";
  return "video/mp4";
};

type StableVideoPlayerProps = {
  src: string;
  className?: string;
};

export default function StableVideoPlayer({ src, className = "h-full w-full object-contain" }: StableVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastRecoveryRef = useRef(0);
  const playAttemptsRef = useRef(0);

  const requestPlay = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    video.play().catch(() => undefined);
  };

  useEffect(() => {
    playAttemptsRef.current = 0;
    const timers = [120, 500, 1200].map((delay) => window.setTimeout(requestPlay, delay));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [src]);

  const recoverPlayback = () => {
    const video = videoRef.current;
    if (!video || video.paused || video.readyState >= 3) return;

    const now = Date.now();
    if (now - lastRecoveryRef.current < 4000) return;
    lastRecoveryRef.current = now;

    const currentTime = video.currentTime;
    video.load();
    window.requestAnimationFrame(() => {
      try {
        video.currentTime = currentTime;
      } catch {
        // Some mobile browsers reject restoring time until metadata is loaded.
      }
      requestPlay();
    });
  };

  const handleReadyToPlay = () => {
    if (playAttemptsRef.current > 4) return;
    playAttemptsRef.current += 1;
    requestPlay();
  };

  return (
    <video
      ref={videoRef}
      key={src}
      controls
      autoPlay
      muted
      playsInline
      preload="auto"
      className={className}
      onLoadedData={handleReadyToPlay}
      onCanPlay={handleReadyToPlay}
      onWaiting={recoverPlayback}
      onStalled={recoverPlayback}
      onSuspend={recoverPlayback}
    >
      <source src={src} type={getVideoMimeType(src)} />
      <a href={src} target="_blank" rel="noreferrer">ვიდეოს გახსნა</a>
    </video>
  );
}
