import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useApp } from '../context/useApp';
import { ROUND_CONFIG } from '../utils/constants';
import { ASSET_PATHS, coverPath } from '../utils/paths';
import { useRoundGames } from '../hooks/useRoundGames';

// Round 4 is a TierMaker-style board.
// Eligible games begin in the pool and can be dragged into S+, S, or S-.
type TierId = 'S+' | 'S' | 'S-' | 'pool';

type BoardTierId = Exclude<TierId, 'pool'>;

type TierAssignments = Record<string, TierId>;

const TIERS: BoardTierId[] = ['S+', 'S', 'S-'];
const VALID_TIER_IDS = new Set<TierId>(['S+', 'S', 'S-', 'pool']);
const STORAGE_KEY = 'grg_round4_tiers_v1';

function isTierId(value: unknown): value is TierId {
  return typeof value === 'string' && VALID_TIER_IDS.has(value as TierId);
}

function loadTierAssignments(): TierAssignments {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};

    const cleaned: TierAssignments = {};

    for (const [gameId, tier] of Object.entries(parsed)) {
      if (typeof gameId === 'string' && isTierId(tier)) {
        cleaned[gameId] = tier;
      }
    }

    return cleaned;
  } catch {
    return {};
  }
}

function saveTierAssignments(assignments: TierAssignments) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assignments));
  } catch (error) {
    console.error('Failed to save Round 4 tier assignments:', error);
  }
}

type DroppableZoneProps = {
  id: TierId;
  className: string;
  ariaLabel: string;
  isClickTarget: boolean;
  onPlaceSelected: (tier: TierId) => void;
  children: ReactNode;
};

function DroppableZone({
  id,
  className,
  ariaLabel,
  isClickTarget,
  onPlaceSelected,
  children,
}: DroppableZoneProps) {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`${className}${isOver ? ' is-over' : ''}${isClickTarget ? ' is-click-target' : ''}`}
      role="region"
      aria-label={ariaLabel}
      onClick={() => onPlaceSelected(id)}
    >
      {children}
    </div>
  );
}

type TierIconVisualProps = {
  title: string;
  imageSrc: string;
  stars: number;
  className?: string;
};

function TierIconVisual({ title, imageSrc, stars, className = '' }: TierIconVisualProps) {
  const safeStars = Math.max(0, Math.min(4, Number(stars) || 0));

  return (
    <span className={`tier-icon-visual${className ? ` ${className}` : ''}`} title={title}>
      <span className="tier-icon-cover">
        <img
          src={imageSrc}
          alt={title}
          draggable={false}
          onError={(event) => {
            event.currentTarget.src = ASSET_PATHS.coverFallback;
          }}
        />
      </span>
      <span className="tier-icon-name">{title}</span>
      <span className="tier-icon-stars" aria-label={`${safeStars} out of 4 stars`}>
        {[1, 2, 3, 4].map((star) => (
          <img
            key={star}
            src={ASSET_PATHS.starPng}
            alt=""
            aria-hidden="true"
            className={star <= safeStars ? 'on' : 'off'}
            draggable={false}
          />
        ))}
      </span>
    </span>
  );
}

type DraggableGameIconProps = {
  gameId: string;
  title: string;
  imageSrc: string;
  stars: number;
  isActive: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onOpen: () => void;
};

function DraggableGameIcon({
  gameId,
  title,
  imageSrc,
  stars,
  isActive,
  isSelected,
  onSelect,
  onOpen,
}: DraggableGameIconProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: gameId,
    data: { type: 'round4-game', gameId },
  });

  const style: CSSProperties = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <button
      ref={setNodeRef}
      type="button"
      className={`tier-icon${isDragging || isActive ? ' is-dragging' : ''}${isSelected ? ' is-selected' : ''}`}
      style={style}
      title={`${title} — drag to a tier, single-click to select, double-click to open details`}
      aria-label={`${title}. Drag to a tier. Single-click to select. Double-click to open details.`}
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
      onDoubleClick={(event) => {
        event.stopPropagation();
        onOpen();
      }}
      {...listeners}
      {...attributes}
    >
      <TierIconVisual title={title} imageSrc={imageSrc} stars={stars} />
    </button>
  );
}

