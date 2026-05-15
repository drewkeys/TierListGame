import type { ActiveRound } from '../types';

const ACTIVE_ROUND_KEY = 'grg_active_round_v1';
const ROUND4_TIERS_KEY = 'grg_round4_tiers_v1';

export function loadSavedActiveRound(): ActiveRound | null {
  try {
    const raw = localStorage.getItem(ACTIVE_ROUND_KEY);
    const parsed = Number(raw);

    if (parsed === 1 || parsed === 2 || parsed === 3 || parsed === 4) {
      return parsed as ActiveRound;
    }

    return null;
  } catch {
    return null;
  }
}

export function saveActiveRound(round: ActiveRound): void {
  try {
    localStorage.setItem(ACTIVE_ROUND_KEY, String(round));
  } catch (error) {
    console.error('Failed to save active round:', error);
  }
}

export function clearSavedActiveRound(): void {
  try {
    localStorage.removeItem(ACTIVE_ROUND_KEY);
  } catch (error) {
    console.error('Failed to clear active round:', error);
  }
}

export function clearRound4Tiers(): void {
  try {
    localStorage.removeItem(ROUND4_TIERS_KEY);
  } catch (error) {
    console.error('Failed to clear Round 4 tiers:', error);
  }
}

export function hasSavedProgress(): boolean {
  try {
    const savedRound = loadSavedActiveRound();
    const hasMainState = Boolean(localStorage.getItem('grg_state_v7'));
    const hasRoundUI = Boolean(localStorage.getItem('grg_round_ui_v1'));
    const hasRound4 = Boolean(localStorage.getItem(ROUND4_TIERS_KEY));

    return Boolean(savedRound || hasMainState || hasRoundUI || hasRound4);
  } catch {
    return false;
  }
}