import type { AppState, GameState } from '../types';

const STORAGE_KEY = 'grg_state_v7';

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { games: {}, r2: null, r3: null, roundWinners: {} };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { games: {}, r2: null, r3: null, roundWinners: {} };
    if (!parsed.games || typeof parsed.games !== 'object') parsed.games = {};
    if (!('r2' in parsed)) parsed.r2 = null;
    if (!('r3' in parsed)) parsed.r3 = null;
    if (!parsed.roundWinners || typeof parsed.roundWinners !== 'object') parsed.roundWinners = {};
    return parsed;
  } catch {
    return { games: {}, r2: null, r3: null, roundWinners: {} };
  }
}

export function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function getGameState(gameId: string, state: AppState): GameState {
  if (!state.games[gameId]) {
    state.games[gameId] = { stars: 0, eliminated: false, r2Survived: false, r3Survived: false };
  }
  const g: GameState = state.games[gameId] as GameState;
  if (typeof g.stars !== 'number') g.stars = 0;
  if (typeof g.eliminated !== 'boolean') g.eliminated = false;
  if (typeof g.r2Survived !== 'boolean') g.r2Survived = false;
  if (typeof g.r3Survived !== 'boolean') g.r3Survived = false;
  return g;
}

export function resetState(): AppState {
  localStorage.removeItem(STORAGE_KEY);
  return { games: {}, r2: null, r3: null, roundWinners: {} };
}
