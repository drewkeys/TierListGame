function parseTimeToSeconds(t: string): number {
  const str = String(t).trim().toLowerCase();
  if (/^\d+$/.test(str)) return Number(str);
  let total = 0;
  const h = str.match(/(\d+)h/);
  const m = str.match(/(\d+)m/);
  const s = str.match(/(\d+)s/);
  if (h) total += Number(h[1]) * 3600;
  if (m) total += Number(m[1]) * 60;
  if (s) total += Number(s[1]);
  return total;
}

export function youtubeToEmbed(url: string): string {
  try {
    const u = new URL(url);
    let videoId = '';
    let start = 0;

    if (u.hostname.includes('youtu.be')) {
      videoId = u.pathname.replace('/', '');
      const t = u.searchParams.get('t');
      if (t) start = parseTimeToSeconds(t);
    } else if (u.hostname.includes('youtube.com')) {
      videoId = u.searchParams.get('v') || '';
      const t = u.searchParams.get('t') || u.searchParams.get('start');
      if (t) start = parseTimeToSeconds(t);
    }

    if (!videoId) return '';
    const params = new URLSearchParams();
    params.set('rel', '0');
    params.set('modestbranding', '1');
    params.set('playsinline', '1');
    if (start > 0) params.set('start', String(start));

    return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
  } catch {
    return '';
  }
}
