import { useEffect, useRef, useState } from 'react';
import { AppProvider } from './context/AppContext';
import { useApp } from './context/useApp';
import { Topbar } from './components/Topbar';
import { ElimCounter } from './components/ElimCounter';
import { HUD } from './components/HUD';
import { GameModal } from './components/GameModal';
import { Round } from './pages/Rounds';
import { ResultsScreen } from './pages/ResultsScreen';
import { ResumeSaveModal } from './components/ResumeSaveModal';
import { InstructionModal } from './components/InstructionModal';
import './styles.css';

function AppContent() {
  const { activeRound } = useApp();
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const autoOpenedInstructions = useRef(false);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      // Required for the browser to show the confirm dialog.
      e.preventDefault();
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  useEffect(() => {
    if (activeRound === 1 && !autoOpenedInstructions.current) {
      autoOpenedInstructions.current = true;
      setInstructionsOpen(true);
    }

    if (activeRound !== 4) {
      setShowResults(false);
    }
  }, [activeRound]);

  return (
    <>
      <div className="background-overlay" aria-hidden="true"></div>
      <Topbar />
      <ElimCounter />
      <main className="stage" role="main">
        <section className="app-viewport" aria-label={showResults ? 'Final results view' : `Round ${activeRound} view`}>
          {showResults ? <ResultsScreen onBackToTiers={() => setShowResults(false)} /> : <Round round={activeRound} />}
        </section>
      </main>
      {!showResults && <HUD onShowResults={() => setShowResults(true)} />}
      <GameModal />
      <ResumeSaveModal />
      <InstructionModal open={instructionsOpen} onClose={() => setInstructionsOpen(false)} />
    </>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
