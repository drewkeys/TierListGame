import { useMemo, useEffect } from 'react';
import { useApp } from '../context/useApp';
import { ROUND_CONFIG } from '../utils/constants';
import { GameCard } from '../components/GameCard';
import { useRoundGames } from '../hooks/useRoundGames';
import type { Round2State } from '../types';

function shuffleIds(ids: string[]): string[] {
  const copy = [...ids];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

function makeTrio(ids: string[], startIndex: number): (string | '')[] {
  const trio = ids.slice(startIndex, startIndex + 3);
  while (trio.length < 3) trio.push('');
  return trio as (string | '')[];
}

export function Round2View() {
  const config = ROUND_CONFIG[2];

  const { gameIndex, setModalGameId, excludedGameIds, state, updateRound2 } = useApp();

  const gameEntries = useRoundGames(2);
  const r2 = state.r2;

  // Pool of eligible 1★ games, minus excluded ids.
  const round2PoolIds = useMemo(() => {
    const oneStarGroups = gameEntries[0] || [];
    const ids: string[] = [];

    for (const group of oneStarGroups) {
      for (const entry of group.games) {
        if (!excludedGameIds.has(entry.game.id)) {
          ids.push(entry.game.id);
        }
      }
    }

    return ids;
  }, [gameEntries, excludedGameIds]);

  // Stable key to detect when the eligible 1★ pool changed.
  const poolKey = useMemo(() => {
    return [...round2PoolIds].sort().join('|');
  }, [round2PoolIds]);

  // Create/maintain one saved shuffled order for Round 2.
  useEffect(() => {
    if (!r2) return;
    if (round2PoolIds.length === 0) return;

    updateRound2((prev: Round2State) => {
      const savedPoolKey = prev.poolKey ?? '';
      const savedOrder = prev.shuffledIds ?? [];
      const hasVisibleTrio = prev.currentTrio.some(Boolean);

      // If the 1★ pool changed, reset Round 2 with a fresh saved shuffle.
      if (savedPoolKey !== poolKey || savedOrder.length === 0) {
        const shuffledIds = shuffleIds(round2PoolIds);

        return {
          ...prev,
          poolKey,
          shuffledIds,
          steps: [],
          currentTrio: makeTrio(shuffledIds, 0),
          currentPick: null,
          cursor: -1,
        };
      }

      // If viewing Back/Next history and that history trio exists, do not auto-generate.
      if (prev.cursor >= 0 && hasVisibleTrio) {
        return prev;
      }

      // If the live newest trio already exists, leave it alone.
      if (prev.cursor === -1 && hasVisibleTrio) {
        return prev;
      }

      // Generate the next live trio from the saved shuffled order.
      const nextStartIndex = prev.steps.length * 3;

      // Finished all Round 2 games.
      if (nextStartIndex >= savedOrder.length) {
        return {
          ...prev,
          currentTrio: ['', '', ''],
          currentPick: null,
          cursor: -1,
        };
      }

      const nextTrio = makeTrio(savedOrder, nextStartIndex);

      return {
        ...prev,
        currentTrio: nextTrio,
        currentPick: null,
        cursor: -1,
      };
    });
  }, [r2, poolKey, round2PoolIds, updateRound2]);

  const currentTrio = useMemo<(string | '')[]>(() => r2?.currentTrio ?? ['', '', ''], [r2?.currentTrio]);
  const hasCurrentTrio = currentTrio.some(Boolean);

  const displayedPick = useMemo(() => {
    if (!r2) return null;
    if (r2.currentPick) return r2.currentPick;

    const currentKey = currentTrio.join('|');
    const matchingStep = r2.steps.find((step) => step.trio.join('|') === currentKey);

    return matchingStep?.pick ?? null;
  }, [r2, currentTrio]);

  const trioEntries = useMemo(() => {
    return currentTrio.map((id) => {
      if (!id) return null;
      return gameIndex.get(id) ?? null;
    });
  }, [currentTrio, gameIndex]);

  // Friendly empty-state so you do not see just the background.
  if (round2PoolIds.length === 0) {
    return (
      <section className={config.containerClass} aria-label={config.title}>
        <header className="round-header">
          <h1 className="round-title">{config.title}</h1>
          <p className="round-subtitle">
            No 1★ games found. Go to Round 1 and rate at least a few games 1★ to populate Round 2.
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

      <section id={config.gridId} className="round2-grid" aria-label="Round 2 trio">
        {hasCurrentTrio ? (
          trioEntries.map((info, index) => {
            if (!info) {
              return <div key={`empty-${index}`} className="round2-slot round2-empty" />;
            }

            return (
              <div key={info.game.id} className="round2-card-wrap">
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
          <div className="round-complete-panel" role="status" aria-live="polite">
            <div className="round-complete-card round-complete-card--minimal">
              <p className="round-complete-eyebrow">Round 2 complete</p>
              <h2>Ready for Round 3?</h2>
            </div>
          </div>
        )}
      </section>
    </section>
  );
}