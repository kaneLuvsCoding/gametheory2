import { useState, useEffect, useRef } from 'react';
import { Send, Clock, ShieldAlert, DollarSign, Package, Target, TrendingDown, Flame, Zap, Swords, Eye, Crown, Lock, Trophy, RotateCcw, Play, Check, Copy, Bot, Users } from 'lucide-react';
import { soundManager } from '../../lib/sound';

/* ─────────────────────────────────────────── helpers ── */
function formatPhase(phase) {
  switch (phase) {
    case 'SUMMIT': return 'Price Huddle';
    case 'SECRET_DISPATCH': return 'Secret Pricing';
    case 'MARKET_REVEAL': return 'Market Opening';
    case 'GAME_OVER': return 'Market Champion';
    default: return phase;
  }
}

function phaseColor(phase) {
  switch (phase) {
    case 'SUMMIT': return 'text-blue-500';
    case 'SECRET_DISPATCH': return 'text-amber-500';
    case 'MARKET_REVEAL': return 'text-primary-500';
    case 'GAME_OVER': return 'text-stone-400';
    default: return 'text-stone-400';
  }
}

function TimerRing({ seconds, max }) {
  const pct = max > 0 ? seconds / max : 0;
  const r = 22;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;
  const color = seconds <= 5 ? '#ef4444' : seconds <= 10 ? '#f59e0b' : '#10b981';

  return (
    <div className="relative w-14 h-14 flex items-center justify-center">
      <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={r} fill="none" stroke="#e7e5e4" strokeWidth="3.5" />
        <circle
          cx="28" cy="28" r={r} fill="none"
          stroke={color} strokeWidth="3.5"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s linear, stroke 0.5s' }}
        />
      </svg>
      <span className={`relative font-mono font-black text-base ${seconds <= 5 ? 'text-red-500 text-glow-red' : seconds <= 10 ? 'text-amber-500' : 'text-stone-800'}`}>
        {seconds}
      </span>
    </div>
  );
}

const AVATAR_PALETTE = [
  { emoji: '👨‍🌾', bg: 'bg-emerald-100 border-emerald-300 text-emerald-900' },
  { emoji: '👩‍🌾', bg: 'bg-amber-100 border-amber-300 text-amber-900' },
  { emoji: '🍅', bg: 'bg-red-100 border-red-300 text-red-900' },
  { emoji: '🦊', bg: 'bg-orange-100 border-orange-300 text-orange-900' },
  { emoji: '🦝', bg: 'bg-stone-200 border-stone-300 text-stone-900' },
  { emoji: '🐮', bg: 'bg-blue-100 border-blue-300 text-blue-900' },
  { emoji: '🐷', bg: 'bg-pink-100 border-pink-300 text-pink-900' },
  { emoji: '🐔', bg: 'bg-yellow-100 border-yellow-300 text-yellow-900' },
  { emoji: '🚜', bg: 'bg-teal-100 border-teal-300 text-teal-900' },
  { emoji: '🎩', bg: 'bg-purple-100 border-purple-300 text-purple-900' },
  { emoji: '🧑‍🍳', bg: 'bg-rose-100 border-rose-300 text-rose-900' },
  { emoji: '🐻', bg: 'bg-amber-200 border-amber-400 text-amber-950' }
];

function getPlayerAvatarInfo(player) {
  if (player?.avatar) {
    const found = AVATAR_PALETTE.find(a => a.emoji === player.avatar);
    return {
      emoji: player.avatar,
      bg: found ? found.bg : 'bg-orange-100 border-orange-200 text-orange-900'
    };
  }
  const str = String(player?.id || player?.name || '0');
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = (hash << 5) - hash + str.charCodeAt(i);
  const index = Math.abs(hash) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[index];
}

function PlayerAvatar({ player, size = "md", className = "" }) {
  const avatarInfo = getPlayerAvatarInfo(player);
  
  const sizeClasses = {
    xs: "w-6 h-6 text-xs rounded-lg",
    sm: "w-9 h-9 text-lg rounded-xl",
    md: "w-10 h-10 text-xl rounded-xl",
    lg: "w-12 h-12 text-2xl rounded-2xl",
    xl: "w-24 h-24 text-5xl rounded-[2rem]"
  };

  return (
    <div
      className={`flex items-center justify-center flex-shrink-0 border select-none transition-transform shadow-sm ${avatarInfo.bg} ${sizeClasses[size] || sizeClasses.md} ${className}`}
      title={player?.name}
    >
      <span>{avatarInfo.emoji}</span>
    </div>
  );
}

