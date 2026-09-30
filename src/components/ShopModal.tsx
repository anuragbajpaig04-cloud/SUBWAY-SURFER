import React, { useState } from 'react';
import { X, Check, Zap, Flame, Magnet, Footprints, Sparkles, Key } from 'lucide-react';
import { CharacterItem, HoverboardItem, PowerUpUpgrade } from '../types';
import { soundManager } from '../audio/soundManager';

interface ShopModalProps {
  totalCoins: number;
  totalKeys: number;
  hoverboardStock: number;
  characters: CharacterItem[];
  selectedCharacterId: string;
  hoverboards: HoverboardItem[];
  selectedHoverboardId: string;
  upgrades: PowerUpUpgrade[];
  onSelectCharacter: (id: string) => void;
  onBuyCharacter: (id: string, cost: number) => void;
  onSelectHoverboard: (id: string) => void;
  onBuyHoverboard: (id: string, cost: number) => void;
  onBuyHoverboardConsumables: (count: number, cost: number) => void;
  onUpgradePowerUp: (id: string, cost: number) => void;
  onBuyKey: (cost: number) => void;
  onClose: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  totalCoins,
  totalKeys,
  hoverboardStock,
  characters,
  selectedCharacterId,
  hoverboards,
  selectedHoverboardId,
  upgrades,
  onSelectCharacter,
  onBuyCharacter,
  onSelectHoverboard,
  onBuyHoverboard,
  onBuyHoverboardConsumables,
  onUpgradePowerUp,
  onBuyKey,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'characters' | 'boards' | 'upgrades'>('characters');

