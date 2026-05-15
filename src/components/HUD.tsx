import { useCallback, useMemo } from 'react';
import { useApp } from '../context/useApp';
import { ROUND_CONFIG } from '../utils/constants';
import { Button } from './Button';
import type { Round2State, Round3State } from '../types';
import './HUD.css';

function makeTrio(ids: string[], startIndex: number): (string | '')[] {
  const trio = ids.slice(startIndex, startIndex + 3);
  while (trio.length < 3) trio.push('');
  return trio as (string | '')[];
}

function makePair(ids: string[], startIndex: number): (string | '')[] {
  const pair = ids.slice(startIndex, startIndex + 2);
  while (pair.length < 2) pair.push('');
  return pair as (string | '')[];
}

function sameIds(a: readonly (string | '')[], b: readonly (string | '')[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((id, index) => id === b[index]);
}

export function HUD() {
  const {
    gameIndex,
    getGameState,
    activeRound,
    shootMode,
    setActiveRound,
    state,
    updateRound2,
    updateRound3,
  } = useApp();

  const config = ROUND_CONFIG[activeRound];

  const nextRound =
    activeRound < 4 ? ((activeRound + 1) as typeof activeRound) : null;

  const r2 = state.r2;
  const r2Cursor = r2?.cursor ?? -1;
  const r2ShuffledIds = r2?.shuffledIds ?? [];
  const r2NextLiveStartIndex = (r2?.steps.length ?? 0) * 3;
  const r2HasFutureLiveTrio = r2NextLiveStartIndex < r2ShuffledIds.length;
  const r2HasCurrentTrio = Boolean(r2?.currentTrio?.some(Boolean));

  const r2IsComplete = Boolean(
    activeRound === 2 &&
      r2 &&
      r2.steps.length > 0 &&
      !r2HasCurrentTrio &&
      r2NextLiveStartIndex >= r2ShuffledIds.length
  );

  const r2CanGoBack = Boolean(
    activeRound === 2 &&
      r2 &&
      r2.steps.length > 0 &&
      (r2Cursor === -1 || r2Cursor > 0)
  );

  const r2CanGoNext = Boolean(
    activeRound === 2 &&
      r2 &&
      r2Cursor >= 0 &&
      (r2Cursor < r2.steps.length - 1 || r2HasFutureLiveTrio)
  );

  const r3 = state.r3;
  const r3Cursor = r3?.cursor ?? -1;
  const r3ShuffledIds = r3?.shuffledIds ?? [];
  const r3NextLiveStartIndex = (r3?.steps.length ?? 0) * 2;
  const r3HasFutureLivePair = r3NextLiveStartIndex < r3ShuffledIds.length;
  const r3HasCurrentPair = Boolean(r3?.currentPair?.some(Boolean));

  const r3IsComplete = Boolean(
    activeRound === 3 &&
      r3 &&
      r3.steps.length > 0 &&
      !r3HasCurrentPair &&
      r3NextLiveStartIndex >= r3ShuffledIds.length
  );

  const r3CanGoBack = Boolean(
    activeRound === 3 &&
      r3 &&
      r3.steps.length > 0 &&
      (r3Cursor === -1 || r3Cursor > 0)
  );

  const r3CanGoNext = Boolean(
    activeRound === 3 &&
      r3 &&
      r3Cursor >= 0 &&
      (r3Cursor < r3.steps.length - 1 || r3HasFutureLivePair)
  );

  const goRound2Back = useCallback(() => {
    if (!r2 || r2.steps.length === 0) return;

    const targetIndex = r2Cursor === -1 ? r2.steps.length - 1 : Math.max(0, r2Cursor - 1);
    const step = r2.steps[targetIndex];
    if (!step) return;

    updateRound2((prev: Round2State) => ({
      ...prev,
      currentTrio: step.trio,
      currentPick: step.pick,
      cursor: targetIndex,
    }));
  }, [r2, r2Cursor, updateRound2]);

  const goRound2Next = useCallback(() => {
    if (!r2 || r2Cursor < 0) return;

    const nextIndex = r2Cursor + 1;
    const nextHistoryStep = r2.steps[nextIndex];

    if (nextHistoryStep) {
      updateRound2((prev: Round2State) => ({
        ...prev,
        currentTrio: nextHistoryStep.trio,
        currentPick: nextHistoryStep.pick,
        cursor: nextIndex,
      }));
      return;
    }

    const order = r2.shuffledIds ?? [];
    const nextLiveTrio = makeTrio(order, r2.steps.length * 3);
    const savedLiveStep = r2.steps.find((step) => sameIds(step.trio, nextLiveTrio));

    updateRound2((prev: Round2State) => ({
      ...prev,
      currentTrio: nextLiveTrio,
      currentPick: savedLiveStep?.pick ?? null,
      cursor: -1,
    }));
  }, [r2, r2Cursor, updateRound2]);

  const goRound3Back = useCallback(() => {
    if (!r3 || r3.steps.length === 0) return;

    const targetIndex = r3Cursor === -1 ? r3.steps.length - 1 : Math.max(0, r3Cursor - 1);
    const step = r3.steps[targetIndex];
    if (!step) return;

    updateRound3((prev: Round3State) => ({
      ...prev,
      currentPair: step.pair,
      currentPick: step.pick,
      cursor: targetIndex,
    }));
  }, [r3, r3Cursor, updateRound3]);

  const goRound3Next = useCallback(() => {
    if (!r3 || r3Cursor < 0) return;

    const nextIndex = r3Cursor + 1;
    const nextHistoryStep = r3.steps[nextIndex];

    if (nextHistoryStep) {
      updateRound3((prev: Round3State) => ({
        ...prev,
        currentPair: nextHistoryStep.pair,
        currentPick: nextHistoryStep.pick,
        cursor: nextIndex,
      }));
      return;
    }

    const order = r3.shuffledIds ?? [];
    const nextLivePair = makePair(order, r3.steps.length * 2);
    const savedLiveStep = r3.steps.find((step) => sameIds(step.pair, nextLivePair));

    updateRound3((prev: Round3State) => ({
      ...prev,
      currentPair: nextLivePair,
      currentPick: savedLiveStep?.pick ?? null,
      cursor: -1,
    }));
  }, [r3, r3Cursor, updateRound3]);

  const stats = useMemo(() => {
    let total = 0,
      eliminated = 0,
      s1 = 0,
      s2 = 0,
      s3 = 0,
      s4 = 0;

    for (const [gameId] of gameIndex) {
      total++;
      const gameState = getGameState(gameId);
      if (gameState.eliminated) eliminated++;
      if (gameState.stars === 1) s1++;
      if (gameState.stars === 2) s2++;
      if (gameState.stars === 3) s3++;
      if (gameState.stars === 4) s4++;
    }

    const remaining = Math.max(0, total - eliminated);

    return { total, eliminated, s1, s2, s3, s4, remaining };
  }, [gameIndex, getGameState]);

  const hint = useMemo(() => {
    if (activeRound === 1) {
      return shootMode
        ? 'ELIM MODE is ON. Click a game cover to eliminate.'
        : 'ELIM MODE is OFF. Click a game to open details.';
    }

    return '';
  }, [activeRound, shootMode]);

  return (
    <footer className="hud" aria-label="Status HUD">
      <div className="hud__row">
        <div className="hud__pill">
          <div className="hud__label">Total</div>
          <div className="hud__value">{stats.total}</div>
        </div>

        <div className="hud__pill">
          <div className="hud__label">Eliminated</div>
          <div className="hud__value">{stats.eliminated}</div>
        </div>

        <div className="hud__pill">
          <div className="hud__label">1★</div>
          <div className="hud__value">{stats.s1}</div>
        </div>

        <div className="hud__pill">
          <div className="hud__label">2★</div>
          <div className="hud__value">{stats.s2}</div>
        </div>

        <div className="hud__pill">
          <div className="hud__label">3★</div>
          <div className="hud__value">{stats.s3}</div>
        </div>

        <div className="hud__pill">
          <div className="hud__label">4★</div>
          <div className="hud__value">{stats.s4}</div>
        </div>

        <div className="hud__pill hud__pill--wide">
          <div className="hud__label">Remaining</div>
          <div className="hud__value">{stats.remaining}</div>
        </div>

        {activeRound === 2 && (
          <>
            <Button
              className="hud__btn hud__btn--back"
              type="button"
              onClick={goRound2Back}
              disabled={!r2CanGoBack}
            >
              Back
            </Button>

            {r2IsComplete && nextRound ? (
              <Button
                className="hud__btn hud__btn--next"
                type="button"
                onClick={() => setActiveRound(nextRound)}
              >
                Round 3 →
              </Button>
            ) : (
              <Button
                className="hud__btn hud__btn--next"
                type="button"
                onClick={goRound2Next}
                disabled={!r2CanGoNext}
              >
                Next →
              </Button>
            )}
          </>
        )}

        {activeRound === 3 && (
          <>
            <Button
              className="hud__btn hud__btn--back"
              type="button"
              onClick={goRound3Back}
              disabled={!r3CanGoBack}
            >
              Back
            </Button>

            {r3IsComplete && nextRound ? (
              <Button
                className="hud__btn hud__btn--next"
                type="button"
                onClick={() => setActiveRound(nextRound)}
              >
                Round 4 →
              </Button>
            ) : (
              <Button
                className="hud__btn hud__btn--next"
                type="button"
                onClick={goRound3Next}
                disabled={!r3CanGoNext}
              >
                Next →
              </Button>
            )}
          </>
        )}

        {config.navClass &&
          config.showNextButton &&
          nextRound &&
          activeRound !== 2 &&
          activeRound !== 3 && (
            <Button
              className="hud__btn hud__btn--next"
              type="button"
              onClick={() => setActiveRound(nextRound)}
            >
              {config.nextButtonText}
            </Button>
          )}

        {activeRound === 1 && nextRound && (
          <Button
            className="hud__btn hud__btn--next"
            type="button"
            onClick={() => setActiveRound(nextRound)}
          >
            NEXT →
          </Button>
        )}

        {hint && <div className="hud__hint">{hint}</div>}
      </div>
    </footer>
  );
}