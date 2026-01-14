import { useMemo } from 'react';
import { useApp } from '../context/useApp';
import { ASSET_PATHS } from '../utils/paths';
import './ElimCounter.css';

export function ElimCounter() {
  const { gameIndex, getGameState, activeRound, shootMode, setShootMode } = useApp();

  const eliminated = useMemo(() => {
    let count = 0;
    for (const [gameId] of gameIndex) {
      const gameState = getGameState(gameId);
      if (gameState.eliminated) count++;
    }
    return count;
  }, [gameIndex, getGameState]);

  if (activeRound !== 1) return null;

  return (
    <div className="overlay-counter" aria-label="Eliminated counter">
      <div className="panel panel--mini">
        <div className="panel__title">ELIM</div>
        <div className="panel__value">{eliminated}</div>
        <button
          className={`gun-icon ${shootMode ? 'is-on' : ''}`}
          type="button"
          aria-pressed={shootMode}
          aria-label="Toggle elimination mode"
          onClick={() => setShootMode(!shootMode)}
        >
          <img src={ASSET_PATHS.gunPng} alt="Elimination mode" />
        </button>
      </div>
    </div>
  );
}
