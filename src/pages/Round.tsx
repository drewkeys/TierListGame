import { useMemo } from 'react';
import { useApp } from '../context/useApp';
import { NEON_PALETTE, ROUND_CONFIG } from '../utils/constants';
import { bannerPath } from '../utils/paths';
import { GameCard } from '../components/GameCard';
import type { ActiveRound } from '../types';
import './Round.css';

interface RoundProps {
  round: ActiveRound;
}

export function Round({ round }: RoundProps) {
  const { catalog, gameIndex, setModalGameId, setGameEliminated, setActiveRound } = useApp();
  const config = ROUND_CONFIG[round];
  const prevRound = (round > 1 ? (round - 1) as ActiveRound : null);

  // Memoize consoles for Round 1 (always call hooks, even if not used)
  const consoles = useMemo(() => {
    if (!catalog || !config.isConsoleGrid) return [];
    return catalog.consoles.map((c) => ({
      ...c,
      name: c.name || c.id || 'Console',
      games: [...(c.games || [])].sort((a, b) => {
        const at = (a.sortTitle || a.title || '').toLowerCase();
        const bt = (b.sortTitle || b.title || '').toLowerCase();
        return at.localeCompare(bt);
      }),
    }));
  }, [catalog, config.isConsoleGrid]);

  // Round 1: Console grid with games
  if (config.isConsoleGrid) {
    return (
      <div id={config.gridId} className={config.containerClass}>
        {consoles.map((c, idx) => {
          const neon = NEON_PALETTE[idx % NEON_PALETTE.length];
          return (
            <article
              key={c.id}
              className="console-window"
              style={{ '--console-neon': neon } as React.CSSProperties}
              data-console-id={c.id}
            >
              <header className="console-window__header console-window__header--banner">
                <img
                  className="console-window__banner"
                  alt={c.name}
                  loading="lazy"
                  src={bannerPath(c)}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = document.createElement('div');
                    fallback.style.padding = '14px';
                    fallback.style.fontFamily = 'var(--mono)';
                    fallback.style.letterSpacing = '0.18em';
                    fallback.style.fontWeight = '900';
                    fallback.textContent = String(c.name).toUpperCase();
                    target.parentElement?.appendChild(fallback);
                  }}
                />
              </header>
              <div className="console-window__body">
                <div className="game-grid">
                  {c.games.map((game) => {
                    const info = gameIndex.get(game.id);
                    if (!info) return null;
                    return (
                      <GameCard
                        key={game.id}
                        game={game}
                        consoleName={info.consoleName}
                        neon={info.neon}
                        onClick={() => setModalGameId(game.id)}
                        onEliminate={() => setGameEliminated(game.id, true)}
                      />
                    );
                  })}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    );
  }

  // Round 4: Tier list
  if (config.isTierList) {
    return (
      <div className={config.containerClass}>
        <div className="round4-head">
          <div className="round2-title">{config.title}</div>
          <div className="round2-sub">{config.subtitle}</div>
        </div>
        <div className="tier-board">
          <div className="tier-row" data-tier="S+">
            <div className="tier-label">S+</div>
            <div className="tier-drop" id="tierSPlus" aria-label="S Plus tier drop zone"></div>
          </div>
          <div className="tier-row" data-tier="S">
            <div className="tier-label">S</div>
            <div className="tier-drop" id="tierS" aria-label="S tier drop zone"></div>
          </div>
          <div className="tier-row" data-tier="S-">
            <div className="tier-label">S-</div>
            <div className="tier-drop" id="tierSMinus" aria-label="S Minus tier drop zone"></div>
          </div>
        </div>
        <div className="tier-pool-wrap">
          <div className="tier-pool-title">Pool</div>
          <div id="tierPool" className="tier-pool" aria-label="Unassigned games pool"></div>
        </div>
        <div className={config.navClass}>
          <button className="btn btn--ghost" type="button" onClick={() => setActiveRound(prevRound!)}>
            {config.backButtonText}
          </button>
        </div>
      </div>
    );
  }

  // Rounds 2 & 3: Grid-based rounds
  return (
    <>
      <div className={config.containerClass}>
        <div className="round2-head">
          <div className="round2-title">{config.title}</div>
          <div className="round2-sub">{config.subtitle}</div>
        </div>
        <div id={config.gridId} className={config.gridClass}>
          <div className="loading-card">{config.title} implementation in progress...</div>
        </div>
        <div className="round2-bottom-spacer"></div>
      </div>
      <div className={config.navClass}>
        <button className="btn btn--ghost" type="button" onClick={() => setActiveRound(prevRound!)}>
          {config.backButtonText}
        </button>
        {config.showNextButton && (
          <button className="btn btn--magenta" type="button" disabled>
            {config.nextButtonText}
          </button>
        )}
      </div>
    </>
  );
}
