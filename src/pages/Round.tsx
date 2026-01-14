import { useMemo } from 'react';
import { useApp } from '../context/useApp';
import { NEON_PALETTE, ROUND_CONFIG } from '../utils/constants';
import { bannerPath } from '../utils/paths';
import { GameCard } from '../components/GameCard';
import type { ActiveRound } from '../types';
import { useRoundGames } from '../hooks/useRoundGames';
import './Round.css';

interface RoundProps {
  round: ActiveRound;
}

export function Round({ round }: RoundProps) {
  const { catalog, gameIndex, setModalGameId, setGameEliminated } = useApp();
  const config = ROUND_CONFIG[round];
  const gameEntries = useRoundGames(round);

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

  // Round 4: Tier list
  if (config.isTierList) {
    return (
      <section className={config.containerClass} aria-label={config.title}>
        <header className="round-header">
          <h1 className="round-title">{config.title}</h1>
          {config.subtitle && <p className="round-subtitle">{config.subtitle}</p>}
        </header>
        <section className="tier-board" aria-label="Tier board">
          <div className="tier-row" data-tier="S+">
            <div className="tier-label" aria-label="S Plus tier">S+</div>
            <div className="tier-drop" id="tier-s-plus" role="region" aria-label="S Plus tier drop zone"></div>
          </div>
          <div className="tier-row" data-tier="S">
            <div className="tier-label" aria-label="S tier">S</div>
            <div className="tier-drop" id="tier-s" role="region" aria-label="S tier drop zone"></div>
          </div>
          <div className="tier-row" data-tier="S-">
            <div className="tier-label" aria-label="S Minus tier">S-</div>
            <div className="tier-drop" id="tier-s-minus" role="region" aria-label="S Minus tier drop zone"></div>
          </div>
        </section>
        <section className="tier-pool-wrapper" aria-label="Unassigned games pool">
          <h2 className="tier-pool-title">Pool</h2>
          <div id="tier-pool" className="tier-pool" role="region" aria-label="Unassigned games pool"></div>
        </section>
      </section>
    );
  }

  // Rounds 2 & 3: Grid-based rounds with console windows (same structure as Round 1)
  return (
    <section className={config.containerClass} aria-label={config.title}>
      <header className="round-header">
        <h1 className="round-title">{config.title}</h1>
        {config.subtitle && <p className="round-subtitle">{config.subtitle}</p>}
      </header>
      <section id={config.gridId} className={config.gridClass} aria-label={`${config.title} games`}>
        {gameEntries.map((consoleGroup) => (
          <article
            key={consoleGroup.id}
            className="console-window"
            style={{ '--console-neon': consoleGroup.neon } as React.CSSProperties}
            data-console-id={consoleGroup.id}
          >
            <header className="console-window__header console-window__header--banner">
              <img
                className="console-window__banner"
                alt={consoleGroup.name}
                loading="lazy"
                src={bannerPath({ id: consoleGroup.id, banner: consoleGroup.banner })}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = document.createElement('div');
                  fallback.style.padding = '14px';
                  fallback.style.fontFamily = 'var(--mono)';
                  fallback.style.letterSpacing = '0.18em';
                  fallback.style.fontWeight = '900';
                  fallback.textContent = String(consoleGroup.name).toUpperCase();
                  target.parentElement?.appendChild(fallback);
                }}
              />
            </header>
            <section className="console-window__body">
              <div className="game-grid" role="list" aria-label={`${consoleGroup.name} games`}>
                {consoleGroup.games.map((entry) => (
                  <GameCard
                    key={entry.game.id}
                    game={entry.game}
                    consoleName={entry.consoleName}
                    neon={entry.neon}
                    onClick={() => setModalGameId(entry.game.id)}
                    onEliminate={() => setGameEliminated(entry.game.id, true)}
                  />
                ))}
              </div>
            </section>
          </article>
        ))}
      </section>
    </section>
  );
}