/* ─────────────────────────────────────────── main board ── */
export default function GameBoard({ gameState, socket }) {
  const me = gameState.players.find(p => p.id === socket.id);
  const isHost = me?.isHost;
  const [maxTime, setMaxTime] = useState(0);

  useEffect(() => {
    if (gameState.timeRemaining > 0 && maxTime === 0) {
      setMaxTime(gameState.timeRemaining);
    }
    if (['SUMMIT','SECRET_DISPATCH','MARKET_REVEAL'].includes(gameState.currentPhase) && gameState.timeRemaining > maxTime) {
      setMaxTime(gameState.timeRemaining);
    }

    if (gameState.currentPhase === 'MARKET_REVEAL') {
      const lastRound = gameState.priceHistory?.[gameState.priceHistory.length - 1];
      if (lastRound?.policeRaid || lastRound?.marketCrashed) {
        soundManager.playAlarm();
      } else {
        const sortedRoundResults = [...(lastRound?.results || [])].sort(
          (a, b) => (b.revenue - b.holdingCost - (b.seizedAmount || 0)) - (a.revenue - a.holdingCost - (a.seizedAmount || 0))
        );
        const roundLeader = sortedRoundResults[0];
        const isMeRoundLeader = roundLeader && (roundLeader.playerId === socket.id || roundLeader.playerName === me?.name);

        if (isMeRoundLeader) {
          soundManager.playRandomMoneySound();
        } else {
          soundManager.playPhase();
        }
      }
    } else if (gameState.currentPhase === 'GAME_OVER') {
      const sortedPlayers = [...(gameState.players || [])].sort((a, b) => b.balance - a.balance);
      const overallWinner = sortedPlayers[0];
      const isMeWinner = overallWinner && (overallWinner.id === socket.id || overallWinner.name === me?.name);

      if (isMeWinner) {
        soundManager.playWinnerSound();
      } else {
        soundManager.playPhase();
      }
    } else if (['SUMMIT', 'SECRET_DISPATCH'].includes(gameState.currentPhase)) {
      soundManager.playPhase();
    }
  }, [gameState.currentPhase]);

  const handleStartGame = () => socket.emit('start_game', { roomId: gameState.id });
  const handleAddBot = () => socket.emit('add_bot', { roomId: gameState.id });

  /* ── LOBBY SCREEN ── */
  if (gameState.currentPhase === 'LOBBY') {
    return (
      <LobbyWaitingScreen
        gameState={gameState}
        socket={socket}
        isHost={isHost}
        onStartGame={handleStartGame}
        onAddBot={handleAddBot}
      />
    );
  }

  /* ── GAME SCREEN ── */
  if (gameState.currentPhase === 'GAME_OVER') {
    return (
      <div className="flex-1 min-h-0 glass border border-stone-200 rounded-xl overflow-y-auto md:overflow-hidden shadow-sm flex flex-col">
        <GameOverPhase gameState={gameState} socket={socket} me={me} />
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-3 md:gap-4 h-full min-h-0 overflow-y-auto md:overflow-hidden">

      {/* ── Responsive Sidebar (Mobile Strip & Desktop Sidebar) ── */}
      <div className="flex-shrink-0 w-full md:w-60 lg:w-64 flex flex-col gap-2.5 md:gap-3 md:h-full md:min-h-0">

        {/* Top HUD Card: Phase + Round + Timer + Heat Level */}
        <div className="bg-white border border-stone-200 rounded-2xl p-3 sm:p-4 shadow-sm flex flex-col gap-2.5 sm:gap-3.5">
          {/* Phase & Timer Row */}
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-0.5 sm:mb-1">
                <span className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">
                  Round {gameState.currentRound} of {gameState.maxRounds}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full animate-pulse flex-shrink-0 ${
                  gameState.currentPhase === 'SUMMIT' ? 'bg-blue-500' :
                  gameState.currentPhase === 'SECRET_DISPATCH' ? 'bg-amber-500' :
                  gameState.currentPhase === 'MARKET_REVEAL' ? 'bg-primary-500' : 'bg-stone-400'
                }`}></span>
                <h3 className={`font-black text-sm sm:text-base leading-tight truncate ${phaseColor(gameState.currentPhase)}`}>
                  {formatPhase(gameState.currentPhase)}
                </h3>
              </div>
            </div>
            <div className="flex-shrink-0">
              <TimerRing seconds={gameState.timeRemaining} max={maxTime} />
            </div>
          </div>

          {/* Integrated Heat Level */}
          <div className="pt-2 sm:pt-3 border-t border-stone-100">
            <div className="flex items-center justify-between mb-1 sm:mb-1.5">
              <div className="flex items-center gap-1">
                <Flame className={`w-3.5 h-3.5 ${gameState.heatLevel >= 70 ? 'text-red-500 animate-bounce' : gameState.heatLevel >= 40 ? 'text-amber-500' : 'text-stone-400'}`} />
                <span className="text-[10px] uppercase tracking-wider text-stone-600 font-bold">Market Heat</span>
              </div>
              <span className={`font-mono font-black text-[11px] sm:text-xs px-1.5 py-0.5 rounded ${
                gameState.heatLevel >= 70 ? 'bg-red-100 text-red-700' :
                gameState.heatLevel >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-600'
              }`}>
                {gameState.heatLevel}%
              </span>
            </div>
            <div className="w-full bg-stone-100 rounded-full h-1.5 sm:h-2 overflow-hidden border border-stone-200/60">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  gameState.heatLevel >= 70 ? 'bg-gradient-to-r from-amber-500 to-red-500' :
                  gameState.heatLevel >= 40 ? 'bg-gradient-to-r from-primary-400 to-amber-500' :
                  'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, gameState.heatLevel)}%` }}
              ></div>
            </div>
            <p className="text-[9px] text-stone-400 mt-1 font-medium flex items-center justify-between">
              <span>0% Safe</span>
              <span className={gameState.heatLevel >= 70 ? 'text-red-500 font-bold' : ''}>100% Inspector Raid</span>
            </p>
          </div>
        </div>

        {/* Competitors Card (Horizontal scroller on mobile, vertical leaderboard on desktop) */}
        <div className="bg-white border border-stone-200 rounded-2xl p-2.5 sm:p-3.5 shadow-sm flex-1 md:flex flex-col min-h-0 overflow-hidden">
          <div className="flex items-center justify-between mb-2 pb-1.5 sm:pb-2 border-b border-stone-100 flex-shrink-0">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-stone-400" />
              <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-stone-800 font-black">Competitors</span>
            </div>
            <span className="text-[9px] sm:text-[10px] text-stone-500 font-mono bg-stone-100 px-2 py-0.5 rounded-full font-bold">
              {gameState.players.length} sellers
            </span>
          </div>

          {/* Players List: Horizontal scroll on mobile, vertical on desktop */}
          <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto flex-1 min-h-0 pr-1 -mr-1 custom-scrollbar pb-1 md:pb-0">
            {[...gameState.players]
              .sort((a, b) => b.balance - a.balance)
              .map((p, idx) => {
                const isLeader = idx === 0;
                const isCurrent = p.id === socket.id;

                return (
                  <div
                    key={p.id}
                    className={`flex items-center gap-2.5 p-2.5 rounded-2xl border transition-all duration-200 flex-shrink-0 min-w-[210px] md:min-w-0 ${
                      isCurrent
                        ? 'bg-gradient-to-r from-orange-50/95 via-amber-50/50 to-white border-primary-300 ring-2 ring-primary-500/20 shadow-sm'
                        : isLeader
                        ? 'bg-gradient-to-r from-amber-50/70 via-yellow-50/30 to-white border-amber-200/90 shadow-2xs'
                        : 'bg-white hover:bg-stone-50/90 border-stone-200/80 shadow-2xs'
                    }`}
                  >
                    {/* Rank Badge */}
                    <div className="flex-shrink-0">
                      {isLeader ? (
                        <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 text-white flex items-center justify-center shadow-xs">
                          <Crown className="w-3 h-3 fill-white text-white" />
                        </div>
                      ) : idx === 1 ? (
                        <div className="w-5 h-5 rounded-lg bg-stone-200 text-stone-700 font-mono text-[10px] font-black flex items-center justify-center shadow-2xs">
                          #2
                        </div>
                      ) : idx === 2 ? (
                        <div className="w-5 h-5 rounded-lg bg-amber-100 text-amber-800 font-mono text-[10px] font-black flex items-center justify-center shadow-2xs">
                          #3
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-lg bg-stone-100 text-stone-400 font-mono text-[10px] font-bold flex items-center justify-center">
                          #{idx + 1}
                        </div>
                      )}
                    </div>

                    <PlayerAvatar player={p} size="sm" className="shadow-xs rounded-xl flex-shrink-0 border" />

                    <div className="min-w-0 flex-1 space-y-1">
                      {/* Name & Badges */}
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1 min-w-0">
                          <p className="text-xs font-black text-stone-900 truncate tracking-tight">{p.name}</p>
                          {p.isHost && (
                            <span className="text-[8px] font-black text-amber-700 bg-amber-100/80 border border-amber-200 px-1 py-0.2 rounded flex-shrink-0">
                              HOST
                            </span>
                          )}
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          {isCurrent && (
                            <span className="text-[8px] font-black uppercase text-white bg-primary-500 px-1.5 py-0.2 rounded-md shadow-2xs tracking-wider">
                              YOU
                            </span>
                          )}
                          {p.isBot && (
                            <span className="text-[8px] font-bold uppercase text-blue-700 bg-blue-50 border border-blue-200/80 px-1.5 py-0.2 rounded-md font-mono tracking-wider">
                              BOT
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Stat chips */}
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-lg font-mono text-[11px] font-black text-emerald-700 shadow-2xs">
                          <img src="/currency.svg" className="w-3.5 h-3.5" alt="cash" />
                          {p.balance.toLocaleString()}
                        </span>
                        <span className="inline-flex items-center gap-1 bg-orange-50 border border-orange-200/80 px-1.5 py-0.5 rounded-lg font-mono text-[11px] font-bold text-primary-800 shadow-2xs">
                          {p.inventory}
                          <img src="/tomato.svg" className="w-3.5 h-3.5" alt="crates" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Footer Info on Desktop */}
          <div className="hidden md:flex pt-2 mt-2 border-t border-stone-100 items-center justify-between text-[10px] text-stone-400 font-medium flex-shrink-0">
            <span>Room: <strong className="font-mono text-stone-600">{gameState.id}</strong></span>
            <span>Tomato Central</span>
          </div>
        </div>
      </div>

      {/* ── Main Panel ── */}
      <div className="flex-1 min-h-0 glass border border-stone-200 rounded-xl overflow-hidden flex flex-col relative shadow-sm">
        {/* Top accent line */}
        <div className={`absolute top-0 left-0 right-0 h-0.5 ${
          gameState.currentPhase === 'SUMMIT' ? 'bg-gradient-to-r from-transparent via-blue-400 to-transparent' :
          gameState.currentPhase === 'SECRET_DISPATCH' ? 'bg-gradient-to-r from-transparent via-amber-400 to-transparent' :
          gameState.currentPhase === 'MARKET_REVEAL' ? 'bg-gradient-to-r from-transparent via-primary-500 to-transparent' :
          'bg-gradient-to-r from-transparent via-stone-400 to-transparent'
        }`}></div>

        {gameState.currentPhase === 'SUMMIT' && <SummitPhase gameState={gameState} socket={socket} />}
        {gameState.currentPhase === 'SECRET_DISPATCH' && <DispatchPhase gameState={gameState} socket={socket} me={me} />}
        {gameState.currentPhase === 'MARKET_REVEAL' && <RevealPhase gameState={gameState} />}
      </div>
    </div>
  );
}

/* ─────────────────────────── LOBBY WAITING SCREEN ── */
function LobbyWaitingScreen({ gameState, socket, isHost, onStartGame, onAddBot }) {
  const maxPlayers = 6;
  const currentCount = gameState.players.length;
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(gameState.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-full p-2 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white border border-stone-200 rounded-3xl p-5 sm:p-7 shadow-xl flex flex-col my-auto space-y-6">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center flex-shrink-0 shadow-inner">
              <img src="/tomato.svg" className="w-6 h-6" alt="Tomato" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <h2 className="text-xl font-black text-stone-900 leading-tight">Tomato Market Lobby</h2>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">Gather tomato sellers before trading begins</p>
            </div>
          </div>

          {/* Room Code with Copy Button */}
          <button
            type="button"
            onClick={handleCopyCode}
            className="flex items-center justify-between sm:justify-start gap-3 bg-stone-50 hover:bg-orange-50/70 border border-stone-200 hover:border-primary-300 px-4 py-2 rounded-2xl transition-all shadow-sm group active:scale-[0.98]"
            title="Click to copy Room Code"
          >
            <div className="text-left sm:text-right">
              <p className="text-[9px] uppercase tracking-wider text-stone-400 font-bold leading-none mb-1">Room Code</p>
              <p className="font-mono text-lg font-black text-primary-600 tracking-wider leading-none">{gameState.id}</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-500 group-hover:text-primary-600 shadow-sm transition-colors">
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </div>
          </button>
        </div>

        {/* Player Count & Subhead */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-stone-600 uppercase tracking-wider">Sellers Ready</span>
            <span className="text-xs font-black font-mono text-primary-600 bg-orange-100 border border-orange-200 px-2.5 py-0.5 rounded-full">
              {currentCount} / {maxPlayers}
            </span>
          </div>
          <span className="text-xs text-stone-400 font-medium">
            {currentCount < 2 ? '⚠️ Need at least 2 sellers to start' : '✅ Ready to open market'}
          </span>
        </div>

        {/* Players Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 flex-shrink-0">
          {gameState.players.map(p => (
            <div
              key={p.id}
              className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                p.id === socket.id
                  ? 'bg-orange-50/80 border-primary-300 ring-2 ring-primary-500/20 shadow-md scale-[1.01]'
                  : 'bg-stone-50/60 border-stone-200 shadow-sm hover:bg-stone-50'
              }`}
            >
              <PlayerAvatar player={p} size="md" className="shadow-sm flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="font-black text-stone-900 text-sm truncate">{p.name}</p>
                  {p.isHost && <Crown className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />}
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  {p.id === socket.id && (
                    <span className="text-[9px] font-black uppercase tracking-wider text-primary-700 bg-orange-100 border border-orange-200 px-1.5 py-0.5 rounded">YOU</span>
                  )}
                  {p.isBot && (
                    <span className="text-[9px] font-black uppercase tracking-wider text-blue-700 bg-blue-100 border border-blue-200 px-1.5 py-0.5 rounded font-mono">BOT</span>
                  )}
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Ready
                  </span>
                </div>
              </div>
            </div>
          ))}
          
          {Array.from({ length: Math.max(0, maxPlayers - currentCount) }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="flex items-center gap-3 p-3 rounded-2xl border border-dashed border-stone-300/80 bg-stone-50/30 text-stone-400"
            >
              <div className="w-10 h-10 rounded-xl border border-dashed border-stone-300 bg-white/70 flex items-center justify-center text-stone-300 font-bold text-base flex-shrink-0">
                +
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-stone-400 text-xs">Open Slot</p>
                <p className="text-[10px] text-stone-300 font-medium">Waiting for seller...</p>
              </div>
            </div>
          ))}
        </div>

        {/* Action Footer */}
        <div className="pt-3 border-t border-stone-100 mt-auto">
          {isHost ? (
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={onAddBot}
                disabled={currentCount >= maxPlayers}
                className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold py-3.5 px-4 rounded-2xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm flex items-center justify-center gap-2"
              >
                <Bot className="w-4 h-4 text-stone-500" />
                + Add Bot ({currentCount}/{maxPlayers})
              </button>
              <button
                type="button"
                onClick={onStartGame}
                disabled={currentCount < 2}
                className="flex-[1.5] btn-primary glow-primary text-sm sm:text-base font-black py-3.5 px-6 rounded-2xl transition-all active:scale-[0.98] disabled:shadow-none shadow-lg flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-white" />
                {currentCount < 2 ? 'Need 1 More Seller...' : 'Start the Game'}
              </button>
            </div>
          ) : (
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-primary-500 animate-pulse"></span>
                <p className="text-stone-700 font-bold text-xs sm:text-sm">Waiting for host to start the game...</p>
              </div>
              <span className="text-xs font-mono text-stone-400">Room {gameState.id}</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

/* ─────────────────────────── SUMMIT PHASE ── */
function SummitPhase({ gameState, socket }) {
  const [chat, setChat] = useState([]);
  const [msg, setMsg] = useState('');
  const [proposedPrice, setProposedPrice] = useState('');
  const chatRef = useRef(null);

  const me = gameState.players.find(p => p.id === socket.id);

  useEffect(() => {
    const handler = (m) => {
      setChat(prev => [...prev, m]);
      setTimeout(() => chatRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    };
    socket.on('chat_message', handler);
    return () => socket.off('chat_message', handler);
  }, [socket]);

  const sendMsg = (e) => {
    e.preventDefault();
    if (msg.trim()) {
      socket.emit('chat_message', { roomId: gameState.id, message: msg });
      setMsg('');
    }
  };

  const proposePrice = () => {
    if (proposedPrice) {
      socket.emit('propose_cartel_price', { roomId: gameState.id, price: Number(proposedPrice) });
      socket.emit('chat_message', { roomId: gameState.id, message: `[SYSTEM] Proposes crate price: ${proposedPrice}` });
      setProposedPrice('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-stone-50/30">
      {/* Header */}
      <div className="flex items-center justify-between px-3 sm:px-5 py-2 sm:py-3 border-b border-stone-200 bg-white shadow-sm z-10">
        <div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            <h2 className="font-bold text-stone-900 text-sm sm:text-base">The Price Agreement</h2>
          </div>
          <p className="text-[9px] sm:text-[10px] text-stone-500 mt-0.5">Huddle on a target crate price. Non-binding!</p>
        </div>
        <div className="flex items-center gap-2">
          {gameState.marketDemand && (
            <div className="px-2.5 sm:px-3 py-1 rounded-xl bg-orange-50 border border-orange-200 text-right">
              <p className="text-[8px] sm:text-[9px] uppercase tracking-wider text-primary-700 font-bold">Total Demand</p>
              <p className="text-xs sm:text-sm font-black font-mono text-primary-600 flex items-center justify-end gap-1">
                {gameState.marketDemand} <img src="/tomato.svg" className="w-3 h-3 opacity-80" alt="tomato" />
              </p>
            </div>
          )}
          <div className="flex flex-col items-end">
            <p className="text-[8px] sm:text-[9px] uppercase tracking-wider text-stone-400 font-bold mb-0.5 sm:mb-1">Agreed Target</p>
            <div className={`px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-lg border flex items-center justify-center min-w-[60px] sm:min-w-[70px] ${
              gameState.cartelAgreedPrice ? 'bg-amber-100 border-amber-200 text-amber-700' : 'bg-stone-100 border-stone-200 text-stone-400'
            }`}>
              <span className="font-black font-mono text-base sm:text-lg leading-none flex items-center justify-center gap-1">
                {gameState.cartelAgreedPrice ? (
                  <>
                    <img src="/currency.svg" className="w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-80" alt="cash" />
                    {gameState.cartelAgreedPrice}
                  </>
                ) : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Breaking news event */}
      {gameState.currentEvent && gameState.currentEvent.type !== 'NORMAL' && (
        <div className="flex items-center gap-3 px-5 py-2.5 bg-blue-50 border-b border-blue-100 shadow-sm z-10">
          <Zap className="w-4 h-4 text-blue-500 flex-shrink-0" />
          <div>
            <span className="text-[10px] uppercase tracking-widest text-blue-600 font-bold">Market Flash</span>
            <span className="text-xs font-semibold text-blue-800 ml-2">{gameState.currentEvent.name}</span>
            <span className="text-xs text-blue-600 ml-2">{gameState.currentEvent.desc}</span>
          </div>
        </div>
      )}

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chat.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-stone-400 text-sm opacity-60">
            <span className="text-3xl mb-2">💬</span>
            <p className="font-medium">No sellers have spoken yet...</p>
          </div>
        )}
        {chat.map(c => {
          const isSystem = c.message.startsWith('[SYSTEM]');
          const isMe = !isSystem && c.playerName === me?.name;
          const senderPlayer = gameState.players.find(p => p.name === c.playerName) || { name: c.playerName };

          if (isSystem) {
            return (
              <div key={c.id} className="flex justify-center my-3">
                <span className="bg-amber-100 text-amber-700 border border-amber-200 px-4 py-1.5 rounded-full text-[11px] font-bold shadow-sm uppercase tracking-wide">
                  {c.playerName} {c.message.replace('[SYSTEM] ', '')}
                </span>
              </div>
            );
          }

          return (
            <div key={c.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end`}>
              <PlayerAvatar player={senderPlayer} size="sm" />
              <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%]`}>
                <span className="text-[10px] font-bold text-stone-400 mx-1 mb-1">{c.playerName}</span>
                <div className={`px-3.5 py-2 rounded-2xl text-sm shadow-sm leading-relaxed
                  ${isMe ? 'bg-primary-500 text-white rounded-br-sm' : 'bg-white border border-stone-200 text-stone-800 rounded-bl-sm'}`}>
                  {c.message}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={chatRef} />
      </div>

      {/* Input area */}
      <div className="p-3 border-t border-stone-200 bg-stone-100/50 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
        {/* Propose Price Quick Action */}
        <div className="flex gap-2 mb-3 bg-white p-2 rounded-xl border border-stone-200 shadow-sm items-center">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider ml-2 hidden sm:block">Target</span>
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center">
              <img src="/currency.svg" className="w-3.5 h-3.5 opacity-70" alt="cash" />
            </span>
            <input
              type="number"
              value={proposedPrice}
              onChange={e => setProposedPrice(e.target.value)}
              placeholder="Suggest crate price..."
              className="w-full bg-stone-50 border border-stone-200 rounded-lg pl-8 pr-3 py-1.5 text-sm font-mono font-bold text-primary-600 placeholder:text-stone-400 placeholder:font-sans focus:outline-none focus:border-primary-400 focus:bg-white transition-colors"
              min="10" max="100"
            />
          </div>
          <button
            onClick={proposePrice}
            disabled={!proposedPrice}
            className="bg-amber-100 hover:bg-amber-200 text-amber-700 border border-amber-200 px-4 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Propose
          </button>
        </div>

        {/* Chat input */}
        <form onSubmit={sendMsg} className="flex gap-2">
          <input
            type="text"
            value={msg}
            onChange={e => setMsg(e.target.value)}
            placeholder="Discuss pricing with rival sellers..."
            className="flex-1 min-w-0 bg-white border border-stone-200 text-stone-800 rounded-full px-5 py-2.5 text-sm shadow-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 transition-all placeholder:text-stone-400"
          />
          <button type="submit" disabled={!msg.trim()} className="bg-primary-500 hover:bg-primary-600 disabled:bg-stone-300 disabled:text-stone-500 text-white px-5 py-2.5 rounded-full text-sm shadow-sm transition-all flex items-center justify-center">
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

/* ─────────────────────────── DISPATCH PHASE ── */
function DispatchPhase({ gameState, socket, me }) {
  const agreedPrice = gameState.cartelAgreedPrice;
  const [price, setPrice] = useState(agreedPrice || '');
  const [quantity, setQuantity] = useState(me.inventory);
  const [auditTarget, setAuditTarget] = useState('');
  const [sabotageType, setSabotageType] = useState('');
  const [sabotageTarget, setSabotageTarget] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const rivals = gameState.players.filter(p => p.id !== me.id);

  const auditCost = auditTarget ? 300 : 0;
  const sabotageCost = sabotageType === 'Thugs' ? 800 : sabotageType === 'Bribe' ? 1200 : 0;
  const totalCost = auditCost + sabotageCost;
  const canAfford = me.balance >= totalCost;
  const isThugsMissingTarget = sabotageType === 'Thugs' && !sabotageTarget;
  const isValid = Boolean(price) && Number(price) >= 10 && Number(price) <= 100 && Number(quantity) >= 0 && Number(quantity) <= me.inventory && !isThugsMissingTarget && canAfford;

  useEffect(() => {
    socket.on('order_confirmed', () => setSubmitted(true));
    return () => socket.off('order_confirmed');
  }, [socket]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValid) return;
    soundManager.playClick();

    socket.emit('submit_secret_order', {
      roomId: gameState.id,
      price: Number(price),
      quantity: Number(quantity),
      auditTarget: auditTarget || null,
      sabotageType: sabotageType || null,
      sabotageTarget: sabotageTarget || null
    });
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 gap-6 bg-stone-50/30">
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-primary-100 border-2 border-primary-300 flex items-center justify-center shadow-lg shadow-primary-500/10">
            <Lock className="w-9 h-9 text-primary-600 animate-pulse" />
          </div>
        </div>
        <div>
          <h3 className="text-2xl font-black text-stone-900">Orders Sealed!</h3>
          <p className="text-stone-500 text-sm mt-1">Your secret price and tomato crates are locked for market opening.</p>
        </div>

        <div className="flex items-center gap-6 bg-white border border-stone-200 rounded-3xl px-8 py-5 shadow-sm">
          <div className="text-center">
            <p className="text-3xl font-black font-mono text-primary-600">{gameState.submissions.length}</p>
            <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider mt-0.5">Locked In</p>
          </div>
          <div className="w-px h-10 bg-stone-200"></div>
          <div className="text-center">
            <p className="text-3xl font-black font-mono text-stone-700">{gameState.players.length}</p>
            <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider mt-0.5">Sellers</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-xs space-y-2">
          <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(gameState.submissions.length / gameState.players.length) * 100}%` }}
            ></div>
          </div>
          <p className="text-xs text-stone-400 font-medium">Waiting for all sellers to lock in...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-stone-50/20 p-3 sm:p-6 pb-14 sm:pb-8 custom-scrollbar">
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-4 sm:space-y-5">
        
        {/* Header banner */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
              <h2 className="font-black text-stone-900 text-lg sm:text-xl">Secret Pricing & Crates</h2>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Set your secret crate price, stock your cargo, or snoop on rival sellers.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {gameState.marketDemand && (
              <div className="px-3 py-1.5 rounded-xl bg-orange-50 border border-orange-200 text-right">
                <p className="text-[9px] uppercase tracking-wider text-primary-700 font-bold">Total Demand</p>
                <div className="text-sm font-black font-mono text-primary-600 flex items-center justify-end gap-1">
                  {gameState.marketDemand} <img src="/tomato.svg" className="w-3.5 h-3.5 opacity-80" alt="tomato" />
                </div>
              </div>
            )}
            <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-right">
              <p className="text-[9px] uppercase tracking-wider text-amber-700 font-bold">Agreed Target</p>
              <div className="text-sm font-black font-mono text-amber-600 flex items-center justify-end gap-1">
                {agreedPrice ? (
                  <>
                    <img src="/currency.svg" className="w-3.5 h-3.5 opacity-80" alt="cash" />
                    {agreedPrice}
                  </>
                ) : 'None'}
              </div>
            </div>
          </div>
        </div>

        {/* Price & Quantity Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Price Card */}
          <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                Crate Selling Price
              </label>
              <span className="text-[10px] text-stone-400 font-medium flex items-center gap-1">
                <img src="/currency.svg" className="w-2.5 h-2.5 opacity-60" alt="cash" /> 10 – 100
              </span>
            </div>

            <div className="relative flex items-center">
              <span className="absolute left-3.5 pointer-events-none flex items-center">
                <img src="/currency.svg" className="w-4 h-4 opacity-70" alt="cash" />
              </span>
              <input
                type="number"
                value={price}
                onChange={e => setPrice(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-9 pr-3 py-2.5 font-mono text-xl font-black text-stone-900 placeholder:text-stone-300 focus:bg-white focus:outline-none focus:border-primary-500 transition-colors shadow-inner"
                placeholder="50"
                required
                min="10"
                max="100"
              />
            </div>

            {/* Price Presets */}
            {agreedPrice && (
              <div className="flex items-center gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setPrice(agreedPrice)}
                  className="flex-1 text-[11px] font-bold py-1.5 px-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors flex items-center justify-center gap-1 truncate"
                  title="Honor the agreed price"
                >
                  Honor (<img src="/currency.svg" className="w-3 h-3 opacity-80" alt="cash" />{agreedPrice})
                </button>
                <button
                  type="button"
                  onClick={() => setPrice(Math.max(10, agreedPrice - 5))}
                  className="flex-1 text-[11px] font-bold py-1.5 px-2 rounded-lg bg-orange-50 hover:bg-orange-100 text-primary-700 border border-primary-200 transition-colors flex items-center justify-center gap-1 truncate"
                  title="Undercut by 5"
                >
                  Undercut (<img src="/currency.svg" className="w-3 h-3 opacity-80" alt="cash" />{Math.max(10, agreedPrice - 5)})
                </button>
                <button
                  type="button"
                  onClick={() => setPrice(15)}
                  className="text-[11px] font-bold py-1.5 px-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors flex items-center justify-center gap-1"
                  title="Dump crates at 15"
                >
                  Dump (<img src="/currency.svg" className="w-3 h-3 opacity-80" alt="cash" />15)
                </button>
              </div>
            )}
          </div>

          {/* Quantity Card */}
          <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                Crates to Sell
              </label>
              <span className="text-[10px] text-stone-500 font-mono font-medium">
                Stock: {me.inventory} <img src="/tomato.svg" className="w-3 h-3 inline-block opacity-70 -mt-0.5" alt="tomato" />
              </span>
            </div>

            <div className="relative flex items-center">
              <input
                type="number"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 font-mono text-xl font-black text-stone-900 placeholder:text-stone-300 focus:bg-white focus:outline-none focus:border-primary-500 transition-colors shadow-inner"
                required
                min="0"
                max={me.inventory}
              />
              <span className="absolute right-3.5 text-xs text-stone-400 font-bold uppercase pointer-events-none">Crates</span>
            </div>

            {/* Quantity Presets */}
            <div className="flex items-center gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setQuantity(Math.floor(me.inventory * 0.25))}
                className="flex-1 text-[11px] font-bold py-1.5 px-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
              >
                25%
              </button>
              <button
                type="button"
                onClick={() => setQuantity(Math.floor(me.inventory * 0.5))}
                className="flex-1 text-[11px] font-bold py-1.5 px-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
              >
                50%
              </button>
              <button
                type="button"
                onClick={() => setQuantity(me.inventory)}
                className="flex-1 text-[11px] font-bold py-1.5 px-2 rounded-lg bg-primary-50 hover:bg-primary-100 text-primary-700 border border-primary-200 transition-colors"
              >
                100% (Max)
              </button>
            </div>
          </div>

        </div>

        {/* ── Tactical Operations ── */}
        <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                <Swords className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-sm font-black text-stone-900">Sabotage</h3>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold text-stone-400">Your Cash:</span>
              <span className="text-xs font-black font-mono text-primary-600 flex items-center gap-1">
                <img src="/currency.svg" className="w-3.5 h-3.5 opacity-80" alt="cash" /> {me.balance}
              </span>
            </div>
          </div>

          {/* 1. Snoop / Spy Toggle */}
          <div className="space-y-2">
            <button
              type="button"
              disabled={me.balance < 300}
              onClick={() => {
                if (auditTarget) {
                  setAuditTarget('');
                } else if (rivals.length > 0) {
                  setAuditTarget(rivals[0].id);
                }
              }}
              className={`w-full p-3 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
                auditTarget
                  ? 'bg-amber-50/70 border-amber-400 ring-2 ring-amber-400/20 shadow-sm'
                  : 'bg-stone-50/50 hover:bg-stone-50 border-stone-200 disabled:opacity-40'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  auditTarget ? 'bg-amber-500 text-white' : 'bg-stone-200 text-stone-600'
                }`}>
                  <Eye className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-stone-900 truncate">Snoop Rival Price</p>
                  <p className="text-[10px] text-stone-500 truncate">Discover a rival seller's secret crate price</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-2">
                <span className="text-xs font-black font-mono text-red-600 flex items-center justify-end gap-0.5">
                  -<img src="/currency.svg" className="w-3 h-3 opacity-80" alt="cash" />300
                </span>
                <span className={`block text-[9px] font-black uppercase tracking-wider ${auditTarget ? 'text-amber-600' : 'text-stone-400'}`}>
                  {auditTarget ? 'ACTIVE' : 'OFF'}
                </span>
              </div>
            </button>

            {/* Informant Target Picker Panel */}
            {Boolean(auditTarget) && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 space-y-2.5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-amber-700" />
                    <p className="text-xs font-bold text-amber-900 uppercase tracking-wider">Choose Rival Seller to Snoop On</p>
                  </div>
                  <span className="text-[10px] text-amber-700 font-medium">1 target</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {rivals.map((rival) => {
                    const isSelected = auditTarget === rival.id;
                    return (
                      <button
                        key={rival.id}
                        type="button"
                        onClick={() => setAuditTarget(rival.id)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border-2 text-left transition-all ${
                          isSelected
                            ? 'bg-amber-500 text-white border-amber-600 shadow-md scale-[1.02]'
                            : 'bg-white hover:bg-amber-100/50 text-stone-800 border-amber-200 shadow-sm'
                        }`}
                      >
                        <PlayerAvatar player={rival} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-stone-900'}`}>{rival.name}</p>
                          <p className={`text-[10px] font-mono flex items-center gap-0.5 ${isSelected ? 'text-amber-100' : 'text-stone-500'}`}>
                            <img src="/currency.svg" className="w-2.5 h-2.5 opacity-80" alt="cash" />{rival.balance}
                          </p>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-white flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 2. Sabotage Selection Cards */}
          <div className="space-y-2.5 pt-2 border-t border-stone-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                <Swords className="w-3.5 h-3.5 text-red-500" />
                Sabotage Operation
              </label>
              <span className="text-[10px] text-stone-400 font-medium">Choose 1 option</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Option: None */}
              <button
                type="button"
                onClick={() => {
                  setSabotageType('');
                  setSabotageTarget('');
                }}
                className={`p-3 rounded-2xl border-2 text-left transition-all ${
                  sabotageType === ''
                    ? 'bg-stone-100 border-stone-400 ring-2 ring-stone-400/20 shadow-sm'
                    : 'bg-stone-50/50 hover:bg-stone-50 border-stone-200 text-stone-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-stone-900">Honest Trader</p>
                  {sabotageType === '' && <Check className="w-3.5 h-3.5 text-stone-700" />}
                </div>
                <p className="text-[10px] text-stone-500 mt-1">Play clean with no dirty tricks</p>
              </button>

              {/* Option: Hire Thugs */}
              <button
                type="button"
                disabled={me.balance < 800}
                onClick={() => {
                  if (sabotageType === 'Thugs') {
                    setSabotageType('');
                    setSabotageTarget('');
                  } else {
                    setSabotageType('Thugs');
                    if (!sabotageTarget && rivals.length > 0) {
                      setSabotageTarget(rivals[0].id);
                    }
                  }
                }}
                className={`p-3 rounded-2xl border-2 text-left transition-all ${
                  sabotageType === 'Thugs'
                    ? 'bg-red-50 border-red-500 ring-2 ring-red-500/20 shadow-sm'
                    : 'bg-stone-50/50 hover:bg-red-50/40 border-stone-200 text-stone-700 disabled:opacity-40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-red-700">Hire Thugs</p>
                  <span className="text-[10px] font-mono font-black text-red-600 flex items-center gap-0.5">
                    -<img src="/currency.svg" className="w-3 h-3 opacity-80" alt="cash" />800
                  </span>
                </div>
                <p className="text-[10px] text-stone-500 mt-1">Destroy 50 rival crates</p>
              </button>

              {/* Option: Bribe Inspector */}
              <button
                type="button"
                disabled={me.balance < 1200}
                onClick={() => {
                  if (sabotageType === 'Bribe') {
                    setSabotageType('');
                  } else {
                    setSabotageType('Bribe');
                    setSabotageTarget('');
                  }
                }}
                className={`p-3 rounded-2xl border-2 text-left transition-all ${
                  sabotageType === 'Bribe'
                    ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20 shadow-sm'
                    : 'bg-stone-50/50 hover:bg-amber-50/40 border-stone-200 text-stone-700 disabled:opacity-40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-amber-800">Bribe Inspector</p>
                  <span className="text-[10px] font-mono font-black text-amber-600 flex items-center gap-0.5">
                    -<img src="/currency.svg" className="w-3 h-3 opacity-80" alt="cash" />1200
                  </span>
                </div>
                <p className="text-[10px] text-stone-500 mt-1">Sell crates first & raise heat</p>
              </button>
            </div>

            {/* Interactive Sabotage Target Selection Panel for Thugs */}
            {sabotageType === 'Thugs' && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-3 animate-in fade-in duration-200 mt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-red-600" />
                    <p className="text-xs font-black text-red-800 uppercase tracking-wider">
                      Select Target to Sabotage
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                    -50 Crates
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {rivals.map((rival) => {
                    const isSelected = sabotageTarget === rival.id;
                    return (
                      <button
                        key={rival.id}
                        type="button"
                        onClick={() => setSabotageTarget(rival.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                          isSelected
                            ? 'bg-red-500 text-white border-red-600 shadow-md scale-[1.02]'
                            : 'bg-white hover:bg-red-100/60 text-stone-800 border-red-200 shadow-sm'
                        }`}
                      >
                        <PlayerAvatar player={rival} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-stone-900'}`}>{rival.name}</p>
                          <p className={`text-[10px] font-mono ${isSelected ? 'text-red-100' : 'text-stone-500'}`}>
                            {rival.inventory} <img src="/tomato.svg" className="w-2.5 h-2.5 inline opacity-70" alt="tomato" /> crates
                          </p>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-white flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Operational Cost & Submit */}
        <div className="space-y-3 pt-1">
          {totalCost > 0 && (
            <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-stone-100 border border-stone-200 text-xs">
              <span className="text-stone-600 font-semibold">Total Tactical Moves Cost:</span>
              <span className="font-mono font-black text-red-600 flex items-center gap-1">
                -<img src="/currency.svg" className="w-3.5 h-3.5 opacity-80" alt="cash" />{totalCost}
              </span>
            </div>
          )}

          <button
            type="submit"
            disabled={!isValid}
            className="w-full btn-primary text-base font-black py-3.5 rounded-2xl shadow-lg glow-primary flex items-center justify-center gap-2 transition-transform active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
          >
            <Lock className="w-4 h-4" />
            {isThugsMissingTarget ? 'Select a Target First' : !canAfford ? 'Insufficient Funds for Moves' : 'Lock In Orders'}
          </button>
        </div>

      </form>
    </div>
  );
}

/* ─────────────────────────── REVEAL PHASE ── */
function RevealPhase({ gameState }) {
  const lastRound = gameState.priceHistory[gameState.priceHistory.length - 1];
  if (!lastRound) return <div className="flex items-center justify-center h-full text-stone-500">Loading results...</div>;

  const totalDemand = lastRound.totalDemand || lastRound.marketDemand || (gameState.players?.length || 4) * (lastRound.event?.type === 'STIMULUS' ? 75 : 50);
  const totalSold = lastRound.totalSold !== undefined ? lastRound.totalSold : lastRound.results.reduce((sum, r) => sum + (r.soldQuantity || 0), 0);
  const totalOffered = lastRound.results.reduce((sum, r) => sum + (r.submittedQuantity || 0), 0);

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-5">
      <div className="mb-5 text-center">
        <h2 className="text-2xl font-black text-stone-900 uppercase tracking-wide">Tomato Market Sales</h2>
        <p className="text-stone-500 text-xs mt-1">Round {lastRound.round} of {gameState.maxRounds || 5} · {lastRound.event?.name || 'Standard Trading Day'}</p>

        {/* Market Demand Overview Banner */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
          <div className="inline-flex items-center gap-2.5 bg-white border border-stone-200 px-4 py-1.5 rounded-2xl text-xs shadow-xs font-bold text-stone-700">
            <span className="text-stone-400 uppercase tracking-widest text-[9px] font-black">Market Demand:</span>
            <span className="font-mono text-primary-600 font-black flex items-center gap-1">
              <img src="/tomato.svg" className="w-3.5 h-3.5" alt="crates" /> {totalDemand} Crates
            </span>
            <span className="text-stone-300">|</span>
            <span className="text-emerald-700 font-mono text-[11px] font-bold">
              {totalSold} Sold
            </span>
            {totalOffered > totalDemand && (
              <span className="text-stone-400 font-mono text-[10px]">
                ({totalOffered - totalSold} Unsold)
              </span>
            )}
          </div>
        </div>

        {/* Alert banners */}
        <div className="flex flex-col items-center gap-2 mt-3">
          {lastRound.marketCrashed && (
            <div className="inline-flex items-center gap-2 bg-red-100 text-red-700 border border-red-200 px-4 py-2 rounded-xl text-sm font-bold shadow-sm">
              <TrendingDown className="w-4 h-4" /> Tomato Price Crash! (Market Over-Supplied)
            </div>
          )}
          {lastRound.policeRaid && (
            <div className="inline-flex items-center gap-2 bg-red-600 text-white border border-red-500 px-4 py-2 rounded-xl font-black text-sm shake shadow-md">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" /> Food Inspector Raid! 50% <img src="/currency.svg" className="inline w-4 h-4" alt="Cash" /> Fined
            </div>
          )}
        </div>
      </div>

      {/* Results list */}
      <div className="space-y-2 max-w-xl mx-auto">
        {[...lastRound.results].sort((a, b) => (b.revenue - b.holdingCost) - (a.revenue - a.holdingCost)).map((res, i) => {
          const net = res.revenue - res.holdingCost - (res.seizedAmount || 0);
          return (
            <div key={i} className={`flex flex-col rounded-xl border p-3 shadow-sm
              ${i === 0 ? 'bg-orange-50 border-orange-200' : 'bg-white border-stone-200'}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`font-black text-sm w-5 ${i === 0 ? 'text-primary-500' : 'text-stone-400'}`}>
                    #{i + 1}
                  </span>
                  <div>
                    <p className="font-bold text-stone-800 text-sm">{res.playerName}</p>
                    <p className="text-[10px] text-stone-500 flex items-center gap-1">
                      <img src="/currency.svg" className="w-3 h-3 opacity-70" alt="cash" />{res.submittedPrice} × {res.soldQuantity} crates sold
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-black font-mono text-lg flex items-center justify-end gap-1 ${net > 0 ? 'text-primary-500' : 'text-red-500'}`}>
                    {net >= 0 ? '+' : '-'}<img src="/currency.svg" className="w-4 h-4 opacity-80" alt="cash" />{Math.abs(net)}
                  </p>
                </div>
              </div>
              
              {/* Optional modifiers like sabotage/audit in a simple line */}
              {(res.inventoryDestroyed > 0 || res.raided || res.auditedPrice !== undefined || res.crashLoss > 0) && (
                <div className="mt-2 pt-2 border-t border-stone-100 flex flex-wrap gap-2">
                   {res.inventoryDestroyed > 0 && <span className="text-[10px] text-red-500 flex items-center gap-1"><Swords className="w-3 h-3"/> Sabotaged (-50 Crates)</span>}
                   {res.raided && <span className="text-[10px] text-red-500 flex items-center gap-1"><ShieldAlert className="w-3 h-3"/> Inspector Fined (-50%)</span>}
                   {res.auditedPrice !== undefined && <span className="text-[10px] text-amber-500 flex items-center gap-1"><Eye className="w-3 h-3"/> Price Snooped</span>}
                   {res.crashLoss > 0 && <span className="text-[10px] text-red-600 font-bold flex items-center gap-1">💥 Market Crash (-<img src="/currency.svg" className="inline w-2.5 h-2.5 opacity-80" alt="cash" />{res.crashLoss})</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────── GAME OVER PHASE ── */
function GameOverPhase({ gameState, socket, me }) {
  const sorted = [...gameState.players].sort((a, b) => b.balance - a.balance);
  const winner = sorted[0];
  const isMeWinner = winner && (winner.id === socket.id || winner.name === me?.name);
  const handleRestart = () => socket.emit('restart_game', { roomId: gameState.id });

  useEffect(() => {
    if (isMeWinner) {
      soundManager.playWinnerSound();
    }
  }, [isMeWinner]);

  return (
    <div className="h-full flex flex-col md:flex-row p-4 sm:p-6 bg-stone-50/30 gap-4 sm:gap-6 overflow-y-auto md:overflow-hidden">
      
      {/* Left: Winner Spotlight */}
      <div className={`w-full md:w-1/2 flex flex-col items-center justify-center p-5 sm:p-6 bg-white border rounded-2xl sm:rounded-3xl shadow-sm ${
        isMeWinner ? 'border-amber-400 ring-2 ring-amber-400/30 bg-gradient-to-b from-amber-50/50 to-white' : 'border-stone-200'
      }`}>
        <div className="flex items-center justify-center mb-4 sm:mb-6">
          <div className={`px-4 py-1.5 rounded-full border shadow-sm ${
            isMeWinner ? 'bg-amber-400 text-stone-900 border-amber-500 font-black animate-bounce' : 'bg-amber-100 border-amber-200 text-amber-700'
          }`}>
            <p className="text-[11px] uppercase tracking-widest font-black">
              {isMeWinner ? '🏆 VICTORY - YOU WON!' : 'Top Tomato Merchant'}
            </p>
          </div>
        </div>
        
        <div className="relative w-28 h-28 mx-auto mb-6 flex items-center justify-center">
          <div className="absolute inset-0 bg-primary-500 rounded-[2rem] blur-xl opacity-30 animate-pulse"></div>
          <PlayerAvatar player={winner} size="xl" className="relative shadow-xl border-4 border-white" />
          <div className="absolute -top-3 -right-3 w-11 h-11 bg-amber-400 rounded-full flex items-center justify-center shadow-lg border-2 border-white rotate-12 z-10">
            <Crown className="w-6 h-6 text-white" />
          </div>
        </div>
        
        <h2 className="text-4xl font-black text-stone-900 mb-2 truncate max-w-full px-4">{winner.name}</h2>
        <p className="text-3xl font-black font-mono text-primary-500 flex items-center justify-center gap-2">
          <img src="/currency.svg" className="w-8 h-8 opacity-80" alt="cash" /> {winner.balance.toLocaleString()}
        </p>
      </div>

      {/* Right: Leaderboard & Controls */}
      <div className="w-full md:w-1/2 flex flex-col min-h-0">
        
        <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-2 custom-scrollbar">
          {sorted.map((p, i) => (
            <div
              key={p.id}
              className={`flex items-center gap-3 p-3 rounded-2xl border transition-all
                ${i === 0 ? 'bg-amber-50 border-amber-200 shadow-sm relative overflow-hidden' : 
                  i === 1 ? 'bg-stone-100 border-stone-200 shadow-sm' : 
                  i === 2 ? 'bg-orange-50/50 border-orange-100 shadow-sm' : 'bg-white border-stone-100 shadow-sm'}`}
            >
              {i === 0 && <div className="absolute top-0 right-0 w-12 h-12 bg-amber-400/10 rounded-bl-full pointer-events-none"></div>}
              
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs flex-shrink-0
                ${i === 0 ? 'bg-amber-400 text-white shadow-inner' : 
                  i === 1 ? 'bg-stone-300 text-stone-700' : 
                  i === 2 ? 'bg-orange-300 text-white' : 'bg-stone-100 text-stone-400'}`}>
                {i === 0 ? <Crown className="w-4 h-4" /> : i + 1}
              </div>

              <PlayerAvatar player={p} size="xs" />
              
              <div className="flex-1 min-w-0 flex items-center gap-2">
                <p className={`font-bold truncate ${i === 0 ? 'text-amber-900 text-base' : 'text-stone-800 text-sm'}`}>{p.name}</p>
                {p.isBot && <span className="text-[9px] font-mono font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded flex-shrink-0">BOT</span>}
              </div>
              
              <div className={`font-black font-mono flex items-center gap-1 flex-shrink-0 ${i === 0 ? 'text-xl text-amber-600' : 'text-base text-stone-600'}`}>
                <img src="/currency.svg" className={`opacity-80 ${i === 0 ? 'w-4 h-4' : 'w-3 h-3'}`} alt="cash" /> {p.balance.toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        <div className="flex-shrink-0 pt-2 border-t border-stone-200/50">
          {me?.isHost ? (
            <button onClick={handleRestart} className="w-full flex items-center justify-center gap-2 btn-primary glow-primary text-base py-3 rounded-2xl shadow-md">
              <RotateCcw className="w-5 h-5" />
              Play Again
            </button>
          ) : (
            <div className="bg-white border border-stone-200 rounded-2xl p-3 w-full text-center flex items-center justify-center gap-2 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-stone-400 animate-pulse"></span>
              <p className="text-stone-600 font-medium text-sm">Waiting for host to restart the game...</p>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}
