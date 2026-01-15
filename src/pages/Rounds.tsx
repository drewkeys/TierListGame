import { useMemo, useState, useCallback, useLayoutEffect, useEffect } from 'react';
import { useApp } from '../context/useApp';
import { NEON_PALETTE, ROUND_CONFIG } from '../utils/constants';
import { bannerPath } from '../utils/paths';
import { GameCard } from '../components/GameCard';
import { RemoveEntryModal } from '../components/RemoveEntryModal';
import type { ActiveRound } from '../types';
import { useRoundGames } from '../hooks/useRoundGames';
import {
  loadExcludedGameIds,
  saveExcludedGameIds,
  loadRound2SelectedIds,
  saveRound2SelectedIds,
} from '../utils/roundStorage';
import './Rounds.css';

interface RoundProps {
  round: ActiveRound;
}

export function Round({ round }: RoundProps) {
  const { catalog, gameIndex, setModalGameId, setGameEliminated, state, updateRound2, updateRound3 } = useApp();
  const config = ROUND_CONFIG[round];
  const gameEntries = useRoundGames(round);
  
  // State for removal modal
  const [pendingRemoval, setPendingRemoval] = useState<{ gameId: string; gameTitle: string } | null>(null);
  // Track excluded game IDs for rounds 2 and 3 (loaded from localStorage via lazy initializer)
  const [excludedGameIds, setExcludedGameIds] = useState<Set<string>>(() => loadExcludedGameIds());
  // Track originally selected game IDs for Round 2 (loaded from localStorage via lazy initializer)
  const [round2SelectedIds, setRound2SelectedIds] = useState<Set<string>>(() => loadRound2SelectedIds());
  
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

  // Handler for removing an entry
  const handleRemoveEntry = useCallback(
    (gameId: string) => {
      const gameInfo = gameIndex.get(gameId);
      if (gameInfo) {
        setPendingRemoval({ gameId, gameTitle: gameInfo.game.title || gameId });
        // Close the game modal if it's open
        setModalGameId(null);
      }
    },
    [gameIndex, setModalGameId]
  );

  // Memoize consoles for Round 1 (always call hooks, even if not used)
  const consoles = useMemo(() => {
    if (!catalog || !config.isConsoleGrid) return [];
    return catalog.consoles.map((c) => ({
      ...c,
      name: c.name || c.id || 'Console',
      games: [...(c.games || [])].sort((a, b) => {
        const at = (a.sortTitle || a.title || '').toLowerCase();
        const bt = (b.sortTitle || b.title || '').toLowerCase();
        return at.localeCompare(bt);
      }),
    }));
  }, [catalog, config.isConsoleGrid]);

  // Calculate initial selection for Round 2 (only when needed)
  const round2InitialSelection = useMemo(() => {
    if (round !== 2 || round2SelectedIds.size > 0) return null;
    
    const oneStarGames = gameEntries[0] || [];
    const allGameEntries: typeof oneStarGames[0]['games'] = [];
    oneStarGames.forEach((group) => {
      allGameEntries.push(...group.games);
    });
    
    const availableEntries = allGameEntries.filter(
      (entry) => !excludedGameIds.has(entry.game.id)
    );
    
    if (availableEntries.length === 0) return null;
    
    if (availableEntries.length <= 3) {
      return new Set(availableEntries.map((e) => e.game.id));
    }
    
    // Deterministically select 3 entries
    const gameIds = availableEntries.map((e) => e.game.id).sort().join('');
    let seed = 0;
    for (let i = 0; i < gameIds.length; i++) {
      seed = ((seed << 5) - seed + gameIds.charCodeAt(i)) | 0;
    }
    
    const selectedIndices = new Set<number>();
    const entries = [...availableEntries];
    
    for (let i = 0; i < 3; i++) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const index = seed % entries.length;
      
      if (selectedIndices.has(index)) {
        for (let j = 0; j < entries.length; j++) {
          const nextIndex = (index + j + 1) % entries.length;
          if (!selectedIndices.has(nextIndex)) {
            selectedIndices.add(nextIndex);
            break;
          }
        }
      } else {
        selectedIndices.add(index);
      }
    }
    
    const selectedEntries = Array.from(selectedIndices)
      .map((idx) => entries[idx])
      .filter(Boolean);
    
    return new Set(selectedEntries.map((e) => e.game.id));
  }, [round, gameEntries, excludedGameIds, round2SelectedIds.size]);

  // Initialize selection once when calculated
  // This is a necessary one-time initialization pattern
  // Initialize round2SelectedIds only if it's empty and initial selection is available.
  // Use layout effect to avoid cascading renders warning from React.
  useLayoutEffect(() => {
    if (round2InitialSelection && round2SelectedIds.size === 0) {
      setRound2SelectedIds(round2InitialSelection);
    }
    // It's safe to depend only on round2InitialSelection, as set will only happen if .size===0
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round2InitialSelection]);
  // Extract the appropriate array based on round for Rounds 2 & 3:
  // Round 2: array[0] = 1-star games (select 3 random entries, but don't repopulate when removed)
  // Round 3: array[1] = 2-star games, plus Round 2 survivors (which may have any star rating)
  const roundGameEntries = useMemo(() => {
    if (round === 2) {
      // Round 2: Select 3 random entries from 1-star games (index 0)
      const oneStarGames = gameEntries[0] || [];
      
      // Flatten all games from all console groups
      const allGameEntries: typeof oneStarGames[0]['games'] = [];
      oneStarGames.forEach((group) => {
        allGameEntries.push(...group.games);
      });
      
      // Use the stored selected IDs, filtering out excluded ones
      const remainingSelected = Array.from(round2SelectedIds).filter(
        (id) => !excludedGameIds.has(id)
      );
      
      // Find the entries for the remaining selected IDs
      const selectedEntries = allGameEntries.filter((entry) =>
        remainingSelected.includes(entry.game.id)
      );
      
      // Group selected entries by console, preserving console metadata
      const selectedMap = new Map<string, typeof oneStarGames[0]>();
      selectedEntries.forEach((entry) => {
        const existingGroup = selectedMap.get(entry.consoleId);
        if (existingGroup) {
          existingGroup.games.push(entry);
        } else {
          // Find the original console group to get its metadata
          const originalGroup = oneStarGames.find((g) => g.id === entry.consoleId);
          if (originalGroup) {
            selectedMap.set(entry.consoleId, {
              ...originalGroup,
              games: [entry],
            });
          }
        }
      });
      
      return Array.from(selectedMap.values());
    } else if (round === 3) {
      // Round 3: Combine 2-star games (index 1) with Round 2 survivors
      // Round 2 survivors can have any star rating, so we need to filter from the catch-all array
      const twoStarGames = gameEntries[1] || [];
      const allGamesWithStars = gameEntries[round] || []; // catch-all array (index = round)
      
      // Create a map to merge console groups and avoid duplicates
      const consoleGroupMap = new Map<string, typeof twoStarGames[0]>();
      
      // Add 2-star games (excluding removed games)
      twoStarGames.forEach((group) => {
        const filteredGames = group.games.filter((entry) => !excludedGameIds.has(entry.game.id));
        if (filteredGames.length > 0) {
          consoleGroupMap.set(group.id, {
            ...group,
            games: filteredGames,
          });
        }
      });
      
      // Add Round 2 survivors (games with r2Survived === true, excluding removed games)
      allGamesWithStars.forEach((group) => {
        const survivorGames = group.games.filter(
          (entry) => entry.gameState.r2Survived === true && !excludedGameIds.has(entry.game.id)
        );
        if (survivorGames.length > 0) {
          const existingGroup = consoleGroupMap.get(group.id);
          if (existingGroup) {
            // Merge games, avoiding duplicates
            const existingIds = new Set(existingGroup.games.map((g) => g.game.id));
            survivorGames.forEach((entry) => {
              if (!existingIds.has(entry.game.id)) {
                existingGroup.games.push(entry);
              }
            });
          } else {
            consoleGroupMap.set(group.id, {
              ...group,
              games: [...survivorGames],
            });
          }
        }
      });
      
      // Convert back to array and sort
      const mergedGroups = Array.from(consoleGroupMap.values());
      
      // Sort games within each console
      mergedGroups.forEach((group) => {
        group.games.sort((a, b) => {
          const aTitle = (a.game.sortTitle || a.game.title || '').toLowerCase();
          const bTitle = (b.game.sortTitle || b.game.title || '').toLowerCase();
          return aTitle.localeCompare(bTitle);
        });
      });
      
      // Sort consoles by name
      mergedGroups.sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        return aName.localeCompare(bName);
      });
      
      return mergedGroups;
    }
    return [];
  }, [gameEntries, round, excludedGameIds, round2SelectedIds]);


  // Confirm removal
  const handleConfirmRemoval = () => {
    if (!pendingRemoval) return;

    const { gameId } = pendingRemoval;

    // Add to excluded set
    setExcludedGameIds((prev) => {
      const next = new Set(prev);
      next.add(gameId);
      return next;
    });

    // Remove from currentTrio (Round 2) or currentPair (Round 3)
    if (round === 2 && state.r2) {
      updateRound2((prev) => ({
        ...prev,
        currentTrio: prev.currentTrio.filter((id) => id !== gameId),
        currentPick: prev.currentPick === gameId ? null : prev.currentPick,
      }));
    } else if (round === 3 && state.r3) {
      updateRound3((prev) => ({
        ...prev,
        currentPair: prev.currentPair.filter((id) => id !== gameId),
        currentPick: prev.currentPick === gameId ? null : prev.currentPick,
      }));
    }

    setPendingRemoval(null);
  };

  // Cancel removal
  const handleCancelRemoval = () => {
    setPendingRemoval(null);
  };

  // Round 1: Console grid with games
  if (config.isConsoleGrid) {
    return (
      <section id={config.gridId} className={config.containerClass} aria-label={config.title}>
        {consoles.map((c, idx) => {
          const neon = NEON_PALETTE[idx % NEON_PALETTE.length];
          return (
            <article
              key={c.id}
              className="console-window"
              style={{ '--console-neon': neon } as React.CSSProperties}
              data-console-id={c.id}
            >
              <header className="console-window__header console-window__header--banner">
                <img
                  className="console-window__banner"
                  alt={c.name}
                  loading="lazy"
                  src={bannerPath(c)}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = document.createElement('div');
                    fallback.style.padding = '14px';
                    fallback.style.fontFamily = 'var(--mono)';
                    fallback.style.letterSpacing = '0.18em';
                    fallback.style.fontWeight = '900';
                    fallback.textContent = String(c.name).toUpperCase();
                    target.parentElement?.appendChild(fallback);
                  }}
                />
              </header>
              <section className="console-window__body">
                <div className="game-grid" role="list" aria-label={`${c.name} games`}>
                  {c.games.map((game) => {
                    const info = gameIndex.get(game.id);
                    if (!info) return null;
                    return (
                      <GameCard
                        key={game.id}
                        game={game}
                        consoleName={info.consoleName}
                        neon={info.neon}
                        onClick={() => setModalGameId(game.id)}
                        onEliminate={() => setGameEliminated(game.id, true)}
                      />
                    );
                  })}
                </div>
              </section>
            </article>
          );
        })}
      </section>
    );
  }

  // Round 4: Tier list
  if (config.isTierList) {
    return (
      <section className={config.containerClass} aria-label={config.title}>
        <header className="round-header">
          <h1 className="round-title">{config.title}</h1>
          {config.subtitle && <p className="round-subtitle">{config.subtitle}</p>}
        </header>
        <section className="tier-board" aria-label="Tier board">
          <div className="tier-row" data-tier="S+">
            <div className="tier-label" aria-label="S Plus tier">S+</div>
            <div className="tier-drop" id="tier-s-plus" role="region" aria-label="S Plus tier drop zone"></div>
          </div>
          <div className="tier-row" data-tier="S">
            <div className="tier-label" aria-label="S tier">S</div>
            <div className="tier-drop" id="tier-s" role="region" aria-label="S tier drop zone"></div>
          </div>
          <div className="tier-row" data-tier="S-">
            <div className="tier-label" aria-label="S Minus tier">S-</div>
            <div className="tier-drop" id="tier-s-minus" role="region" aria-label="S Minus tier drop zone"></div>
          </div>
        </section>
        <section className="tier-pool-wrapper" aria-label="Unassigned games pool">
          <h2 className="tier-pool-title">Pool</h2>
          <div id="tier-pool" className="tier-pool" role="region" aria-label="Unassigned games pool"></div>
        </section>
      </section>
    );
  }

  // Rounds 2 & 3: Grid-based rounds with console windows (same structure as Round 1)
  return (
    <>
      <section className={config.containerClass} aria-label={config.title}>
        <header className="round-header">
          <h1 className="round-title">{config.title}</h1>
          {config.subtitle && <p className="round-subtitle">{config.subtitle}</p>}
        </header>
        <section id={config.gridId} className={config.gridClass} aria-label={`${config.title} games`}>
          {roundGameEntries.map((consoleGroup) => (
            <article
              key={consoleGroup.id}
              className="console-window"
              style={{ '--console-neon': consoleGroup.neon } as React.CSSProperties}
              data-console-id={consoleGroup.id}
            >
              <header className="console-window__header console-window__header--banner">
                <img
                  className="console-window__banner"
                  alt={consoleGroup.name}
                  loading="lazy"
                  src={bannerPath({ id: consoleGroup.id, banner: consoleGroup.banner })}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = document.createElement('div');
                    fallback.style.padding = '14px';
                    fallback.style.fontFamily = 'var(--mono)';
                    fallback.style.letterSpacing = '0.18em';
                    fallback.style.fontWeight = '900';
                    fallback.textContent = String(consoleGroup.name).toUpperCase();
                    target.parentElement?.appendChild(fallback);
                  }}
                />
              </header>
              <section className="console-window__body">
                <div className="game-grid" role="list" aria-label={`${consoleGroup.name} games`}>
                  {consoleGroup.games.map((entry) => (
                    <GameCard
                      key={entry.game.id}
                      game={entry.game}
                      consoleName={entry.consoleName}
                      neon={entry.neon}
                      onClick={() => handleRemoveEntry(entry.game.id)}
                      onEliminate={() => handleRemoveEntry(entry.game.id)}
                    />
                  ))}
                </div>
              </section>
            </article>
          ))}
        </section>
      </section>
      {pendingRemoval && (
        <RemoveEntryModal
          gameId={pendingRemoval.gameId}
          gameTitle={pendingRemoval.gameTitle}
          onConfirm={handleConfirmRemoval}
          onCancel={handleCancelRemoval}
        />
      )}
    </>
  );
}
