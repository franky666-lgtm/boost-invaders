// BOOST INVADERS - GAME CANVAS COMPONENT
// React-Wrapper fuer Canvas und Game Engine

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Renderer } from './Renderer';
import { GameEngine } from './GameEngine';
import { GAME_CONFIG } from './GameConfig';

export default function GameCanvas({ mode, onGameEnd, onScoreUpdate }) {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const rendererRef = useRef(null);
  const animationRef = useRef(null);
  const [isRunning, setIsRunning] = useState(false);

  const onScoreUpdateRef = useRef(onScoreUpdate);
  const onGameEndRef = useRef(onGameEnd);
  const lastReportedScoreRef = useRef(0);

  useEffect(() => {
    onScoreUpdateRef.current = onScoreUpdate;
    onGameEndRef.current = onGameEnd;
  }, [onScoreUpdate, onGameEnd]);

  const gameLoop = useCallback((timestamp) => {
    if (!engineRef.current || !rendererRef.current) return;

    engineRef.current.update(timestamp);
    engineRef.current.render();

    if (onScoreUpdateRef.current && engineRef.current.score !== undefined) {
      if (engineRef.current.score !== lastReportedScoreRef.current) {
        lastReportedScoreRef.current = engineRef.current.score;
        onScoreUpdateRef.current(engineRef.current.score);
      }
    }

    animationRef.current = requestAnimationFrame(gameLoop);
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    canvas.width = GAME_CONFIG.canvas.width;
    canvas.height = GAME_CONFIG.canvas.height;

    rendererRef.current = new Renderer(canvas);
    engineRef.current = new GameEngine(rendererRef.current);

    engineRef.current.startGame(mode);
    setIsRunning(true);
    lastReportedScoreRef.current = 0;

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [mode]);

  // Keyboard handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!engineRef.current) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        engineRef.current.togglePause();
        return;
      }

      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        const result = engineRef.current.handleSpace();
        if (result === 'menu' && onGameEndRef.current) {
          // Use getGameResult for full stats
          const gameResult = engineRef.current.getGameResult();
          onGameEndRef.current(gameResult);
          return;
        }
      }

      engineRef.current.setKey(e.key, true);
    };

    const handleKeyUp = (e) => {
      if (!engineRef.current) return;
      engineRef.current.setKey(e.key, false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Touch controls
  useEffect(() => {
    let touchStartX = 0;
    let isTouching = false;

    const handleTouchStart = (e) => {
      if (!engineRef.current) return;
      touchStartX = e.touches[0].clientX;
      isTouching = true;
      engineRef.current.setKey(' ', true);
    };

    const handleTouchMove = (e) => {
      if (!engineRef.current || !isTouching) return;
      e.preventDefault();

      const touchX = e.touches[0].clientX;
      const diff = touchX - touchStartX;

      engineRef.current.setKey('ArrowLeft', false);
      engineRef.current.setKey('ArrowRight', false);

      if (diff < -10) {
        engineRef.current.setKey('ArrowLeft', true);
      } else if (diff > 10) {
        engineRef.current.setKey('ArrowRight', true);
      }

      touchStartX = touchX;
    };

    const handleTouchEnd = () => {
      if (!engineRef.current) return;
      isTouching = false;
      engineRef.current.setKey('ArrowLeft', false);
      engineRef.current.setKey('ArrowRight', false);
      engineRef.current.setKey(' ', false);
    };

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
      canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
      canvas.addEventListener('touchend', handleTouchEnd);

      return () => {
        canvas.removeEventListener('touchstart', handleTouchStart);
        canvas.removeEventListener('touchmove', handleTouchMove);
        canvas.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas
        ref={canvasRef}
        className="border-4 border-purple-500 rounded-lg shadow-2xl shadow-purple-500/30"
        style={{
          maxWidth: '100%',
          height: 'auto',
          imageRendering: 'pixelated'
        }}
      />

      {/* Mobile controls */}
      <div className="md:hidden flex gap-4 mt-4">
        <button
          className="w-20 h-20 bg-gray-800 rounded-full text-white text-2xl active:bg-gray-600 border-2 border-gray-600"
          onTouchStart={() => engineRef.current?.setKey('ArrowLeft', true)}
          onTouchEnd={() => engineRef.current?.setKey('ArrowLeft', false)}
        >
          &laquo;
        </button>
        <button
          className="w-20 h-20 bg-red-600 rounded-full text-white text-2xl active:bg-red-500 border-2 border-red-400"
          onTouchStart={() => engineRef.current?.setKey(' ', true)}
          onTouchEnd={() => engineRef.current?.setKey(' ', false)}
        >
          FIRE
        </button>
        <button
          className="w-20 h-20 bg-gray-800 rounded-full text-white text-2xl active:bg-gray-600 border-2 border-gray-600"
          onTouchStart={() => engineRef.current?.setKey('ArrowRight', true)}
          onTouchEnd={() => engineRef.current?.setKey('ArrowRight', false)}
        >
          &raquo;
        </button>
      </div>

      <div className="hidden md:block text-center text-gray-400 text-sm mt-2">
        <p>&larr; &rarr; Bewegen | SPACE Schiessen | ESC Pause</p>
      </div>
    </div>
  );
}
