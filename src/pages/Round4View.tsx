import { useCallback, useEffect, useMemo, useState } from 'react';
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
// Eligible games begin in the pool and can be dragged into GOAT, S+, S, or S-.
type TierId = 'GOAT' | 'S+' | 'S' | 'S-' | 'pool';

type BoardTierId = Exclude<TierId, 'pool'>;

type TierAssignments = Record<string, TierId>;
type TierOrder = Record<TierId, string[]>;

const TIERS: BoardTierId[] = ['GOAT', 'S+', 'S', 'S-'];
const ALL_TIER_IDS: TierId[] = ['GOAT', 'S+', 'S', 'S-', 'pool'];
const VALID_TIER_IDS = new Set<TierId>(ALL_TIER_IDS);
const STORAGE_KEY = 'grg_round4_tiers_v1';
const ORDER_STORAGE_KEY = 'grg_round4_order_v1';

function emptyTierOrder(): TierOrder {
  return {
    GOAT: [],
    'S+': [],
    S: [],
    'S-': [],
    pool: [],
  };
}

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

function loadTierOrder(): TierOrder {
  const cleaned = emptyTierOrder();

  try {
    const raw = localStorage.getItem(ORDER_STORAGE_KEY);
    if (!raw) return cleaned;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return cleaned;

    for (const tier of ALL_TIER_IDS) {
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

function saveTierOrder(order: TierOrder) {
  try {
    localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(order));
  } catch (error) {
    console.error('Failed to save Round 4 tier order:', error);
  }
}

function removeFromAllTiers(order: TierOrder, gameId: string): TierOrder {
  const next = emptyTierOrder();

  for (const tier of ALL_TIER_IDS) {
    next[tier] = order[tier].filter((id) => id !== gameId);
  }

  return next;
}

function playWooshSound(muted: boolean) {
  if (muted) return;

  try {
    const audio = new Audio(ASSET_PATHS.wooshMp3);
    audio.currentTime = 0;

    void audio.play().catch((error) => {
      console.warn('Could not play Round 4 woosh sound:', error);
    });
  } catch (error) {
    console.warn('Could not create Round 4 woosh sound:', error);
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
  const { attributes, listeners, setNodeRef: setDraggableRef, transform, isDragging } = useDraggable({
    id: gameId,
    data: { type: 'round4-game', gameId },
  });

  const { isOver, setNodeRef: setDroppableRef } = useDroppable({
    id: `slot:${gameId}`,
    data: { type: 'round4-slot', gameId },
  });

  const setNodeRef = useCallback(
    (node: HTMLButtonElement | null) => {
      setDraggableRef(node);
      setDroppableRef(node);
    },
    [setDraggableRef, setDroppableRef]
  );

  const style: CSSProperties = {
    // DragOverlay renders the moving copy. Keep the source tile in the flex grid
    // as an invisible placeholder so it does not visually stack on top of other games.
    transform: isDragging ? undefined : CSS.Translate.toString(transform),
  };

  return (
    <button
      ref={setNodeRef}
      type="button"
      className={`tier-icon${isDragging || isActive ? ' is-dragging' : ''}${isSelected ? ' is-selected' : ''}${isOver ? ' is-slot-over' : ''}`}
      style={style}
      title={`${title}. Drag to a tier, single-click to select, double-click to open details`}
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
  const { gameIndex, excludedGameIds, setModalGameId, getGameState, muted } = useApp();
  const gameEntries = useRoundGames(4);

  const [assignments, setAssignments] = useState<TierAssignments>(() => loadTierAssignments());
  const [tierOrder, setTierOrder] = useState<TierOrder>(() => loadTierOrder());
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);

  useEffect(() => {
    const audio = new Audio(ASSET_PATHS.wooshMp3);
    audio.preload = 'auto';
  }, []);

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

  const visibleAssignments = useMemo(() => {
    const next: TierAssignments = {};

    for (const [gameId, tier] of Object.entries(assignments)) {
      if (eligibleIds.has(gameId) && isTierId(tier)) {
        next[gameId] = tier;
      }
    }

    return next;
  }, [assignments, eligibleIds]);

  const normalizedTierOrder = useMemo(() => {
    const next = emptyTierOrder();
    const added = new Set<string>();

    for (const tier of ALL_TIER_IDS) {
      for (const gameId of tierOrder[tier] || []) {
        const assignedTier = visibleAssignments[gameId] || 'pool';
        if (!eligibleIds.has(gameId) || assignedTier !== tier || added.has(gameId)) continue;

        next[tier].push(gameId);
        added.add(gameId);
      }
    }

    for (const entry of round4Games) {
      if (!entry) continue;
      const gameId = entry.game.id;
      if (added.has(gameId)) continue;

      const tier = visibleAssignments[gameId] || 'pool';
      next[tier].push(gameId);
      added.add(gameId);
    }

    return next;
  }, [eligibleIds, round4Games, tierOrder, visibleAssignments]);

  useEffect(() => {
    saveTierAssignments(visibleAssignments);
  }, [visibleAssignments]);

  useEffect(() => {
    saveTierOrder(normalizedTierOrder);
  }, [normalizedTierOrder]);

  const gamesByTier = normalizedTierOrder;

  const activeGame = activeGameId ? gameIndex.get(activeGameId)?.game : null;
  const activeGameStars = activeGameId ? getGameState(activeGameId).stars : 0;

  function placeGameInTier(gameId: string, targetTier: TierId, playDropSound = false, beforeGameId?: string) {
    if (!eligibleIds.has(gameId)) return;
    if (beforeGameId && (!eligibleIds.has(beforeGameId) || beforeGameId === gameId)) return;

    const currentTier = visibleAssignments[gameId] || 'pool';

    setAssignments({
      ...visibleAssignments,
      [gameId]: targetTier,
    });

    setTierOrder((prev) => {
      const next = removeFromAllTiers(normalizedTierOrder || prev, gameId);
      const targetList = next[targetTier];
      const beforeIndex = beforeGameId ? targetList.indexOf(beforeGameId) : -1;

      if (beforeIndex >= 0) {
        targetList.splice(beforeIndex, 0, gameId);
      } else {
        targetList.push(gameId);
      }

      return next;
    });

    if (playDropSound && targetTier !== 'pool' && (targetTier !== currentTier || Boolean(beforeGameId))) {
      playWooshSound(muted);
    }
  }

  function handlePlaceSelected(targetTier: TierId) {
    if (!selectedGameId || !eligibleIds.has(selectedGameId)) return;

    placeGameInTier(selectedGameId, targetTier, true);
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
    const targetId = event.over?.id == null ? null : String(event.over.id);

    setActiveGameId(null);

    if (!targetId || !eligibleIds.has(gameId)) {
      return;
    }

    if (targetId.startsWith('slot:')) {
      const beforeGameId = targetId.slice('slot:'.length);
      if (!eligibleIds.has(beforeGameId) || beforeGameId === gameId) return;

      const targetTier = visibleAssignments[beforeGameId] || 'pool';
      placeGameInTier(gameId, targetTier, true, beforeGameId);
      setSelectedGameId(null);
      return;
    }

    if (!isTierId(targetId)) {
      return;
    }

    placeGameInTier(gameId, targetId, true);
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
      <header className="round-header round4-header-panel">
        <div className="round4-header-panel__bar">
          <h1 className="round-title">{config.title}</h1>
        </div>
        <div className="round4-header-panel__body">
          {config.subtitle && <p className="round-subtitle">{config.subtitle}</p>}
          <p className="round-subtitle round4-touch-tip">
            Tip: drag games into a tier, or tap a game once and then tap a tier to place it.
          </p>
        </div>
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