  return (
    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 md:p-6 z-40 animate-in fade-in duration-200">
      <div className="bg-slate-900 border-3 border-amber-500 rounded-3xl max-w-2xl w-full h-[88vh] max-h-[640px] flex flex-col shadow-2xl overflow-hidden">
        {/* Header Bar */}
        <div className="bg-slate-950 px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="font-titan text-2xl md:text-3xl text-amber-400 tracking-wider text-stroke-sm">
              SUBWAY SHOP
            </h2>
          </div>

          {/* User Currency Badges */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-900 border border-amber-400/60 px-3 py-1 rounded-xl flex items-center gap-1.5 shadow">
              <span className="text-amber-400 text-sm">★</span>
              <span className="font-titan text-base text-yellow-300">{totalCoins}</span>
            </div>
            <div className="bg-slate-900 border border-emerald-400/60 px-3 py-1 rounded-xl flex items-center gap-1.5 shadow">
              <Key className="w-3.5 h-3.5 text-emerald-400 fill-current" />
              <span className="font-titan text-base text-emerald-400">{totalKeys}</span>
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
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-slate-950/60 border-b border-slate-800 p-2 gap-2">
          {(['characters', 'boards', 'upgrades'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 px-3 rounded-xl font-titan text-sm tracking-wide capitalize transition cursor-pointer ${
                activeTab === tab
                  ? 'bg-amber-500 text-slate-950 shadow-md scale-100'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content Container */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {/* TAB 1: CHARACTERS */}
          {activeTab === 'characters' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {characters.map(char => {
                const isSelected = char.id === selectedCharacterId;
                const canAfford = totalCoins >= char.cost;

                return (
                  <div
                    key={char.id}
                    className={`bg-slate-950/80 border-2 rounded-2xl p-4 flex flex-col justify-between transition ${
                      isSelected
                        ? 'border-amber-400 ring-2 ring-amber-400/30 shadow-lg'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      {/* Character Color Avatar Preview */}
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center border-2 border-white/20 shadow-md relative"
                        style={{ backgroundColor: char.shirtColor }}
                      >
                        <div
                          className="w-6 h-6 rounded-full border border-white/40 absolute -top-1"
                          style={{ backgroundColor: char.capColor }}
                        />
                        <span className="font-titan text-white text-lg">
                          {char.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-titan text-lg text-white">{char.name}</h3>
                        <p className="text-xs font-fredoka text-slate-400">{char.subtitle}</p>
                      </div>
                    </div>

                    {/* Action Button */}
                    {char.unlocked ? (
                      <button
                        onClick={() => {
                          soundManager.playCoin();
                          onSelectCharacter(char.id);
                        }}
                        className={`w-full py-2 px-3 rounded-xl font-titan text-sm flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-500 text-slate-950 font-bold'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Check className="w-4 h-4 stroke-[3]" />
                            <span>EQUIPPED</span>
                          </>
                        ) : (
                          <span>EQUIP</span>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => onBuyCharacter(char.id, char.cost)}
                        disabled={!canAfford}
                        className={`w-full py-2 px-3 rounded-xl font-titan text-sm flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          canAfford
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        <span>UNLOCK FOR</span>
                        <span className="text-amber-950">★</span>
                        <span>{char.cost}</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: HOVERBOARDS */}
          {activeTab === 'boards' && (
            <div className="space-y-4">
              {/* Consumable stock box */}
              <div className="bg-slate-950/90 border border-cyan-500/40 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-cyan-400 fill-current" />
                  </div>
                  <div>
                    <h4 className="font-titan text-base text-white">HOVERBOARDS IN STOCK</h4>
                    <p className="text-xs font-fredoka text-slate-400">
                      Double-tap in game to activate crash shield!
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-titan text-2xl text-cyan-400">x{hoverboardStock}</span>
                  <button
                    onClick={() => onBuyHoverboardConsumables(3, 300)}
                    disabled={totalCoins < 300}
                    className={`py-2 px-3 rounded-xl font-titan text-xs flex items-center gap-1 cursor-pointer transition ${
                      totalCoins >= 300
                        ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <span>BUY +3 FOR</span>
                    <span>★ 300</span>
                  </button>
                </div>
              </div>

              {/* Board Styles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {hoverboards.map(board => {
                  const isSelected = board.id === selectedHoverboardId;
                  const canAfford = totalCoins >= board.cost;

                  return (
                    <div
                      key={board.id}
                      className={`bg-slate-950/80 border-2 rounded-2xl p-4 flex flex-col justify-between transition ${
                        isSelected
                          ? 'border-cyan-400 ring-2 ring-cyan-400/30 shadow-lg'
                          : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className="w-14 h-8 rounded-xl flex items-center justify-center border-2 border-white/20 shadow-md"
                          style={{ backgroundColor: board.primaryColor }}
                        >
                          <div
                            className="w-8 h-1 rounded-full"
                            style={{ backgroundColor: board.accentColor }}
                          />
                        </div>
                        <div>
                          <h3 className="font-titan text-base text-white">{board.name}</h3>
                          <span className="text-[11px] font-fredoka text-cyan-300">
                            Custom Skin
                          </span>
                        </div>
                      </div>

                      {board.unlocked ? (
                        <button
                          onClick={() => {
                            soundManager.playCoin();
                            onSelectHoverboard(board.id);
                          }}
                          className={`w-full py-2 px-3 rounded-xl font-titan text-sm flex items-center justify-center gap-1.5 transition cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-500 text-slate-950 font-bold'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                          }`}
                        >
                          {isSelected ? (
                            <>
                              <Check className="w-4 h-4 stroke-[3]" />
                              <span>EQUIPPED</span>
                            </>
                          ) : (
                            <span>EQUIP</span>
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={() => onBuyHoverboard(board.id, board.cost)}
                          disabled={!canAfford}
                          className={`w-full py-2 px-3 rounded-xl font-titan text-sm flex items-center justify-center gap-1.5 transition cursor-pointer ${
                            canAfford
                              ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          <span>UNLOCK FOR</span>
                          <span>★ {board.cost}</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: POWERUP UPGRADES */}
          {activeTab === 'upgrades' && (
            <div className="space-y-3.5">
              {/* Keys purchase banner */}
              <div className="bg-slate-950/80 border border-emerald-500/40 rounded-2xl p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center">
                    <Key className="w-5 h-5 text-emerald-400 fill-current" />
                  </div>
                  <div>
                    <h4 className="font-titan text-sm text-white">REVIVAL KEYS</h4>
                    <p className="text-[11px] font-fredoka text-slate-400">
                      Use keys to revive yourself after a crash!
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onBuyKey(500)}
                  disabled={totalCoins < 500}
                  className={`py-2 px-3 rounded-xl font-titan text-xs flex items-center gap-1 cursor-pointer transition ${
                    totalCoins >= 500
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <span>BUY +1 KEY FOR ★ 500</span>
                </button>
              </div>

              {/* Power-up duration upgrades */}
              {upgrades.map(up => {
                const isMax = up.level >= up.maxLevel;
                const nextCost = isMax ? 0 : up.costPerLevel[up.level];
                const canAfford = totalCoins >= nextCost;

                const iconMap = {
                  jetpack: <Flame className="w-5 h-5 text-red-500" />,
                  magnet: <Magnet className="w-5 h-5 text-blue-400" />,
                  sneakers: <Footprints className="w-5 h-5 text-emerald-400" />,
                  multiplier: <Sparkles className="w-5 h-5 text-yellow-400" />,
                };

                return (
                  <div
                    key={up.id}
                    className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center">
                        {iconMap[up.id]}
                      </div>
                      <div>
                        <h4 className="font-titan text-base text-white">{up.name}</h4>
                        <p className="text-xs font-fredoka text-slate-400 mb-1.5">
                          {up.description}
                        </p>
                        {/* Level pips */}
                        <div className="flex gap-1">
                          {Array.from({ length: up.maxLevel }).map((_, i) => (
                            <div
                              key={i}
                              className={`w-4 h-2 rounded-sm ${
                                i < up.level ? 'bg-amber-400 shadow-sm' : 'bg-slate-800'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      {isMax ? (
                        <span className="font-titan text-xs text-emerald-400 px-3 py-1.5 bg-emerald-950/60 rounded-lg border border-emerald-800">
                          MAX LEVEL
                        </span>
                      ) : (
                        <button
                          onClick={() => onUpgradePowerUp(up.id, nextCost)}
                          disabled={!canAfford}
                          className={`py-2 px-3.5 rounded-xl font-titan text-xs flex items-center gap-1.5 cursor-pointer transition ${
                            canAfford
                              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          <span>UPGRADE</span>
                          <span>★ {nextCost}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
