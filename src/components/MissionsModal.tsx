import React from 'react';
import { X, Check, Gift, Target } from 'lucide-react';
import { Mission, WordHunt } from '../types';
import { soundManager } from '../audio/soundManager';

interface MissionsModalProps {
  missions: Mission[];
  wordHunt: WordHunt;
  onClaimReward: (missionId: string, reward: number) => void;
  onClaimWordHunt: (reward: number) => void;
  onClose: () => void;
}

export const MissionsModal: React.FC<MissionsModalProps> = ({
  missions,
  wordHunt,
  onClaimReward,
  onClaimWordHunt,
  onClose,
}) => {
  const isWordHuntComplete =
    wordHunt.collectedLetters.length >= wordHunt.targetWord.length && !wordHunt.completed;

  return (
    <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-40 animate-in fade-in duration-200">
      <div className="bg-slate-900 border-3 border-amber-500 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Target className="w-6 h-6 text-amber-400" />
            <h2 className="font-titan text-2xl text-amber-400 tracking-wider text-stroke-sm">
              MISSIONS & CHALLENGES
            </h2>
          </div>
          <button
            onClick={() => {
              soundManager.playCoin();
              onClose();
            }}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Daily Word Hunt Box */}
          <div className="bg-gradient-to-br from-cyan-950/60 to-blue-950/60 border-2 border-cyan-500/50 rounded-2xl p-4 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-[10px] font-fredoka font-bold text-cyan-400 tracking-widest uppercase">
                  Daily Challenge
                </span>
                <h3 className="font-titan text-lg text-white">WORD HUNT</h3>
              </div>
              <div className="flex items-center gap-1 font-titan text-yellow-300 text-sm">
                <span>REWARD:</span>
                <span>★ {wordHunt.reward}</span>
              </div>
            </div>

            {/* Letter Tiles */}
            <div className="flex justify-center gap-3 mb-4">
              {wordHunt.targetWord.split('').map((letter, idx) => {
                const collected = wordHunt.collectedLetters.includes(letter);
                return (
                  <div
                    key={idx}
                    className={`w-12 h-12 rounded-xl font-titan text-2xl flex items-center justify-center border-2 transition-all ${
                      collected
                        ? 'bg-gradient-to-b from-cyan-400 to-blue-600 text-white border-white scale-105 shadow-lg shadow-cyan-500/50'
                        : 'bg-slate-900/90 text-slate-500 border-slate-700'
                    }`}
                  >
                    {letter}
                  </div>
                );
              })}
            </div>

            {/* Claim button */}
            {isWordHuntComplete ? (
              <button
                onClick={() => onClaimWordHunt(wordHunt.reward)}
                className="w-full py-2.5 bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-titan text-sm rounded-xl shadow-lg hover:brightness-110 active:scale-98 cursor-pointer flex items-center justify-center gap-2"
              >
                <Gift className="w-4 h-4" />
                <span>CLAIM ★ {wordHunt.reward} COINS!</span>
              </button>
            ) : wordHunt.completed ? (
              <div className="w-full py-2 text-center text-xs font-titan text-emerald-400 bg-emerald-950/40 border border-emerald-800 rounded-xl">
                COMPLETED TODAY! COME BACK TOMORROW
              </div>
            ) : (
              <p className="text-center text-xs font-fredoka text-slate-400">
                Collect all 4 glowing letters during your runs!
              </p>
            )}
          </div>

          {/* Active Missions */}
          <div className="space-y-3">
            <h4 className="font-titan text-xs text-slate-400 uppercase tracking-widest pl-1">
              Active Run Missions
            </h4>
            {missions.map(mission => {
              const progress = Math.min(100, (mission.current / mission.target) * 100);

              return (
                <div
                  key={mission.id}
                  className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2.5 shadow"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-titan text-base text-white">{mission.title}</h4>
                      <span className="text-xs font-fredoka text-slate-400">
                        {mission.current} / {mission.target}
                      </span>
                    </div>

                    {/* Reward / Claim */}
                    {mission.claimed ? (
                      <span className="flex items-center gap-1 text-xs font-titan text-emerald-400">
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>CLAIMED</span>
                      </span>
                    ) : mission.completed ? (
                      <button
                        onClick={() => onClaimReward(mission.id, mission.reward)}
                        className="py-1.5 px-3 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-titan text-xs rounded-xl shadow cursor-pointer transition flex items-center gap-1"
                      >
                        <Gift className="w-3.5 h-3.5" />
                        <span>CLAIM ★ {mission.reward}</span>
                      </button>
                    ) : (
                      <div className="font-titan text-xs text-yellow-400">
                        ★ {mission.reward}
                      </div>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
