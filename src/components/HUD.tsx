import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Button } from './Button';

export function HUD() {
  const { gameIndex, getGameState, activeRound, shootMode, setActiveRound } = useApp();

  const stats = useMemo(() => {
    let total = 0,
      eliminated = 0,
      s1 = 0,
      s2 = 0,
      s3 = 0;

    for (const [gameId] of gameIndex) {
      total++;
      const gameState = getGameState(gameId);
      if (gameState.eliminated) eliminated++;
      if (gameState.stars === 1) s1++;
      if (gameState.stars === 2) s2++;
      if (gameState.stars === 3) s3++;
    }

    const remaining = Math.max(0, total - eliminated);

    return { total, eliminated, s1, s2, s3, remaining };
  }, [gameIndex, getGameState]);

  const hint = useMemo(() => {
    if (activeRound === 1) {
      return shootMode
        ? 'ELIM MODE is ON. Click a game cover to eliminate.'
        : 'ELIM MODE is OFF. Click a game to open details.';
    }
    return 'Round navigation: Back/Next controls are available.';
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

        <div className="hud__pill hud__pill--wide">
          <div className="hud__label">Remaining</div>
          <div className="hud__value">{stats.remaining}</div>
        </div>

        {activeRound === 1 && (
          <Button className="hud__btn hud__btn--next" onClick={() => setActiveRound(2)}>
            NEXT →
          </Button>
        )}

        <div className="hud__hint">{hint}</div>
      </div>
    </footer>
  );
}
