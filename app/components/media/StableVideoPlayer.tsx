"use client";

import { useRef } from "react";

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
      video.play().catch(() => undefined);
    });
  };

  return (
    <video
      ref={videoRef}
      key={src}
      controls
      playsInline
      preload="auto"
      className={className}
      onWaiting={recoverPlayback}
      onStalled={recoverPlayback}
      onSuspend={recoverPlayback}
    >
      <source src={src} type={getVideoMimeType(src)} />
      <a href={src} target="_blank" rel="noreferrer">ვიდეოს გახსნა</a>
    </video>
  );
}

