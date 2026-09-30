import React from 'react';
import { X, Volume2, VolumeX, Music, Smartphone, Keyboard, ShieldAlert } from 'lucide-react';

interface SettingsModalProps {
  sfxMuted: boolean;
  musicMuted: boolean;
  onToggleSfx: () => void;
  onToggleMusic: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  sfxMuted,
  musicMuted,
  onToggleSfx,
  onToggleMusic,
  onClose,
}) => {
  return (
    <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-40 animate-in fade-in duration-200">
      <div className="bg-slate-900 border-3 border-amber-500 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="font-titan text-2xl text-amber-400 tracking-wider text-stroke-sm">
            SETTINGS & HOW TO PLAY
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Audio Settings */}
          <div>
            <h4 className="font-titan text-xs text-slate-400 uppercase tracking-widest mb-2 pl-1">
              Audio Settings
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={onToggleSfx}
                className={`p-3 rounded-2xl border-2 flex items-center justify-center gap-2 cursor-pointer transition ${
                  sfxMuted
                    ? 'bg-slate-950 border-slate-800 text-slate-500'
                    : 'bg-slate-800 border-amber-400 text-amber-400 shadow-md'
                }`}
              >
                {sfxMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                <span className="font-titan text-sm">{sfxMuted ? 'SFX OFF' : 'SFX ON'}</span>
              </button>
              <button
                onClick={onToggleMusic}
                className={`p-3 rounded-2xl border-2 flex items-center justify-center gap-2 cursor-pointer transition ${
                  musicMuted
                    ? 'bg-slate-950 border-slate-800 text-slate-500'
                    : 'bg-slate-800 border-cyan-400 text-cyan-400 shadow-md'
                }`}
              >
                <Music className="w-5 h-5" />
                <span className="font-titan text-sm">{musicMuted ? 'MUSIC OFF' : 'MUSIC ON'}</span>
              </button>
            </div>
          </div>

          {/* Controls Guide */}
          <div>
            <h4 className="font-titan text-xs text-slate-400 uppercase tracking-widest mb-2 pl-1 flex items-center gap-1.5">
              <Keyboard className="w-4 h-4 text-amber-400" />
              <span>Keyboard Controls</span>
            </h4>
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 space-y-2 text-xs font-fredoka">
              <div className="flex justify-between items-center text-slate-300">
                <span>Switch Lanes:</span>
                <span className="font-titan text-amber-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  Left / Right Arrows or A / D
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Jump (over barriers):</span>
                <span className="font-titan text-amber-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  Up Arrow or W
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Roll / Slide (under hurdles):</span>
                <span className="font-titan text-amber-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  Down Arrow or S
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Hoverboard Shield:</span>
                <span className="font-titan text-cyan-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  Space Bar
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Pause:</span>
                <span className="font-titan text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  Esc
                </span>
              </div>
            </div>
          </div>

          {/* Touch / Mobile Guide */}
          <div>
            <h4 className="font-titan text-xs text-slate-400 uppercase tracking-widest mb-2 pl-1 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-cyan-400" />
              <span>Touch & Swipes</span>
            </h4>
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 text-xs font-fredoka text-slate-300 space-y-1.5">
              <p>• Swipe <strong>Left / Right</strong> to switch subway lanes</p>
              <p>• Swipe <strong>Up</strong> to jump over barriers</p>
              <p>• Swipe <strong>Down</strong> to roll under high barricades</p>
              <p>• <strong>Double Tap</strong> anywhere on screen to trigger Hoverboard!</p>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs font-fredoka text-amber-200/90 leading-relaxed">
              <strong>Pro-Tip:</strong> Hoverboard saves you from 1 fatal crash! Collect gold coins to unlock new characters, skateboards, and power-up duration upgrades in the shop.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
