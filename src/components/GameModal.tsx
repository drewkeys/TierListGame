import { useEffect, useRef } from 'react';
import { useApp } from '../context/useApp';
import { youtubeToEmbed } from '../utils/youtube';
import { Button } from './Button';
import './GameModal.css';

export function GameModal() {
  const {
    modalGameId,
    setModalGameId,
    gameIndex,
    getGameState,
    setGameStars,

    // Prefer explicit setter over toggle (more predictable)
    setGameEliminated,

    // Round 2 selection support
    setGameR2Survived,
    updateRound2,

    activeRound,
  } = useApp() as any;

  const videoRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!modalGameId && videoRef.current) {
      videoRef.current.src = 'about:blank';
    }
  }, [modalGameId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModalGameId(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setModalGameId]);

  // Keep Round 3 using RemoveEntryModal (as your current codebase expects)
  if (!modalGameId || activeRound === 3) return null;

  const info = gameIndex.get(modalGameId);
  if (!info) return null;

  const { consoleName, game } = info;
  const gameState = getGameState(modalGameId);
  const embed = youtubeToEmbed(game.youtube || '');

  // Round 2+ should be read-only for rating/eliminate
  const isReadOnly = activeRound > 1;

  const handlePickWinnerRound2 = () => {
    if (activeRound !== 2) return;

    // Mark survivor so Round 3 can consume it
    setGameR2Survived(modalGameId, true);

    // Commit this trio selection into Round 2 history and force next trio
    updateRound2((prev: any) => {
      const step = { trio: prev.currentTrio, pick: modalGameId };

      // If user previously went "back" and is rewriting history, truncate forward steps
      const baseSteps =
        typeof prev.cursor === 'number' && prev.cursor < prev.steps.length - 1
          ? prev.steps.slice(0, prev.cursor + 1)
          : prev.steps;

      const nextSteps = [...baseSteps, step];

      return {
        ...prev,
        steps: nextSteps,
        cursor: nextSteps.length - 1,
        currentPick: null,
        currentTrio: ['', '', ''], // clears so Round 2 view generates next trio
      };
    });

    setModalGameId(null);
  };

  return (
    <>
      <div className="modal-backdrop" onClick={() => setModalGameId(null)} />
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modalTitle"
        onClick={() => setModalGameId(null)} // click outside closes
      >
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
                      onClick={() => {
                        if (isReadOnly) return;
                        setGameStars(modalGameId, i);
                      }}
                      onKeyDown={(e) => {
                        if (isReadOnly) return;
                        if (e.key === 'Enter' || e.key === ' ') {
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

                  <Button
                    variant="danger"
                    disabled={isReadOnly}
                    onClick={() => {
                      if (isReadOnly) return;
                      setGameEliminated(modalGameId, !gameState.eliminated);
                    }}
                  >
                    {gameState.eliminated ? 'Un-eliminate' : 'Eliminate'}
                  </Button>

                  {/* Round 2 specific action */}
                  {activeRound === 2 && (
                    <Button variant="magenta" onClick={handlePickWinnerRound2}>
                      Pick this winner
                    </Button>
                  )}
                </div>

                {isReadOnly && (
                  <div className="modal__hint modal__hint--spaced">
                    This panel is read-only in Rounds 2–4. Return to Round 1 to change ratings.
                  </div>
                )}
                <div className="modal__hint">
                  Tip: press <span className="kbd">Esc</span> to close.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
