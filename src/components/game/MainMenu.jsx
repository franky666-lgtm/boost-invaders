// BOOST INVADERS - HAUPTMENUE
// Moduswahl mit Beschreibungen + Branding

import React, { useState, useEffect } from 'react';
import { GAME_CONFIG } from './GameConfig';
import { motion } from 'framer-motion';
import { Gamepad2, Baby, Skull, Star, Rocket, Zap, ArrowLeft } from 'lucide-react';

export default function MainMenu({ onStartGame, highScores }) {
  const [selectedMode, setSelectedMode] = useState(null);
  const [stars, setStars] = useState([]);

  useEffect(() => {
    const newStars = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 3 + 2
    }));
    setStars(newStars);
  }, []);

  const modes = [
    {
      id: 'kids',
      name: GAME_CONFIG.modes.kids.name,
      description: GAME_CONFIG.modes.kids.description,
      icon: Baby,
      color: 'from-pink-500 to-yellow-400',
      bgColor: 'bg-pink-500/20',
      borderColor: 'border-pink-400',
      features: ['3 lustige Level', 'Bunte Smileys & Schneemaenner', 'Keine echten Waffen']
    },
    {
      id: 'normal',
      name: GAME_CONFIG.modes.normal.name,
      description: GAME_CONFIG.modes.normal.description,
      icon: Gamepad2,
      color: 'from-blue-500 to-green-400',
      bgColor: 'bg-blue-500/20',
      borderColor: 'border-blue-400',
      features: ['10 Level', 'Klassische Aliens', 'Steigende Schwierigkeit']
    },
    {
      id: 'hardcore',
      name: GAME_CONFIG.modes.hardcore.name,
      description: GAME_CONFIG.modes.hardcore.description,
      icon: Skull,
      color: 'from-red-600 to-purple-600',
      bgColor: 'bg-red-500/20',
      borderColor: 'border-red-500',
      features: ['10 extreme Level', 'Duestere Monster', 'Fuer Profis']
    }
  ];

  return (
    <div className="relative min-h-screen bg-[#0a0a1a] overflow-hidden flex flex-col items-center justify-center p-4">
      {/* Zurueck-Button */}
      <a
        href="https://social-boost-pro.com"
        className="fixed top-4 left-4 z-50 flex items-center gap-2 px-4 py-2 bg-gray-800/80 hover:bg-gray-700 rounded-lg text-gray-300 hover:text-white text-sm border border-gray-600 transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
        Social Boost Pro
      </a>

      {/* Animierte Sterne */}
      {stars.map(star => (
        <motion.div
          key={star.id}
          className="absolute bg-white rounded-full"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size
          }}
          animate={{
            opacity: [0.2, 1, 0.2],
            scale: [1, 1.2, 1]
          }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ))}

      {/* Titel */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-center mb-8"
      >
        <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-cyan-400 bg-clip-text text-transparent mb-4">
          BOOST INVADERS
        </h1>
        <p className="text-gray-400 text-lg">Waehle deinen Spielmodus</p>
      </motion.div>

      {/* Modus-Auswahl */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
        {modes.map((mode, index) => {
          const Icon = mode.icon;
          const isSelected = selectedMode === mode.id;
          const modeHighScore = highScores?.[mode.id] || 0;

          return (
            <motion.div
              key={mode.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              onClick={() => setSelectedMode(mode.id)}
              className={`
                relative cursor-pointer rounded-2xl p-6 border-2 transition-all duration-300
                ${isSelected ? `${mode.borderColor} ${mode.bgColor}` : 'border-gray-700 bg-gray-900/50'}
                hover:scale-105 hover:border-opacity-100
              `}
            >
              {isSelected && (
                <motion.div
                  layoutId="glow"
                  className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${mode.color} opacity-20 blur-xl`}
                />
              )}

              <div className="relative z-10">
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${mode.color} flex items-center justify-center mb-4`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>

                <h2 className="text-2xl font-bold text-white mb-2">{mode.name}</h2>
                <p className="text-gray-400 text-sm mb-4">{mode.description}</p>

                <ul className="space-y-2 mb-4">
                  {mode.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                      <Star className="w-4 h-4 text-yellow-400" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {modeHighScore > 0 && (
                  <div className="flex items-center gap-2 text-yellow-400 text-sm">
                    <Zap className="w-4 h-4" />
                    Highscore: {modeHighScore}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Start-Button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: selectedMode ? 1 : 0.3 }}
        disabled={!selectedMode}
        onClick={() => selectedMode && onStartGame(selectedMode)}
        className={`
          mt-8 px-12 py-4 rounded-full text-xl font-bold
          bg-gradient-to-r from-purple-600 to-pink-600
          hover:from-purple-500 hover:to-pink-500
          disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed
          text-white shadow-lg shadow-purple-500/30
          transition-all duration-300 hover:scale-105
          flex items-center gap-3
        `}
      >
        <Rocket className="w-6 h-6" />
        {selectedMode ? 'STARTEN' : 'Waehle einen Modus'}
      </motion.button>

      {/* Steuerungshinweis */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-center text-gray-500 text-sm"
      >
        <p>Steuerung: &larr; &rarr; Bewegen | LEERTASTE Schiessen | ESC Pause</p>
        <p className="mt-1">Auf Mobilgeraeten: Touch-Steuerung verfuegbar</p>
      </motion.div>

      {/* Branding Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-6 text-center"
      >
        <a
          href="https://social-boost-pro.com"
          className="text-gray-600 hover:text-purple-400 text-xs transition-colors"
        >
          Ein Easter Egg von social-boost-pro.com
        </a>
      </motion.div>
    </div>
  );
}
