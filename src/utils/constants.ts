export const NEON_PALETTE = [
  '#00f6ff',
  '#ff2bd6',
  '#7c4dff',
  '#00ff9a',
  '#ffd84d',
  '#ff6a3d',
  '#3d8bff',
] as const;

export const DATA_URL = '/data/data.json';

export interface RoundConfig {
  title: string;
  subtitle: string;
  containerClass: string;
  gridId?: string;
  gridClass?: string;
  navClass: string;
  backButtonText: string;
  nextButtonText?: string;
  showNextButton: boolean;
  isTierList: boolean;
  isConsoleGrid: boolean;
}

export const ROUND_CONFIG: Record<1 | 2 | 3 | 4, RoundConfig> = {
  1: {
    title: 'Round 1',
    subtitle: '',
    containerClass: 'board__grid',
    gridId: 'consoleGrid',
    navClass: '',
    backButtonText: '',
    showNextButton: false,
    isTierList: false,
    isConsoleGrid: true,
  },
  2: {
    title: 'Round 2',
    subtitle: 'Only 1-star games. Each screen shows up to 3 games. Pick 1 to survive.',
    containerClass: 'round2-wrap',
    gridId: 'round2Grid',
    gridClass: 'round2-grid',
    navClass: 'round2-nav',
    backButtonText: '← Back',
    nextButtonText: 'Next →',
    showNextButton: true,
    isTierList: false,
    isConsoleGrid: false,
  },
  3: {
    title: 'Round 3',
    subtitle: 'Only 2-star games plus Round 2 survivors. Each screen shows up to 2 games. Pick 1 to survive.',
    containerClass: 'round2-wrap',
    gridId: 'round3Grid',
    gridClass: 'round3-grid',
    navClass: 'round2-nav',
    backButtonText: '← Back',
    nextButtonText: 'Next →',
    showNextButton: true,
    isTierList: false,
    isConsoleGrid: false,
  },
  4: {
    title: 'Round 4',
    subtitle: 'Tier list: drag survivors of Round 3 and any 3-star games into S+, S, or S-.',
    containerClass: 'round4-wrap',
    navClass: 'round4-nav',
    backButtonText: '← Back to Round 3',
    showNextButton: false,
    isTierList: true,
    isConsoleGrid: false,
  },
};
