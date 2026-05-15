import { useEffect, useMemo, useRef } from 'react';
import type { Round2State, Round3State } from '../types';
import { useApp } from '../context/useApp';
import { youtubeToEmbed } from '../utils/youtube';
import { Button } from './Button';
import './GameModal.css';

function makeTrio(ids: string[], startIndex: number): (string | '')[] {
  const trio = ids.slice(startIndex, startIndex + 3);
  while (trio.length < 3) trio.push('');
  return trio as (string | '')[];
}

function makePair(ids: string[], startIndex: number): (string | '')[] {
  const pair = ids.slice(startIndex, startIndex + 2);
  while (pair.length < 2) pair.push('');
  return pair as (string | '')[];
}

function withYoutubeApiParams(url: string): string {
  if (!url) return url;

  try {
    const parsed = new URL(url, window.location.origin);

    parsed.searchParams.set('enablejsapi', '1');
    parsed.searchParams.set('origin', window.location.origin);

    return parsed.toString();
  } catch {
    const separator = url.includes('?') ? '&' : '?';
    const origin =
      typeof window !== 'undefined'
        ? encodeURIComponent(window.location.origin)
        : '';

    if (url.includes('enablejsapi=1')) {
      return url;
    }

    return `${url}${separator}enablejsapi=1&origin=${origin}`;
  }
}

export function GameModal() {
  const {
    modalGameId,
    setModalGameId,
    gameIndex,
    getGameState,
    setGameStars,
    setGameEliminated,

    // Global audio state
    muted,

    // Round 2 / Round 3 selection support
    setGameR2Survived,
    setGameR3Survived,
    updateRound2,
    updateRound3,

    activeRound,
  } = useApp();

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

  const info = modalGameId ? gameIndex.get(modalGameId) : null;
  const game = info?.game ?? null;

  const youtubeUrl = game?.youtube ?? '';

  const embed = useMemo(() => {
    if (!youtubeUrl) return '';
    return withYoutubeApiParams(youtubeToEmbed(youtubeUrl));
  }, [youtubeUrl]);

  useEffect(() => {
    const iframe = videoRef.current;
    if (!iframe || !modalGameId || !embed) return;

    const sendYoutubeCommand = (func: string, args: unknown[] = []) => {
      iframe.contentWindow?.postMessage(
        JSON.stringify({
          event: 'command',
          func,
          args,
        }),
        '*'
      );
    };

    const applyAudioState = () => {
      if (muted) {
        sendYoutubeCommand('mute');
        sendYoutubeCommand('setVolume', [0]);
      } else {
        sendYoutubeCommand('unMute');
        sendYoutubeCommand('setVolume', [25]);
      }
    };

    // YouTube iframe is not always ready immediately, especially on mobile.
    // Re-send a few times so the command lands once the player is ready.
    const timers = [
      window.setTimeout(applyAudioState, 250),
      window.setTimeout(applyAudioState, 750),
      window.setTimeout(applyAudioState, 1500),
      window.setTimeout(applyAudioState, 2500),
    ];

    return () => {
      timers.forEach(window.clearTimeout);
    };
  }, [modalGameId, embed, muted]);

  if (!modalGameId) return null;

  if (!info || !game) return null;

  const { consoleName } = info;
  const gameState = getGameState(modalGameId);

  const handlePickWinnerRound2 = () => {
    if (activeRound !== 2 || !modalGameId) return;

    const pickedId = modalGameId;

    updateRound2((prev: Round2State) => {
      const currentTrio = prev.currentTrio ?? ['', '', ''];
      const cursor = typeof prev.cursor === 'number' ? prev.cursor : -1;
      const steps = prev.steps ?? [];

      const step = {
        trio: currentTrio,
        pick: pickedId,
      };

      // cursor -1 = live/newest trio.
      // cursor 0+ = viewing old history and replacing that answer.
      if (cursor >= 0) {
        const futureSteps = steps.slice(cursor + 1);

        for (const futureStep of futureSteps) {
          if (futureStep.pick) {
            setGameR2Survived(futureStep.pick, false);
          }
        }

        const oldPick = steps[cursor]?.pick;
        if (oldPick && oldPick !== pickedId) {
          setGameR2Survived(oldPick, false);
        }
      }

      setGameR2Survived(pickedId, true);

      // If replacing step 2, keep steps 0 and 1, then append the replacement.
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

  const handlePickWinnerRound3 = () => {
    if (activeRound !== 3 || !modalGameId) return;

    const pickedId = modalGameId;

    updateRound3((prev: Round3State) => {
      const currentPair = prev.currentPair ?? ['', ''];
      const cursor = typeof prev.cursor === 'number' ? prev.cursor : -1;
      const steps = prev.steps ?? [];

      const step = {
        pair: currentPair,
        pick: pickedId,
      };

      // cursor -1 = live/newest pair.
      // cursor 0+ = viewing old history and replacing that answer.
      if (cursor >= 0) {
        const futureSteps = steps.slice(cursor + 1);

        for (const futureStep of futureSteps) {
          if (futureStep.pick) {
            setGameR3Survived(futureStep.pick, false);
          }
        }

        const oldPick = steps[cursor]?.pick;
        if (oldPick && oldPick !== pickedId) {
          setGameR3Survived(oldPick, false);
        }
      }

      setGameR3Survived(pickedId, true);

      // If replacing step 2, keep steps 0 and 1, then append the replacement.
      const baseSteps = cursor >= 0 ? steps.slice(0, cursor) : steps;
      const nextSteps = [...baseSteps, step];

      const order = prev.shuffledIds ?? [];
      const nextStartIndex = nextSteps.length * 2;
      const nextPair =
        nextStartIndex < order.length ? makePair(order, nextStartIndex) : ['', ''];

      return {
        ...prev,
        steps: nextSteps,
        cursor: -1,
        currentPick: null,
        currentPair: nextPair,
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

                {activeRound === 3 && (
                  <div className="modal__actions">
                    <Button variant="magenta" onClick={handlePickWinnerRound3}>
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