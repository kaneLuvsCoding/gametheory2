import { useState, useEffect } from 'react';
import { socket } from './lib/socket';
import { Settings } from 'lucide-react';
import Lobby from './pages/Lobby';
import GameBoard from './pages/Game/GameBoard';
import RulesModal from './components/RulesModal';
import SettingsModal from './components/SettingsModal';

function App() {
  const [gameState, setGameState] = useState(null);
  const [inRoom, setInRoom] = useState(false);
  const [error, setError] = useState('');
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    socket.connect();

    socket.on('room_state_update', (state) => {
      setGameState(state);
      setInRoom(true);
    });

    socket.on('phase_timer_tick', (timeRemaining) => {
      setGameState(prev => prev ? { ...prev, timeRemaining } : prev);
    });

    socket.on('error', (err) => {
      setError(err);
      setTimeout(() => setError(''), 5000);
    });

    return () => {
      socket.off('room_state_update');
      socket.off('phase_timer_tick');
      socket.off('error');
      socket.disconnect();
    };
  }, []);

  const handleJoin = (roomId, playerName) => {
    socket.emit('join_room', { roomId, playerName });
  };

  return (
    <div className="min-h-[100dvh] md:h-screen font-sans flex flex-col bg-orange-50 text-stone-800 overflow-y-auto md:overflow-hidden relative">

      {/* Subtle grid background */}
      <div className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(239,68,68,0.06) 0%, transparent 50%),
                           radial-gradient(circle at 75% 75%, rgba(16,185,129,0.06) 0%, transparent 50%)`,
        }}
      />

      {/* Header */}
      <header className="relative z-10 flex-shrink-0 border-b border-stone-200/80 bg-white/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-2.5 sm:py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <img src="/logo.png" className="w-8 h-8 sm:w-9 sm:h-9 object-contain rounded-lg shadow-sm" alt="Market Tomato" />
            <h1 className="text-base sm:text-lg font-black tracking-wider text-stone-900 uppercase">
              Market <span className="gradient-text-primary">Tomato</span>
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Rules / Help Button */}
            <button
              type="button"
              onClick={() => setIsRulesOpen(true)}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-stone-100 hover:bg-orange-100 hover:border-orange-200 hover:text-primary-600 border border-stone-200 flex items-center justify-center text-stone-600 transition-colors shadow-sm font-black text-sm"
              title="Walkthrough"
            >
              ?
            </button>

            {/* Settings Button */}
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-stone-100 hover:bg-stone-200 border border-stone-200 flex items-center justify-center shadow-sm text-stone-600 hover:text-stone-900 transition-colors"
              title="Settings"
            >
              <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-stone-600" />
            </button>
          </div>
        </div>
      </header>

      {/* Rules & Technical Guide Modal */}
      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />

      {/* Settings Modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Error toast */}
      {error && (
        <div className="absolute top-14 sm:top-16 left-1/2 -translate-x-1/2 z-50 flex-shrink-0 px-4 w-full max-w-md">
          <div className="glass border border-red-500/50 text-red-600 px-4 py-2.5 rounded-xl glow-red text-xs sm:text-sm font-medium shadow-xl text-center">
            ⚠ {error}
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="relative z-10 flex-1 min-h-0 w-full max-w-7xl mx-auto p-3 sm:p-4 md:p-6 flex flex-col">
        {!inRoom || !gameState ? (
          <div className="min-h-full flex items-center justify-center py-2 sm:py-4 md:py-0">
            <Lobby onJoin={handleJoin} />
          </div>
        ) : (
          <GameBoard gameState={gameState} socket={socket} />
        )}
      </main>
    </div>
  );
}

export default App;
