export type Lane = -1 | 0 | 1; // -1: Left (x=-3), 0: Center (x=0), 1: Right (x=3)

export type GameStatus = 'idle' | 'running' | 'paused' | 'crashed' | 'gameover';

export type PowerUpType = 'jetpack' | 'magnet' | 'sneakers' | 'multiplier';

export interface PowerUpState {
  active: boolean;
  timeLeft: number;
  duration: number;
}

export interface PlayerStats {
  score: number;
  coins: number;
  distance: number; // in meters
  highScore: number;
  multiplier: number;
  keys: number;
}

export interface CharacterItem {
  id: string;
  name: string;
  subtitle: string;
  cost: number;
  unlocked: boolean;
  shirtColor: string;
  pantsColor: string;
  capColor: string;
  skinColor: string;
}

export interface HoverboardItem {
  id: string;
  name: string;
  cost: number;
  unlocked: boolean;
  primaryColor: string;
  accentColor: string;
  glowColor: string;
  speedBonus?: number;
}

export interface PowerUpUpgrade {
  id: PowerUpType;
  name: string;
  description: string;
  level: number;
  maxLevel: number;
  baseDuration: number;
  costPerLevel: number[];
}

export interface Mission {
  id: string;
  title: string;
  target: number;
  current: number;
  reward: number;
  type: 'coins' | 'jump' | 'roll' | 'score' | 'letters' | 'hoverboard';
  completed: boolean;
  claimed: boolean;
}

export interface WordHunt {
  targetWord: string;
  collectedLetters: string[];
  reward: number;
  completed: boolean;
}
