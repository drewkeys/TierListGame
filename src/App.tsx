import { AppProvider } from './context/AppContext';
import { useApp } from './context/useApp';
import { Topbar } from './components/Topbar';
import { ElimCounter } from './components/ElimCounter';
import { HUD } from './components/HUD';
import { GameModal } from './components/GameModal';
import { Round } from './pages/Rounds';
import { useEffect } from "react";
import { ResumeSaveModal } from './components/ResumeSaveModal';
import './styles.css';

function AppContent() {
  const { activeRound } = useApp();
    useEffect(() => {
      const onBeforeUnload = (e: BeforeUnloadEvent) => {
        // Required for the browser to show the confirm dialog.
        e.preventDefault();
      };

      window.addEventListener("beforeunload", onBeforeUnload);
      return () => window.removeEventListener("beforeunload", onBeforeUnload);
    }, []);
  return (
    <>
      <div className="background-overlay" aria-hidden="true"></div>
      <Topbar />
      <ElimCounter />
      <main className="stage" role="main">
        <section className="app-viewport" aria-label={`Round ${activeRound} view`}>
          <Round round={activeRound} />
        </section>
      </main>
      <HUD />
      <GameModal />
      <ResumeSaveModal />
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
