import { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/useApp';
import type { Game } from '../types';
import { coverPath, ASSET_PATHS } from '../utils/paths';
import { Stars } from './Stars';
import './GameCard.css';

interface GameCardProps {
  game: Game;
  consoleName?: string;
  neon?: string;
  selected?: boolean;
  onClick?: () => void;
  onEliminate?: () => void;
}

let explosionAssetsPreloaded = false;
let cachedExplosionAudio: HTMLAudioElement | null = null;

function preloadExplosionAssets() {
  if (explosionAssetsPreloaded) return;
  explosionAssetsPreloaded = true;

  const explosionImg = new Image();
  explosionImg.src = ASSET_PATHS.explosionGif;

  cachedExplosionAudio = new Audio(ASSET_PATHS.explodeMp3);
  cachedExplosionAudio.preload = 'auto';
  cachedExplosionAudio.volume = 0.02;
  cachedExplosionAudio.load();
}

function playExplosionSoundClientSide(muted: boolean) {
  if (muted) return;
  try {
    const sourceAudio = cachedExplosionAudio ?? new Audio(ASSET_PATHS.explodeMp3);

    // Clone so rapid eliminations can overlap instead of restarting one audio element.
    const audio = sourceAudio.cloneNode(true) as HTMLAudioElement;
    audio.volume = 0.02;
    audio.currentTime = 0;

    // Never await audio. Browser/network audio behavior should not block UI feedback.
    void audio.play().catch((error) => {
      console.error('Failed to play explosion sound:', error);
    });
  } catch (error) {
    console.error('Failed to create explosion sound:', error);
  }
}

export function GameCard({ game, selected = false, onClick, onEliminate }: GameCardProps) {
  const { getGameState, shootMode, activeRound, muted } = useApp();
  const gameState = getGameState(game.id);

  const [isExploding, setIsExploding] = useState(false);
  const [explosionKey, setExplosionKey] = useState(0);
  const [imgError, setImgError] = useState(false);

  const explosionTimerRef = useRef<number | null>(null);
  const eliminateTimerRef = useRef<number | null>(null);
  const isBusyRef = useRef(false);

  useEffect(() => {
    preloadExplosionAssets();

    return () => {
      if (explosionTimerRef.current !== null) {
        window.clearTimeout(explosionTimerRef.current);
      }

      if (eliminateTimerRef.current !== null) {
        window.clearTimeout(eliminateTimerRef.current);
      }
    };
  }, []);

  const handleClick = () => {
    if (shootMode && activeRound === 1 && onEliminate && !gameState.eliminated) {
      if (isBusyRef.current) return;
      isBusyRef.current = true;

      if (explosionTimerRef.current !== null) {
        window.clearTimeout(explosionTimerRef.current);
      }

      if (eliminateTimerRef.current !== null) {
        window.clearTimeout(eliminateTimerRef.current);
      }

      // Client-side feedback first.
      const nextExplosionKey = explosionKey + 1;
      setExplosionKey(nextExplosionKey);
      setIsExploding(true);
      playExplosionSoundClientSide(muted);

      // Commit the elimination in the background after the browser has had time to paint the GIF.
      eliminateTimerRef.current = window.setTimeout(() => {
        onEliminate();
        eliminateTimerRef.current = null;
      }, 180);

      explosionTimerRef.current = window.setTimeout(() => {
        setIsExploding(false);
        isBusyRef.current = false;
        explosionTimerRef.current = null;
      }, 950);

      return;
    }

    if (onClick) {
      onClick();
    }
  };

  return (
    <div
      className={`game-card ${gameState.eliminated ? 'is-eliminated' : ''} ${
        isExploding ? 'is-exploding' : ''
      } ${selected ? 'is-selected' : ''}`.trim()}
      data-game-id={game.id}
      onClick={handleClick}
    >
      <div className="card-meta">
        {gameState.eliminated && <div className="card-elim">ELIM</div>}
      </div>

      <img
        className="cover"
        alt={game.title || game.id}
        loading="lazy"
        src={imgError ? ASSET_PATHS.coverFallback : coverPath(game)}
        onError={() => setImgError(true)}
      />

      <div className="caption">
        <div className="caption__title">{game.title || game.id}</div>
        <Stars stars={gameState.stars} />
      </div>

      {isExploding && (
        <div className="explosion" aria-hidden="true">
          <img
            key={explosionKey}
            alt=""
            src={ASSET_PATHS.explosionGif}
            draggable={false}
          />
        </div>
      )}
    </div>
  );
}
