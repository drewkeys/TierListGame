import { useEffect, useMemo, type CSSProperties } from 'react';
import { useApp } from '../context/useApp';
import { Button } from '../components/Button';
import { ASSET_PATHS, coverPath } from '../utils/paths';
import './ResultsScreen.css';

type ResultTierId = 'GOAT' | 'S+' | 'S' | 'S-' | 'pool';
type BoardResultTierId = Exclude<ResultTierId, 'pool'>;
type TierAssignments = Record<string, ResultTierId>;
type TierOrder = Record<ResultTierId, string[]>;

const ROUND4_TIERS_KEY = 'grg_round4_tiers_v1';
const ROUND4_ORDER_KEY = 'grg_round4_order_v1';
const RESULT_TIERS: BoardResultTierId[] = ['GOAT', 'S+', 'S', 'S-'];
const ALL_TIERS: ResultTierId[] = ['GOAT', 'S+', 'S', 'S-', 'pool'];
const VALID_TIERS = new Set<ResultTierId>(ALL_TIERS);

function emptyTierOrder(): TierOrder {
  return {
    GOAT: [],
    'S+': [],
    S: [],
    'S-': [],
    pool: [],
  };
}

function loadTierAssignments(): TierAssignments {
  try {
    const raw = localStorage.getItem(ROUND4_TIERS_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};

    const cleaned: TierAssignments = {};

    for (const [gameId, tier] of Object.entries(parsed)) {
      if (typeof gameId === 'string' && typeof tier === 'string' && VALID_TIERS.has(tier as ResultTierId)) {
        cleaned[gameId] = tier as ResultTierId;
      }
    }

    return cleaned;
  } catch {
    return {};
  }
}

function loadTierOrder(): TierOrder {
  const cleaned = emptyTierOrder();

  try {
    const raw = localStorage.getItem(ROUND4_ORDER_KEY);
    if (!raw) return cleaned;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return cleaned;

    for (const tier of ALL_TIERS) {
      const ids = (parsed as Partial<TierOrder>)[tier];
      if (Array.isArray(ids)) {
        cleaned[tier] = ids.filter((id): id is string => typeof id === 'string');
      }
    }
  } catch {
    return cleaned;
  }

  return cleaned;
}

interface ResultsScreenProps {
  onBackToTiers: () => void;
}

export function ResultsScreen({ onBackToTiers }: ResultsScreenProps) {
  const { gameIndex, getGameState, muted } = useApp();

  useEffect(() => {
    if (muted) return;

    const audio = new Audio(ASSET_PATHS.celebrationMp3);
    void audio.play().catch(() => {
      // Some browsers block autoplay even after a click. The results screen still works.
    });
  }, [muted]);

  const assignments = useMemo(() => loadTierAssignments(), []);
  const savedOrder = useMemo(() => loadTierOrder(), []);

  const groupedResults = useMemo(() => {
    const grouped: Record<BoardResultTierId, string[]> = {
      GOAT: [],
      'S+': [],
      S: [],
      'S-': [],
    };

    const added = new Set<string>();

    for (const tier of RESULT_TIERS) {
      for (const gameId of savedOrder[tier]) {
        if (!gameIndex.has(gameId) || assignments[gameId] !== tier || added.has(gameId)) continue;
        grouped[tier].push(gameId);
        added.add(gameId);
      }
    }

    // Fallback for older saves that have assignments but no explicit saved ordering.
    for (const [gameId, tier] of Object.entries(assignments)) {
      if (!gameIndex.has(gameId) || tier === 'pool' || !RESULT_TIERS.includes(tier) || added.has(gameId)) continue;
      grouped[tier].push(gameId);
      added.add(gameId);
    }

    return grouped;
  }, [assignments, gameIndex, savedOrder]);

  return (
    <section className="results-screen" aria-label="Final results">
      <div className="cookie-confetti" aria-hidden="true">
        {Array.from({ length: 54 }, (_, index) => (
          <img
            key={index}
            src={ASSET_PATHS.cookiePng}
            alt=""
            style={
              {
                '--x': `${(index * 37) % 100}%`,
                '--delay': `${-((index * 0.17) % 5)}s`,
                '--duration': `${4.6 + (index % 5) * 0.25}s`,
                '--size': `${22 + (index % 5) * 7}px`,
                '--spin': `${index % 2 === 0 ? 1 : -1}`,
              } as CSSProperties
            }
            draggable={false}
          />
        ))}
      </div>

      <header className="results-header">
        <h1 className="results-heading">Results:</h1>
        <Button type="button" className="results-back-btn" onClick={onBackToTiers}>
          Back to Tier List
        </Button>
      </header>

      <div className="results-board">
        {RESULT_TIERS.map((tier) => {
          const ids = groupedResults[tier];

          return (
            <section className="results-tier" data-tier={tier} key={tier} aria-label={`${tier} results`}>
              <div className="results-tier__label">
                <span>{tier}</span>
                <strong>{ids.length}</strong>
              </div>

              <div className="results-tier__games">
                {ids.length > 0 ? (
                  ids.map((gameId) => {
                    const entry = gameIndex.get(gameId);
                    if (!entry) return null;

                    const stars = Math.max(0, Math.min(4, getGameState(gameId).stars || 0));

                    return (
                      <article className="results-game" key={gameId} title={entry.game.title}>
                        <img
                          className="results-game__cover"
                          src={coverPath(entry.game)}
                          alt={entry.game.title}
                          onError={(event) => {
                            event.currentTarget.src = ASSET_PATHS.coverFallback;
                          }}
                          draggable={false}
                        />
                        <div className="results-game__name">{entry.game.title}</div>
                        <div className="results-game__stars" aria-label={`${stars} out of 4 stars`}>
                          {[1, 2, 3, 4].map((star) => (
                            <img
                              key={star}
                              src={ASSET_PATHS.starPng}
                              alt=""
                              aria-hidden="true"
                              className={star <= stars ? 'on' : 'off'}
                              draggable={false}
                            />
                          ))}
                        </div>
                      </article>
                    );
                  })
                ) : null}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}
