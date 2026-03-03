/**
 * YouTube URL utilities
 * Converts standard YouTube URLs to embeddable format
 */

/**
 * Extract video ID from various YouTube URL formats
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - URLs with additional query parameters (pp=, etc.)
 */
export function getYouTubeVideoId(url: string): string | null {
  if (!url) return null;

  try {
    const urlObj = new URL(url);

    if (urlObj.hostname.includes('youtube.com') && urlObj.searchParams.has('v')) {
      const videoId = urlObj.searchParams.get('v');
      return videoId ? videoId.split('&')[0] : null;
    }

    if (urlObj.hostname === 'youtu.be') {
      const videoId = urlObj.pathname.slice(1); // Remove leading slash
      return videoId.split('?')[0].split('&')[0];
    }

    if (urlObj.hostname.includes('youtube.com') && urlObj.pathname.includes('/embed/')) {
      const videoId = urlObj.pathname.split('/embed/')[1];
      return videoId ? videoId.split('?')[0].split('&')[0] : null;
    }

    return null;
  } catch (error) {
    console.error('Error parsing YouTube URL:', error);
    return null;
  }
}

/**
 * Convert any YouTube URL to embeddable format
 * Returns: https://www.youtube.com/embed/VIDEO_ID
 */
export function getEmbedUrl(url: string): string | null {
  const videoId = getYouTubeVideoId(url);
  
  if (!videoId) {
    return null;
  }

  return `https://www.youtube.com/embed/${videoId}`;
}

/**
 * Check if a URL is a YouTube URL
 */
export function isYouTubeUrl(url: string): boolean {
  if (!url) return false;

  try {
    const urlObj = new URL(url);
    return (
      urlObj.hostname.includes('youtube.com') ||
      urlObj.hostname === 'youtu.be'
    );
  } catch {
    return false;
  }
}

/**
 * Get YouTube thumbnail URL
 */
export function getYouTubeThumbnail(url: string, quality: 'default' | 'hq' | 'mq' | 'sd' | 'maxres' = 'hq'): string | null {
  const videoId = getYouTubeVideoId(url);
  
  if (!videoId) {
    return null;
  }

  const qualityMap = {
    default: 'default',
    mq: 'mqdefault',
    hq: 'hqdefault',
    sd: 'sddefault',
    maxres: 'maxresdefault',
  };

  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`;
}
