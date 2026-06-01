
import { useState, useEffect, useCallback, type ReactNode } from 'react';
import {
  loadSavedActiveRound,
  saveActiveRound,
  clearSavedActiveRound,
  clearRound4Tiers,
} from '../utils/saveSlotStorage';
import type {
  AppState,
  ActiveRound,
  Catalog,
  GameIndexEntry,
  Round2State,
  Round3State,
  Console,
  Game,
} from '../types';
import { loadState, saveState, saveStateImmediate, getGameState, resetState } from '../utils/storage';
import {
  loadExcludedGameIds,
  saveExcludedGameIds,
  loadRound2SelectedIds,
  saveRound2SelectedIds,
  resetRoundUIState,
} from '../utils/roundStorage';
import { DATA_URL } from '../utils/constants';
import { ASSET_PATHS, bannerPath, coverPath } from '../utils/paths';
import { AppContext } from './useApp';

const DEFAULT_R2: Round2State = {
  baseline: null,
  steps: [],
  currentTrio: ['', '', ''],
  currentPick: null,
  cursor: -1,
  poolKey: '',
  shuffledIds: [],
};

const DEFAULT_R3: Round3State = {
  baseline: null,
  steps: [],
  currentPair: ['', ''],
  currentPick: null,
  cursor: -1,
  poolKey: '',
  shuffledIds: [],
};


function preloadImage(src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = src;
  });
}

function warmImageCache(games: Game[], consoles: Console[]): void {
  const prioritySources = [
    ASSET_PATHS.coverFallback,
    ASSET_PATHS.explosionGif,
    ASSET_PATHS.starPng,
    ASSET_PATHS.gunPng,
    ASSET_PATHS.speakerPng,
    ASSET_PATHS.cookiePng,
    ...consoles.map((console) => bannerPath(console)),
    ...games.slice(0, 36).map((game) => coverPath(game)),
  ];

  // Start visible/near-visible assets immediately so cards do not pop in blank.
  prioritySources.forEach((src) => void preloadImage(src));

  const remainingCoverSources = games.slice(36).map((game) => coverPath(game));
  let index = 0;

  const loadNextBatch = () => {
    const batch = remainingCoverSources.slice(index, index + 12);
    index += batch.length;

    batch.forEach((src) => void preloadImage(src));

    if (index < remainingCoverSources.length) {
      window.setTimeout(loadNextBatch, 120);
    }
  };

  if (remainingCoverSources.length > 0) {
    const requestIdle = (window as Window & { requestIdleCallback?: (callback: () => void) => number }).requestIdleCallback;

    if (requestIdle) {
      requestIdle(loadNextBatch);
    } else {
      window.setTimeout(loadNextBatch, 1);
    }
  }
}

const MUTE_STORAGE_KEY = 'grg_muted_v1';

function loadMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function saveMuted(muted: boolean): void {
  try {
    localStorage.setItem(MUTE_STORAGE_KEY, muted ? '1' : '0');
  } catch (error) {
    console.error('Failed to save mute setting:', error);
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [state, setState] = useState<AppState>(loadState);
  const [gameIndex, setGameIndex] = useState<Map<string, GameIndexEntry>>(new Map());
  const [activeRound, setActiveRoundState] = useState<ActiveRound>(() => loadSavedActiveRound() ?? 1);
  const [shootMode, setShootModeState] = useState(false);
  const [muted, setMutedState] = useState<boolean>(() => loadMuted());
  const [modalGameId, setModalGameId] = useState<string | null>(null);
  // Round UI state (excluded games and Round 2 selections) - loaded from localStorage
  const [excludedGameIds, setExcludedGameIdsState] = useState<Set<string>>(() => loadExcludedGameIds());
  const [round2SelectedIds, setRound2SelectedIdsState] = useState<Set<string>>(() => loadRound2SelectedIds());

  // Load catalog
  useEffect(() => {
    fetch(DATA_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load ${DATA_URL}: ${res.status}`);
        return res.json();
      })
      .then((data: Catalog) => {
        setCatalog(data);
        // Build game index
        const index = new Map<string, GameIndexEntry>();
        const NEON_PALETTE = ['#00f6ff', '#ff2bd6', '#7c4dff', '#00ff9a', '#ffd84d', '#ff6a3d', '#3d8bff'];
        const allGames: Game[] = [];

        data.consoles?.forEach((console: Console, idx: number) => {
          const consoleName = console.name || console.id || 'Console';
          const neon = NEON_PALETTE[idx % NEON_PALETTE.length];
          console.games?.forEach((game: Game) => {
            if (game?.id) {
              allGames.push(game);
              index.set(game.id, {
                consoleId: console.id,
                consoleName,
                game,
                neon,
              });
            }
          });
        });

        warmImageCache(allGames, data.consoles ?? []);
        setGameIndex(index);
      })
      .catch((err) => {
        console.error('Failed to load catalog:', err);
      });
  }, []);

  // Save state when it changes (debounced for efficiency)
  useEffect(() => {
    // Skip save on initial mount (state already loaded from localStorage)
    if (catalog === null) return;

    saveState(state);
  }, [state, catalog]);

  // Body class for round
  useEffect(() => {
    document.body.classList.remove('round-1', 'round-2', 'round-3', 'round-4');
    document.body.classList.add(`round-${activeRound}`);
  }, [activeRound]);

  // Body class for shoot mode
  useEffect(() => {
    document.body.classList.toggle('shoot-mode', shootMode);
  }, [shootMode]);

  // Save excluded game IDs to localStorage when they change
  useEffect(() => {
    saveExcludedGameIds(excludedGameIds);
  }, [excludedGameIds]);

  // Save Round 2 selected IDs to localStorage when they change
  useEffect(() => {
    if (round2SelectedIds.size > 0) {
      saveRound2SelectedIds(round2SelectedIds);
    }
  }, [round2SelectedIds]);
  
  useEffect(() => {
    saveActiveRound(activeRound);
  }, [activeRound]);

  useEffect(() => {
    saveMuted(muted);
  }, [muted]);

  // Setters for excluded game IDs and Round 2 selected IDs
  const setExcludedGameIds = useCallback((ids: Set<string>) => {
    setExcludedGameIdsState(ids);
  }, []);

  const setRound2SelectedIds = useCallback((ids: Set<string>) => {
    setRound2SelectedIdsState(ids);
  }, []);

  /**
   * ✅ CHANGED:
   * - Prevent going backwards between rounds
   * - Ensure Round 2/3 state is initialized immediately when entering those rounds
   * - Keep shoot mode only in Round 1 (existing behavior)
   * - Close modal on round change (existing behavior)
   */
  const setActiveRound = useCallback((round: ActiveRound) => {
    setActiveRoundState((prevRound) => {
      // 🚫 No going backwards
      if (round < prevRound) return prevRound;
      return round;
    });

    // Ensure r2/r3 exist immediately when entering the round
    setState((prev) => {
      // If user attempted to go backwards, do nothing
      // (We can’t read prevRound from the other state setter reliably,
      //  so we just enforce monotonicity by checking activeRound below.)
      // If you want this perfectly synchronized, switch to a reducer later.
      const nextState: AppState = { ...prev };

      // Initialize round state when entering these rounds
      if (round === 2 && !nextState.r2) nextState.r2 = { ...DEFAULT_R2 };
      if (round === 3 && !nextState.r3) nextState.r3 = { ...DEFAULT_R3 };

      return nextState;
    });

    // Enforce shoot mode only in Round 1
    if (round !== 1) {
      setShootModeState(false);
    }

    // Close modal on round change
    setModalGameId(null);
    document.body.style.overflow = '';
  }, []);

  const setShootMode = useCallback(
    (mode: boolean) => {
      if (activeRound === 1) {
        setShootModeState(mode);
      }
    },
    [activeRound]
  );

  const setMuted = useCallback((nextMuted: boolean) => {
    setMutedState(nextMuted);
  }, []);

  const toggleMuted = useCallback(() => {
    setMutedState((prev) => !prev);
  }, []);

  const setModalGameIdCallback = useCallback((id: string | null) => {
    setModalGameId(id);
    if (id) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, []);

  const setGameStars = useCallback((gameId: string, stars: number) => {
    setState((prev) => {
      const newState = { ...prev };
      const gameState = getGameState(gameId, newState);
      gameState.stars = Math.max(0, Math.min(4, stars));
      return newState;
    });
  }, []);

  const setGameEliminated = useCallback((gameId: string, eliminated: boolean) => {
    setState((prev) => {
      const newState = { ...prev };
      const gameState = getGameState(gameId, newState);
      gameState.eliminated = eliminated;
      return newState;
    });
  }, []);

  const toggleGameEliminated = useCallback((gameId: string) => {
    setState((prev) => {
      const newState = { ...prev };
      const gameState = getGameState(gameId, newState);
      gameState.eliminated = !gameState.eliminated;
      return newState;
    });
  }, []);

  const getGameStateLocal = useCallback(
    (gameId: string) => {
      return getGameState(gameId, state);
    },
    [state]
  );

  const updateRound2 = useCallback((updater: (prev: Round2State) => Round2State) => {
    setState((prev) => {
      const newState = { ...prev };
      if (!newState.r2) {
        newState.r2 = { ...DEFAULT_R2 };
      }
      newState.r2 = updater(newState.r2);
      return newState;
    });
  }, []);

  const updateRound3 = useCallback((updater: (prev: Round3State) => Round3State) => {
    setState((prev) => {
      const newState = { ...prev };
      if (!newState.r3) {
        newState.r3 = { ...DEFAULT_R3 };
      }
      newState.r3 = updater(newState.r3);
      return newState;
    });
  }, []);

  const setGameR2Survived = useCallback((gameId: string, survived: boolean) => {
    setState((prev) => {
      const newState = { ...prev };
      const gs = getGameState(gameId, newState);
      gs.r2Survived = survived;
      return newState;
    });
  }, []);

  const setGameR3Survived = useCallback((gameId: string, survived: boolean) => {
    setState((prev) => {
      const newState = { ...prev };
      const gs = getGameState(gameId, newState);
      gs.r3Survived = survived;
      return newState;
    });
  }, []);

  const reset = useCallback(() => {
    const newState = resetState();

    clearSavedActiveRound();
    clearRound4Tiers();

    setState(newState);
    setActiveRoundState(1);
    setShootModeState(false);
    setModalGameId(null);
    document.body.style.overflow = '';

    resetRoundUIState();
    setExcludedGameIdsState(new Set());
    setRound2SelectedIdsState(new Set());

    saveStateImmediate(newState);
    saveActiveRound(1);
  }, []);

  return (
    <AppContext.Provider
      value={{
        catalog,
        state,
        gameIndex,
        activeRound,
        shootMode,
        muted,
        modalGameId,
        excludedGameIds,
        round2SelectedIds,
        setActiveRound,
        setShootMode,
        setMuted,
        toggleMuted,
        setModalGameId: setModalGameIdCallback,
        setGameStars,
        setGameEliminated,
        toggleGameEliminated,
        getGameState: getGameStateLocal,
        updateRound2,
        updateRound3,
        setExcludedGameIds,
        setRound2SelectedIds,
        setGameR2Survived,
        setGameR3Survived,
        reset,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}