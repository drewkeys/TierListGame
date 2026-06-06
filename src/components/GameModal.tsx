import { useEffect, useMemo, useRef, useState } from 'react';
import type { Round2State, Round3State } from '../types';
import { useApp } from '../context/useApp';
import { youtubeToEmbed } from '../utils/youtube';
import { ASSET_PATHS } from '../utils/paths';
import { Button } from './Button';
import './GameModal.css';
import './Stars.css';

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

let cachedButtonAudio: HTMLAudioElement | null = null;
let cachedYayAudio: HTMLAudioElement | null = null;

function getCachedAudio(src: string, cacheName: 'button' | 'yay'): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;

  if (cacheName === 'button') {
    cachedButtonAudio ??= new Audio(src);
    return cachedButtonAudio;
  }

  cachedYayAudio ??= new Audio(src);
  return cachedYayAudio;
}

function playButtonSound(muted: boolean) {
  if (muted) return;

  try {
    const cachedAudio = getCachedAudio(ASSET_PATHS.buttonMp3, 'button');
    const audio = (cachedAudio ?? new Audio(ASSET_PATHS.buttonMp3)).cloneNode(true) as HTMLAudioElement;
    audio.currentTime = 0;

    void audio.play().catch((error) => {
      console.warn('Could not play button sound:', error);
    });
  } catch (error) {
    console.warn('Could not prepare button sound:', error);
  }
}

function playRatingSound(stars: number, muted: boolean) {
  if (muted) return;

  try {
    const src = stars === 4 ? ASSET_PATHS.yayMp3 : ASSET_PATHS.buttonMp3;
    const cachedAudio = getCachedAudio(src, stars === 4 ? 'yay' : 'button');
    const audio = (cachedAudio ?? new Audio(src)).cloneNode(true) as HTMLAudioElement;
    audio.currentTime = 0;

    void audio.play().catch((error) => {
      console.warn('Could not play rating sound:', error);
    });
  } catch (error) {
    console.warn('Could not prepare rating sound:', error);
  }
}

