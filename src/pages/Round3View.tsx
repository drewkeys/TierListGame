import { useMemo, useEffect } from 'react';
import { useApp } from '../context/useApp';
import { ROUND_CONFIG } from '../utils/constants';
import { GameCard } from '../components/GameCard';
import { useRoundGames } from '../hooks/useRoundGames';
import { shuffle } from '../utils/array';
import type { Round3State } from '../types';

function makePair(ids: string[], startIndex: number): (string | '')[] {
  const pair = ids.slice(startIndex, startIndex + 2);
  while (pair.length < 2) pair.push('');
  return pair as (string | '')[];
}

export function Round3View() {
  const config = ROUND_CONFIG[3];

  const { gameIndex, setModalGameId, excludedGameIds, state, updateRound3 } = useApp();

  const gameEntries = useRoundGames(3);
  const r3 = state.r3;

  const round3PoolIds = useMemo(() => {
    const ids: string[] = [];
    const seen = new Set<string>();

    // 2★ games from Round 1
    const twoStarGroups = gameEntries[1] || [];
    for (const group of twoStarGroups) {
      for (const entry of group.games) {
        const id = entry.game.id;
        if (!excludedGameIds.has(id) && !seen.has(id)) {
          seen.add(id);
          ids.push(id);
        }
      }
    }

    // Round 2 survivors, from all rated games
    const allRatedGroups = gameEntries[3] || [];
    for (const group of allRatedGroups) {
      for (const entry of group.games) {
        const id = entry.game.id;
        if (entry.gameState.r2Survived === true && !excludedGameIds.has(id) && !seen.has(id)) {
          seen.add(id);
          ids.push(id);
        }
      }
    }

    return ids;
  }, [gameEntries, excludedGameIds]);

  const poolKey = useMemo(() => {
    return [...round3PoolIds].sort().join('|');
  }, [round3PoolIds]);

  useEffect(() => {
    if (!r3) return;
    if (round3PoolIds.length === 0) return;

    updateRound3((prev: Round3State) => {
      const savedPoolKey = prev.poolKey ?? '';
      const savedOrder = prev.shuffledIds ?? [];
      const hasVisiblePair = prev.currentPair.some(Boolean);

      if (savedPoolKey !== poolKey || savedOrder.length === 0) {
        const shuffledIds = shuffle(round3PoolIds);

        return {
          ...prev,
          poolKey,
          shuffledIds,
          steps: [],
          currentPair: makePair(shuffledIds, 0),
          currentPick: null,
          cursor: -1,
        };
      }

      if (prev.cursor >= 0 && hasVisiblePair) {
        return prev;
      }

      if (prev.cursor === -1 && hasVisiblePair) {
        return prev;
      }

      const nextStartIndex = prev.steps.length * 2;

      if (nextStartIndex >= savedOrder.length) {
        return {
          ...prev,
          currentPair: ['', ''],
          currentPick: null,
          cursor: -1,
        };
      }

      const nextPair = makePair(savedOrder, nextStartIndex);

      return {
        ...prev,
        currentPair: nextPair,
        currentPick: null,
        cursor: -1,
      };
    });
  }, [r3, poolKey, round3PoolIds, updateRound3]);

  const currentPair = useMemo<(string | '')[]>(() => r3?.currentPair ?? ['', ''], [r3?.currentPair]);
  const hasCurrentPair = currentPair.some(Boolean);

  const displayedPick = useMemo(() => {
    if (!r3) return null;
    if (r3.currentPick) return r3.currentPick;

    const currentKey = currentPair.join('|');
    const matchingStep = r3.steps.find((step) => step.pair.join('|') === currentKey);

    return matchingStep?.pick ?? null;
  }, [r3, currentPair]);

  const pairEntries = useMemo(() => {
    return currentPair.map((id) => {
      if (!id) return null;
      return gameIndex.get(id) ?? null;
    });
  }, [currentPair, gameIndex]);

  if (round3PoolIds.length === 0) {
    return (
      <section className={config.containerClass} aria-label={config.title}>
        <header className="round-header">
          <h1 className="round-title">{config.title}</h1>
          <p className="round-subtitle">
            No Round 3 games found. Round 3 uses 2★ games plus Round 2 survivors.
          </p>
        </header>
      </section>
    );
  }

  return (
    <section className={config.containerClass} aria-label={config.title}>
      <header className="round-header">
        <h1 className="round-title">{config.title}</h1>
        {config.subtitle && <p className="round-subtitle">{config.subtitle}</p>}
      </header>

      <section id={config.gridId} className="round3-grid round-pick-grid" aria-label="Round 3 pair">
        {hasCurrentPair ? (
          pairEntries.map((info, index) => {
            if (!info) {
              return <div key={`empty-${index}`} className="round3-slot round3-empty" />;
            }

            return (
              <div key={info.game.id} className="round3-card-wrap">
                <GameCard
                  game={info.game}
                  consoleName={info.consoleName}
                  neon={info.neon}
                  selected={displayedPick === info.game.id}
                  onClick={() => setModalGameId(info.game.id)}
                  onEliminate={() => setModalGameId(info.game.id)}
                />
              </div>
            );
          })
        ) : (
          <div className="loading-card">
            Round 3 complete. Use Back to review previous selections, or continue to Round 4.
          </div>
        )}
      </section>
    </section>
  );
}