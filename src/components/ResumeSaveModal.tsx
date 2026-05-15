import { useMemo, useState } from 'react';
import { Button } from './Button';
import { useApp } from '../context/useApp';
import { hasSavedProgress, loadSavedActiveRound } from '../utils/saveSlotStorage';
import './ResumeSaveModal.css';

const SEEN_THIS_SESSION_KEY = 'grg_resume_prompt_seen_session';

export function ResumeSaveModal() {
  const { activeRound, setActiveRound, reset } = useApp();

  const savedRound = useMemo(() => loadSavedActiveRound(), []);
  const [show, setShow] = useState(() => {
    const alreadyAsked = sessionStorage.getItem(SEEN_THIS_SESSION_KEY) === '1';
    const shouldShow = !alreadyAsked && hasSavedProgress() && Boolean(savedRound && savedRound > 1);

    if (shouldShow) {
      sessionStorage.setItem(SEEN_THIS_SESSION_KEY, '1');
    }

    return shouldShow;
  });

  if (!show || !savedRound) return null;

  return (
    <div className="resume-save" role="dialog" aria-modal="true" aria-label="Load current save">
      <div className="resume-save__panel">
        <div className="resume-save__title">Load Current Save?</div>

        <p className="resume-save__text">
          Found saved progress from Round {savedRound}. Continue where you left off?
        </p>

        <div className="resume-save__meta">
          Current screen: Round {activeRound}
        </div>

        <div className="resume-save__actions">
          <Button
            type="button"
            className="resume-save__btn"
            onClick={() => {
              reset();
              setShow(false);
            }}
          >
            New Game
          </Button>

          <Button
            type="button"
            className="resume-save__btn resume-save__btn--primary"
            onClick={() => {
              setActiveRound(savedRound);
              setShow(false);
            }}
          >
            Load Save
          </Button>
        </div>
      </div>
    </div>
  );
}