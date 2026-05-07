import React, { useMemo, useState, useCallback } from 'react';
import { useApp } from '../context/useApp';
import { ROUND_CONFIG } from '../utils/constants';
import { useRoundGames } from '../hooks/useRoundGames';
import { GameCard } from '../components/GameCard';
import { RemoveEntryModal } from '../components/RemoveEntryModal';

export function Round3View() {
  const config = ROUND_CONFIG[3];
  const { gameIndex, setModalGameId, excludedGameIds, setExcludedGameIds, state, updateRound3 } = useApp();
  const gameEntries = useRoundGames(3);

  const [pendingRemoval, setPendingRemoval] = useState<{ gameId: string; gameTitle: string } | null>(null);

  const handleRemoveEntry = useCallback(
    (gameId: string) => {
      const info = gameIndex.get(gameId);
      if (info) {
        setPendingRemoval({ gameId, gameTitle: info.game.title || gameId });
        setModalGameId(null);
      }
    },
    [gameIndex, setModalGameId]
  );

  const handleConfirmRemoval = useCallback(() => {
    if (!pendingRemoval) return;
    const { gameId } = pendingRemoval;

    const next = new Set(excludedGameIds);
    next.add(gameId);
    setExcludedGameIds(next);

    if (state.r3) {
      updateRound3((prev) => ({
        ...prev,
        currentPair: prev.currentPair.filter((id) => id !== gameId),
        currentPick: prev.currentPick === gameId ? null : prev.currentPick,
      }));
    }

    setPendingRemoval(null);
  }, [pendingRemoval, excludedGameIds, setExcludedGameIds, state.r3, updateRound3]);

  const handleCancelRemoval = useCallback(() => setPendingRemoval(null), []);

  // ✅ This used to be in Rounds.tsx after the Round 2 return
  const roundGameEntries = useMemo(() => {
    const twoStarGames = gameEntries[1] || [];
    const allGamesWithStars = gameEntries[3] || [];

    const consoleGroupMap = new Map<string, typeof twoStarGames[0]>();

    twoStarGames.forEach((group) => {
      const filteredGames = group.games.filter((entry) => !excludedGameIds.has(entry.game.id));
      if (filteredGames.length > 0) {
        consoleGroupMap.set(group.id, { ...group, games: filteredGames });
      }
    });

    allGamesWithStars.forEach((group) => {
      const survivorGames = group.games.filter(
        (entry) => entry.gameState.r2Survived === true && !excludedGameIds.has(entry.game.id)
      );
      if (survivorGames.length > 0) {
        const existingGroup = consoleGroupMap.get(group.id);
        if (existingGroup) {
          const existingIds = new Set(existingGroup.games.map((g) => g.game.id));
          survivorGames.forEach((entry) => {
            if (!existingIds.has(entry.game.id)) existingGroup.games.push(entry);
          });
        } else {
          consoleGroupMap.set(group.id, { ...group, games: [...survivorGames] });
        }
      }
    });

    const mergedGroups = Array.from(consoleGroupMap.values());

    mergedGroups.forEach((group) => {
      group.games.sort((a, b) => {
        const aTitle = (a.game.sortTitle || a.game.title || '').toLowerCase();
        const bTitle = (b.game.sortTitle || b.game.title || '').toLowerCase();
        return aTitle.localeCompare(bTitle);
      });
    });

    mergedGroups.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
    return mergedGroups;
  }, [gameEntries, excludedGameIds]);

  return (
    <>
      <section className={config.containerClass} aria-label={config.title}>
        <header className="round-header">
          <h1 className="round-title">{config.title}</h1>
          {config.subtitle && <p className="round-subtitle">{config.subtitle}</p>}
        </header>

        <section id={config.gridId} className={config.gridClass} aria-label={`${config.title} games`}>
          {roundGameEntries.map((consoleGroup) => (
            <article key={consoleGroup.id} className="console-group">
              <h2 className="console-group-title">{consoleGroup.name}</h2>
              <div className="game-grid" role="list" aria-label={`${consoleGroup.name} games`}>
                {consoleGroup.games.map((entry) => {
                  const info = gameIndex.get(entry.game.id);
                  if (!info) return null;
                  return (
                    <GameCard
                      key={entry.game.id}
                      game={info.game}
                      consoleName={info.consoleName}
                      neon={info.neon}
                      onClick={() => setModalGameId(info.game.id)}
                      onEliminate={() => handleRemoveEntry(info.game.id)}
                    />
                  );
                })}
              </div>
            </article>
          ))}
        </section>
      </section>

      {pendingRemoval && (
        <RemoveEntryModal
          title={pendingRemoval.gameTitle}
          onConfirm={handleConfirmRemoval}
          onCancel={handleCancelRemoval}
        />
      )}
    </>
  );
}