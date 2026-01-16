import { useEffect } from 'react';
import { Button } from './Button';
import './RemoveEntryModal.css';

interface RemoveEntryModalProps {
  gameId: string | null;
  gameTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function RemoveEntryModal({ gameId, gameTitle, onConfirm, onCancel }: RemoveEntryModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  if (!gameId) return null;

  return (
    <>
      <div className="modal-backdrop" onClick={onCancel} />
      <div className="modal remove-entry-modal" role="dialog" aria-modal="true" aria-labelledby="removeModalTitle">
        <div className="modal__panel" onClick={(e) => e.stopPropagation()}>
          <div className="modal__header">
            <h2 id="removeModalTitle" className="modal__title">Remove Entry</h2>
            <button className="modal__close" type="button" onClick={onCancel}>
              Close
            </button>
          </div>

          <div className="modal__content">
            <div className="remove-entry-modal__body">
              <p className="remove-entry-modal__text">
                Do you want to remove <strong>{gameTitle}</strong> from the lineup?
              </p>
              <p className="remove-entry-modal__hint">
                This will remove the entry from the current selection and it will no longer appear in this round.
              </p>
            </div>

            <div className="modal__actions">
              <Button variant="default" onClick={onCancel}>
                Cancel
              </Button>
              <Button variant="danger" onClick={onConfirm}>
                Remove Entry
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
