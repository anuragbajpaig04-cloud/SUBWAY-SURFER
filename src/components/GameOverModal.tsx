import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { RotateCcw, ShoppingBag, Trophy, Heart, ArrowRight } from 'lucide-react';
import { soundManager } from '../audio/soundManager';

interface GameOverModalProps {
  score: number;
  highScore: number;
  coins: number;
  distance: number;
  totalKeys: number;
  onRetry: () => void;
  onRevive: () => void;
  onOpenShop: () => void;
  onDoubleCoins: () => void;
  hasDoubledCoins: boolean;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  score,
  highScore,
  coins,
  distance,
  totalKeys,
  onRetry,
  onRevive,
  onOpenShop,
  onDoubleCoins,
  hasDoubledCoins,
}) => {
  const isNewHighScore = score > highScore && score > 0;

  useEffect(() => {
    if (isNewHighScore) {
      soundManager.playCelebration();
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // Fallback if canvas-confetti is not loaded
      }
    }
  }, [isNewHighScore]);

  return (
    <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-30 animate-in fade-in duration-300">
      <div className="bg-slate-900 border-4 border-amber-500 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
        {/* Background glow banner */}
        <div className="absolute -top-24 w-80 h-32 bg-amber-500/20 blur-3xl pointer-events-none" />

        {/* Title */}
        <h2 className="font-titan text-4xl md:text-5xl text-red-500 tracking-wider text-stroke-md text-shadow-red mb-1">
          CAUGHT!
        </h2>
        <p className="font-fredoka text-slate-300 text-sm font-semibold mb-6">
          The Inspector caught you tagging the subway!
        </p>

        {/* New High Score Callout */}
        {isNewHighScore && (
          <div className="mb-4 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 px-4 py-1.5 rounded-full font-titan text-sm uppercase tracking-wider flex items-center gap-1.5 shadow-lg animate-bounce">
            <Trophy className="w-4 h-4 fill-current" />
            <span>New High Score!</span>
          </div>
        )}

        {/* Stats Card */}
        <div className="w-full bg-slate-950/70 border border-slate-800 rounded-2xl p-4 mb-5 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
            <span className="font-fredoka text-slate-400 font-bold text-sm">FINAL SCORE</span>
            <span className="font-titan text-2xl text-white tracking-wide">{score.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
            <span className="font-fredoka text-slate-400 font-bold text-sm">COINS COLLECTED</span>
            <span className="font-titan text-2xl text-yellow-400 flex items-center gap-1.5">
              <span>★</span>
              <span>{coins}</span>
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-fredoka text-slate-400 font-bold text-sm">DISTANCE</span>
            <span className="font-titan text-xl text-sky-400">{distance}m</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-3">
          {/* Revive Button */}
          {totalKeys > 0 && (
            <button
              onClick={onRevive}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 active:scale-98 text-white font-titan text-lg rounded-2xl border-2 border-white shadow-lg flex items-center justify-center gap-2 cursor-pointer transition"
            >
              <Heart className="w-5 h-5 fill-current text-white animate-pulse" />
              <span>REVIVE (1 KEY)</span>
            </button>
          )}

          {/* Double Coins Bonus */}
          {!hasDoubledCoins && coins > 0 && (
            <button
              onClick={onDoubleCoins}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 active:scale-98 text-slate-950 font-titan text-sm rounded-xl border border-white/60 shadow flex items-center justify-center gap-2 cursor-pointer transition"
            >
              <span>DOUBLE RUN COINS (+{coins} ★)</span>
            </button>
          )}

          {/* Main Play Again Button */}
          <button
            onClick={onRetry}
            className="w-full py-4 px-6 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:brightness-110 active:scale-98 text-slate-950 font-titan text-2xl rounded-2xl border-3 border-white shadow-xl shadow-amber-500/30 flex items-center justify-center gap-3 cursor-pointer transition"
          >
            <RotateCcw className="w-6 h-6 stroke-[3]" />
            <span>PLAY AGAIN</span>
          </button>

          {/* Shop / Locker Shortcut */}
          <button
            onClick={onOpenShop}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-fredoka font-bold text-sm rounded-xl border border-slate-700 flex items-center justify-center gap-2 cursor-pointer transition"
          >
            <ShoppingBag className="w-4 h-4 text-amber-400" />
            <span>VISIT SHOP & UPGRADES</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
