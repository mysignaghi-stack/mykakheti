"use client";

import { useState } from "react";

type NativeVideoShareButtonProps = {
  videoUrl: string;
  fallbackUrl: string;
  title: string;
  className?: string;
};

const getVideoType = (url: string, fallback = "video/mp4") => {
  if (/\.webm(\?|#|$)/i.test(url)) return "video/webm";
  if (/\.ogg(\?|#|$)/i.test(url)) return "video/ogg";
  if (/\.mov(\?|#|$)/i.test(url)) return "video/quicktime";
  return fallback || "video/mp4";
};

const getVideoName = (url: string) => {
  try {
    const pathname = new URL(url).pathname;
    const rawName = pathname.split("/").filter(Boolean).pop() || "mykakheti-video.mp4";
    return rawName.includes(".") ? rawName : `${rawName}.mp4`;
  } catch {
    return "mykakheti-video.mp4";
  }
};

export default function NativeVideoShareButton({
  videoUrl,
  fallbackUrl,
  title,
  className,
}: NativeVideoShareButtonProps) {
  const [sharing, setSharing] = useState(false);

  const shareVideoFile = async () => {
    if (!videoUrl || sharing) return;
    setSharing(true);

    try {
      const response = await fetch(videoUrl, { mode: "cors" });
      if (!response.ok) throw new Error("video fetch failed");
      const blob = await response.blob();
      const file = new File([blob], getVideoName(videoUrl), {
        type: blob.type || getVideoType(videoUrl),
      });
      const sharePayload = {
        title,
        text: title,
        files: [file],
      };

      if (navigator.canShare?.(sharePayload) && navigator.share) {
        await navigator.share(sharePayload);
        return;
      }

      if (navigator.share) {
        await navigator.share({ title, url: fallbackUrl });
        return;
      }

      await navigator.clipboard.writeText(fallbackUrl);
      alert("ბმული დაკოპირდა.");
    } catch {
      try {
        if (navigator.share) {
          await navigator.share({ title, url: fallbackUrl });
          return;
        }
        await navigator.clipboard.writeText(fallbackUrl);
        alert("ვიდეოს ფაილად გაზიარება ამ მოწყობილობაზე ვერ მოხერხდა. ბმული დაკოპირდა.");
      } catch {
        alert("გაზიარება ვერ მოხერხდა.");
      }
    } finally {
      setSharing(false);
    }
  };

  return (
    <button type="button" onClick={shareVideoFile} disabled={sharing} className={className}>
      {sharing ? "მზადდება..." : "ვიდეოს გაზიარება"}
    </button>
  );
}
