'use client';

import { useState } from 'react';
import { Play, ExternalLink } from 'lucide-react';
import { getEmbedUrl, isYouTubeUrl, getYouTubeThumbnail } from '@/lib/utils/youtube';

interface VideoPlayerProps {
  url: string;
  title?: string;
  className?: string;
}

export default function VideoPlayer({ url, title, className = '' }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(false);

  // Check if it's a YouTube URL
  const isYouTube = isYouTubeUrl(url);
  const embedUrl = isYouTube ? getEmbedUrl(url) : null;
  const thumbnail = isYouTube ? getYouTubeThumbnail(url, 'hq') : null;

  // If not YouTube or embed URL failed, show external link
  if (!isYouTube || !embedUrl) {
    return (
      <div className={`bg-gray-100 rounded-lg p-8 text-center ${className}`}>
        <ExternalLink className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 mb-4">
          This resource is available on an external platform
        </p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Open Resource
        </a>
      </div>
    );
  }

  // Show thumbnail with play button before playing
  if (!isPlaying && thumbnail) {
    return (
      <div className={`relative rounded-lg overflow-hidden ${className}`}>
        <img
          src={thumbnail}
          alt={title || 'Video thumbnail'}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
          <button
            onClick={() => setIsPlaying(true)}
            className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-all hover:scale-110 shadow-lg"
            aria-label="Play video"
          >
            <Play className="w-10 h-10 text-white ml-1" fill="white" />
          </button>
        </div>
        {title && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
            <p className="text-white font-semibold">{title}</p>
          </div>
        )}
      </div>
    );
  }

  // Show iframe when playing
  return (
    <div className={`relative rounded-lg overflow-hidden bg-black ${className}`}>
      {error ? (
        <div className="aspect-video flex items-center justify-center bg-gray-100">
          <div className="text-center p-8 space-y-4">
            <p className="text-gray-600">Failed to load video in player</p>
            <p className="text-sm text-gray-500">YouTube may have blocked embedding from this domain</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Watch on YouTube
            </a>
          </div>
        </div>
      ) : (
        <iframe
          src={`${embedUrl}?autoplay=1&rel=0&modestbranding=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`}
          title={title || 'Video player'}
          className="w-full aspect-video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          onError={() => setError(true)}
        />
      )}
    </div>
  );
}
