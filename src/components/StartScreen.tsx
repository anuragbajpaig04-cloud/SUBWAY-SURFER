import React from 'react';
import { Play, ShoppingBag, Target, Settings, Trophy, Zap, Volume2, VolumeX } from 'lucide-react';
import { soundManager } from '../audio/soundManager';

interface StartScreenProps {
  highScore: number;
  totalCoins: number;
  totalKeys: number;
  hoverboardStock: number;
  selectedCharacterName: string;
  selectedHoverboardName: string;
  onStart: () => void;
  onOpenShop: () => void;
  onOpenMissions: () => void;
  onOpenSettings: () => void;
  sfxMuted: boolean;
  onToggleSfx: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  highScore,
  totalCoins,
  totalKeys,
  hoverboardStock,
  selectedCharacterName,
  selectedHoverboardName,
  onStart,
  onOpenShop,
  onOpenMissions,
  onOpenSettings,
  sfxMuted,
  onToggleSfx,
}) => {
  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-between p-4 md:p-8 pointer-events-none select-none">
      {/* Top Header: Currencies & High Score */}
      <div className="flex items-center justify-between w-full pointer-events-auto">
        {/* High Score Badge */}
        <div className="bg-slate-900/80 backdrop-blur-md border-2 border-amber-400/80 px-3.5 py-1.5 rounded-2xl flex items-center gap-2 shadow-lg">
          <Trophy className="w-5 h-5 text-amber-400 fill-amber-400/20" />
          <div className="flex flex-col">
            <span className="text-[10px] font-fredoka font-bold text-amber-300 leading-none">
              TOP RECORD
            </span>
            <span className="font-titan text-lg md:text-xl text-white tracking-wide">
              {highScore.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Currency & Settings */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Coins */}
          <div className="bg-slate-900/80 backdrop-blur-md border border-amber-400/60 px-3 py-1.5 rounded-2xl flex items-center gap-1.5 shadow">
            <span className="text-amber-400 text-sm">★</span>
            <span className="font-titan text-base md:text-lg text-yellow-300">
              {totalCoins.toLocaleString()}
            </span>
          </div>

          {/* Hoverboard Consumable Badge */}
          <div className="hidden sm:flex bg-slate-900/80 backdrop-blur-md border border-cyan-400/60 px-3 py-1.5 rounded-2xl items-center gap-1.5 shadow">
            <Zap className="w-4 h-4 text-cyan-400 fill-current" />
            <span className="font-titan text-sm text-cyan-300">x{hoverboardStock}</span>
          </div>

          {/* Quick Sound Toggle */}
          <button
            onClick={onToggleSfx}
            className="p-2.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-white/20 text-white backdrop-blur-md cursor-pointer transition shadow"
            title="Toggle SFX"
          >
            {sfxMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>

          {/* Settings */}
          <button
            onClick={() => {
              soundManager.playCoin();
              onOpenSettings();
            }}
            className="p-2.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-white/20 text-white backdrop-blur-md cursor-pointer transition shadow"
            title="Settings & Guide"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Center Banner: Subway Surfers Graffiti Logo & Tap to Run */}
      <div className="flex flex-col items-center justify-center my-auto pointer-events-auto">
        {/* Subway Surfers Title */}
        <div className="text-center mb-6 md:mb-10 transform hover:scale-105 transition-transform duration-300">
          <div className="font-bungee text-2xl md:text-3xl text-cyan-300 tracking-widest text-stroke-sm text-shadow-blue mb-[-12px]">
            SUBWAY
          </div>
          <h1 className="font-titan text-6xl md:text-8xl text-yellow-400 tracking-wider text-stroke-lg text-shadow-subway transform -rotate-2">
            SURFERS
          </h1>
          <div className="inline-block bg-red-600 text-white font-titan text-xs md:text-sm px-3 py-0.5 rounded-md border-2 border-white shadow-lg uppercase tracking-widest transform rotate-2 -mt-2">
            WORLD TOUR 3D
          </div>
        </div>

        {/* Big Tap to Play Button */}
        <button
          onClick={() => {
            soundManager.ensureAudio();
            onStart();
          }}
          className="group relative py-4 px-10 md:py-5 md:px-14 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:brightness-110 active:scale-95 text-slate-950 font-titan text-2xl md:text-3xl rounded-3xl border-4 border-white shadow-2xl shadow-amber-500/50 flex items-center gap-3 cursor-pointer transition-all animate-pulse"
        >
          <div className="w-10 h-10 rounded-full bg-slate-950 text-white flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
            <Play className="w-5 h-5 fill-current ml-0.5 text-amber-400" />
          </div>
          <span className="tracking-wider">TAP TO RUN</span>
        </button>

        {/* Controls Hint */}
        <div className="mt-4 font-fredoka text-slate-200/90 text-xs md:text-sm font-semibold tracking-wide bg-slate-950/60 px-4 py-1 rounded-full border border-white/10 backdrop-blur-sm">
          Swipe or Arrow Keys / WASD · Space for Hoverboard
        </div>
      </div>

      {/* Bottom Footer: Shop & Missions Menus */}
      <div className="flex items-center justify-between w-full pointer-events-auto">
        {/* Character & Board Info Button */}
        <button
          onClick={() => {
            soundManager.playCoin();
            onOpenShop();
          }}
          className="bg-slate-900/85 hover:bg-slate-850 active:scale-98 border-2 border-white/20 p-2.5 md:p-3 rounded-2xl flex items-center gap-3 shadow-xl backdrop-blur-md cursor-pointer transition"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-sky-400 flex items-center justify-center font-titan text-white text-lg border border-white/40">
            {selectedCharacterName.charAt(0)}
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-fredoka font-bold text-slate-400 leading-none">
              EQUIPPED
            </span>
            <span className="font-titan text-sm text-white">{selectedCharacterName}</span>
            <span className="text-[11px] font-fredoka text-cyan-300 leading-none">
              {selectedHoverboardName}
            </span>
          </div>
        </button>

        {/* Right Action Buttons: Shop & Missions */}
        <div className="flex items-center gap-2.5">
          {/* Missions */}
          <button
            onClick={() => {
              soundManager.playCoin();
              onOpenMissions();
            }}
            className="p-3 md:px-4 md:py-3 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:brightness-110 active:scale-95 text-white font-titan text-sm border-2 border-white flex items-center gap-2 shadow-lg cursor-pointer transition"
          >
            <Target className="w-5 h-5" />
            <span className="hidden sm:inline">MISSIONS</span>
          </button>

          {/* Shop */}
          <button
            onClick={() => {
              soundManager.playCoin();
              onOpenShop();
            }}
            className="p-3 md:px-5 md:py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 active:scale-95 text-slate-950 font-titan text-sm md:text-base border-2 border-white flex items-center gap-2 shadow-lg shadow-amber-500/30 cursor-pointer transition"
          >
            <ShoppingBag className="w-5 h-5 text-slate-950" />
            <span>SHOP</span>
          </button>
        </div>
      </div>
    </div>
  );
};
