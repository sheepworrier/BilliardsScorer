import React, { useMemo } from 'react';
import { GameState, ShotType } from '../types';
import { CannonIcon, InOffIcon, PotIcon } from './icons';
import { jsPDF } from 'jspdf';

interface SummaryScreenProps {
  gameState: GameState;
  onNewGame: () => void;
  onBackToGame: () => void;
}

interface ShotIconProps {
  type: ShotType;
}

const ShotIcon: React.FC<ShotIconProps> = ({ type }) => {
    const Icon = type === ShotType.CANNON ? CannonIcon : type.includes('In-off') ? InOffIcon : PotIcon;
    const colorClass = type.includes('Red') ? 'text-red-600' : type.includes('Opponent') ? 'text-yellow-500' : 'text-blue-500';
    return <Icon className={`w-4 h-4 inline-block mx-0.5 ${colorClass}`} />;
};

const SummaryScreen: React.FC<SummaryScreenProps> = ({ gameState, onNewGame, onBackToGame }) => {
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

  const getShotSymbol = (type: ShotType): string => {
    if (type === ShotType.CANNON) return 'C'; // C for cannon
    if (type.includes('In-off')) return 'I'; // I for in-off
    return 'P'; // P for pot
  };

  const getShotColor = (type: ShotType): [number, number, number] => {
    if (type.includes('Red')) return [220, 38, 38]; // Red RGB
    if (type.includes('Opponent')) return [234, 179, 8]; // Yellow RGB
    return [59, 130, 246]; // Blue RGB for cannon
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // Title
    doc.setFontSize(20);
    doc.setTextColor(34, 197, 94); // Green
    doc.text('ENGLISH BILLIARDS SCORE SHEET', pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Game Info
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const gameDate = new Date(gameState.startTime).toLocaleString();
    const gameMode = settings.mode === 'points' ? `${settings.target} points` : `${settings.target} minutes`;
    doc.text(`Date: ${gameDate}`, 20, yPos);
    yPos += 7;
    doc.text(`Game Mode: ${gameMode}`, 20, yPos);
    yPos += 15;

    // Winner announcement
    doc.setFontSize(14);
    doc.setTextColor(34, 197, 94); // Green
    if (winner) {
      doc.text(`Winner: ${winner.name}`, pageWidth / 2, yPos, { align: 'center' });
    } else {
      doc.text("It's a draw!", pageWidth / 2, yPos, { align: 'center' });
    }
    yPos += 15;

    // Final Scores Box
    doc.setFillColor(240, 240, 240);
    doc.roundedRect(20, yPos, pageWidth - 40, 35, 3, 3, 'F');

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    const col1X = 40;
    const col2X = pageWidth - 60;

    doc.text(settings.player1.name, col1X, yPos + 10, { align: 'center' });
    doc.setFontSize(18);
    doc.text(score1.toString(), col1X, yPos + 20, { align: 'center' });
    doc.setFontSize(9);
    doc.text(`Top Break: ${topBreaks.p1Top}`, col1X, yPos + 28, { align: 'center' });

    doc.setFontSize(16);
    doc.setTextColor(100, 100, 100);
    doc.text('vs', pageWidth / 2, yPos + 20, { align: 'center' });

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(settings.player2.name, col2X, yPos + 10, { align: 'center' });
    doc.setFontSize(18);
    doc.text(score2.toString(), col2X, yPos + 20, { align: 'center' });
    doc.setFontSize(9);
    doc.text(`Top Break: ${topBreaks.p2Top}`, col2X, yPos + 28, { align: 'center' });

    yPos += 45;

    // Game Log Header
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Game Log', 20, yPos);
    yPos += 10;

    // Table Headers
    doc.setFillColor(50, 50, 50);
    doc.rect(20, yPos - 5, pageWidth - 40, 8, 'F');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text('Time', 25, yPos);
    doc.text(settings.player1.name, 50, yPos);
    doc.text(settings.player2.name, pageWidth / 2 + 20, yPos);
    yPos += 8;

    // Game Log Entries
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8);

    breaks.forEach((breakItem) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;

        // Repeat headers on new page
        doc.setFillColor(50, 50, 50);
        doc.rect(20, yPos - 5, pageWidth - 40, 8, 'F');
        doc.setFontSize(9);
        doc.setTextColor(255, 255, 255);
        doc.text('Time', 25, yPos);
        doc.text(settings.player1.name, 50, yPos);
        doc.text(settings.player2.name, pageWidth / 2 + 20, yPos);
        yPos += 8;
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(8);
      }

      const timeStr = formatTimeFromStart(breakItem.timestamp);
      const isPlayer1 = breakItem.playerIndex === 0;
      const xPos = isPlayer1 ? 50 : pageWidth / 2 + 20;
      const maxWidth = (pageWidth / 2) - 30; // Maximum width for the shot column
      const startYPos = yPos;

      // Time
      doc.setTextColor(100, 100, 100);
      doc.text(timeStr, 25, yPos);

      // Break total
      doc.setTextColor(34, 197, 94); // Green
      doc.setFont('helvetica', 'bold');
      doc.text(breakItem.total.toString(), xPos, yPos);
      doc.setFont('helvetica', 'normal');

      // Shots with colored symbols - with line wrapping
      let shotXPos = xPos + 15;
      let currentYPos = yPos;
      breakItem.shots.forEach((shot, shotIndex) => {
        if (shotIndex > 0) {
          // Check if separator would overflow
          if (shotXPos + 3 > xPos + maxWidth) {
            currentYPos += 7;
            shotXPos = xPos + 15;
            // Check if we need a new page
            if (currentYPos > 270) {
              doc.addPage();
              currentYPos = 20;
              yPos = 20;

              // Repeat headers on new page
              doc.setFillColor(50, 50, 50);
              doc.rect(20, currentYPos - 5, pageWidth - 40, 8, 'F');
              doc.setFontSize(9);
              doc.setTextColor(255, 255, 255);
              doc.text('Time', 25, currentYPos);
              doc.text(settings.player1.name, 50, currentYPos);
              doc.text(settings.player2.name, pageWidth / 2 + 20, currentYPos);
              currentYPos += 8;
              doc.setTextColor(0, 0, 0);
              doc.setFontSize(8);
              shotXPos = xPos + 15;
            }
          }
          doc.setTextColor(150, 150, 150);
          doc.text('|', shotXPos, currentYPos);
          shotXPos += 3;
        }

        shot.types.forEach((type) => {
          const symbol = getShotSymbol(type);
          const symbolWidth = 4;

          // Check if symbol would overflow
          if (shotXPos + symbolWidth > xPos + maxWidth) {
            currentYPos += 7;
            shotXPos = xPos + 15;
            // Check if we need a new page
            if (currentYPos > 270) {
              doc.addPage();
              currentYPos = 20;
              yPos = 20;

              // Repeat headers on new page
              doc.setFillColor(50, 50, 50);
              doc.rect(20, currentYPos - 5, pageWidth - 40, 8, 'F');
              doc.setFontSize(9);
              doc.setTextColor(255, 255, 255);
              doc.text('Time', 25, currentYPos);
              doc.text(settings.player1.name, 50, currentYPos);
              doc.text(settings.player2.name, pageWidth / 2 + 20, currentYPos);
              currentYPos += 8;
              doc.setTextColor(0, 0, 0);
              doc.setFontSize(8);
              shotXPos = xPos + 15;
            }
          }

          const color = getShotColor(type);
          doc.setTextColor(color[0], color[1], color[2]);
          doc.text(symbol, shotXPos, currentYPos);
          shotXPos += symbolWidth;
        });
      });

      // Foul indicator
      if (breakItem.endedByFoul) {
        // Check if FOUL text would overflow
        if (shotXPos + 15 > xPos + maxWidth) {
          currentYPos += 7;
          shotXPos = xPos + 15;
        }
        doc.setTextColor(239, 68, 68); // Red
        doc.setFont('helvetica', 'bold');
        doc.text('FOUL', shotXPos + 2, currentYPos);
        doc.setFont('helvetica', 'normal');
      }

      // Update yPos to account for any line wrapping
      yPos = currentYPos + 7;
    });

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 10;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Generated by English Billiards Scorer', pageWidth / 2, footerY, { align: 'center' });

    // Save the PDF
    doc.save(`billiards-score-${new Date(gameState.startTime).toISOString().split('T')[0]}.pdf`);
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


      <div className="mt-8 flex gap-4 flex-wrap justify-center">
        <button
          onClick={onBackToGame}
          className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-300 text-lg"
        >
          Back to Game
        </button>
        <button
          onClick={exportToPDF}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-300 text-lg"
        >
          Export to PDF
        </button>
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