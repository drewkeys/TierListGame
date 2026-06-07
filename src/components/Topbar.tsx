import { useState } from 'react';
import { useApp } from '../context/useApp';
import { Button } from './Button';
import { ASSET_PATHS } from '../utils/paths';
import { CreditsModal } from './CreditsModal';
import './Topbar.css';

export function Topbar() {
  const { reset, activeRound, muted, toggleMuted } = useApp();
  const [creditsOpen, setCreditsOpen] = useState(false);


  const handleCreditsClick = () => {
    if (!muted) {
      const audio = new Audio(ASSET_PATHS.yummyMp3);
      audio.volume = 0.75;
      void audio.play().catch(() => {
        // Browser audio permissions can block playback; opening credits should still work.
      });
    }

    setCreditsOpen(true);
  };

  const handleReset = () => {
    if (window.confirm('Reset all ratings and eliminations? This cannot be undone.')) {
      reset();
    }
  };

  return (
    <>
      <header className="topbar">
      <Button
        type="button"
        className="topbar__cookie"
        onClick={handleCreditsClick}
        aria-label="Open credits"
        title="Credits"
      >
        <img src={ASSET_PATHS.cookiePng} alt="" aria-hidden="true" />
      </Button>
      <div className="topbar__titleBlock">
        <div className="title">GAME RATING GAME</div>
        <div className="subtitle">
          {activeRound === 1
            ? 'Round 1: rate 1–4 stars or eliminate. Click a game for details.'
            : activeRound === 4
              ? 'Round 4'
              : `Round ${activeRound}: continue selection`}
        </div>
      </div>
      <div className="topbar__actions">
        <Button
          type="button"
          className={`topbar__mute${muted ? ' is-muted' : ''}`}
          onClick={toggleMuted}
          aria-label={muted ? 'Unmute sounds' : 'Mute sounds'}
          title={muted ? 'Unmute sounds' : 'Mute sounds'}
        >
          <img src={muted ? ASSET_PATHS.mutedPng : ASSET_PATHS.speakerPng} alt="" aria-hidden="true" />
        </Button>
        <Button className="topbar__reset" variant="danger" onClick={handleReset}>
          Reset
        </Button>
      </div>
      </header>
      <CreditsModal open={creditsOpen} onClose={() => setCreditsOpen(false)} />
    </>
  );
}
