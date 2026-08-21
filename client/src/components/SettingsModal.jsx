import React, { useState } from 'react';
import { X, Settings, Volume2, VolumeX } from 'lucide-react';
import { soundManager } from '../lib/sound';

export default function SettingsModal({ isOpen, onClose }) {
  const [soundEnabled, setSoundEnabled] = useState(soundManager.isEnabled());

  React.useEffect(() => {
    if (isOpen) {
      setSoundEnabled(soundManager.isEnabled());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundManager.setEnabled(next);
    if (next) {
      soundManager.playRandomMoneySound();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white border border-stone-200 rounded-2xl sm:rounded-3xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-stone-100 bg-stone-50/70">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-700 shadow-sm flex-shrink-0">
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-stone-900">Game Settings</h2>
              <p className="text-[11px] sm:text-xs text-stone-500 font-medium">Audio and preferences</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 hover:text-stone-800 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* Sound Toggle Card */}
          <div className="bg-stone-50 border border-stone-200 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center transition-colors flex-shrink-0 ${
                soundEnabled ? 'bg-primary-100 text-primary-600' : 'bg-stone-200 text-stone-400'
              }`}>
                {soundEnabled ? <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />}
              </div>
              <div>
                <p className="font-bold text-stone-900 text-xs sm:text-sm">Sound Effects</p>
                <p className="text-[11px] sm:text-xs text-stone-500 mt-0.5">
                  {soundEnabled ? 'Audio enabled for events & actions' : 'All in-game sounds muted'}
                </p>
              </div>
            </div>

            {/* Toggle Switch */}
            <button
              type="button"
              onClick={handleToggleSound}
              className={`w-12 sm:w-14 h-7 sm:h-8 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer flex-shrink-0 ${
                soundEnabled ? 'bg-primary-500 justify-end' : 'bg-stone-300 justify-start'
              }`}
            >
              <div className="bg-white w-5 h-5 sm:w-6 sm:h-6 rounded-full shadow-md transform transition-transform"></div>
            </button>
          </div>

          {/* Info note */}
          <div className="p-3 bg-stone-50/70 border border-stone-100 rounded-xl text-stone-400 text-[11px] text-center">
            Settings are automatically saved to your browser.
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 sm:px-6 sm:py-3.5 border-t border-stone-100 bg-stone-50/70 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs sm:text-sm transition-colors shadow-sm text-center"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
