import { useState } from 'react';
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

export function GameCard({ game, selected = false, onClick, onEliminate }: GameCardProps) {
  const { getGameState, shootMode, activeRound } = useApp();
  const gameState = getGameState(game.id);
  const [isExploding, setIsExploding] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleClick = async () => {
    if (shootMode && activeRound === 1 && onEliminate && !gameState.eliminated) {
      setIsExploding(true);
      try {
        const audio = new Audio(ASSET_PATHS.explodeMp3);
        audio.volume = 0.02;
        audio.currentTime = 0;
        await audio.play();
      } catch (error) {
        console.error('Failed to play explosion sound:', error);
      }
      onEliminate();
      setTimeout(() => setIsExploding(false), 650);
    } else if (onClick) {
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
      <div className="explosion">
        <img alt="Explosion" src={ASSET_PATHS.explosionGif} />
      </div>
    </div>
  );
}
