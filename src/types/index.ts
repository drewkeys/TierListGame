// Game and Console Types
export interface Game {
  id: string;
  title: string;
  description: string;
  youtube?: string;
  cover?: string;
  sortTitle?: string;
}

export interface Console {
  id: string;
  name?: string;
  banner?: string;
  games: Game[];
}

export interface Catalog {
  consoles: Console[];
}

// Game State Types
export interface GameState {
  stars: number;
  eliminated: boolean;
  r2Survived: boolean;
  r3Survived: boolean;
}

export interface GameIndexEntry {
  consoleId: string;
  consoleName: string;
  game: Game;
  neon: string;
}

// Round 2 State Types
export interface Round2Baseline {
  [gameId: string]: {
    eliminated: boolean;
    r2Survived: boolean;
  };
}

export interface Round2Step {
  trio: (string | '')[];
  pick: string | null;
}

export interface Round2State {
  baseline: Round2Baseline | null;
  steps: Round2Step[];
  currentTrio: (string | '')[];
  currentPick: string | null;
}

// Round 3 State Types
export interface Round3Baseline {
  [gameId: string]: {
    eliminated: boolean;
  };
}

export interface Round3Step {
  pair: (string | '')[];
  pick: string | null;
}

export interface Round3State {
  baseline: Round3Baseline | null;
  steps: Round3Step[];
  currentPair: (string | '')[];
  currentPick: string | null;
}

// App State Types
export interface RoundWinners {
  r2Survivors?: string[];
  r3Survivors?: string[];
}

export interface AppState {
  games: Record<string, GameState>;
  r2: Round2State | null;
  r3: Round3State | null;
  roundWinners: RoundWinners;
}

// Active Round Type
export type ActiveRound = 1 | 2 | 3 | 4;
