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
