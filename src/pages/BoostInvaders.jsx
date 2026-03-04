// BOOST INVADERS - HAUPTSEITE
// Vereint Menue, Spiel und Bestenliste

import React, { useState, useEffect } from 'react';
import MainMenu from '@/components/game/MainMenu';
import GameCanvas from '@/components/game/GameCanvas';
import Leaderboard, { HighscoreInput, loadHighscores, getTopScore } from '@/components/game/Leaderboard';

// Validation: Game result must have valid fields
function validateGameResult(result) {
  if (!result || typeof result !== 'object') return false;
  if (!['kids', 'normal', 'hardcore'].includes(result.mode)) return false;
  if (!Number.isInteger(result.score) || result.score < 0 || result.score > 9999999) return false;
  if (!Number.isInteger(result.level) || result.level < 1 || result.level > 999) return false;
  if (typeof result.victory !== 'boolean') return false;
  return true;
}

export default function BoostInvaders() {
  const [screen, setScreen] = useState('menu');
  const [selectedMode, setSelectedMode] = useState(null);
  const [currentScore, setCurrentScore] = useState(0);
  const [gameResult, setGameResult] = useState(null);
  const [highScores, setHighScores] = useState({});

  useEffect(() => {
    setHighScores({
      kids: getTopScore('kids'),
      normal: getTopScore('normal'),
      hardcore: getTopScore('hardcore')
    });
  }, [screen]);

  const handleStartGame = (mode) => {
    setSelectedMode(mode);
    setCurrentScore(0);
    setGameResult(null);
    setScreen('game');
  };

  const handleGameEnd = (result) => {
    // Validate game result before allowing highscore entry
    if (!validateGameResult(result)) {
      console.warn('Invalid game result rejected:', result);
      setScreen('menu');
      return;
    }

    // Hardcore Endlos: Wave als Level
    if (result.mode === 'hardcore' && result.level >= 10) {
      result.level = result.wave || result.level;
    }
    setGameResult(result);
    setScreen('highscoreInput');
  };

  const handleHighscoreSaved = () => {
    setScreen('menu');
    setHighScores({
      kids: getTopScore('kids'),
      normal: getTopScore('normal'),
      hardcore: getTopScore('hardcore')
    });
  };

  const handleScoreUpdate = (score) => {
    setCurrentScore(score);
  };

  const handleBackToMenu = () => {
    setScreen('menu');
  };

  return (
    <div className="min-h-screen bg-[#0a0a1a]">
      {screen === 'menu' && (
        <div className="relative">
          <MainMenu
            onStartGame={handleStartGame}
            highScores={highScores}
          />

          <button
            onClick={() => setScreen('leaderboard')}
            className="fixed bottom-8 right-8 px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-full text-white font-medium border border-gray-600 transition-all hover:scale-105"
          >
            Bestenliste
          </button>
        </div>
      )}

      {screen === 'game' && (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <GameCanvas
            mode={selectedMode}
            onGameEnd={handleGameEnd}
            onScoreUpdate={handleScoreUpdate}
          />

          <a
            href="https://social-boost-pro.com"
            className="fixed top-4 left-4 px-4 py-2 bg-gray-800/80 hover:bg-gray-700 rounded-lg text-gray-300 hover:text-white text-sm border border-gray-600 transition-all z-50"
          >
            &larr; Social Boost Pro
          </a>
          <button
            onClick={handleBackToMenu}
            className="fixed top-4 right-4 px-4 py-2 bg-gray-800/80 hover:bg-gray-700 rounded-lg text-white text-sm border border-gray-600 z-50"
          >
            Menue
          </button>
        </div>
      )}

      {screen === 'leaderboard' && (
        <Leaderboard
          onBack={handleBackToMenu}
          initialMode="normal"
        />
      )}

      {screen === 'highscoreInput' && gameResult && (
        <>
          <div className="flex flex-col items-center justify-center min-h-screen p-4 opacity-30">
            <GameCanvas
              mode={selectedMode}
              onGameEnd={() => {}}
              onScoreUpdate={() => {}}
            />
          </div>

          <HighscoreInput
            score={gameResult.score}
            level={gameResult.level}
            mode={gameResult.mode}
            victory={gameResult.victory}
            accuracy={gameResult.accuracy}
            speedBonus={gameResult.speedBonus}
            maxCombo={gameResult.maxCombo}
            onSave={handleHighscoreSaved}
            onSkip={handleBackToMenu}
          />
        </>
      )}
    </div>
  );
}
