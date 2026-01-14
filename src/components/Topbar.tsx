import { useApp } from '../context/AppContext';
import { Button } from './Button';

export function Topbar() {
  const { reset, activeRound } = useApp();

  const handleReset = () => {
    if (window.confirm('Reset all ratings and eliminations? This cannot be undone.')) {
      reset();
    }
  };

  return (
    <header className="topbar">
      <div>
        <div className="title">GAME RATING GAME</div>
        <div className="subtitle">
          Round {activeRound}: {activeRound === 1 ? 'rate 1–3 stars or eliminate. Click a game for details.' : 'continue selection'}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
        <Button variant="danger" onClick={handleReset}>
          Reset
        </Button>
      </div>
    </header>
  );
}
