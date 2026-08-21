import { useState } from 'react';
import { ArrowRight, Dice5, Handshake, Swords, TrendingUp } from 'lucide-react';

const RANDOM_NAMES = [
  'Trader Joe', 'Tomato Baron', 'Crate King', 'Market Mogul',
  'Juice Master', 'Slick Seller', 'Red King', 'Market Fox'
];

const RANDOM_ROOMS = ['ROJO', 'RIPE', 'SEED', 'VINE', 'PULP', 'FARM', 'RUBY', 'CASH', 'BEEF', 'ROME'];

export default function Lobby({ onJoin }) {
  const [roomId, setRoomId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [focused, setFocused] = useState(null);

  const handleRandomName = () => {
    const random = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
    setPlayerName(random);
  };

  const handleRandomRoom = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += letters[Math.floor(Math.random() * letters.length)];
    }
    setRoomId(code);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (roomId.length === 4 && playerName.trim()) {
      onJoin(roomId, playerName.trim());
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-2 flex flex-col items-center">
      {/* Top Badge */}
      <div className="inline-flex items-center gap-2 bg-orange-100 border border-orange-200 text-primary-600 text-xs font-mono px-3.5 py-1.5 rounded-full shadow-sm mb-6">
        <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse"></span>
        MULTIPLAYER • REAL-TIME • MARKET WARFARE
      </div>

      {/* Main Terminal Card */}
      <div className="w-full bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div>
            <h2 className="text-xl font-black text-stone-900">Enter the Tomato Market</h2>
            <p className="text-xs text-stone-500 mt-0.5">Enter a room code to trade with rivals or bots.</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center flex-shrink-0 shadow-inner">
            <img src="/tomato.svg" className="w-6 h-6" alt="Tomato" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Room Code */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                Room Code
              </label>
              <button
                type="button"
                onClick={handleRandomRoom}
                className="text-[11px] font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors"
              >
                <Dice5 className="w-3.5 h-3.5" /> Random
              </button>
            </div>
            <div className={`relative rounded-2xl transition-all duration-200 ${focused === 'room' ? 'ring-2 ring-primary-500/20' : ''}`}>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 4))}
                onFocus={() => setFocused('room')}
                onBlur={() => setFocused(null)}
                maxLength={4}
                className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-4 py-3 font-mono uppercase tracking-[0.3em] text-primary-600 text-lg font-black placeholder:text-stone-300 placeholder:normal-case placeholder:tracking-normal placeholder:font-sans placeholder:text-sm focus:bg-white focus:outline-none focus:border-primary-500 transition-colors shadow-inner text-center sm:text-left"
                placeholder="e.g. ROJO"
                required
              />
            </div>
          </div>

          {/* Alias */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                Trader Alias
              </label>
              <button
                type="button"
                onClick={handleRandomName}
                className="text-[11px] font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors"
              >
                <Dice5 className="w-3.5 h-3.5" /> Random
              </button>
            </div>
            <div className={`relative rounded-2xl transition-all duration-200 ${focused === 'name' ? 'ring-2 ring-primary-500/20' : ''}`}>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onFocus={() => setFocused('name')}
                onBlur={() => setFocused(null)}
                className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-4 py-3 font-semibold text-stone-900 text-sm sm:text-base placeholder:text-stone-300 focus:bg-white focus:outline-none focus:border-primary-500 transition-colors shadow-inner"
                placeholder="e.g. Tomato Baron, Trader Joe..."
                required
                maxLength={20}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={roomId.length !== 4 || !playerName.trim()}
            className="w-full mt-2 flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black py-3.5 px-6 rounded-2xl transition-all duration-200 active:scale-[0.98] glow-primary shadow-lg text-base"
          >
            Enter the Game
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        {/* 3 Step Flow Horizontal Strip */}
        <div className="pt-4 border-t border-stone-100 grid grid-cols-3 gap-2 text-center">
          <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-100 flex flex-col items-center">
            <Handshake className="w-4 h-4 text-blue-500 mb-1" />
            <span className="text-[10px] font-black text-stone-800 uppercase tracking-wide">1. Price Deal</span>
            <span className="text-[9px] text-stone-400">Huddle on price</span>
          </div>
          <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-100 flex flex-col items-center">
            <Swords className="w-4 h-4 text-primary-500 mb-1" />
            <span className="text-[10px] font-black text-stone-800 uppercase tracking-wide">2. Secret Deals</span>
            <span className="text-[9px] text-stone-400">Undercut & snoop</span>
          </div>
          <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-100 flex flex-col items-center">
            <TrendingUp className="w-4 h-4 text-emerald-500 mb-1" />
            <span className="text-[10px] font-black text-stone-800 uppercase tracking-wide">3. Market Open</span>
            <span className="text-[9px] text-stone-400">Sell out & profit</span>
          </div>
        </div>
      </div>
    </div>
  );
}
