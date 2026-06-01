import './InstructionModal.css';

interface InstructionModalProps {
  open: boolean;
  onClose: () => void;
}

export function InstructionModal({ open, onClose }: InstructionModalProps) {
  if (!open) return null;

  return (
    <div
      className="instructions-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="instructions-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="instructions-title"
      >
        <header className="instructions-modal__header">
          <div>
            <p className="instructions-modal__eyebrow">How to play</p>
            <h2 id="instructions-title">Game Rating Game</h2>
          </div>
          <button
            className="instructions-modal__close"
            type="button"
            onClick={onClose}
            aria-label="Close instructions"
          >
            Close
          </button>
        </header>

        <div className="instructions-modal__body">
          <article className="instructions-card">
            <h3>Round 1</h3>
            <p>Click a game for details. Give it 1 to 4 stars, or eliminate it with the space gun. Most should be 1 stars, some 2 stars, very few 3 or 4 stars.</p>
          </article>

          <article className="instructions-card">
            <h3>Round 2</h3>
            <p>Only 1-star games appear here. Pick your favorite from each group of three.</p>
          </article>

          <article className="instructions-card">
            <h3>Round 3</h3>
            <p>2-star games and Round 2 winners go head to head. Pick one winner from each pair.</p>
          </article>

          <article className="instructions-card">
            <h3>Round 4</h3>
            <p>Drag the final games into GOAT, S+, S, or S-. You can arrange games inside each tier.</p>
          </article>

          <article className="instructions-card instructions-card--warning">
            <h3>Important</h3>
            <p>Check your picks before moving on. Once you confirm the next round, earlier answers are locked.</p>
          </article>
        </div>
      </section>
    </div>
  );
}
