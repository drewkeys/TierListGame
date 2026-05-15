const ASSET_COVER_BASE = '/assets/covers/';
const ASSET_COVER_FALLBACK = '/assets/covers/placeholder.png';

const ASSET_CONSOLE_BANNER_BASE = '/assets/consoles/';

const CONSOLE_BANNER_MAP: Record<string, string> = {
  NES: 'Banner_NES_NoBG.png',
  SNES: 'Banner_SNES_NoBG.png',

  'SEGA Master System': 'Banner_GenesisMS_NoBG.png',
  'SEGA Genesis': 'Banner_GenesisMS_NoBG.png',

  'Nintendo Gameboy/DS': 'Banner_Handhelds_NoBG.png',
  'Nintendo 64': 'Banner_N64_NoBG.png',
  'Nintendo GameCube': 'Banner_Gamecube_NoBG.png',
  'Nintendo Wii/Wii U': 'Banner_Wii_NoBG.png',

  'SEGA Dreamcast': 'Banner_Dreamcast_NoBG.png',

  'Sony Playstation': 'Banner_PS1_NoBG.png',
  'Sony Playstation 2': 'Banner_PS2_NoBG.png',

  'PC - (Boy)': 'Banner_PCboy_NoBG.png',
  'PC - (Man)': 'Banner_PCman_NoBG.png',

  'Non PC Modern Console (PS3+)': 'Banner_PS3XBOX360_NoBG.png',

  'iOS/VR': 'Banner_IOSVR_NoBG.png',
  ARCADE: 'Banner_Arcade_NoBG.png',
};

export function slugify(s: string): string {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function bannerPath(consoleObj: { id: string; banner?: string }): string {
  if (consoleObj.banner) {
    return `${ASSET_CONSOLE_BANNER_BASE}${consoleObj.banner}`;
  }

  const mappedBanner = CONSOLE_BANNER_MAP[consoleObj.id];

  if (mappedBanner) {
    return `${ASSET_CONSOLE_BANNER_BASE}${mappedBanner}`;
  }

  return `${ASSET_CONSOLE_BANNER_BASE}${slugify(consoleObj.id)}-banner.png`;
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
  speakerPng: '/assets/ui/speaker.png',
} as const;