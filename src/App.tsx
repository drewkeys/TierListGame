import { AppProvider } from './context/AppContext';
import { useApp } from './context/useApp';
import { Topbar } from './components/Topbar';
import { ElimCounter } from './components/ElimCounter';
import { HUD } from './components/HUD';
import { GameModal } from './components/GameModal';
import { Round } from './pages/Round';
import './styles.css';

function AppContent() {
  const { activeRound } = useApp();

  return (
    <>
      <div className="bg-overlay" aria-hidden="true"></div>
      <Topbar />
      <ElimCounter />
      <main className="stage">
        <section className="view-viewport">
          <div
            className={`view-slider ${
              activeRound ? `is-round${activeRound}` : ''
            }`}
          >
            <Round round={activeRound} />
          </div>
        </section>
      </main>
      <HUD />
      <GameModal />
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
