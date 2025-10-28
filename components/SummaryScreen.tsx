import React, { useMemo } from 'react';
import { GameState, ShotType } from '../types';
import { CannonIcon, InOffIcon, PotIcon } from './icons';

interface SummaryScreenProps {
  gameState: GameState;
  onNewGame: () => void;
}

interface ShotIconProps {
  type: ShotType;
}

const ShotIcon: React.FC<ShotIconProps> = ({ type }) => {
    const Icon = type.includes('CANNON') ? CannonIcon : type.includes('IN_OFF') ? InOffIcon : PotIcon;
    const colorClass = type.includes('RED') ? 'text-red-500' : type.includes('OPPONENT') ? 'text-yellow-400' : 'text-blue-400';
    return <Icon className={`w-4 h-4 inline-block mx-0.5 ${colorClass}`} />;
};

const SummaryScreen: React.FC<SummaryScreenProps> = ({ gameState, onNewGame }) => {
  const { settings, score1, score2, breaks } = gameState;
  
  const winner = useMemo(() => {
    if (score1 > score2) return settings.player1;
    if (score2 > score1) return settings.player2;
    return null;
  }, [score1, score2, settings]);

  const topBreaks = useMemo(() => {
    const p1Breaks = breaks.filter(b => b.playerIndex === 0).sort((a, b) => b.total - a.total);
    const p2Breaks = breaks.filter(b => b.playerIndex === 1).sort((a, b) => b.total - a.total);
    return {
      p1Top: p1Breaks.length > 0 ? p1Breaks[0].total : 0,
      p2Top: p2Breaks.length > 0 ? p2Breaks[0].total : 0,
    };
  }, [breaks]);

  const formatTimeFromStart = (timestamp: number) => {
    const diff = Math.floor((timestamp - gameState.startTime) / 1000);
    const minutes = Math.floor(diff / 60).toString().padStart(2, '0');
    const seconds = (diff % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };
  
  return (
    <div className="flex flex-col items-center justify-start h-full p-4 animate-fade-in">
      <h2 className="text-3xl font-bold text-green-400 mb-2">Game Over</h2>
      {winner ? (
        <p className="text-xl text-gray-300 mb-6">{winner.name} wins!</p>
      ) : (
        <p className="text-xl text-gray-300 mb-6">It's a draw!</p>
      )}

      <div className="w-full bg-gray-700 rounded-lg p-6 mb-6">
        <div className="flex justify-around items-center text-center">
          <div>
            <p className="text-lg font-semibold">{settings.player1.name}</p>
            <p className="text-4xl font-bold">{score1}</p>
            <p className="text-sm text-gray-400 mt-1">Top Break: {topBreaks.p1Top}</p>
          </div>
          <div className="text-gray-500 text-3xl font-light">vs</div>
          <div>
            <p className="text-lg font-semibold">{settings.player2.name}</p>
            <p className="text-4xl font-bold">{score2}</p>
            <p className="text-sm text-gray-400 mt-1">Top Break: {topBreaks.p2Top}</p>
          </div>
        </div>
      </div>
      
      <div className="w-full">
          <h3 className="text-xl font-semibold mb-3 text-gray-200">Game Log</h3>
          <div className="bg-gray-900 rounded-lg max-h-64 overflow-y-auto p-1">
              <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-400 uppercase bg-gray-800 sticky top-0">
                      <tr>
                          <th scope="col" className="px-4 py-2">Time</th>
                          <th scope="col" className="px-4 py-2">{settings.player1.name}</th>
                          <th scope="col" className="px-4 py-2">{settings.player2.name}</th>
                      </tr>
                  </thead>
                  <tbody>
                      {breaks.map((breakItem, index) => (
                          <tr key={index} className="border-b border-gray-700 hover:bg-gray-700/50">
                              <td className="px-4 py-2 text-gray-400 font-mono">{formatTimeFromStart(breakItem.timestamp)}</td>
                              {breakItem.playerIndex === 0 ? (
                                  <td className="px-4 py-2">
                                      <span className="font-bold text-green-400 mr-2">{breakItem.total}</span>
                                      {breakItem.shots.map((shot, shotIndex) => (
                                          <React.Fragment key={shotIndex}>
                                              {shotIndex > 0 && <span className="text-gray-500 mx-0.5">|</span>}
                                              {shot.types.map((type, typeIndex) => (
                                                  <ShotIcon key={`${shotIndex}-${typeIndex}`} type={type} />
                                              ))}
                                          </React.Fragment>
                                      ))}
                                      {breakItem.endedByFoul && <span className="text-red-500 ml-2 font-semibold">FOUL</span>}
                                  </td>
                              ) : <td></td>}
                              {breakItem.playerIndex === 1 ? (
                                  <td className="px-4 py-2">
                                      <span className="font-bold text-green-400 mr-2">{breakItem.total}</span>
                                      {breakItem.shots.map((shot, shotIndex) => (
                                          <React.Fragment key={shotIndex}>
                                              {shotIndex > 0 && <span className="text-gray-500 mx-0.5">|</span>}
                                              {shot.types.map((type, typeIndex) => (
                                                  <ShotIcon key={`${shotIndex}-${typeIndex}`} type={type} />
                                              ))}
                                          </React.Fragment>
                                      ))}
                                      {breakItem.endedByFoul && <span className="text-red-500 ml-2 font-semibold">FOUL</span>}
                                  </td>
                              ) : <td></td>}
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>


      <div className="mt-8">
        <button
          onClick={onNewGame}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-300 text-lg"
        >
          Start New Game
        </button>
      </div>
    </div>
  );
};

export default SummaryScreen;