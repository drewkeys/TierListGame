import { useEffect, useRef } from 'react';
import { useApp } from '../context/useApp';
import { youtubeToEmbed } from '../utils/youtube';
import { Button } from './Button';
import './GameModal.css';

function makeTrio(ids: string[], startIndex: number): (string | '')[] {
  const trio = ids.slice(startIndex, startIndex + 3);
  while (trio.length < 3) trio.push('');
  return trio as (string | '')[];
}

export function GameModal() {
  const {
    modalGameId,
    setModalGameId,
    gameIndex,
    getGameState,
    setGameStars,
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

  // Keep Round 3 using RemoveEntryModal if your current codebase expects that.
  if (!modalGameId || activeRound === 3) return null;

  const info = gameIndex.get(modalGameId);
  if (!info) return null;

  const { consoleName, game } = info;
  const gameState = getGameState(modalGameId);
  const embed = youtubeToEmbed(game.youtube || '');

  const handlePickWinnerRound2 = () => {
    if (activeRound !== 2 || !modalGameId) return;

    const pickedId = modalGameId;

    updateRound2((prev: any) => {
      const currentTrio = prev.currentTrio ?? ['', '', ''];
      const cursor = typeof prev.cursor === 'number' ? prev.cursor : -1;
      const steps = prev.steps ?? [];

      const step = {
        trio: currentTrio,
        pick: pickedId,
      };

      /*
        cursor === -1 means we are on the live/newest trio.
        cursor >= 0 means we are viewing old history and may be changing an answer.
      */

      if (cursor >= 0) {
        // Remove survivor status from all future steps because they are being discarded.
        const futureSteps = steps.slice(cursor + 1);
        for (const futureStep of futureSteps) {
          if (futureStep.pick) {
            setGameR2Survived(futureStep.pick, false);
          }
        }

        // If replacing the saved pick for this historical trio, unset the old pick.
        const oldPick = steps[cursor]?.pick;
        if (oldPick && oldPick !== pickedId) {
          setGameR2Survived(oldPick, false);
        }
      }

      // Save the new winner.
      setGameR2Survived(pickedId, true);

      /*
        Important:
        If cursor is 2, we are replacing step 2.
        Keep steps 0 and 1, then append the replacement step.
        Do NOT use slice(0, cursor + 1), or you keep the old step and duplicate it.
      */
      const baseSteps = cursor >= 0 ? steps.slice(0, cursor) : steps;
      const nextSteps = [...baseSteps, step];

      const order = prev.shuffledIds ?? [];
      const nextStartIndex = nextSteps.length * 3;

      const nextTrio =
        nextStartIndex < order.length ? makeTrio(order, nextStartIndex) : ['', '', ''];

      return {
        ...prev,
        steps: nextSteps,
        cursor: -1,
        currentPick: null,
        currentTrio: nextTrio,
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
        onClick={() => setModalGameId(null)}
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
                {activeRound === 1 && (
                  <>
                    <div className="detail-label">Rating</div>

                    <div className="stars stars--spaced">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`star-btn ${i <= gameState.stars ? 'is-on' : ''}`}
                          role="button"
                          tabIndex={0}
                          aria-label={`Set ${i} star rating`}
                          onClick={() => setGameStars(modalGameId, i)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setGameStars(modalGameId, i);
                            }
                          }}
                        />
                      ))}
                    </div>

                    <div className="modal__actions">
                      <Button onClick={() => setGameStars(modalGameId, 0)}>0★</Button>
                      <Button onClick={() => setGameStars(modalGameId, 1)}>1★</Button>
                      <Button onClick={() => setGameStars(modalGameId, 2)}>2★</Button>
                      <Button onClick={() => setGameStars(modalGameId, 3)}>3★</Button>
                      <Button onClick={() => setGameStars(modalGameId, 4)}>4★</Button>

                      <Button
                        variant="danger"
                        onClick={() => setGameEliminated(modalGameId, !gameState.eliminated)}
                      >
                        {gameState.eliminated ? 'Un-eliminate' : 'Eliminate'}
                      </Button>
                    </div>
                  </>
                )}

                {activeRound === 2 && (
                  <div className="modal__actions">
                    <Button variant="magenta" onClick={handlePickWinnerRound2}>
                      Pick this winner
                    </Button>
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