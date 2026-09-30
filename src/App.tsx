/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { SubwaySurfersEngine } from './game/threeEngine';
import { GameHUD } from './components/GameHUD';
import { StartScreen } from './components/StartScreen';
import { GameOverModal } from './components/GameOverModal';
import { ShopModal } from './components/ShopModal';
import { MissionsModal } from './components/MissionsModal';
import { SettingsModal } from './components/SettingsModal';
import { PauseModal } from './components/PauseModal';
import { soundManager } from './audio/soundManager';
import {
  CharacterItem,
  HoverboardItem,
  Mission,
  PowerUpType,
  PowerUpUpgrade,
  WordHunt,
} from './types';

const INITIAL_CHARACTERS: CharacterItem[] = [
  {
    id: 'jake',
    name: 'Jake',
    subtitle: 'The Classic Subway Rebel',
    cost: 0,
    unlocked: true,
    shirtColor: '#0284c7', // Sky Blue
    pantsColor: '#1e293b',
    capColor: '#dc2626',   // Red cap
    skinColor: '#ffdbac',
  },
  {
    id: 'tricky',
    name: 'Tricky',
    subtitle: 'Hip Hop Queen',
    cost: 1000,
    unlocked: false,
    shirtColor: '#ec4899', // Pink Hoodie
    pantsColor: '#475569',
    capColor: '#f8fafc',   // White Beanie
    skinColor: '#ffe0bd',
  },
  {
    id: 'fresh',
    name: 'Fresh',
    subtitle: 'Boombox Funk Master',
    cost: 2500,
    unlocked: false,
    shirtColor: '#10b981', // Emerald Green
    pantsColor: '#0f172a',
    capColor: '#eab308',   // Yellow Cap
    skinColor: '#8d5524',
  },
  {
    id: 'ninja',
    name: 'Ninja',
    subtitle: 'Silent Subway Shadow',
    cost: 5000,
    unlocked: false,
    shirtColor: '#111827', // Black
    pantsColor: '#111827',
    capColor: '#ef4444',   // Red Band
    skinColor: '#ffdbac',
  },
];

const INITIAL_HOVERBOARDS: HoverboardItem[] = [
  {
    id: 'freestyler',
    name: 'Freestyler',
    cost: 0,
    unlocked: true,
    primaryColor: '#f59e0b',
    accentColor: '#ef4444',
    glowColor: '#06b6d4',
  },
  {
    id: 'miami',
    name: 'Miami Vice',
    cost: 1200,
    unlocked: false,
    primaryColor: '#d946ef',
    accentColor: '#06b6d4',
    glowColor: '#ec4899',
  },
  {
    id: 'monster',
    name: 'Monster Flame',
    cost: 3000,
    unlocked: false,
    primaryColor: '#ef4444',
    accentColor: '#facc15',
    glowColor: '#f97316',
  },
  {
    id: 'teleporter',
    name: 'Cosmic Warp',
    cost: 6000,
    unlocked: false,
    primaryColor: '#6366f1',
    accentColor: '#a855f7',
    glowColor: '#ec4899',
  },
];

const INITIAL_UPGRADES: PowerUpUpgrade[] = [
  {
    id: 'jetpack',
    name: 'Jetpack Flight',
    description: 'Fly high above the tracks & scoop endless coins',
    level: 1,
    maxLevel: 5,
    baseDuration: 10,
    costPerLevel: [0, 500, 1200, 2500, 5000],
  },
  {
    id: 'magnet',
    name: 'Super Magnet',
    description: 'Pull all gold coins from any lane automatically',
    level: 1,
    maxLevel: 5,
    baseDuration: 12,
    costPerLevel: [0, 500, 1200, 2500, 5000],
  },
  {
    id: 'sneakers',
    name: 'Super Jumpers',
    description: 'Spring boots to jump clean over trains & hurdles',
    level: 1,
    maxLevel: 5,
    baseDuration: 12,
    costPerLevel: [0, 500, 1200, 2500, 5000],
  },
  {
    id: 'multiplier',
    name: '2x Multiplier',
    description: 'Double all score & coin gain during your run',
    level: 1,
    maxLevel: 5,
    baseDuration: 15,
    costPerLevel: [0, 500, 1200, 2500, 5000],
  },
];

