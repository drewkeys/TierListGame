import { useApp } from '../context/useApp';
import type { ActiveRound } from '../types';
import type { RoundConfig } from '../utils/constants';
import { Button } from './Button';
import './RoundNavigation.css';

interface RoundNavigationProps {
  round: ActiveRound;
  config: RoundConfig;
}

export function RoundNavigation({ round, config }: RoundNavigationProps) {
  const { setActiveRound } = useApp();
  const prevRound = (round > 1 ? (round - 1) as ActiveRound : null);

  // Don't render if no navClass is provided (e.g., Round 1)
  if (!config.navClass) {
    return null;
  }

  return (
    <div className={config.navClass}>
      {prevRound && (
        <Button
          variant="ghost"
          type="button"
          onClick={() => setActiveRound(prevRound)}
        >
          {config.backButtonText}
        </Button>
      )}
      {config.showNextButton && (
        <Button
          variant="magenta"
          type="button"
          disabled
        >
          {config.nextButtonText}
        </Button>
      )}
    </div>
  );
}
