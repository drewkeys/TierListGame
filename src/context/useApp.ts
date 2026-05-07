import { createContext, useContext } from 'react';
import type { AppState, ActiveRound, Catalog, GameIndexEntry, Round2State, Round3State } from '../types';

export interface AppContextType {
  catalog: Catalog | null;
  state: AppState;
  gameIndex: Map<string, GameIndexEntry>;
  activeRound: ActiveRound;
  shootMode: boolean;
  modalGameId: string | null;
  excludedGameIds: Set<string>;
  round2SelectedIds: Set<string>;
  setActiveRound: (round: ActiveRound) => void;
  setShootMode: (mode: boolean) => void;
  setModalGameId: (id: string | null) => void;
  setGameStars: (gameId: string, stars: number) => void;
  setGameEliminated: (gameId: string, eliminated: boolean) => void;
  toggleGameEliminated: (gameId: string) => void;
  getGameState: (gameId: string) => import('../types').GameState;
  updateRound2: (updater: (prev: Round2State) => Round2State) => void;
  updateRound3: (updater: (prev: Round3State) => Round3State) => void;
  setExcludedGameIds: (ids: Set<string>) => void;
  setRound2SelectedIds: (ids: Set<string>) => void;
  setGameR2Survived: (gameId: string, survived: boolean) => void;
  reset: () => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
