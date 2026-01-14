import { AppProvider, useApp } from './context/AppContext';
import { Topbar } from './components/Topbar';
import { ElimCounter } from './components/ElimCounter';
import { HUD } from './components/HUD';
import { GameModal } from './components/GameModal';
import { Round1 } from './pages/Round1';
import { Round2 } from './pages/Round2';
import { Round3 } from './pages/Round3';
import { Round4 } from './pages/Round4';
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
              activeRound === 2 ? 'is-round2' : activeRound === 3 ? 'is-round3' : activeRound === 4 ? 'is-round4' : ''
            }`.trim()}
          >
            <div id="viewRound1" className="view view--round1" hidden={activeRound !== 1}>
              <Round1 />
            </div>
            <div id="viewRound2" className="view view--round2" hidden={activeRound !== 2}>
              <Round2 />
            </div>
            <div id="viewRound3" className="view view--round3" hidden={activeRound !== 3}>
              <Round3 />
            </div>
            <div id="viewRound4" className="view view--round4" hidden={activeRound !== 4}>
              <Round4 />
            </div>
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
