import { useMemo } from 'react';
import { useApp } from '../context/useApp';
import type { ActiveRound, GameIndexEntry, GameState, Console } from '../types';

export interface RoundGameEntry extends GameIndexEntry {
  gameState: GameState;
}

export interface ConsoleGroup {
  id: string;
  name: string;
  neon: string;
  banner?: string;
  games: RoundGameEntry[];
}

/**
 * Hook to fetch games filtered by round requirements and grouped by console
 * - Round 2: Games with 1 star rating (not eliminated)
 * - Round 3: Games with 2 star rating OR Round 2 survivors (not eliminated)
 * 
 * @param round - The active round number
 * @returns Array of console groups with filtered games
 */
export function useRoundGames(round: ActiveRound): ConsoleGroup[] {
  const { gameIndex, getGameState, catalog } = useApp();

  return useMemo(() => {
    if (!gameIndex || gameIndex.size === 0) {
      return [];
    }

    // Group games by console
    const consoleMap = new Map<string, ConsoleGroup>();

    for (const [gameId, gameEntry] of gameIndex.entries()) {
      const gameState = getGameState(gameId);

      // Skip eliminated games
      if (gameState.eliminated) {
        continue;
      }

      let shouldInclude = false;

      if (round === 2) {
        // Round 2: Only 1-star games
        shouldInclude = gameState.stars === 1;
      } else if (round === 3) {
        // Round 3: 2-star games OR Round 2 survivors
        shouldInclude = gameState.stars === 2 || gameState.r2Survived === true;
      } else {
        // For other rounds, return empty (or handle as needed)
        continue;
      }

      if (shouldInclude) {
        const consoleId = gameEntry.consoleId;
        
        // Initialize console group if it doesn't exist
        if (!consoleMap.has(consoleId)) {
          // Try to get console banner from catalog if available
          let banner: string | undefined;
          if (catalog) {
            const console = catalog.consoles.find((c: Console) => c.id === consoleId);
            banner = console?.banner;
          }

          consoleMap.set(consoleId, {
            id: consoleId,
            name: gameEntry.consoleName,
            neon: gameEntry.neon,
            banner,
            games: [],
          });
        }

        // Add game to console group
        const consoleGroup = consoleMap.get(consoleId)!;
        consoleGroup.games.push({
          ...gameEntry,
          gameState,
        });
      }
    }

    // Convert map to array and sort
    const consoleGroups = Array.from(consoleMap.values());

    // Sort games within each console by title
    consoleGroups.forEach((group) => {
      group.games.sort((a, b) => {
        const aTitle = (a.game.sortTitle || a.game.title || '').toLowerCase();
        const bTitle = (b.game.sortTitle || b.game.title || '').toLowerCase();
        return aTitle.localeCompare(bTitle);
      });
    });

    // Sort consoles by name for consistent ordering
    consoleGroups.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      return aName.localeCompare(bName);
    });

    return consoleGroups;
  }, [gameIndex, getGameState, round, catalog]);
}
