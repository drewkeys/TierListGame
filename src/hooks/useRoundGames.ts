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
 * Hook to fetch games organized by star rating in a multi-dimensional array
 * - Array size: activeRound + 1
 * - array[0] = 1-star games grouped by console
 * - array[1] = 2-star games grouped by console
 * - array[activeRound - 1] = activeRound-star games grouped by console
 * - array[activeRound] = all games with stars >= 1 grouped by console (catch-all)
 * 
 * Games with 0 stars are ignored.
 * 
 * @param round - The active round number
 * @returns Multi-dimensional array of console groups, indexed by star count (1-indexed, but array is 0-indexed)
 */
export function useRoundGames(round: ActiveRound): ConsoleGroup[][] {
  const { gameIndex, getGameState, catalog } = useApp();

  return useMemo(() => {
    if (!gameIndex || gameIndex.size === 0) {
      // Return empty arrays for all star levels
      return Array(round + 1).fill(null).map(() => []);
    }

    // Initialize the multi-dimensional array: round + 1 slots
    // array[0] = 1-star, array[1] = 2-star, ..., array[round] = all stars >= 1
    const starArrays: ConsoleGroup[][] = Array(round + 1)
      .fill(null)
      .map(() => []);

    // Maps for each star level: consoleId -> ConsoleGroup
    const consoleMaps = Array(round + 1)
      .fill(null)
      .map(() => new Map<string, ConsoleGroup>());

    for (const [gameId, gameEntry] of gameIndex.entries()) {
      const gameState = getGameState(gameId);

      // Skip eliminated games and games with 0 stars
      if (gameState.eliminated || gameState.stars === 0) {
        continue;
      }

      const stars = gameState.stars;
      const consoleId = gameEntry.consoleId;

      // Add game to specific star level array (stars - 1 because array is 0-indexed but stars are 1-indexed)
      if (stars >= 1 && stars <= round) {
        const starIndex = stars - 1;
        const consoleMap = consoleMaps[starIndex];

        // Initialize console group if it doesn't exist
        if (!consoleMap.has(consoleId)) {
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

      // Also add to catch-all array (last index) if stars >= 1
      if (stars >= 1) {
        const catchAllIndex = round;
        const consoleMap = consoleMaps[catchAllIndex];

        // Initialize console group if it doesn't exist
        if (!consoleMap.has(consoleId)) {
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

        // Add game to catch-all console group
        const consoleGroup = consoleMap.get(consoleId)!;
        consoleGroup.games.push({
          ...gameEntry,
          gameState,
        });
      }
    }

    // Convert maps to arrays and sort for each star level
    for (let i = 0; i <= round; i++) {
      const consoleGroups = Array.from(consoleMaps[i].values());

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

      starArrays[i] = consoleGroups;
    }

    return starArrays;
  }, [gameIndex, getGameState, round, catalog]);
}