function withYoutubeApiParams(url: string, muted: boolean): string {
  if (!url) return url;

  try {
    const parsed = new URL(url, window.location.origin);

    parsed.searchParams.set('enablejsapi', '1');
    parsed.searchParams.set('origin', window.location.origin);
    parsed.searchParams.set('mute', muted ? '1' : '0');
    parsed.searchParams.set('playsinline', '1');

    return parsed.toString();
  } catch {
    const separator = url.includes('?') ? '&' : '?';
    const origin =
      typeof window !== 'undefined'
        ? encodeURIComponent(window.location.origin)
        : '';

    if (url.includes('enablejsapi=1')) {
      return `${url}${url.includes('?') ? '&' : '?'}mute=${muted ? '1' : '0'}&playsinline=1`;
    }

    return `${url}${separator}enablejsapi=1&origin=${origin}&mute=${muted ? '1' : '0'}&playsinline=1`;
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
  const [hoverStars, setHoverStars] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Warm these after first render so the first star click feels instant.
    getCachedAudio(ASSET_PATHS.buttonMp3, 'button');
    getCachedAudio(ASSET_PATHS.yayMp3, 'yay');
  }, []);

  useEffect(() => {
    if (!modalGameId && videoRef.current) {
      videoRef.current.src = 'about:blank';
    }
  }, [modalGameId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setModalGameId(null);
        return;
      }

      if (activeRound !== 1 || !modalGameId || e.repeat || e.altKey || e.ctrlKey || e.metaKey) {
        return;
      }

      const keyboardGameState = getGameState(modalGameId);
      if (keyboardGameState.eliminated) {
        return;
      }

      if (e.key >= '1' && e.key <= '4') {
        e.preventDefault();

        const stars = Number(e.key);
        playRatingSound(stars, muted);
        setGameStars(modalGameId, stars);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeRound, modalGameId, muted, getGameState, setGameStars, setModalGameId]);

  const info = modalGameId ? gameIndex.get(modalGameId) : null;
  const game = info?.game ?? null;

  const youtubeUrl = game?.youtube ?? '';

  const embed = useMemo(() => {
    if (!youtubeUrl) return '';
    return withYoutubeApiParams(youtubeToEmbed(youtubeUrl), muted);
  }, [youtubeUrl, muted]);

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
  const starsDisabled = activeRound === 1 && gameState.eliminated;

  const handlePickWinnerRound2 = () => {
    if (activeRound !== 2 || !modalGameId) return;

    playButtonSound(muted);

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
      // Important: preserve future history when editing an old answer.
      // Back/Next should behave like a review timeline, not erase later picks.
      let nextSteps = steps;
      let nextCursor = -1;
      let nextCurrentTrio: (string | '')[] = ['', '', ''];
      let nextCurrentPick: string | null = null;

      if (cursor >= 0) {
        const oldPick = steps[cursor]?.pick;
        if (oldPick && oldPick !== pickedId) {
          setGameR2Survived(oldPick, false);
        }

        nextSteps = steps.map((savedStep, index) => (index === cursor ? step : savedStep));

        const followingStep = nextSteps[cursor + 1];
        if (followingStep) {
          nextCursor = cursor + 1;
          nextCurrentTrio = followingStep.trio;
          nextCurrentPick = followingStep.pick;
        } else {
          const order = prev.shuffledIds ?? [];
          const nextStartIndex = nextSteps.length * 3;
          nextCurrentTrio =
            nextStartIndex < order.length ? makeTrio(order, nextStartIndex) : ['', '', ''];
        }
      } else {
        nextSteps = [...steps, step];

        const order = prev.shuffledIds ?? [];
        const nextStartIndex = nextSteps.length * 3;
        nextCurrentTrio =
          nextStartIndex < order.length ? makeTrio(order, nextStartIndex) : ['', '', ''];
      }

      setGameR2Survived(pickedId, true);

      return {
        ...prev,
        steps: nextSteps,
        cursor: nextCursor,
        currentPick: nextCurrentPick,
        currentTrio: nextCurrentTrio,
      };
    });

    setModalGameId(null);
  };

  const handlePickWinnerRound3 = () => {
    if (activeRound !== 3 || !modalGameId) return;

    playButtonSound(muted);

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
      // Important: preserve future history when editing an old answer.
      // Back/Next should behave like a review timeline, not erase later picks.
      let nextSteps = steps;
      let nextCursor = -1;
      let nextCurrentPair: (string | '')[] = ['', ''];
      let nextCurrentPick: string | null = null;

      if (cursor >= 0) {
        const oldPick = steps[cursor]?.pick;
        if (oldPick && oldPick !== pickedId) {
          setGameR3Survived(oldPick, false);
        }

        nextSteps = steps.map((savedStep, index) => (index === cursor ? step : savedStep));

        const followingStep = nextSteps[cursor + 1];
        if (followingStep) {
          nextCursor = cursor + 1;
          nextCurrentPair = followingStep.pair;
          nextCurrentPick = followingStep.pick;
        } else {
          const order = prev.shuffledIds ?? [];
          const nextStartIndex = nextSteps.length * 2;
          nextCurrentPair =
            nextStartIndex < order.length ? makePair(order, nextStartIndex) : ['', ''];
        }
      } else {
        nextSteps = [...steps, step];

        const order = prev.shuffledIds ?? [];
        const nextStartIndex = nextSteps.length * 2;
        nextCurrentPair =
          nextStartIndex < order.length ? makePair(order, nextStartIndex) : ['', ''];
      }

      setGameR3Survived(pickedId, true);

      return {
        ...prev,
        steps: nextSteps,
        cursor: nextCursor,
        currentPick: nextCurrentPick,
        currentPair: nextCurrentPair,
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

            <div className="modal__details">
              <div className="detail-block modal__description-block">
                <div className="detail-label">Description</div>
                <p className="detail-paragraph">{game.description || ''}</p>
              </div>

              <div className="detail-block detail-block--spaced modal__controls-row">
                <div className="modal__hint">
                  Tip: press <span className="kbd">1</span> to <span className="kbd">4</span> to rate. Press <span className="kbd">Esc</span> to close.
                </div>

                {activeRound === 1 && (
                  <div className="modal__rating-controls">
                    <Button
                      variant="danger"
                      onClick={() => setGameEliminated(modalGameId, !gameState.eliminated)}
                    >
                      {gameState.eliminated ? 'Un-eliminate' : 'Eliminate'}
                    </Button>

                    <div
                      className={`stars stars--spaced ${starsDisabled ? 'stars--disabled' : ''}`.trim()}
                      onMouseLeave={() => setHoverStars(0)}
                      aria-label={
                        starsDisabled
                          ? 'Star rating disabled while this game is eliminated'
                          : 'Star rating'
                      }
                    >
                      {[1, 2, 3, 4].map((i) => {
                        const selectedStars = gameState.stars;
                        const isSelected = !starsDisabled && i <= selectedStars;
                        const isPreview = !starsDisabled && hoverStars > 0 && i <= hoverStars && hoverStars !== selectedStars;

                        return (
                          <button
                            key={i}
                            type="button"
                            className={`star-btn ${isSelected ? 'is-selected' : ''} ${isPreview ? 'is-preview' : ''}`.trim()}
                            disabled={starsDisabled}
                            aria-pressed={isSelected}
                            aria-label={`Set ${i} star rating`}
                            title={
                              starsDisabled
                                ? 'Un-eliminate this game before rating it'
                                : `Set ${i} star rating`
                            }
                            onMouseEnter={() => {
                              if (!starsDisabled) setHoverStars(i);
                            }}
                            onFocus={() => {
                              if (!starsDisabled) setHoverStars(i);
                            }}
                            onBlur={() => setHoverStars(0)}
                            onClick={() => {
                              if (starsDisabled) return;
                              playRatingSound(i, muted);
                              setGameStars(modalGameId, i);
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}