const INITIAL_MISSIONS: Mission[] = [
  {
    id: 'm1',
    title: 'Collect 100 Gold Coins',
    target: 100,
    current: 0,
    reward: 250,
    type: 'coins',
    completed: false,
    claimed: false,
  },
  {
    id: 'm2',
    title: 'Jump 25 Obstacles',
    target: 25,
    current: 0,
    reward: 350,
    type: 'jump',
    completed: false,
    claimed: false,
  },
  {
    id: 'm3',
    title: 'Score 5,000 Points',
    target: 5000,
    current: 0,
    reward: 500,
    type: 'score',
    completed: false,
    claimed: false,
  },
];

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<SubwaySurfersEngine | null>(null);

  // Game Engine State
  const [gameStatus, setGameStatus] = useState<
    'idle' | 'running' | 'paused' | 'crashed' | 'gameover'
  >('idle');
  const [score, setScore] = useState<number>(0);
  const [runCoins, setRunCoins] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);
  const [multiplier, setMultiplier] = useState<number>(1);
  const [isHoverboardActive, setIsHoverboardActive] = useState<boolean>(false);
  const [hasDoubledCoins, setHasDoubledCoins] = useState<boolean>(false);

  // Persistent Player Stats
  const [highScore, setHighScore] = useState<number>(() => {
    return parseInt(localStorage.getItem('ss_highscore') || '0', 10);
  });
  const [totalCoins, setTotalCoins] = useState<number>(() => {
    return parseInt(localStorage.getItem('ss_coins') || '450', 10); // Start with 450 coins welcome bonus!
  });
  const [totalKeys, setTotalKeys] = useState<number>(() => {
    return parseInt(localStorage.getItem('ss_keys') || '3', 10); // Start with 3 free keys!
  });
  const [hoverboardStock, setHoverboardStock] = useState<number>(() => {
    return parseInt(localStorage.getItem('ss_hoverboards') || '5', 10); // Start with 5 boards!
  });

  // Customization
  const [characters, setCharacters] = useState<CharacterItem[]>(() => {
    const saved = localStorage.getItem('ss_characters');
    return saved ? JSON.parse(saved) : INITIAL_CHARACTERS;
  });
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>(() => {
    return localStorage.getItem('ss_selected_char') || 'jake';
  });

  const [hoverboards, setHoverboards] = useState<HoverboardItem[]>(() => {
    const saved = localStorage.getItem('ss_hoverboards_list');
    return saved ? JSON.parse(saved) : INITIAL_HOVERBOARDS;
  });
  const [selectedHoverboardId, setSelectedHoverboardId] = useState<string>(() => {
    return localStorage.getItem('ss_selected_board') || 'freestyler';
  });

  const [upgrades, setUpgrades] = useState<PowerUpUpgrade[]>(() => {
    const saved = localStorage.getItem('ss_upgrades');
    return saved ? JSON.parse(saved) : INITIAL_UPGRADES;
  });

  // Missions & Word Hunt
  const [missions, setMissions] = useState<Mission[]>(() => {
    const saved = localStorage.getItem('ss_missions');
    return saved ? JSON.parse(saved) : INITIAL_MISSIONS;
  });
  const [wordHunt, setWordHunt] = useState<WordHunt>(() => {
    const saved = localStorage.getItem('ss_wordhunt');
    return saved
      ? JSON.parse(saved)
      : { targetWord: 'SURF', collectedLetters: [], reward: 1000, completed: false };
  });

  // Active Powerups
  const [powerUps, setPowerUps] = useState<
    Record<PowerUpType, { active: boolean; timeLeft: number; duration: number }>
  >({
    jetpack: { active: false, timeLeft: 0, duration: 10 },
    magnet: { active: false, timeLeft: 0, duration: 12 },
    sneakers: { active: false, timeLeft: 0, duration: 12 },
    multiplier: { active: false, timeLeft: 0, duration: 15 },
  });

  // Audio & Modals
  const [sfxMuted, setSfxMuted] = useState<boolean>(false);
  const [musicMuted, setMusicMuted] = useState<boolean>(false);
  const [isShopOpen, setIsShopOpen] = useState<boolean>(false);
  const [isMissionsOpen, setIsMissionsOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem('ss_highscore', highScore.toString());
  }, [highScore]);

  useEffect(() => {
    localStorage.setItem('ss_coins', totalCoins.toString());
  }, [totalCoins]);

  useEffect(() => {
    localStorage.setItem('ss_keys', totalKeys.toString());
  }, [totalKeys]);

  useEffect(() => {
    localStorage.setItem('ss_hoverboards', hoverboardStock.toString());
  }, [hoverboardStock]);

  useEffect(() => {
    localStorage.setItem('ss_characters', JSON.stringify(characters));
  }, [characters]);

  useEffect(() => {
    localStorage.setItem('ss_selected_char', selectedCharacterId);
  }, [selectedCharacterId]);

  useEffect(() => {
    localStorage.setItem('ss_hoverboards_list', JSON.stringify(hoverboards));
  }, [hoverboards]);

  useEffect(() => {
    localStorage.setItem('ss_selected_board', selectedHoverboardId);
  }, [selectedHoverboardId]);

  useEffect(() => {
    localStorage.setItem('ss_upgrades', JSON.stringify(upgrades));
  }, [upgrades]);

  useEffect(() => {
    localStorage.setItem('ss_missions', JSON.stringify(missions));
  }, [missions]);

  useEffect(() => {
    localStorage.setItem('ss_wordhunt', JSON.stringify(wordHunt));
  }, [wordHunt]);

  // Initialize Three.js Engine
  useEffect(() => {
    if (!containerRef.current) return;

    const engine = new SubwaySurfersEngine(containerRef.current, {
      onScoreUpdate: (currentScore, currentCoins, dist) => {
        setScore(currentScore);
        setRunCoins(currentCoins);
        setDistance(dist);
      },
      onPowerUpUpdate: (type, active, timeLeft, duration) => {
        setPowerUps(prev => ({
          ...prev,
          [type]: { active, timeLeft, duration },
        }));
        if (type === 'multiplier') {
          setMultiplier(active ? 2 : 1);
        }
      },
      onHoverboardUpdate: (active, count) => {
        setIsHoverboardActive(active);
        setHoverboardStock(count);
      },
      onWordLetterCollected: letter => {
        setWordHunt(prev => {
          if (!prev.collectedLetters.includes(letter)) {
            const updated = [...prev.collectedLetters, letter];
            return { ...prev, collectedLetters: updated };
          }
          return prev;
        });
      },
      onGameOver: (finalScore, finalCoins, dist) => {
        setGameStatus('gameover');
        setTotalCoins(prev => prev + finalCoins);
        if (finalScore > highScore) {
          setHighScore(finalScore);
        }
      },
      onStumble: () => {
        // slight camera shake handled inside engine
      },
      onMissionProgress: (type, amount) => {
        setMissions(prevMissions =>
          prevMissions.map(m => {
            if (m.type === type && !m.completed) {
              const updatedCurrent = m.current + amount;
              return {
                ...m,
                current: updatedCurrent,
                completed: updatedCurrent >= m.target,
              };
            }
            return m;
          })
        );
      },
    });

    engine.hoverboardCount = hoverboardStock;
    engineRef.current = engine;

    // Apply equipped character colors
    const char = characters.find(c => c.id === selectedCharacterId);
    if (char) {
      engine.currentCharacter = {
        shirtColor: parseInt(char.shirtColor.replace('#', '0x'), 16),
        pantsColor: parseInt(char.pantsColor.replace('#', '0x'), 16),
        capColor: parseInt(char.capColor.replace('#', '0x'), 16),
        skinColor: parseInt(char.skinColor.replace('#', '0x'), 16),
      };
    }

    const board = hoverboards.find(b => b.id === selectedHoverboardId);
    if (board) {
      engine.currentBoard = {
        primaryColor: parseInt(board.primaryColor.replace('#', '0x'), 16),
        accentColor: parseInt(board.accentColor.replace('#', '0x'), 16),
        glowColor: parseInt(board.glowColor.replace('#', '0x'), 16),
      };
    }

    // Global Key Listener for Pause
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        if (engine.status === 'running') {
          engine.pause();
          setGameStatus('paused');
        } else if (engine.status === 'paused') {
          engine.resume();
          setGameStatus('running');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      engine.destroy();
    };
  }, []);

  // Update engine hoverboard count when stock changes
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.hoverboardCount = hoverboardStock;
    }
  }, [hoverboardStock]);

  // Update equipped character
  const handleSelectCharacter = (id: string) => {
    setSelectedCharacterId(id);
    const char = characters.find(c => c.id === id);
    if (char && engineRef.current) {
      engineRef.current.currentCharacter = {
        shirtColor: parseInt(char.shirtColor.replace('#', '0x'), 16),
        pantsColor: parseInt(char.pantsColor.replace('#', '0x'), 16),
        capColor: parseInt(char.capColor.replace('#', '0x'), 16),
        skinColor: parseInt(char.skinColor.replace('#', '0x'), 16),
      };
    }
  };

  const handleBuyCharacter = (id: string, cost: number) => {
    if (totalCoins < cost) return;
    setTotalCoins(prev => prev - cost);
    setCharacters(prev => prev.map(c => (c.id === id ? { ...c, unlocked: true } : c)));
    handleSelectCharacter(id);
    soundManager.playCelebration();
  };

  // Update equipped hoverboard
  const handleSelectHoverboard = (id: string) => {
    setSelectedHoverboardId(id);
    const board = hoverboards.find(b => b.id === id);
    if (board && engineRef.current) {
      engineRef.current.currentBoard = {
        primaryColor: parseInt(board.primaryColor.replace('#', '0x'), 16),
        accentColor: parseInt(board.accentColor.replace('#', '0x'), 16),
        glowColor: parseInt(board.glowColor.replace('#', '0x'), 16),
      };
    }
  };

  const handleBuyHoverboard = (id: string, cost: number) => {
    if (totalCoins < cost) return;
    setTotalCoins(prev => prev - cost);
    setHoverboards(prev => prev.map(b => (b.id === id ? { ...b, unlocked: true } : b)));
    handleSelectHoverboard(id);
    soundManager.playCelebration();
  };

  const handleBuyHoverboardConsumables = (count: number, cost: number) => {
    if (totalCoins < cost) return;
    setTotalCoins(prev => prev - cost);
    setHoverboardStock(prev => prev + count);
    soundManager.playPowerup();
  };

  const handleUpgradePowerUp = (id: string, cost: number) => {
    if (totalCoins < cost) return;
    setTotalCoins(prev => prev - cost);
    setUpgrades(prev =>
      prev.map(u => (u.id === id ? { ...u, level: Math.min(u.maxLevel, u.level + 1) } : u))
    );
    soundManager.playPowerup();
  };

  const handleBuyKey = (cost: number) => {
    if (totalCoins < cost) return;
    setTotalCoins(prev => prev - cost);
    setTotalKeys(prev => prev + 1);
    soundManager.playPowerup();
  };

  // Claim Mission Reward
  const handleClaimReward = (missionId: string, reward: number) => {
    setTotalCoins(prev => prev + reward);
    setMissions(prev => prev.map(m => (m.id === missionId ? { ...m, claimed: true } : m)));
    soundManager.playCelebration();
  };

  // Claim Word Hunt Reward
  const handleClaimWordHunt = (reward: number) => {
    setTotalCoins(prev => prev + reward);
    setWordHunt(prev => ({ ...prev, completed: true }));
    soundManager.playCelebration();
  };

  // Double Run Coins Bonus
  const handleDoubleCoins = () => {
    if (hasDoubledCoins || runCoins <= 0) return;
    setTotalCoins(prev => prev + runCoins);
    setRunCoins(prev => prev * 2);
    setHasDoubledCoins(true);
    soundManager.playCelebration();
  };

  // Audio controls
  const handleToggleSfx = () => {
    const next = !sfxMuted;
    setSfxMuted(next);
    soundManager.setSfxMuted(next);
  };

  const handleToggleMusic = () => {
    const next = !musicMuted;
    setMusicMuted(next);
    soundManager.setMusicMuted(next);
  };

  // Game control handlers
  const handleStartRun = () => {
    setGameStatus('running');
    setHasDoubledCoins(false);
    if (engineRef.current) {
      engineRef.current.startRun();
    }
  };

  const handlePause = () => {
    if (engineRef.current && engineRef.current.status === 'running') {
      engineRef.current.pause();
      setGameStatus('paused');
    }
  };

  const handleResume = () => {
    if (engineRef.current && engineRef.current.status === 'paused') {
      engineRef.current.resume();
      setGameStatus('running');
    }
  };

  const handleRestart = () => {
    setGameStatus('running');
    setHasDoubledCoins(false);
    if (engineRef.current) {
      engineRef.current.restart();
    }
  };

  const handleRevive = () => {
    if (totalKeys <= 0) return;
    setTotalKeys(prev => prev - 1);
    setGameStatus('running');
    if (engineRef.current) {
      engineRef.current.revive();
    }
  };

  const handleQuitToMenu = () => {
    setGameStatus('idle');
    if (engineRef.current) {
      engineRef.current.status = 'idle';
      soundManager.stopMusic();
    }
  };

  const equippedCharName =
    characters.find(c => c.id === selectedCharacterId)?.name || 'Jake';
  const equippedBoardName =
    hoverboards.find(b => b.id === selectedHoverboardId)?.name || 'Freestyler';

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950 font-fredoka">
      {/* 3D WebGL Canvas Viewport */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* 1. START MENU OVERLAY */}
      {gameStatus === 'idle' && (
        <StartScreen
          highScore={highScore}
          totalCoins={totalCoins}
          totalKeys={totalKeys}
          hoverboardStock={hoverboardStock}
          selectedCharacterName={equippedCharName}
          selectedHoverboardName={equippedBoardName}
          onStart={handleStartRun}
          onOpenShop={() => setIsShopOpen(true)}
          onOpenMissions={() => setIsMissionsOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          sfxMuted={sfxMuted}
          onToggleSfx={handleToggleSfx}
        />
      )}

      {/* 2. IN-GAME HUD OVERLAY */}
      {(gameStatus === 'running' || gameStatus === 'paused' || gameStatus === 'crashed') && (
        <GameHUD
          score={score}
          highScore={highScore}
          coins={runCoins}
          multiplier={multiplier}
          powerUps={powerUps}
          hoverboards={hoverboardStock}
          isHoverboardActive={isHoverboardActive}
          wordHunt={wordHunt}
          onPause={handlePause}
          onActivateHoverboard={() => engineRef.current?.activateHoverboard()}
          onJump={() => engineRef.current?.jump()}
          onRoll={() => engineRef.current?.roll()}
          onMoveLeft={() => engineRef.current?.moveLane(-1)}
          onMoveRight={() => engineRef.current?.moveLane(1)}
        />
      )}

      {/* 3. PAUSE MODAL */}
      {gameStatus === 'paused' && (
        <PauseModal
          onResume={handleResume}
          onRestart={handleRestart}
          onQuitToMenu={handleQuitToMenu}
          sfxMuted={sfxMuted}
          musicMuted={musicMuted}
          onToggleSfx={handleToggleSfx}
          onToggleMusic={handleToggleMusic}
        />
      )}

      {/* 4. GAME OVER MODAL */}
      {gameStatus === 'gameover' && (
        <GameOverModal
          score={score}
          highScore={highScore}
          coins={runCoins}
          distance={distance}
          totalKeys={totalKeys}
          onRetry={handleRestart}
          onRevive={handleRevive}
          onOpenShop={() => setIsShopOpen(true)}
          onDoubleCoins={handleDoubleCoins}
          hasDoubledCoins={hasDoubledCoins}
        />
      )}

      {/* 5. SHOP MODAL */}
      {isShopOpen && (
        <ShopModal
          totalCoins={totalCoins}
          totalKeys={totalKeys}
          hoverboardStock={hoverboardStock}
          characters={characters}
          selectedCharacterId={selectedCharacterId}
          hoverboards={hoverboards}
          selectedHoverboardId={selectedHoverboardId}
          upgrades={upgrades}
          onSelectCharacter={handleSelectCharacter}
          onBuyCharacter={handleBuyCharacter}
          onSelectHoverboard={handleSelectHoverboard}
          onBuyHoverboard={handleBuyHoverboard}
          onBuyHoverboardConsumables={handleBuyHoverboardConsumables}
          onUpgradePowerUp={handleUpgradePowerUp}
          onBuyKey={handleBuyKey}
          onClose={() => setIsShopOpen(false)}
        />
      )}

      {/* 6. MISSIONS MODAL */}
      {isMissionsOpen && (
        <MissionsModal
          missions={missions}
          wordHunt={wordHunt}
          onClaimReward={handleClaimReward}
          onClaimWordHunt={handleClaimWordHunt}
          onClose={() => setIsMissionsOpen(false)}
        />
      )}

      {/* 7. SETTINGS MODAL */}
      {isSettingsOpen && (
        <SettingsModal
          sfxMuted={sfxMuted}
          musicMuted={musicMuted}
          onToggleSfx={handleToggleSfx}
          onToggleMusic={handleToggleMusic}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  );
}
