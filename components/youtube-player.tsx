"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

// Official YouTube IFrame Player API (embedding is permitted by YouTube's ToS).
// https://developers.google.com/youtube/iframe_api_reference

interface YTPlayer {
  getCurrentTime(): number;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  setPlaybackRate(rate: number): void;
  playVideo(): void;
  destroy(): void;
}

declare global {
  interface Window {
    YT?: {
      Player: new (
        el: HTMLElement,
        opts: {
          videoId: string;
          playerVars?: Record<string, number | string>;
          events?: { onReady?: () => void; onStateChange?: (e: { data: number }) => void };
        },
      ) => YTPlayer;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<void> | null = null;
function loadApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve();
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(s);
  });
  return apiPromise;
}

export interface PlayerHandle {
  currentTime(): number;
  seek(seconds: number): void;
  setRate(rate: number): void;
}

interface Props {
  videoId: string;
  start?: number;
  rate?: number;
  /** Called every few seconds while playing, for resume support. */
  onProgress?: (seconds: number) => void;
}

export const YouTubePlayer = forwardRef<PlayerHandle, Props>(function YouTubePlayer(
  { videoId, start = 0, rate = 1, onProgress },
  ref,
) {
  const host = useRef<HTMLDivElement>(null);
  const player = useRef<YTPlayer | null>(null);
  const progressRef = useRef(onProgress);
  const rateRef = useRef(rate);

  useEffect(() => {
    progressRef.current = onProgress;
    rateRef.current = rate;
  });

  useImperativeHandle(ref, () => ({
    currentTime: () => player.current?.getCurrentTime() ?? 0,
    seek: (s) => {
      player.current?.seekTo(s, true);
      player.current?.playVideo();
    },
    setRate: (r) => player.current?.setPlaybackRate(r),
  }));

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | undefined;
    const mount = document.createElement("div");
    host.current?.appendChild(mount);

    loadApi().then(() => {
      if (cancelled || !window.YT) return;
      player.current = new window.YT.Player(mount, {
        videoId,
        playerVars: { start: Math.floor(start), rel: 0, modestbranding: 1, playsinline: 1 },
        events: {
          onReady: () => player.current?.setPlaybackRate(rateRef.current),
          onStateChange: (e) => {
            clearInterval(timer);
            if (e.data === 1) {
              timer = setInterval(() => {
                const t = player.current?.getCurrentTime();
                if (t !== undefined) progressRef.current?.(t);
              }, 5000);
            }
          },
        },
      });
    });

    return () => {
      cancelled = true;
      clearInterval(timer);
      player.current?.destroy();
      player.current = null;
      mount.remove();
    };
    // Re-create only when the video changes; `start` is the initial position.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  return (
    <div
      ref={host}
      className="aspect-video w-full overflow-hidden rounded-lg bg-black [&>div]:h-full [&>div]:w-full [&_iframe]:h-full [&_iframe]:w-full"
    />
  );
});
