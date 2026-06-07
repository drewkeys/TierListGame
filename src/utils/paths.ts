const BASE = import.meta.env.BASE_URL;

const ASSET_COVER_BASE = `${BASE}assets/covers/`;
const ASSET_COVER_FALLBACK = `${BASE}assets/covers/placeholder.png`;

const ASSET_CONSOLE_BANNER_BASE = `${BASE}assets/consoles/`;

const CONSOLE_BANNER_MAP: Record<string, string> = {
  NES: 'Banner_NES_NoBG.png',
  SNES: 'Banner_SNES_NoBG.png',

  'SEGA Master System': 'Banner_GenesisMS_NoBG.png',
  'SEGA Genesis': 'Banner_GenesisMS_NoBG.png',
  'SEGA CD': 'Banner_GenesisMS_NoBG.png',

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
  explosionGif: `${BASE}assets/ui/explode.gif`,
  starPng: `${BASE}assets/ui/stars.png`,
  gunPng: `${BASE}assets/ui/gun.png`,
  crosshairPng: `${BASE}assets/ui/crosshair.png`,
  explodeMp3: `${BASE}assets/ui/explode.mp3`,
  buttonMp3: `${BASE}assets/ui/button.mp3`,
  yayMp3: `${BASE}assets/ui/yay.mp3`,
  wooshMp3: `${BASE}assets/ui/woosh.mp3`,
  celebrationMp3: `${BASE}assets/ui/celebration.mp3`,
  yummyMp3: `${BASE}assets/ui/yummy.mp3`,
  cookiePng: `${BASE}assets/ui/cookie.png`,
  speakerPng: `${BASE}assets/ui/speaker.png`,
  mutedPng: `${BASE}assets/ui/muted.png`,
} as const;