import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GameState, Shot, ShotType, Break } from '../types';
import { UndoIcon, NextPlayerIcon } from './icons';
import { SHOT_CONFIG } from './shotConfig';

interface GameScreenProps {
  initialState: GameState;
  onEndGame: (finalState: GameState) => void;
}

const GameScreen: React.FC<GameScreenProps> = ({ initialState, onEndGame }) => {
  const [state, setState] = useState<GameState>(initialState);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [currentShotSelection, setCurrentShotSelection] = useState<ShotType[]>([]);
  const [foulMessage, setFoulMessage] = useState<string | null>(null);
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);

  const currentPlayer = useMemo(() => state.currentPlayerIndex === 0 ? state.settings.player1 : state.settings.player2, [state.currentPlayerIndex, state.settings]);
  
  useEffect(() => {
    if (foulMessage) {
        const timer = setTimeout(() => setFoulMessage(null), 3000);
        return () => clearTimeout(timer);
    }
  }, [foulMessage]);

  // Auto-save effect: automatically add shot to break after 3 seconds of inactivity
  useEffect(() => {
    if (currentShotSelection.length === 0) {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
        setAutoSaveTimer(null);
      }
      return;
    }

    // Clear existing timer
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }

    // Set new timer
    const timer = setTimeout(() => {
      addCombinedShot();
    }, 3000);

    setAutoSaveTimer(timer);

    return () => {
      clearTimeout(timer);
    };
  }, [currentShotSelection]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (state.settings.mode === 'time') {
      const timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
        setTimeElapsed(elapsed);
        if (elapsed >= state.settings.target * 60) {
          // Save any unfinished break before ending the game
          const finalState = state.currentBreakScore > 0 ? {
            ...state,
            breaks: [...state.breaks, {
              playerIndex: state.currentPlayerIndex,
              shots: state.currentBreakShots,
              total: state.currentBreakScore,
              timestamp: Date.now(),
            }]
          } : state;
          onEndGame(finalState);
          clearInterval(timer);
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.startTime, state.settings.mode, state.settings.target]);

  const toggleShotSelection = useCallback((type: ShotType) => {
    setCurrentShotSelection(prev => {
        if (prev.includes(type)) {
            return prev.filter(t => t !== type);
        } else {
            return [...prev, type];
        }
    });
  }, []);

  const handleFoul = useCallback((prevState: GameState, reason: string): GameState => {
    setFoulMessage(`Foul: ${reason}.`);
    const opponentScoreToUpdate = prevState.currentPlayerIndex === 0 ? 'score2' : 'score1';
    const newBreak: Break = {
      playerIndex: prevState.currentPlayerIndex,
      shots: prevState.currentBreakShots,
      total: prevState.currentBreakScore,
      timestamp: Date.now(),
      endedByFoul: reason,
    };

    return {
      ...prevState,
      [opponentScoreToUpdate]: prevState[opponentScoreToUpdate] + 2,
      breaks: prevState.currentBreakScore > 0 ? [...prevState.breaks, newBreak] : prevState.breaks,
      currentPlayerIndex: prevState.currentPlayerIndex === 0 ? 1 : 0,
      currentBreakShots: [],
      currentBreakScore: 0,
      shotHistory: [...prevState.shotHistory, prevState],
      consecutiveCannons: 0,
      consecutiveHazards: 0,
      isOpponentBallPotted: false,
      baulkLineCrossedAt: null,
    };
  }, []);

  const recordFoul = useCallback(() => {
    setState(prevState => handleFoul(prevState, 'Manual foul recorded'));
    setCurrentShotSelection([]);
  }, [handleFoul]);

  const recordBaulkLineCrossing = useCallback(() => {
    setState(prevState => ({
      ...prevState,
      baulkLineCrossedAt: prevState.currentBreakScore,
      shotHistory: [...prevState.shotHistory, prevState],
    }));
  }, []);

  const addCombinedShot = useCallback(() => {
    if (currentShotSelection.length === 0) return;

    // Clear auto-save timer
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
      setAutoSaveTimer(null);
    }

    const points = currentShotSelection.reduce((total, type) => {
        const config = SHOT_CONFIG.find(sc => sc.type === type);
        return total + (config ? config.points : 0);
    }, 0);

    const newShot: Shot = { types: currentShotSelection, points };

    setState(prevState => {
        const hasCannon = newShot.types.includes(ShotType.CANNON);
        const hasHazard = newShot.types.some(t => t !== ShotType.CANNON);

        if (hasCannon && !hasHazard && prevState.consecutiveCannons >= 75) {
            return handleFoul(prevState, 'Exceeded 75 consecutive cannons');
        }
        if (!hasCannon && hasHazard && prevState.consecutiveHazards >= 15) {
            return handleFoul(prevState, 'Exceeded 15 consecutive hazards');
        }

        // Check for baulk line crossing requirement
        const newBreakScore = prevState.currentBreakScore + newShot.points;
        const currentHundred = Math.floor(prevState.currentBreakScore / 100);
        const newHundred = Math.floor(newBreakScore / 100);

        // If we're crossing into a new hundred and the baulk line wasn't crossed in the previous hundred
        if (newHundred > currentHundred) {
          const lastCrossedHundred = prevState.baulkLineCrossedAt !== null
            ? Math.floor(prevState.baulkLineCrossedAt / 100)
            : -1;

          // If we didn't cross the baulk line in the previous hundred (80-100 range)
          if (lastCrossedHundred < currentHundred && prevState.currentBreakScore >= 80) {
            return handleFoul(prevState, 'Failed to cross baulk line between 80-100 points');
          }
        }

        const shotHistory = [...prevState.shotHistory, prevState];
        const scoreToUpdate = prevState.currentPlayerIndex === 0 ? 'score1' : 'score2';

        const opponentPotted = newShot.types.includes(ShotType.POT_OPPONENT);

        let consecutiveCannons = prevState.consecutiveCannons;
        let consecutiveHazards = prevState.consecutiveHazards;

        if (hasCannon && !hasHazard) {
            consecutiveCannons += 1;
            consecutiveHazards = 0;
        } else if (!hasCannon && hasHazard) {
            consecutiveHazards += 1;
            consecutiveCannons = 0;
        } else if (hasCannon && hasHazard) {
            consecutiveCannons = 0;
            consecutiveHazards = 0;
        }

        // Calculate new score, capping at target in points mode
        const newScore = prevState[scoreToUpdate] + newShot.points;
        const cappedScore = prevState.settings.mode === 'points'
          ? Math.min(newScore, prevState.settings.target)
          : newScore;

        // Calculate actual points added (after capping)
        const actualPointsAdded = cappedScore - prevState[scoreToUpdate];

        return {
            ...prevState,
            [scoreToUpdate]: cappedScore,
            currentBreakShots: [...prevState.currentBreakShots, newShot],
            currentBreakScore: prevState.currentBreakScore + actualPointsAdded,
            shotHistory,
            consecutiveCannons,
            consecutiveHazards,
            isOpponentBallPotted: prevState.isOpponentBallPotted || opponentPotted,
        };
    });
    setCurrentShotSelection([]);
  }, [currentShotSelection, handleFoul, autoSaveTimer]);


  const undoLastShot = useCallback(() => {
    setState(prevState => {
      if (prevState.shotHistory.length === 0) return prevState;
      const lastState = prevState.shotHistory[prevState.shotHistory.length - 1];
      return lastState;
    });
  }, []);

  const endTurn = useCallback(() => {
    setState(prevState => {
      const newBreak: Break = {
        playerIndex: prevState.currentPlayerIndex,
        shots: prevState.currentBreakShots,
        total: prevState.currentBreakScore,
        timestamp: Date.now(),
      };

      return {
        ...prevState,
        breaks: prevState.currentBreakScore > 0 ? [...prevState.breaks, newBreak] : prevState.breaks,
        currentPlayerIndex: prevState.currentPlayerIndex === 0 ? 1 : 0,
        currentBreakShots: [],
        currentBreakScore: 0,
        shotHistory: [...prevState.shotHistory, prevState],
        consecutiveCannons: 0,
        consecutiveHazards: 0,
        isOpponentBallPotted: false,
        baulkLineCrossedAt: null,
      };
    });
    setCurrentShotSelection([]);
  }, []);

  useEffect(() => {
      if (state.settings.mode === 'points' && (state.score1 >= state.settings.target || state.score2 >= state.settings.target)) {
          // Save any unfinished break before ending the game
          const finalState = state.currentBreakScore > 0 ? {
            ...state,
            breaks: [...state.breaks, {
              playerIndex: state.currentPlayerIndex,
              shots: state.currentBreakShots,
              total: state.currentBreakScore,
              timestamp: Date.now(),
            }]
          } : state;
          onEndGame(finalState);
      }
  }, [state, onEndGame]);

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  const timerDisplay = useMemo(() => {
    if (state.settings.mode !== 'time') return null;
    const timeLeft = state.settings.target * 60 - timeElapsed;
    return (
        <div className="text-center bg-gray-900 p-2 rounded-lg">
            <div className="text-lg font-semibold text-gray-400">Time Remaining</div>
            <div className="text-4xl font-bold text-green-400 tracking-widest">{formatTime(Math.max(0, timeLeft))}</div>
        </div>
    );
  }, [state.settings.mode, state.settings.target, timeElapsed]);

  const predictedScores = useMemo(() => {
    if (state.settings.mode === 'points') {
      // Calculate predicted final scores based on progress toward target
      const h1 = state.settings.handicap1;
      const h2 = state.settings.handicap2;
      const t = state.settings.target;
      const s1 = state.score1;
      const s2 = state.score2;

      // Calculate progress for each player
      const p1 = (s1 - h1) / (t - h1);
      const p2 = (s2 - h2) / (t - h2);

      if (p1 === 0 && p2 === 0) return null;

      let predicted1: number;
      let predicted2: number;

      if (p1 > p2) {
        // Player 1 is ahead
        predicted1 = t;
        predicted2 = Math.round(p2 / p1 * (t - h2) + h2);
      } else if (p2 > p1) {
        // Player 2 is ahead
        predicted2 = t;
        predicted1 = Math.round(p1 / p2 * (t - h1) + h1);
      } else {
        // Equal progress
        predicted1 = t;
        predicted2 = t;
      }

      return { predicted1, predicted2 };
    } else {
      // Time mode: extrapolate based on time elapsed
      if (timeElapsed === 0) return null;

      const h1 = state.settings.handicap1;
      const h2 = state.settings.handicap2;
      const t = state.settings.target; // time target in minutes
      const c = timeElapsed / 60; // current minutes elapsed
      const s1 = state.score1;
      const s2 = state.score2;

      const predicted1 = Math.round(t / c * (s1 - h1) + h1);
      const predicted2 = Math.round(t / c * (s2 - h2) + h2);

      return { predicted1, predicted2 };
    }
  }, [state.settings.mode, state.settings.target, state.settings.handicap1, state.settings.handicap2, state.score1, state.score2, timeElapsed]);


  return (
    <div className="flex flex-col h-full relative">
      {foulMessage && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-800 text-white p-6 rounded-lg shadow-2xl z-20 text-center animate-pulse">
            <p className="font-bold text-xl">{foulMessage}</p>
            <p className="text-sm text-gray-300">Turn ends. 2 points to opponent.</p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className={`p-4 rounded-lg text-center border-4 ${state.currentPlayerIndex === 0 ? 'border-green-400' : 'border-transparent'}`}>
            <div className="text-xl font-bold">{state.settings.player1.name}</div>
            <div className="text-5xl font-mono font-bold tracking-tighter">{state.score1}</div>
            {predictedScores && (
              <div className="text-sm text-gray-400 mt-1">
                Predicted: {predictedScores.predicted1}
              </div>
            )}
        </div>
        <div className={`p-4 rounded-lg text-center border-4 ${state.currentPlayerIndex === 1 ? 'border-green-400' : 'border-transparent'}`}>
            <div className="text-xl font-bold">{state.settings.player2.name}</div>
            <div className="text-5xl font-mono font-bold tracking-tighter">{state.score2}</div>
            {predictedScores && (
              <div className="text-sm text-gray-400 mt-1">
                Predicted: {predictedScores.predicted2}
              </div>
            )}
        </div>
      </div>

      {timerDisplay}

      <div className="text-center my-4 flex-grow">
          <div className="text-lg text-gray-400">Current Break: {currentPlayer.name}</div>
          <div className="text-7xl font-bold text-green-400">{state.currentBreakScore}</div>
          <div className="flex justify-center items-center gap-4 mt-2 text-sm">
              <span className={`${state.consecutiveCannons >= 70 ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                  {state.consecutiveCannons} / 75 cannons
              </span>
              <span className={`${state.consecutiveHazards >= 10 ? 'text-yellow-500 font-bold' : 'text-gray-400'}`}>
                  {state.consecutiveHazards} / 15 hazards
              </span>
          </div>
          {state.currentBreakScore >= 80 && (() => {
            const currentHundred = Math.floor(state.currentBreakScore / 100);
            const lastCrossedHundred = state.baulkLineCrossedAt !== null
              ? Math.floor(state.baulkLineCrossedAt / 100)
              : -1;
            const needsCrossing = lastCrossedHundred < currentHundred;
            const rangeStart = currentHundred * 100 + 80;
            const rangeEnd = (currentHundred + 1) * 100;

            return needsCrossing ? (
              <div className="mt-2">
                <button
                  onClick={recordBaulkLineCrossing}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-1 px-3 rounded text-xs"
                >
                  Baulk Line Crossed ({rangeStart}-{rangeEnd})
                </button>
              </div>
            ) : null;
          })()}
          <div className="flex flex-wrap justify-center items-center gap-2 mt-2 min-h-[30px]">
            {state.currentBreakShots.map((shot, index) => (
                <React.Fragment key={index}>
                    {index > 0 && <span className="text-gray-500 mx-1">|</span>}
                    {shot.types.map((type, i) => {
                        const Icon = SHOT_CONFIG.find(sc => sc.type === type)?.icon;
                        const colorClass = type.includes('RED') ? 'text-red-500' : type.includes('OPPONENT') ? 'text-yellow-400' : 'text-blue-400';
                        return Icon ? <Icon key={i} className={`w-6 h-6 ${colorClass}`} /> : null;
                    })}
                </React.Fragment>
            ))}
          </div>
      </div>
      
      <div className="sticky bottom-0 bg-gray-800 py-4 -mx-6 px-6">
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-4">
            {SHOT_CONFIG.map(({ type, label, icon: Icon, color }) => {
                const isSelected = currentShotSelection.includes(type);
                const isOpponentShot = type === ShotType.POT_OPPONENT || type === ShotType.IN_OFF_OPPONENT;
                const isCannonShot = type === ShotType.CANNON;

                // Disable opponent shots if opponent ball already potted
                const disabledByOpponentPotted = isOpponentShot && state.isOpponentBallPotted;

                // Disable cannon if opponent ball potted in current selection
                const opponentPottedInSelection = currentShotSelection.includes(ShotType.POT_OPPONENT);
                const disabledByCannonRule = isCannonShot && opponentPottedInSelection;

                // Prevent both in-off red and in-off opponent in same stroke
                const isInOffRed = type === ShotType.IN_OFF_RED;
                const isInOffOpponent = type === ShotType.IN_OFF_OPPONENT;
                const hasInOffRed = currentShotSelection.includes(ShotType.IN_OFF_RED);
                const hasInOffOpponent = currentShotSelection.includes(ShotType.IN_OFF_OPPONENT);
                const disabledByInOffRule = (isInOffRed && hasInOffOpponent) || (isInOffOpponent && hasInOffRed);

                const isDisabled = disabledByOpponentPotted || disabledByCannonRule || disabledByInOffRule;

                return (
                    <button
                        key={type}
                        onClick={() => toggleShotSelection(type)}
                        disabled={isDisabled}
                        className={`${isDisabled ? 'bg-gray-600 opacity-50 cursor-not-allowed' : color} text-white font-semibold p-1.5 rounded flex flex-col items-center justify-center text-center text-xs h-16 transition-transform transform ${isSelected && !isDisabled ? 'ring-2 ring-green-400 scale-105' : 'hover:scale-105'}`}
                    >
                        <Icon className="w-6 h-6 mb-0.5" />
                        <span>{label}</span>
                    </button>
                )
            })}
        </div>
         <button
            onClick={addCombinedShot}
            disabled={currentShotSelection.length === 0}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold p-2 rounded flex items-center justify-center text-base mb-2"
        >
            Add Shot to Break
        </button>
        <div className="grid grid-cols-2 gap-2 mb-2">
            <button onClick={undoLastShot} className="bg-gray-600 hover:bg-gray-700 text-white font-bold p-2 rounded flex items-center justify-center text-sm">
                <UndoIcon className="w-5 h-5 mr-1" /> Undo
            </button>
            <button onClick={endTurn} className="bg-gray-600 hover:bg-gray-700 text-white font-bold p-2 rounded flex items-center justify-center text-sm">
                Miss / End <NextPlayerIcon className="w-5 h-5 ml-1" />
            </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
            <button onClick={recordFoul} className="bg-orange-600 hover:bg-orange-700 text-white font-bold p-2 rounded text-sm">
                Record Foul
            </button>
            <button onClick={() => {
              // Save any unfinished break before ending the game
              const finalState = state.currentBreakScore > 0 ? {
                ...state,
                breaks: [...state.breaks, {
                  playerIndex: state.currentPlayerIndex,
                  shots: state.currentBreakShots,
                  total: state.currentBreakScore,
                  timestamp: Date.now(),
                }]
              } : state;
              onEndGame(finalState);
            }} className="bg-red-700 hover:bg-red-800 text-white font-bold p-2 rounded text-sm">End Game</button>
        </div>
      </div>
    </div>
  );
};

export default GameScreen;