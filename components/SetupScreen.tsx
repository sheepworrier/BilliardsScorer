import React, { useState } from 'react';
import { GameSettings, GameMode, Player } from '../types';

interface SetupScreenProps {
  onSetupComplete: (settings: GameSettings) => void;
}

const MOCK_FRIENDS: Player[] = [
  { id: '1', name: 'Player 1' },
  { id: '2', name: 'Player 2' },
];

const SetupScreen: React.FC<SetupScreenProps> = ({ onSetupComplete }) => {
  const [player1Name, setPlayer1Name] = useState('Player 1');
  const [player2Name, setPlayer2Name] = useState('Player 2');
  const [mode, setMode] = useState<GameMode>('points');
  const [target, setTarget] = useState(200);
  const [handicap1, setHandicap1] = useState('0');
  const [handicap2, setHandicap2] = useState('0');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSetupComplete({
      player1: { id: 'p1', name: player1Name || 'Player 1' },
      player2: { id: 'p2', name: player2Name || 'Player 2' },
      mode,
      target: Number(target),
      handicap1: Number(handicap1) || 0,
      handicap2: Number(handicap2) || 0,
    });
  };

  const handleModeChange = (newMode: GameMode) => {
    setMode(newMode);
    setTarget(newMode === 'points' ? 200 : 60);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full animate-fade-in">
      <h2 className="text-2xl font-semibold text-gray-200 mb-6">New Game Setup</h2>
      <form onSubmit={handleSubmit} className="w-full max-w-lg space-y-6">
        <div>
          <label htmlFor="player1Name" className="block text-sm font-medium text-gray-400">Player 1 (White)</label>
          <input type="text" id="player1Name" value={player1Name} onChange={(e) => setPlayer1Name(e.target.value)} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm text-white p-2" />
        </div>
        <div>
          <label htmlFor="player2Name" className="block text-sm font-medium text-gray-400">Player 2 (Yellow)</label>
          <input type="text" id="player2Name" value={player2Name} onChange={(e) => setPlayer2Name(e.target.value)} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm text-white p-2" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400">Game Mode</label>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <button type="button" onClick={() => handleModeChange('points')} className={`px-4 py-2 text-sm font-medium rounded-md ${mode === 'points' ? 'bg-green-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>Points</button>
            <button type="button" onClick={() => handleModeChange('time')} className={`px-4 py-2 text-sm font-medium rounded-md ${mode === 'time' ? 'bg-green-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>Time</button>
          </div>
        </div>

        <div>
          <label htmlFor="target" className="block text-sm font-medium text-gray-400">{mode === 'points' ? 'Target Score' : 'Time (minutes)'}</label>
          <input type="number" id="target" value={target} onChange={(e) => setTarget(Number(e.target.value))} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm text-white p-2" />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label htmlFor="handicap1" className="block text-sm font-medium text-gray-400">P1 Handicap</label>
                <input type="number" id="handicap1" value={handicap1} onChange={(e) => setHandicap1(e.target.value)} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm text-white p-2" />
            </div>
            <div>
                <label htmlFor="handicap2" className="block text-sm font-medium text-gray-400">P2 Handicap</label>
                <input type="number" id="handicap2" value={handicap2} onChange={(e) => setHandicap2(e.target.value)} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm text-white p-2" />
            </div>
        </div>

        <div className="pt-4">
          <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 text-lg">
            Start Game
          </button>
        </div>
      </form>
    </div>
  );
};

export default SetupScreen;