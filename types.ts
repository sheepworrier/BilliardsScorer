export interface Player {
  id: string;
  name: string;
}

export type GameMode = 'points' | 'time';

export interface GameSettings {
  player1: Player;
  player2: Player;
  mode: GameMode;
  target: number; // either points or minutes
  handicap1: number;
  handicap2: number;
}

export enum ShotType {
  CANNON = 'Cannon',
  POT_RED = 'Pot Red',
  POT_OPPONENT = 'Pot Opponent',
  IN_OFF_RED = 'In-off Red',
  IN_OFF_OPPONENT = 'In-off Opponent',
}

export interface Shot {
  // A single stroke can have multiple scoring types
  types: ShotType[];
  points: number;
}

export interface Break {
  playerIndex: 0 | 1;
  shots: Shot[];
  total: number;
  timestamp: number;
  endedByFoul?: string;
}

export interface GameState {
  settings: GameSettings;
  score1: number;
  score2: number;
  breaks: Break[];
  currentPlayerIndex: 0 | 1;
  currentBreakShots: Shot[];
  currentBreakScore: number;
  startTime: number;
  isGameOver: boolean;
  shotHistory: GameState[]; // For undo functionality
  consecutiveCannons: number;
  consecutiveHazards: number;
  isOpponentBallPotted: boolean;
  baulkLineCrossedAt: number | null; // Tracks the score when baulk line was last crossed
}