export function Round4View() {
  const config = ROUND_CONFIG[4];
  const { gameIndex, excludedGameIds, setModalGameId, getGameState } = useApp();
  const gameEntries = useRoundGames(4);

  const [assignments, setAssignments] = useState<TierAssignments>(() => loadTierAssignments());
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 120, tolerance: 8 },
    }),
  );

  const round4Games = useMemo(() => {
    const ids: string[] = [];
    const seen = new Set<string>();

    function add(id: string) {
      if (excludedGameIds.has(id)) return;
      if (seen.has(id)) return;
      if (!gameIndex.has(id)) return;

      seen.add(id);
      ids.push(id);
    }

    // 3-star games from Round 1.
    const threeStarGroups = gameEntries[2] || [];
    for (const group of threeStarGroups) {
      for (const entry of group.games) {
        add(entry.game.id);
      }
    }

    // 4-star games from Round 1.
    const fourStarGroups = gameEntries[3] || [];
    for (const group of fourStarGroups) {
      for (const entry of group.games) {
        add(entry.game.id);
      }
    }

    // Round 3 survivors.
    const allRatedGroups = gameEntries[4] || [];
    for (const group of allRatedGroups) {
      for (const entry of group.games) {
        if (entry.gameState.r3Survived === true) {
          add(entry.game.id);
        }
      }
    }

    return ids
      .map((id) => gameIndex.get(id))
      .filter(Boolean)
      .sort((a, b) => {
        const at = (a!.game.sortTitle || a!.game.title || '').toLowerCase();
        const bt = (b!.game.sortTitle || b!.game.title || '').toLowerCase();
        return at.localeCompare(bt);
      });
  }, [gameEntries, excludedGameIds, gameIndex]);

  const eligibleIds = useMemo(() => {
    return new Set(round4Games.map((entry) => entry!.game.id));
  }, [round4Games]);

  // Keep saved Round 4 tier data aligned with the current eligible game set.
  useEffect(() => {
    setAssignments((prev) => {
      let changed = false;
      const next: TierAssignments = {};

      for (const [gameId, tier] of Object.entries(prev)) {
        if (eligibleIds.has(gameId) && isTierId(tier)) {
          next[gameId] = tier;
        } else {
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  }, [eligibleIds]);

  useEffect(() => {
    saveTierAssignments(assignments);
  }, [assignments]);

  const gamesByTier = useMemo(() => {
    const grouped: Record<TierId, string[]> = {
      'S+': [],
      S: [],
      'S-': [],
      pool: [],
    };

    for (const entry of round4Games) {
      if (!entry) continue;

      const id = entry.game.id;
      const tier = assignments[id] || 'pool';

      if (isTierId(tier)) {
        grouped[tier].push(id);
      } else {
        grouped.pool.push(id);
      }
    }

    return grouped;
  }, [round4Games, assignments]);

  const activeGame = activeGameId ? gameIndex.get(activeGameId)?.game : null;
  const activeGameStars = activeGameId ? getGameState(activeGameId).stars : 0;

  function placeGameInTier(gameId: string, targetTier: TierId) {
    if (!eligibleIds.has(gameId)) return;

    setAssignments((prev) => ({
      ...prev,
      [gameId]: targetTier,
    }));
  }

  function handlePlaceSelected(targetTier: TierId) {
    if (!selectedGameId || !eligibleIds.has(selectedGameId)) return;

    placeGameInTier(selectedGameId, targetTier);
    setSelectedGameId(null);
  }

  function handleToggleSelected(gameId: string) {
    setSelectedGameId((prev) => (prev === gameId ? null : gameId));
  }

  function handleDragStart(event: DragStartEvent) {
    const gameId = String(event.active.id);

    if (eligibleIds.has(gameId)) {
      setSelectedGameId(null);
      setActiveGameId(gameId);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const gameId = String(event.active.id);
    const targetTier = event.over?.id == null ? null : String(event.over.id);

    setActiveGameId(null);

    if (!targetTier || !isTierId(targetTier) || !eligibleIds.has(gameId)) {
      return;
    }

    placeGameInTier(gameId, targetTier);
    setSelectedGameId(null);
  }

  function renderIcon(gameId: string) {
    const info = gameIndex.get(gameId);
    if (!info) return null;

    return (
      <DraggableGameIcon
        key={gameId}
        gameId={gameId}
        title={info.game.title || info.game.id}
        imageSrc={coverPath(info.game)}
        stars={getGameState(gameId).stars}
        isActive={activeGameId === gameId}
        isSelected={selectedGameId === gameId}
        onSelect={() => handleToggleSelected(gameId)}
        onOpen={() => setModalGameId(gameId)}
      />
    );
  }

  return (
    <section className={config.containerClass} aria-label={config.title}>
      <header className="round-header">
        <h1 className="round-title">{config.title}</h1>
        {config.subtitle && <p className="round-subtitle">{config.subtitle}</p>}
        <p className="round-subtitle round4-touch-tip">
          Tip: drag games into a tier, or tap a game once and then tap a tier to place it.
        </p>
      </header>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <section className="tier-board" aria-label="Tier board">
          {TIERS.map((tier) => (
            <div className="tier-row" data-tier={tier} key={tier}>
              <div className="tier-label" aria-label={`${tier} tier`}>
                {tier}
              </div>

              <DroppableZone
                id={tier}
                className="tier-drop"
                ariaLabel={`${tier} tier drop zone`}
                isClickTarget={Boolean(selectedGameId)}
                onPlaceSelected={handlePlaceSelected}
              >
                {gamesByTier[tier].map(renderIcon)}
              </DroppableZone>
            </div>
          ))}
        </section>

        <section className="tier-pool-wrapper" aria-label="Unassigned games pool">
          <h2 className="tier-pool-title">Pool</h2>

          <DroppableZone
            id="pool"
            className="tier-pool"
            ariaLabel="Unassigned games pool"
            isClickTarget={Boolean(selectedGameId)}
            onPlaceSelected={handlePlaceSelected}
          >
            {gamesByTier.pool.length > 0 ? (
              gamesByTier.pool.map(renderIcon)
            ) : (
              <div className="loading-card">Pool is empty. Drag games back here to unassign them.</div>
            )}
          </DroppableZone>
        </section>

        <DragOverlay className="tier-drag-overlay" dropAnimation={null}>
          {activeGame ? (
            <TierIconVisual
              title={activeGame.title || activeGame.id}
              imageSrc={coverPath(activeGame)}
              stars={activeGameStars}
              className="tier-icon-visual--overlay"
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </section>
  );
}
