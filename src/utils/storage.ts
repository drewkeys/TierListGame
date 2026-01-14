import type { AppState, GameState } from '../types';

const STORAGE_KEY = 'grg_state_v7';
const SAVE_DEBOUNCE_MS = 300; // Debounce rapid updates

let saveTimeoutId: ReturnType<typeof setTimeout> | null = null;
let pendingState: AppState | null = null;

/**
 * Validates and normalizes AppState structure
 */
function validateState(state: AppState): AppState {
  const validated: AppState = {
    games: typeof state.games === 'object' && state.games !== null ? state.games : {},
    r2: state.r2 ?? null,
    r3: state.r3 ?? null,
    roundWinners: typeof state.roundWinners === 'object' && state.roundWinners !== null ? state.roundWinners : {},
  };

  // Clean up game states: only keep games that have been modified from defaults
  // This prevents storing unnecessary default values
  const cleanedGames: Record<string, GameState> = {};
  for (const [gameId, gameState] of Object.entries(validated.games)) {
    if (!gameState || typeof gameState !== 'object') continue;
    
    // Only store if game has been modified (not all defaults)
    const isModified =
      gameState.stars !== 0 ||
      gameState.eliminated !== false ||
      gameState.r2Survived !== false ||
      gameState.r3Survived !== false;

    if (isModified) {
      cleanedGames[gameId] = {
        stars: typeof gameState.stars === 'number' ? Math.max(0, Math.min(3, gameState.stars)) : 0,
        eliminated: typeof gameState.eliminated === 'boolean' ? gameState.eliminated : false,
        r2Survived: typeof gameState.r2Survived === 'boolean' ? gameState.r2Survived : false,
        r3Survived: typeof gameState.r3Survived === 'boolean' ? gameState.r3Survived : false,
      };
    }
  }
  validated.games = cleanedGames;

  return validated;
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { games: {}, r2: null, r3: null, roundWinners: {} };
    
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return { games: {}, r2: null, r3: null, roundWinners: {} };
    }

    // Validate and normalize loaded state
    return validateState(parsed as AppState);
  } catch (error) {
    console.error('Failed to load state from localStorage:', error);
    return { games: {}, r2: null, r3: null, roundWinners: {} };
  }
}

/**
 * Saves state to localStorage with debouncing and error handling
 */
export function saveState(state: AppState): void {
  // Store the latest state
  pendingState = state;

  // Clear existing timeout
  if (saveTimeoutId !== null) {
    clearTimeout(saveTimeoutId);
  }

  // Debounce: wait for a pause in updates before saving
  saveTimeoutId = setTimeout(() => {
    if (pendingState === null) return;

    try {
      const validated = validateState(pendingState);
      const serialized = JSON.stringify(validated);
      
      // Check localStorage quota before writing
      try {
        localStorage.setItem(STORAGE_KEY, serialized);
      } catch (error) {
        // Handle quota exceeded or other storage errors
        if (error instanceof Error && error.name === 'QuotaExceededError') {
          console.warn('localStorage quota exceeded. Attempting to clean up...');
          // Try to free space by removing old/unused game states
          const cleaned = validateState(pendingState);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
          } catch (retryError) {
            console.error('Failed to save state after cleanup:', retryError);
          }
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error('Failed to save state to localStorage:', error);
      // Don't throw - allow app to continue functioning
    } finally {
      pendingState = null;
      saveTimeoutId = null;
    }
  }, SAVE_DEBOUNCE_MS);
}

/**
 * Immediately saves state (bypasses debounce) - useful for critical saves
 */
export function saveStateImmediate(state: AppState): void {
  // Clear any pending debounced save
  if (saveTimeoutId !== null) {
    clearTimeout(saveTimeoutId);
    saveTimeoutId = null;
  }
  pendingState = null;

  try {
    const validated = validateState(state);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(validated));
  } catch (error) {
    console.error('Failed to save state immediately:', error);
  }
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
