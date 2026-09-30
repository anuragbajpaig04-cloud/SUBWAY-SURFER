import React from 'react';
import { Pause, Zap, Magnet, Footprints, Flame, Sparkles } from 'lucide-react';
import { PowerUpType, WordHunt } from '../types';

interface GameHUDProps {
  score: number;
  highScore: number;
  coins: number;
  multiplier: number;
  powerUps: Record<PowerUpType, { active: boolean; timeLeft: number; duration: number }>;
  hoverboards: number;
  isHoverboardActive: boolean;
  wordHunt: WordHunt;
  onPause: () => void;
  onActivateHoverboard: () => void;
  onJump: () => void;
  onRoll: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  score,
  highScore,
  coins,
  multiplier,
  powerUps,
  hoverboards,
  isHoverboardActive,
  wordHunt,
  onPause,
  onActivateHoverboard,
  onJump,
  onRoll,
  onMoveLeft,
  onMoveRight,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 md:p-6 z-10">
      {/* Top Header Bar */}
      <div className="flex items-start justify-between">
        {/* Left: Score & High Score */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            {/* Multiplier Badge */}
            <div className="bg-gradient-to-b from-amber-400 to-amber-600 text-slate-950 font-titan px-2.5 py-0.5 rounded-lg border-2 border-white shadow-lg text-sm md:text-base flex items-center gap-0.5">
              <span>x</span>
              <span>{multiplier}</span>
            </div>

            {/* Score */}
            <div className="font-titan text-3xl md:text-5xl text-white tracking-wider text-stroke-sm text-shadow-subway">
              {score.toLocaleString()}
            </div>
          </div>

          {/* High Score Tag */}
          <div className="text-xs md:text-sm font-fredoka font-bold text-amber-300/90 tracking-wide mt-0.5 pl-1">
            HIGH: {Math.max(score, highScore).toLocaleString()}
          </div>
        </div>

        {/* Right: Pause & Coin Counter */}
        <div className="flex items-center gap-3">
          {/* Coin Badge */}
          <div className="bg-slate-900/80 backdrop-blur-md border-2 border-amber-400/80 px-3 py-1.5 rounded-2xl flex items-center gap-2 shadow-lg">
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-300 border-2 border-yellow-200 flex items-center justify-center shadow-inner animate-pulse">
              <span className="text-[11px] font-titan text-amber-950">★</span>
            </div>
            <span className="font-titan text-xl md:text-2xl text-yellow-300 text-stroke-sm">
              {coins}
            </span>
          </div>

          {/* Pause Button */}
          <button
            onClick={onPause}
            className="pointer-events-auto bg-slate-900/80 hover:bg-slate-800 active:scale-95 text-white p-2.5 rounded-2xl border-2 border-white/20 backdrop-blur-md transition shadow-lg cursor-pointer"
            title="Pause Game (Esc)"
          >
            <Pause className="w-5 h-5 fill-current" />
          </button>
        </div>
      </div>

      {/* Middle Floating Overlays: Daily Word Hunt & Active Powerups */}
      <div className="flex justify-between items-center w-full my-auto pointer-events-none">
        {/* Left Side: Active PowerUp Cards */}
        <div className="flex flex-col gap-2.5">
          {Object.entries(powerUps).map(([type, data]) => {
            if (!data.active) return null;
            const progress = (data.timeLeft / data.duration) * 100;

            const iconMap = {
              jetpack: <Flame className="w-5 h-5 text-red-500" />,
              magnet: <Magnet className="w-5 h-5 text-blue-400" />,
              sneakers: <Footprints className="w-5 h-5 text-emerald-400" />,
              multiplier: <Sparkles className="w-5 h-5 text-yellow-400" />,
            };

            const nameMap = {
              jetpack: 'JETPACK',
              magnet: 'MAGNET',
              sneakers: 'SUPER JUMP',
              multiplier: '2X MULTI',
            };

            return (
              <div
                key={type}
                className="bg-slate-900/90 border border-white/20 backdrop-blur-md rounded-xl p-2 w-32 shadow-xl animate-bounce-short"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  {iconMap[type as PowerUpType]}
                  <span className="text-[10px] font-titan text-white tracking-wider">
                    {nameMap[type as PowerUpType]}
                  </span>
                </div>
                {/* Progress Bar */}
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-amber-400 to-yellow-300 h-full rounded-full transition-all duration-100"
                    style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Side: Word Hunt "SURF" */}
        <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-2.5 backdrop-blur-md flex flex-col items-center gap-1 shadow-lg">
          <span className="text-[9px] font-fredoka font-bold text-slate-300 uppercase tracking-widest">
            Word Hunt
          </span>
          <div className="flex gap-1.5">
            {wordHunt.targetWord.split('').map((letter, idx) => {
              const collected = wordHunt.collectedLetters.includes(letter);
              return (
                <div
                  key={idx}
                  className={`w-7 h-7 rounded-lg font-titan flex items-center justify-center text-sm border-2 transition-all ${
                    collected
                      ? 'bg-gradient-to-b from-cyan-400 to-blue-600 text-white border-white scale-105 shadow-md shadow-cyan-500/50'
                      : 'bg-slate-800/80 text-slate-500 border-slate-700'
                  }`}
                >
                  {letter}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Area: Hoverboard Trigger & Touch / Keyboard Controls */}
      <div className="flex items-end justify-between w-full">
        {/* Hoverboard Button */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={onActivateHoverboard}
            disabled={hoverboards <= 0}
            className={`relative group p-3.5 rounded-2xl border-2 transition active:scale-95 shadow-xl cursor-pointer ${
              isHoverboardActive
                ? 'bg-cyan-500/90 border-white text-white shadow-cyan-500/50 ring-4 ring-cyan-300/40 animate-pulse'
                : hoverboards > 0
                ? 'bg-gradient-to-b from-amber-400 to-amber-600 border-white text-slate-950 hover:brightness-110 shadow-amber-500/40'
                : 'bg-slate-800/80 border-slate-700 text-slate-500 opacity-60 cursor-not-allowed'
            }`}
            title="Double-tap screen or press Space for Hoverboard"
          >
            <div className="flex items-center gap-2">
              <Zap className="w-6 h-6 fill-current" />
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-titan tracking-wider leading-none">
                  {isHoverboardActive ? 'SHIELD ON' : 'HOVERBOARD'}
                </span>
                <span className="text-xs font-titan leading-tight">
                  x{hoverboards}
                </span>
              </div>
            </div>
          </button>
        </div>

        {/* On-Screen Mobile Action Controls (Jump, Roll, Left, Right) */}
        <div className="pointer-events-auto flex gap-2 sm:hidden">
          <div className="flex flex-col gap-1.5">
            <button
              onClick={onJump}
              className="w-12 h-12 rounded-xl bg-slate-900/80 active:bg-amber-500 border-2 border-white/20 text-white font-titan text-xs flex items-center justify-center shadow-lg"
            >
              UP
            </button>
            <button
              onClick={onRoll}
              className="w-12 h-12 rounded-xl bg-slate-900/80 active:bg-amber-500 border-2 border-white/20 text-white font-titan text-xs flex items-center justify-center shadow-lg"
            >
              DOWN
            </button>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onMoveLeft}
              className="w-12 h-12 rounded-xl bg-slate-900/80 active:bg-amber-500 border-2 border-white/20 text-white font-titan text-xs flex items-center justify-center shadow-lg"
            >
              LEFT
            </button>
            <button
              onClick={onMoveRight}
              className="w-12 h-12 rounded-xl bg-slate-900/80 active:bg-amber-500 border-2 border-white/20 text-white font-titan text-xs flex items-center justify-center shadow-lg"
            >
              RIGHT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
