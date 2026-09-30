import React from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX, Music } from 'lucide-react';
import { soundManager } from '../audio/soundManager';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onQuitToMenu: () => void;
  sfxMuted: boolean;
  musicMuted: boolean;
  onToggleSfx: () => void;
  onToggleMusic: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onQuitToMenu,
  sfxMuted,
  musicMuted,
  onToggleSfx,
  onToggleMusic,
}) => {
  return (
    <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-40 animate-in fade-in duration-150">
      <div className="bg-slate-900 border-3 border-amber-500 rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col items-center text-center">
        <h2 className="font-titan text-3xl text-amber-400 tracking-wider text-stroke-sm text-shadow-subway mb-6">
          GAME PAUSED
        </h2>

        {/* Audio Toggles */}
        <div className="flex gap-4 mb-6 w-full justify-center">
          <button
            onClick={onToggleSfx}
            className={`p-3 rounded-2xl border-2 flex items-center gap-2 cursor-pointer transition ${
              sfxMuted
                ? 'bg-slate-800 border-slate-700 text-slate-500'
                : 'bg-slate-800 border-amber-400 text-amber-400 shadow-md'
            }`}
          >
            {sfxMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            <span className="font-titan text-xs">SFX</span>
          </button>
          <button
            onClick={onToggleMusic}
            className={`p-3 rounded-2xl border-2 flex items-center gap-2 cursor-pointer transition ${
              musicMuted
                ? 'bg-slate-800 border-slate-700 text-slate-500'
                : 'bg-slate-800 border-cyan-400 text-cyan-400 shadow-md'
            }`}
          >
            <Music className="w-5 h-5" />
            <span className="font-titan text-xs">MUSIC</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={onResume}
            className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-amber-600 hover:brightness-110 active:scale-98 text-slate-950 font-titan text-xl rounded-2xl border-2 border-white shadow-lg flex items-center justify-center gap-2 cursor-pointer transition"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>RESUME</span>
          </button>

          <button
            onClick={onRestart}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 active:scale-98 text-white font-titan text-base rounded-xl border border-slate-700 flex items-center justify-center gap-2 cursor-pointer transition"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESTART RUN</span>
          </button>

          <button
            onClick={onQuitToMenu}
            className="w-full py-2.5 bg-slate-950 hover:bg-slate-900 active:scale-98 text-slate-400 hover:text-white font-fredoka font-bold text-sm rounded-xl border border-slate-800 flex items-center justify-center gap-2 cursor-pointer transition"
          >
            <Home className="w-4 h-4" />
            <span>QUIT TO MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
