import React, { useMemo } from 'react';
import { useApp } from '../context/useApp';
import { NEON_PALETTE, ROUND_CONFIG } from '../utils/constants';
import { bannerPath } from '../utils/paths';
import { GameCard } from '../components/GameCard';
import './Rounds.css';


import { Round2View } from './Round2View';
import { Round3View } from './Round3View';
import { Round4View } from './Round4View';
import type { ActiveRound } from '../types';

type RoundProps = { round: ActiveRound; };

export function Round({ round }: RoundProps) {
  const { catalog, gameIndex, setModalGameId, setGameEliminated } = useApp();
  const config = ROUND_CONFIG[round];

  // Round 2 / Round 3 are now isolated components
  if (round === 2) return <Round2View />;
  if (round === 3) return <Round3View />;
  if (round === 4) return <Round4View />;

  // Round 1 consoles
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

  if (config.isConsoleGrid) {
    return (
      <section id={config.gridId} className={config.containerClass} aria-label={config.title}>
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

              <section className="console-window__body">
                <div className="game-grid" role="list" aria-label={`${c.name} games`}>
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
              </section>
            </article>
          );
        })}
      </section>
    );
  }

  return null;
}