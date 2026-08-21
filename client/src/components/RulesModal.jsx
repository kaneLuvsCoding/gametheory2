import React from 'react';
import { X, BookOpen, Handshake, Lock, TrendingUp, ShieldAlert, Swords, Eye, Trophy, Flame, Package } from 'lucide-react';

export default function RulesModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white border border-stone-200 rounded-2xl sm:rounded-3xl w-full max-w-2xl max-h-[85dvh] sm:max-h-[88vh] flex flex-col shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Fixed Top */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-stone-100 bg-stone-50/80 flex-shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-orange-100 border border-orange-200 flex items-center justify-center text-primary-600 shadow-sm flex-shrink-0">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-stone-900 leading-tight">Walkthrough</h2>
              <p className="text-[11px] sm:text-xs text-stone-500 font-medium">Quick guide to playing Market Tomato</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 hover:text-stone-800 transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-3.5 sm:space-y-4 text-stone-700 custom-scrollbar pb-6">
          
          {/* 1. Goal */}
          <div className="bg-orange-50 border border-orange-200/90 rounded-xl sm:rounded-2xl p-3 sm:p-3.5 flex items-center gap-3 shadow-sm">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm glow-primary">
              <Trophy className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </div>
            <div className="text-xs sm:text-sm min-w-0">
              <p className="font-black text-stone-900 text-xs sm:text-sm">The Goal</p>
              <p className="text-stone-600 mt-0.5 leading-relaxed text-[11px] sm:text-xs">
                Play <strong>5 rounds</strong>. Start with <strong>$5,000</strong> cash & <strong>100 crates/round</strong>. Highest cash wins!
              </p>
            </div>
          </div>

          {/* 2. 3-Phase Loop */}
          <div className="space-y-1.5 sm:space-y-2">
            <p className="text-[10px] sm:text-xs font-black text-stone-400 uppercase tracking-wider">How Each Round Works</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5">
              
              <div className="p-2.5 sm:p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl sm:rounded-2xl space-y-1 shadow-sm">
                <div className="flex items-center gap-1.5 font-black text-blue-900 text-xs">
                  <Handshake className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" /> 1. Price Deal
                </div>
                <p className="text-stone-600 text-[11px] leading-relaxed">
                  Chat & agree on a target price (<strong>$10–$100</strong>). Deals are <strong>non-binding</strong>!
                </p>
              </div>

              <div className="p-2.5 sm:p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl sm:rounded-2xl space-y-1 shadow-sm">
                <div className="flex items-center gap-1.5 font-black text-amber-900 text-xs">
                  <Lock className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" /> 2. Secret Pricing
                </div>
                <p className="text-stone-600 text-[11px] leading-relaxed">
                  Lock in your actual price, crate quantity, or trigger sabotage against rivals.
                </p>
              </div>

              <div className="p-2.5 sm:p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl sm:rounded-2xl space-y-1 shadow-sm">
                <div className="flex items-center gap-1.5 font-black text-emerald-900 text-xs">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" /> 3. Market Open
                </div>
                <p className="text-stone-600 text-[11px] leading-relaxed">
                  Cheapest crates sell first. Unsold crates pay <strong>-$200</strong> storage fee.
                </p>
              </div>

            </div>
          </div>

          {/* 3. Sabotage */}
          <div className="space-y-1.5 sm:space-y-2">
            <p className="text-[10px] sm:text-xs font-black text-stone-400 uppercase tracking-wider">Sabotage</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5">
              
              <div className="p-2.5 sm:p-3 bg-stone-50 border border-stone-200 rounded-xl sm:rounded-2xl space-y-0.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-black text-stone-900 text-xs flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" /> Snoop Price
                  </span>
                  <span className="font-mono font-black text-red-600 text-[11px]">-$300</span>
                </div>
                <p className="text-stone-500 text-[11px] leading-tight">
                  Inspect 1 rival's secret locked crate price.
                </p>
              </div>

              <div className="p-2.5 sm:p-3 bg-stone-50 border border-stone-200 rounded-xl sm:rounded-2xl space-y-0.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-black text-stone-900 text-xs flex items-center gap-1.5">
                    <Swords className="w-3.5 h-3.5 text-red-600 flex-shrink-0" /> Hire Thugs
                  </span>
                  <span className="font-mono font-black text-red-600 text-[11px]">-$800</span>
                </div>
                <p className="text-stone-500 text-[11px] leading-tight">
                  Destroy 50 crates at a rival's inventory.
                </p>
              </div>

              <div className="p-2.5 sm:p-3 bg-stone-50 border border-stone-200 rounded-xl sm:rounded-2xl space-y-0.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-black text-stone-900 text-xs flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" /> Bribe Inspector
                  </span>
                  <span className="font-mono font-black text-red-600 text-[11px]">-$1,200</span>
                </div>
                <p className="text-stone-500 text-[11px] leading-tight">
                  Sell crates first and adds <strong>+25% Heat</strong>.
                </p>
              </div>

            </div>
          </div>

          {/* 4. Heat Meter & Raids */}
          <div className="bg-red-50/70 border border-red-200 rounded-xl sm:rounded-2xl p-3 sm:p-3.5 space-y-2 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <Flame className="w-4 h-4 text-red-600 flex-shrink-0" />
                <p className="font-black text-stone-900 text-xs truncate">Market Heat & Raids</p>
              </div>
              <span className="text-[9px] sm:text-[10px] uppercase font-mono font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-md flex-shrink-0">
                0% Safe → 100% Raid
              </span>
            </div>

            {/* Visual Heat Bar */}
            <div className="w-full bg-red-100 h-2 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 via-amber-500 to-red-600 h-full w-full rounded-full opacity-85"></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-stone-600 pt-0.5">
              <div className="flex items-start gap-1.5">
                <span className="text-red-500 font-bold">•</span>
                <span>Each <strong>Bribe Inspector</strong> move increases Market Heat by <strong>+25%</strong>.</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-red-500 font-bold">•</span>
                <span>At <strong>100% Heat</strong>, inspectors raid the <strong>#1 richest player</strong> and fine <strong>50% cash</strong>!</span>
              </div>
            </div>
          </div>

          {/* 5. Demand & Storage Fees */}
          <div className="bg-stone-50 border border-stone-200 rounded-xl sm:rounded-2xl p-3 sm:p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            <div className="flex items-start gap-2">
              <Package className="w-4 h-4 text-primary-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-stone-900 text-xs">Market Demand</p>
                <p className="text-stone-600 mt-0.5 leading-relaxed">
                  <strong>50 crates per player</strong> (50% of supply). In 4-player games, demand is 200 crates.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-stone-900 text-xs">Holding Cost</p>
                <p className="text-stone-600 mt-0.5 leading-relaxed">
                  Unsold crates spoil and incur a <strong>-$200 storage fee</strong> per round.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Footer - Fixed Bottom */}
        <div className="px-4 py-2.5 sm:px-6 sm:py-3 border-t border-stone-100 bg-stone-50/90 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl sm:rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs sm:text-sm transition-colors shadow-sm text-center"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
