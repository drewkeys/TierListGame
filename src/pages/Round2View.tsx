import React, { useMemo, useCallback, useEffect } from 'react';
import { useApp } from '../context/useApp';
import { ROUND_CONFIG } from '../utils/constants';
import { GameCard } from '../components/GameCard';
import { useRoundGames } from '../hooks/useRoundGames';
import type { Round2State } from '../types';

function shuffleInPlace<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pickRandomTrio(fromIds: string[]): (string | '')[] {
  const copy = [...fromIds];
  shuffleInPlace(copy);
  const trio = copy.slice(0, 3);
  while (trio.length < 3) trio.push('');
  return trio as (string | '')[];
}

export function Round2View() {
  const config = ROUND_CONFIG[2];

  const { gameIndex, setModalGameId, excludedGameIds, state, updateRound2, setGameR2Survived } =
    useApp();

  const gameEntries = useRoundGames(2);
  const r2 = state.r2; // Round2State | null
  const cursor = r2?.cursor ?? -1;

  // Pool of eligible 1★ games (from hook) minus excluded ids.
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

  // IDs shown in committed steps — depend ONLY on steps for stability.
  const usedIds = useMemo(() => {
    const used = new Set<string>();
    const steps = r2?.steps ?? [];
    for (const step of steps) {
      for (const id of step.trio) {
        if (id) used.add(id);
      }
    }
    return used;
  }, [r2?.steps]);

  const remainingIds = useMemo(() => {
    return round2PoolIds.filter((id) => !usedIds.has(id));
  }, [round2PoolIds, usedIds]);

  // --- IMPORTANT FIX ---
  // Only call updateRound2 when we truly need to generate a trio.
  const viewingCommitted = (r2?.cursor ?? -1) >= 0;
  const hasTrio = (r2?.currentTrio ?? []).some(Boolean);

  // Stabilize dependency to avoid reference-churn loops
  const remainingIdsKey = useMemo(() => remainingIds.join('|'), [remainingIds]);

  useEffect(() => {
    // If Round2 state isn’t initialized in context yet, we can't do anything here.
    // (Your context should create a default r2 object; if not, we can add that later.)
    if (!r2) return;

    if (viewingCommitted) return;
    if (hasTrio) return;
    if (remainingIds.length === 0) return;

    updateRound2((prev: Round2State) => {
      // double-check inside updater too
      const prevViewingCommitted = prev.cursor >= 0;
      const prevHasTrio = prev.currentTrio.some(Boolean);
      if (prevViewingCommitted || prevHasTrio) return prev;

      const trio = pickRandomTrio(remainingIds);
      return { ...prev, currentTrio: trio, currentPick: null };
    });
  }, [r2, viewingCommitted, hasTrio, remainingIdsKey, remainingIds, updateRound2]);

  const trioEntries = useMemo(() => {
    const trio = r2?.currentTrio ?? ['', '', ''];
    return trio
      .filter(Boolean)
      .map((id) => gameIndex.get(id))
      .filter((x): x is NonNullable<typeof x> => Boolean(x));
  }, [r2?.currentTrio, gameIndex]);

  const canGoBack = Boolean(r2 && r2.steps.length > 0 && cursor >= 0);
  const canGoNext = Boolean(r2 && cursor >= 0 && cursor < r2.steps.length - 1);

  const goBack = useCallback(() => {
    if (!r2) return;

    const prevIndex = cursor - 1;

    if (prevIndex >= 0) {
      const step = r2.steps[prevIndex];
      updateRound2((prev: Round2State) => ({
        ...prev,
        currentTrio: step.trio,
        currentPick: step.pick,
        cursor: prevIndex,
      }));
    } else if (r2.steps[0]) {
      const step0 = r2.steps[0];
      updateRound2((prev: Round2State) => ({
        ...prev,
        currentTrio: step0.trio,
        currentPick: step0.pick,
        cursor: -1,
      }));
    }
  }, [r2, cursor, updateRound2]);

  const goNext = useCallback(() => {
    if (!r2) return;
    const nextIndex = cursor + 1;
    const step = r2.steps[nextIndex];
    if (!step) return;

    updateRound2((prev: Round2State) => ({
      ...prev,
      currentTrio: step.trio,
      currentPick: step.pick,
      cursor: nextIndex,
    }));
  }, [r2, cursor, updateRound2]);

  const commitPick = useCallback(
    (pickedId: string) => {
      if (!pickedId || !r2) return;

      // If rewriting history, unset survivors from future steps we’re about to truncate
      if (cursor >= 0) {
        const futureSteps = r2.steps.slice(cursor + 1);
        for (const s of futureSteps) {
          if (s.pick) setGameR2Survived(s.pick, false);
        }
      }

      // If replacing a pick, unset previous
      const existingPick = r2.currentPick;
      if (existingPick && existingPick !== pickedId) {
        setGameR2Survived(existingPick, false);
      }

      // Set new survivor
      setGameR2Survived(pickedId, true);

      updateRound2((prev: Round2State) => {
        const step = { trio: prev.currentTrio, pick: pickedId };

        const baseSteps =
          prev.cursor >= 0 ? prev.steps.slice(0, prev.cursor + 1) : prev.steps;

        const nextSteps = [...baseSteps, step];
        const newCursor = nextSteps.length - 1;

        return {
          ...prev,
          steps: nextSteps,
          currentPick: pickedId,
          currentTrio: ['', '', ''], // clear so effect generates next trio
          cursor: newCursor,
        };
      });

      setModalGameId(null);
    },
    [r2, cursor, updateRound2, setGameR2Survived, setModalGameId]
  );

  // Friendly empty-state so you don’t see “just the background”
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
        {trioEntries.map((info) => (
          <div key={info.game.id} className="round2-card-wrap">
            <GameCard
              game={info.game}
              consoleName={info.consoleName}
              neon={info.neon}
              onClick={() => setModalGameId(info.game.id)}
              onEliminate={() => setModalGameId(info.game.id)}
            />
          </div>
        ))}
      </section>

      <div className="round-nav">
        <button type="button" onClick={goBack} disabled={!canGoBack}>
          Back
        </button>
        <button type="button" onClick={goNext} disabled={!canGoNext}>
          Next
        </button>
      </div>
    </section>
  );
}