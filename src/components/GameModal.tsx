import { useEffect, useRef } from 'react';
import { useApp } from '../context/useApp';
import { youtubeToEmbed } from '../utils/youtube';
import { Button } from './Button';
import './GameModal.css';

export function GameModal() {
  const { modalGameId, setModalGameId, gameIndex, getGameState, setGameStars, toggleGameEliminated, activeRound } =
    useApp();
  const videoRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!modalGameId && videoRef.current) {
      videoRef.current.src = 'about:blank';
    }
  }, [modalGameId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setModalGameId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setModalGameId]);

  if (!modalGameId) return null;

  const info = gameIndex.get(modalGameId);
  if (!info) return null;

  const { consoleName, game } = info;
  const gameState = getGameState(modalGameId);
  const embed = youtubeToEmbed(game.youtube || '');
  const isReadOnly = activeRound > 1;

  return (
    <>
      <div className="modal-backdrop" onClick={() => setModalGameId(null)} />
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
        <div className="modal__panel" onClick={(e) => e.stopPropagation()}>
          <div className="modal__header">
            <div>
              <div className="modal__console">{consoleName}</div>
              <h2 id="modalTitle" className="modal__title">
                {game.title || game.id}
              </h2>
            </div>
            <button className="modal__close" type="button" onClick={() => setModalGameId(null)}>
              Close
            </button>
          </div>

          <div className="modal__content">
            <div className="video-frame">
              {embed ? (
                <iframe
                  ref={videoRef}
                  title="Gameplay video"
                  src={embed}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <div className="no-video">No video available for this game.</div>
              )}
            </div>

            <div>
              <div className="detail-block">
                <div className="detail-label">Description</div>
                <p className="detail-paragraph">{game.description || ''}</p>
              </div>

              <div className="detail-block detail-block--spaced">
                <div className="detail-label">Rating</div>
                <div className="stars stars--spaced">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`star-btn ${i <= gameState.stars ? 'is-on' : ''}`}
                      role="button"
                      tabIndex={0}
                      aria-label={`Set ${i} star rating`}
                      onClick={() => !isReadOnly && setGameStars(modalGameId, i)}
                      onKeyDown={(e) => {
                        if ((e.key === 'Enter' || e.key === ' ') && !isReadOnly) {
                          e.preventDefault();
                          setGameStars(modalGameId, i);
                        }
                      }}
                    />
                  ))}
                </div>

                <div className="modal__actions">
                  <Button onClick={() => !isReadOnly && setGameStars(modalGameId, 0)} disabled={isReadOnly}>
                    0★
                  </Button>
                  <Button onClick={() => !isReadOnly && setGameStars(modalGameId, 1)} disabled={isReadOnly}>
                    1★
                  </Button>
                  <Button onClick={() => !isReadOnly && setGameStars(modalGameId, 2)} disabled={isReadOnly}>
                    2★
                  </Button>
                  <Button onClick={() => !isReadOnly && setGameStars(modalGameId, 3)} disabled={isReadOnly}>
                    3★
                  </Button>
                  <Button variant="danger" onClick={() => !isReadOnly && toggleGameEliminated(modalGameId)} disabled={isReadOnly}>
                    {gameState.eliminated ? 'Un-eliminate' : 'Eliminate'}
                  </Button>
                </div>

                {isReadOnly && (
                  <div className="modal__hint modal__hint--spaced">
                    This panel is read-only in Rounds 2–4. Return to Round 1 to change ratings.
                  </div>
                )}
                <div className="modal__hint">Tip: press <span className="kbd">Esc</span> to close.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
