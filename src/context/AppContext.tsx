import { useState, useEffect, useCallback, type ReactNode } from 'react';
import type { AppState, ActiveRound, Catalog, GameIndexEntry, Round2State, Round3State, Console, Game } from '../types';
import { loadState, saveState, saveStateImmediate, getGameState, resetState } from '../utils/storage';
import { DATA_URL } from '../utils/constants';
import { AppContext } from './useApp';

export function AppProvider({ children }: { children: ReactNode }) {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [state, setState] = useState<AppState>(loadState);
  const [gameIndex, setGameIndex] = useState<Map<string, GameIndexEntry>>(new Map());
  const [activeRound, setActiveRoundState] = useState<ActiveRound>(1);
  const [shootMode, setShootModeState] = useState(false);
  const [modalGameId, setModalGameId] = useState<string | null>(null);

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
        data.consoles?.forEach((console: Console, idx: number) => {
          const consoleName = console.name || console.id || 'Console';
          const neon = NEON_PALETTE[idx % NEON_PALETTE.length];
          console.games?.forEach((game: Game) => {
            if (game?.id) {
              index.set(game.id, {
                consoleId: console.id,
                consoleName,
                game,
                neon,
              });
            }
          });
        });
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

  const setActiveRound = useCallback((round: ActiveRound) => {
    setActiveRoundState(round);
    // Enforce shoot mode only in Round 1
    if (round !== 1) {
      setShootModeState(false);
    }
    setModalGameId(null);
  }, []);

  const setShootMode = useCallback((mode: boolean) => {
    if (activeRound === 1) {
      setShootModeState(mode);
    }
  }, [activeRound]);

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
      gameState.stars = stars;
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

  const getGameStateLocal = useCallback((gameId: string) => {
    return getGameState(gameId, state);
  }, [state]);

  const updateRound2 = useCallback((updater: (prev: Round2State) => Round2State) => {
    setState((prev) => {
      const newState = { ...prev };
      if (!newState.r2) {
        newState.r2 = { baseline: null, steps: [], currentTrio: ['', '', ''], currentPick: null };
      }
      newState.r2 = updater(newState.r2);
      return newState;
    });
  }, []);

  const updateRound3 = useCallback((updater: (prev: Round3State) => Round3State) => {
    setState((prev) => {
      const newState = { ...prev };
      if (!newState.r3) {
        newState.r3 = { baseline: null, steps: [], currentPair: ['', ''], currentPick: null };
      }
      newState.r3 = updater(newState.r3);
      return newState;
    });
  }, []);

  const reset = useCallback(() => {
    const newState = resetState();
    setState(newState);
    setActiveRoundState(1);
    setShootModeState(false);
    setModalGameId(null);
    document.body.style.overflow = '';
    // Immediately save reset state
    saveStateImmediate(newState);
  }, []);

  return (
    <AppContext.Provider
      value={{
        catalog,
        state,
        gameIndex,
        activeRound,
        shootMode,
        modalGameId,
        setActiveRound,
        setShootMode,
        setModalGameId: setModalGameIdCallback,
        setGameStars,
        setGameEliminated,
        toggleGameEliminated,
        getGameState: getGameStateLocal,
        updateRound2,
        updateRound3,
        reset,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

