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
