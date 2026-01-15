/**
 * Storage utilities for round-specific UI state
 * Handles persistence of excluded game IDs and Round 2 selected IDs
 */

const STORAGE_KEY = 'grg_round_ui_v1';

export interface RoundUIState {
  excludedGameIds: string[];
  round2SelectedIds: string[];
}

function loadRoundUIState(): RoundUIState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { excludedGameIds: [], round2SelectedIds: [] };
    }
    
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return { excludedGameIds: [], round2SelectedIds: [] };
    }

    return {
      excludedGameIds: Array.isArray(parsed.excludedGameIds) ? parsed.excludedGameIds : [],
      round2SelectedIds: Array.isArray(parsed.round2SelectedIds) ? parsed.round2SelectedIds : [],
    };
  } catch (error) {
    console.error('Failed to load round UI state from localStorage:', error);
    return { excludedGameIds: [], round2SelectedIds: [] };
  }
}

function saveRoundUIState(state: RoundUIState): void {
  try {
    const serialized = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (error) {
    console.error('Failed to save round UI state to localStorage:', error);
    // Handle quota exceeded
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.warn('localStorage quota exceeded for round UI state');
    }
  }
}

/**
 * Load excluded game IDs from localStorage
 */
export function loadExcludedGameIds(): Set<string> {
  const state = loadRoundUIState();
  return new Set(state.excludedGameIds);
}

/**
 * Save excluded game IDs to localStorage
 */
export function saveExcludedGameIds(excludedIds: Set<string>): void {
  const state = loadRoundUIState();
  state.excludedGameIds = Array.from(excludedIds);
  saveRoundUIState(state);
}

/**
 * Load Round 2 selected IDs from localStorage
 */
export function loadRound2SelectedIds(): Set<string> {
  const state = loadRoundUIState();
  return new Set(state.round2SelectedIds);
}

/**
 * Save Round 2 selected IDs to localStorage
 */
export function saveRound2SelectedIds(selectedIds: Set<string>): void {
  const state = loadRoundUIState();
  state.round2SelectedIds = Array.from(selectedIds);
  saveRoundUIState(state);
}

/**
 * Reset all round UI state
 */
export function resetRoundUIState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to reset round UI state:', error);
  }
}
