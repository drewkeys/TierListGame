const ASSET_COVER_BASE = '/assets/covers/';
const ASSET_COVER_FALLBACK = '/assets/covers/placeholder.png';
const ASSET_BANNER_BASE = '/assets/ui/';

export function slugify(s: string): string {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function bannerPath(consoleObj: { id: string; banner?: string }): string {
  if (consoleObj.banner) return `${ASSET_BANNER_BASE}${consoleObj.banner}`;
  return `${ASSET_BANNER_BASE}${slugify(consoleObj.id)}-banner.png`;
}

export function coverPath(gameObj: { id: string; cover?: string }): string {
  if (gameObj.cover) return `${ASSET_COVER_BASE}${gameObj.cover}`;
  return `${ASSET_COVER_BASE}${gameObj.id}.png`;
}

export const ASSET_PATHS = {
  coverFallback: ASSET_COVER_FALLBACK,
  explosionGif: '/assets/ui/explode.gif',
  starPng: '/assets/ui/stars.png',
  gunPng: '/assets/ui/gun.png',
  crosshairPng: '/assets/ui/crosshair.png',
  explodeMp3: '/assets/ui/explode.mp3',
} as const;
