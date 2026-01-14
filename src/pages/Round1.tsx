import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { NEON_PALETTE } from '../utils/constants';
import { bannerPath } from '../utils/paths';
import { GameCard } from '../components/GameCard';

export function Round1() {
  const { catalog, gameIndex, setModalGameId, setGameEliminated } = useApp();

  const consoles = useMemo(() => {
    if (!catalog) return [];
    return catalog.consoles.map((c) => ({
      ...c,
      name: c.name || c.id || 'Console',
      games: [...(c.games || [])].sort((a, b) => {
        const at = (a.sortTitle || a.title || '').toLowerCase();
        const bt = (b.sortTitle || b.title || '').toLowerCase();
        return at.localeCompare(bt);
      }),
    }));
  }, [catalog]);

  return (
    <div id="consoleGrid" className="board__grid">
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
