import { useApp } from '../context/useApp';
import { Button } from './Button';
import './Topbar.css';

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
          Round {activeRound}: {activeRound === 1 ? 'rate 1–4 stars or eliminate. Click a game for details.' : 'continue selection'}
        </div>
      </div>
      <div className="topbar__actions">
        <Button variant="danger" onClick={handleReset}>
          Reset
        </Button>
      </div>
    </header>
  );
}
