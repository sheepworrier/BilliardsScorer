
import { ShotType } from '../types';
import { CannonIcon, InOffIcon, PotIcon } from './icons';
import React from 'react';

export const SHOT_CONFIG: { type: ShotType; points: number; label: string; icon: React.FC<{className?:string}>; color: string }[] = [
  { type: ShotType.POT_RED, points: 3, label: 'Pot Red', icon: PotIcon, color: 'bg-red-600 hover:bg-red-700' },
  { type: ShotType.IN_OFF_RED, points: 3, label: 'In-off Red', icon: InOffIcon, color: 'bg-red-600 hover:bg-red-700' },
  { type: ShotType.POT_OPPONENT, points: 2, label: 'Pot Opponent', icon: PotIcon, color: 'bg-yellow-500 hover:bg-yellow-600' },
  { type: ShotType.IN_OFF_OPPONENT, points: 2, label: 'In-off Opponent', icon: InOffIcon, color: 'bg-yellow-500 hover:bg-yellow-600' },
  { type: ShotType.CANNON, points: 2, label: 'Cannon', icon: CannonIcon, color: 'bg-blue-500 hover:bg-blue-600' },
];
