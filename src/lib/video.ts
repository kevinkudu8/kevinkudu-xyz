/** The 11-character video id from a YouTube URL or a bare id. */
export function youtubeId(value: string | null | undefined): string | null {
  if (!value) return null;
  if (/^[\w-]{11}$/.test(value)) return value;
  return value.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/)?.[1] ?? null;
}

export const youtubeThumb = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

// Privacy-enhanced domain: no tracking cookies until the viewer presses play
export const youtubeEmbed = (id: string) =>
  `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;

/** The numeric video id from a Vimeo URL (including vimeo.com/manage/<id>/... links). */
export function vimeoId(value: string | null | undefined): string | null {
  return value?.match(/vimeo\.com\/(?:manage\/|video\/)?(?:videos\/)?(\d+)/)?.[1] ?? null;
}

// dnt=1: Vimeo sets no tracking cookies
export const vimeoEmbed = (id: string) =>
  `https://player.vimeo.com/video/${id}?autoplay=1&dnt=1&title=0&byline=0&portrait=0`;

/** A playable embed URL for a YouTube or Vimeo link, or null if it's neither. */
export function embedUrl(link: string | null | undefined): string | null {
  const vimeo = vimeoId(link);
  if (vimeo) return vimeoEmbed(vimeo);
  const youtube = youtubeId(link);
  return youtube ? youtubeEmbed(youtube) : null;
}
