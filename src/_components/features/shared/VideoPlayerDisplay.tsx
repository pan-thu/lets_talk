"use client";

import { useEffect, useRef } from "react";
import Plyr from "plyr";
import "plyr/dist/plyr.css";

interface VideoPlayerDisplayProps {
  videoUrl: string;
}

export default function VideoPlayerDisplay({
  videoUrl,
}: VideoPlayerDisplayProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<Plyr | null>(null);

  useEffect(() => {
    if (videoRef.current && !playerRef.current) {
      // Initialize Plyr
      playerRef.current = new Plyr(videoRef.current, {
        controls: [
          "play-large",
          "play",
          "progress",
          "current-time",
          "duration",
          "mute",
          "volume",
          "settings",
          "fullscreen",
        ],
        settings: ["quality", "speed"],
      });
    }

    // Cleanup function
    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative aspect-video w-full max-w-3xl overflow-hidden rounded-lg shadow-lg">
      <video
        ref={videoRef}
        className="h-full w-full"
        preload="metadata"
        poster="/placeholder-video-poster.jpg"
        crossOrigin="anonymous"
      >
        <source src={videoUrl} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
