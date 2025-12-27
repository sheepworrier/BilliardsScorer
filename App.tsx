import React, { useState, useCallback } from 'react';
import { GameSettings, GameState } from './types';
import SetupScreen from './components/SetupScreen';
import GameScreen from './components/GameScreen';
import SummaryScreen from './components/SummaryScreen';

const App: React.FC = () => {
  const [view, setView] = useState<'setup' | 'game' | 'summary'>('setup');
  const [gameState, setGameState] = useState<GameState | null>(null);

  const handleGameSetup = useCallback((settings: GameSettings) => {
    const initialState: GameState = {
      settings,
      score1: settings.handicap1,
      score2: settings.handicap2,
      breaks: [],
      currentPlayerIndex: 0,
      currentBreakShots: [],
      currentBreakScore: 0,
      startTime: Date.now(),
      isGameOver: false,
      shotHistory: [],
      consecutiveCannons: 0,
      consecutiveHazards: 0,
      isOpponentBallPotted: false,
      baulkLineCrossedAt: null,
    };
    setGameState(initialState);
    setView('game');
  }, []);

  const handleEndGame = useCallback((finalState: GameState) => {
    setGameState({ ...finalState, isGameOver: true });
    setView('summary');
  }, []);

  const handleNewGame = useCallback(() => {
    setGameState(null);
    setView('setup');
  }, []);

  const handleBackToGame = useCallback(() => {
    if (gameState) {
      setGameState({ ...gameState, isGameOver: false });
      setView('game');
    }
  }, [gameState]);

  const renderView = () => {
    switch (view) {
      case 'setup':
        return <SetupScreen onSetupComplete={handleGameSetup} />;
      case 'game':
        if (gameState) {
          return <GameScreen initialState={gameState} onEndGame={handleEndGame} />;
        }
        return null;
      case 'summary':
        if (gameState) {
          return <SummaryScreen gameState={gameState} onNewGame={handleNewGame} onBackToGame={handleBackToGame} />;
        }
        return null;
      default:
        return <SetupScreen onSetupComplete={handleGameSetup} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-green-400 tracking-wider">English Billiards Scorer</h1>
          <p className="text-gray-400 mt-1">Track your game with precision</p>
        </header>
        <main className="bg-gray-800 rounded-xl shadow-2xl p-4 sm:p-6 min-h-[600px]">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

export default App;