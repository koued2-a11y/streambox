'use client';

import { useEffect, useRef } from 'react';

interface VideoPlayerProps {
  src: string;
  poster?: string;
}

export default function VideoPlayer({ src, poster }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Construire l'URL complète du poster
  const getPosterUrl = () => {
    if (!poster) return undefined;
    if (poster.startsWith('http')) {
      return poster; // URL externe (placeholder)
    }
    // URL locale : ajouter l'URL du backend
    return `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${poster}`;
  };

  return (
    <div className="w-full aspect-video bg-black rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        className="w-full h-full"
        controls
        poster={getPosterUrl()}
        src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${src}`}
      >
        Votre navigateur ne supporte pas la lecture vidéo.
      </video>
    </div>
  );
}

