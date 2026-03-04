// BOOST INVADERS - RENDERER
// Striktes Rendering mit Fallback-System, Partikeln, Score-Popups, 30 Gegnertypen

import { GAME_CONFIG } from './GameConfig';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.fallbackColorIndex = 0;
  }

  clear() {
    this.ctx.fillStyle = GAME_CONFIG.canvas.backgroundColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  renderBackground(stars) {
    this.ctx.globalAlpha = 1.0;
    this.ctx.fillStyle = '#FFFFFF';
    stars.forEach(star => {
      this.ctx.globalAlpha = star.brightness;
      this.ctx.fillRect(star.x, star.y, star.size, star.size);
    });
    this.ctx.globalAlpha = 1.0;
  }

  renderFallback(x, y, width, height) {
    const colors = GAME_CONFIG.global.visibility.fallbackRect.colors;
    const color = colors[this.fallbackColorIndex % colors.length];
    this.fallbackColorIndex++;
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, width, height);
  }

  // --- PLAYER ---
  renderPlayer(player) {
    if (!player || !player.visible) return;
    const { x, y, width, height, color } = player;

    if (width < GAME_CONFIG.global.visibility.minEnemySizePx ||
        height < GAME_CONFIG.global.visibility.minEnemySizePx) {
      this.renderFallback(x, y, 32, 32);
      return;
    }

    this.ctx.fillStyle = color || GAME_CONFIG.player.color;
    this.ctx.globalAlpha = 1.0;

    this.ctx.beginPath();
    this.ctx.moveTo(x + width / 2, y);
    this.ctx.lineTo(x + width, y + height);
    this.ctx.lineTo(x + width * 0.8, y + height * 0.7);
    this.ctx.lineTo(x + width * 0.2, y + height * 0.7);
    this.ctx.lineTo(x, y + height);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.beginPath();
    this.ctx.arc(x + width / 2, y + height * 0.4, width * 0.15, 0, Math.PI * 2);
    this.ctx.fill();
  }

  // --- ENEMY ROUTING ---
  renderEnemy(enemy) {
    if (!enemy || enemy.destroyed) return;

    const { x, y, width, height, type, color, mode } = enemy;
    const minSize = GAME_CONFIG.global.visibility.minEnemySizePx;
    const renderWidth = Math.max(width, minSize);
    const renderHeight = Math.max(height, minSize);

    this.ctx.globalAlpha = 1.0;

    if (mode === 'kids') {
      this.renderKidsEnemy(x, y, renderWidth, renderHeight, type, color);
    } else if (mode === 'normal') {
      this.renderNormalEnemy(x, y, renderWidth, renderHeight, type, color);
    } else if (mode === 'hardcore') {
      this.renderHardcoreEnemy(x, y, renderWidth, renderHeight, type, color);
    } else {
      this.renderFallback(x, y, renderWidth, renderHeight);
    }
  }

  // ============================================================
  //  KIDS ENEMIES (10 types across 3 levels)
  // ============================================================
  renderKidsEnemy(x, y, width, height, type, color) {
    const cx = x + width / 2;
    const cy = y + height / 2;
    const r = Math.min(width, height) / 2;

    switch (type) {
      case 'smiley':
        this.ctx.fillStyle = color || '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, r, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(cx - r * 0.3, cy - r * 0.2, r * 0.12, 0, Math.PI * 2);
        this.ctx.arc(cx + r * 0.3, cy - r * 0.2, r * 0.12, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy + r * 0.1, r * 0.4, 0.1 * Math.PI, 0.9 * Math.PI);
        this.ctx.stroke();
        break;

      case 'heart':
        this.ctx.fillStyle = color || '#FF6B6B';
        this.ctx.beginPath();
        this.ctx.moveTo(cx, cy + r * 0.5);
        this.ctx.bezierCurveTo(cx - r, cy - r * 0.3, cx - r * 0.5, cy - r, cx, cy - r * 0.4);
        this.ctx.bezierCurveTo(cx + r * 0.5, cy - r, cx + r, cy - r * 0.3, cx, cy + r * 0.5);
        this.ctx.fill();
        // Eyes
        this.ctx.fillStyle = '#FFF';
        this.ctx.beginPath();
        this.ctx.arc(cx - r * 0.2, cy - r * 0.15, r * 0.1, 0, Math.PI * 2);
        this.ctx.arc(cx + r * 0.2, cy - r * 0.15, r * 0.1, 0, Math.PI * 2);
        this.ctx.fill();
        break;

      case 'rainbow':
        // Rainbow circle with stripes
        const rainbowColors = ['#FF0000', '#FF8800', '#FFFF00', '#00FF00', '#0088FF', '#8800FF'];
        for (let i = rainbowColors.length - 1; i >= 0; i--) {
          this.ctx.fillStyle = rainbowColors[i];
          this.ctx.beginPath();
          this.ctx.arc(cx, cy, r * (0.4 + i * 0.1), 0, Math.PI, true);
          this.ctx.fill();
        }
        // Face
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(cx, cy + r * 0.2, r * 0.3, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(cx - r * 0.1, cy + r * 0.15, r * 0.05, 0, Math.PI * 2);
        this.ctx.arc(cx + r * 0.1, cy + r * 0.15, r * 0.05, 0, Math.PI * 2);
        this.ctx.fill();
        break;

      case 'butterfly':
        // Wings
        this.ctx.fillStyle = color || '#FF69B4';
        // Left wing
        this.ctx.beginPath();
        this.ctx.ellipse(cx - r * 0.4, cy - r * 0.1, r * 0.45, r * 0.6, -0.3, 0, Math.PI * 2);
        this.ctx.fill();
        // Right wing
        this.ctx.beginPath();
        this.ctx.ellipse(cx + r * 0.4, cy - r * 0.1, r * 0.45, r * 0.6, 0.3, 0, Math.PI * 2);
        this.ctx.fill();
        // Body
        this.ctx.fillStyle = '#4A3000';
        this.ctx.fillRect(cx - r * 0.05, cy - r * 0.5, r * 0.1, r);
        // Antennae
        this.ctx.strokeStyle = '#4A3000';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(cx, cy - r * 0.5);
        this.ctx.lineTo(cx - r * 0.3, cy - r * 0.8);
        this.ctx.moveTo(cx, cy - r * 0.5);
        this.ctx.lineTo(cx + r * 0.3, cy - r * 0.8);
        this.ctx.stroke();
        break;

      case 'snowman':
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.beginPath();
        this.ctx.arc(cx, cy + r * 0.3, r * 0.6, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(cx, cy - r * 0.3, r * 0.4, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(cx - r * 0.15, cy - r * 0.4, r * 0.08, 0, Math.PI * 2);
        this.ctx.arc(cx + r * 0.15, cy - r * 0.4, r * 0.08, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#FF6600';
        this.ctx.beginPath();
        this.ctx.moveTo(cx, cy - r * 0.25);
        this.ctx.lineTo(cx + r * 0.25, cy - r * 0.2);
        this.ctx.lineTo(cx, cy - r * 0.15);
        this.ctx.closePath();
        this.ctx.fill();
        break;

      case 'penguin':
        // Body (black)
        this.ctx.fillStyle = '#1A1A2E';
        this.ctx.beginPath();
        this.ctx.ellipse(cx, cy, r * 0.5, r * 0.7, 0, 0, Math.PI * 2);
        this.ctx.fill();
        // Belly (white)
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.beginPath();
        this.ctx.ellipse(cx, cy + r * 0.1, r * 0.3, r * 0.5, 0, 0, Math.PI * 2);
        this.ctx.fill();
        // Eyes
        this.ctx.fillStyle = '#FFF';
        this.ctx.beginPath();
        this.ctx.arc(cx - r * 0.15, cy - r * 0.25, r * 0.12, 0, Math.PI * 2);
        this.ctx.arc(cx + r * 0.15, cy - r * 0.25, r * 0.12, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(cx - r * 0.15, cy - r * 0.25, r * 0.06, 0, Math.PI * 2);
        this.ctx.arc(cx + r * 0.15, cy - r * 0.25, r * 0.06, 0, Math.PI * 2);
        this.ctx.fill();
        // Beak
        this.ctx.fillStyle = '#FF8C00';
        this.ctx.beginPath();
        this.ctx.moveTo(cx - r * 0.1, cy - r * 0.1);
        this.ctx.lineTo(cx, cy + r * 0.05);
        this.ctx.lineTo(cx + r * 0.1, cy - r * 0.1);
        this.ctx.closePath();
        this.ctx.fill();
        break;

      case 'iceCreature':
        // Crystal ice creature
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.beginPath();
        this.ctx.moveTo(cx, cy - r * 0.7);
        this.ctx.lineTo(cx + r * 0.5, cy - r * 0.2);
        this.ctx.lineTo(cx + r * 0.7, cy + r * 0.3);
        this.ctx.lineTo(cx + r * 0.2, cy + r * 0.7);
        this.ctx.lineTo(cx - r * 0.2, cy + r * 0.7);
        this.ctx.lineTo(cx - r * 0.7, cy + r * 0.3);
        this.ctx.lineTo(cx - r * 0.5, cy - r * 0.2);
        this.ctx.closePath();
        this.ctx.fill();
        // Shine
        this.ctx.fillStyle = '#B8E0F7';
        this.ctx.beginPath();
        this.ctx.moveTo(cx - r * 0.1, cy - r * 0.4);
        this.ctx.lineTo(cx + r * 0.15, cy - r * 0.1);
        this.ctx.lineTo(cx - r * 0.05, cy + r * 0.1);
        this.ctx.closePath();
        this.ctx.fill();
        // Eyes
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(cx - r * 0.15, cy - r * 0.05, r * 0.08, 0, Math.PI * 2);
        this.ctx.arc(cx + r * 0.15, cy - r * 0.05, r * 0.08, 0, Math.PI * 2);
        this.ctx.fill();
        break;

      case 'funnyMonster':
        this.ctx.fillStyle = color || '#9B59B6';
        this.ctx.beginPath();
        this.ctx.ellipse(cx, cy, r * 0.8, r, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#FFF';
        this.ctx.beginPath();
        this.ctx.arc(cx - r * 0.3, cy - r * 0.2, r * 0.25, 0, Math.PI * 2);
        this.ctx.arc(cx + r * 0.3, cy - r * 0.2, r * 0.25, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(cx - r * 0.25, cy - r * 0.2, r * 0.1, 0, Math.PI * 2);
        this.ctx.arc(cx + r * 0.35, cy - r * 0.2, r * 0.1, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#FFF';
        this.ctx.beginPath();
        this.ctx.arc(cx, cy + r * 0.3, r * 0.4, 0, Math.PI);
        this.ctx.fill();
        break;

      case 'blob':
        // Amorphous blob
        this.ctx.fillStyle = color || '#2ECC71';
        this.ctx.beginPath();
        this.ctx.moveTo(cx - r * 0.6, cy + r * 0.3);
        this.ctx.quadraticCurveTo(cx - r * 0.7, cy - r * 0.5, cx - r * 0.1, cy - r * 0.6);
        this.ctx.quadraticCurveTo(cx + r * 0.3, cy - r * 0.8, cx + r * 0.6, cy - r * 0.3);
        this.ctx.quadraticCurveTo(cx + r * 0.8, cy + r * 0.2, cx + r * 0.4, cy + r * 0.5);
        this.ctx.quadraticCurveTo(cx, cy + r * 0.7, cx - r * 0.6, cy + r * 0.3);
        this.ctx.fill();
        // Eyes
        this.ctx.fillStyle = '#FFF';
        this.ctx.beginPath();
        this.ctx.arc(cx - r * 0.15, cy - r * 0.1, r * 0.15, 0, Math.PI * 2);
        this.ctx.arc(cx + r * 0.2, cy - r * 0.15, r * 0.12, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(cx - r * 0.12, cy - r * 0.1, r * 0.06, 0, Math.PI * 2);
        this.ctx.arc(cx + r * 0.22, cy - r * 0.15, r * 0.05, 0, Math.PI * 2);
        this.ctx.fill();
        break;

      case 'cyclops':
        // Single-eyed round creature
        this.ctx.fillStyle = color || '#F39C12';
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, r * 0.7, 0, Math.PI * 2);
        this.ctx.fill();
        // Single big eye
        this.ctx.fillStyle = '#FFF';
        this.ctx.beginPath();
        this.ctx.arc(cx, cy - r * 0.1, r * 0.35, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#0000FF';
        this.ctx.beginPath();
        this.ctx.arc(cx, cy - r * 0.1, r * 0.18, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(cx, cy - r * 0.1, r * 0.08, 0, Math.PI * 2);
        this.ctx.fill();
        // Mouth
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy + r * 0.3, r * 0.2, 0.2 * Math.PI, 0.8 * Math.PI);
        this.ctx.stroke();
        break;

      default:
        this.renderFallback(x, y, width, height);
    }
  }

  // ============================================================
  //  NORMAL ENEMIES (10 types)
  // ============================================================
  renderNormalEnemy(x, y, width, height, type, color) {
    this.ctx.fillStyle = color || '#4CAF50';
    const cx = x + width / 2;
    const cy = y + height / 2;
    const r = Math.min(width, height) / 2;

    switch (type) {
      case 'alien':
        this.ctx.beginPath();
        this.ctx.moveTo(x + width * 0.5, y);
        this.ctx.lineTo(x + width, y + height * 0.4);
        this.ctx.lineTo(x + width * 0.8, y + height);
        this.ctx.lineTo(x + width * 0.2, y + height);
        this.ctx.lineTo(x, y + height * 0.4);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.fillStyle = '#FF0000';
        this.ctx.beginPath();
        this.ctx.arc(x + width * 0.35, y + height * 0.35, width * 0.1, 0, Math.PI * 2);
        this.ctx.arc(x + width * 0.65, y + height * 0.35, width * 0.1, 0, Math.PI * 2);
        this.ctx.fill();
        break;

      case 'reptile':
        this.ctx.beginPath();
        this.ctx.ellipse(cx, cy, width / 2, height / 2, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = '#2E7D32';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
          this.ctx.beginPath();
          this.ctx.arc(cx, y + height * 0.3 + i * height * 0.2, width * 0.3, 0, Math.PI);
          this.ctx.stroke();
        }
        this.ctx.fillStyle = '#FFEB3B';
        this.ctx.beginPath();
        this.ctx.ellipse(x + width * 0.3, y + height * 0.3, width * 0.12, height * 0.08, 0, 0, Math.PI * 2);
        this.ctx.ellipse(x + width * 0.7, y + height * 0.3, width * 0.12, height * 0.08, 0, 0, Math.PI * 2);
        this.ctx.fill();
        break;

      case 'spider':
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, r * 0.35, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = color || '#4CAF50';
        this.ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
          const angle = (i / 4) * Math.PI - Math.PI / 2;
          const legX = cx + Math.cos(angle) * width * 0.3;
          const legY = cy + Math.sin(angle) * height * 0.3;
          this.ctx.beginPath();
          this.ctx.moveTo(cx, cy);
          this.ctx.lineTo(legX + Math.cos(angle) * width * 0.3, legY + Math.sin(angle) * height * 0.3);
          this.ctx.stroke();
        }
        this.ctx.fillStyle = '#FF0000';
        for (let i = 0; i < 8; i++) {
          const eyeX = x + width * 0.35 + (i % 4) * width * 0.08;
          const eyeY = y + height * 0.35 + Math.floor(i / 4) * height * 0.12;
          this.ctx.beginPath();
          this.ctx.arc(eyeX, eyeY, width * 0.04, 0, Math.PI * 2);
          this.ctx.fill();
        }
        break;

      case 'jellyfish':
        // Translucent dome + tentacles
        this.ctx.fillStyle = color || '#4ECDC4';
        this.ctx.globalAlpha = 0.8;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy - r * 0.1, r * 0.6, Math.PI, 0);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.globalAlpha = 1.0;
        // Tentacles
        this.ctx.strokeStyle = color || '#4ECDC4';
        this.ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
          const tx = cx - r * 0.4 + i * r * 0.2;
          this.ctx.beginPath();
          this.ctx.moveTo(tx, cy - r * 0.1);
          this.ctx.quadraticCurveTo(tx + r * 0.1 * (i % 2 ? 1 : -1), cy + r * 0.3, tx, cy + r * 0.6);
          this.ctx.stroke();
        }
        // Eyes
        this.ctx.fillStyle = '#FFF';
        this.ctx.beginPath();
        this.ctx.arc(cx - r * 0.15, cy - r * 0.25, r * 0.1, 0, Math.PI * 2);
        this.ctx.arc(cx + r * 0.15, cy - r * 0.25, r * 0.1, 0, Math.PI * 2);
        this.ctx.fill();
        break;

      case 'mech':
        // Rectangular robot with visor
        this.ctx.fillStyle = '#607D8B';
        this.ctx.fillRect(x + width * 0.15, y + height * 0.1, width * 0.7, height * 0.8);
        // Visor
        this.ctx.fillStyle = '#00E5FF';
        this.ctx.fillRect(x + width * 0.2, y + height * 0.2, width * 0.6, height * 0.2);
        // Legs
        this.ctx.fillStyle = '#455A64';
        this.ctx.fillRect(x + width * 0.2, y + height * 0.85, width * 0.15, height * 0.15);
        this.ctx.fillRect(x + width * 0.65, y + height * 0.85, width * 0.15, height * 0.15);
        // Antenna
        this.ctx.strokeStyle = '#90A4AE';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(cx, y + height * 0.1);
        this.ctx.lineTo(cx, y);
        this.ctx.stroke();
        this.ctx.fillStyle = '#FF0000';
        this.ctx.beginPath();
        this.ctx.arc(cx, y, r * 0.08, 0, Math.PI * 2);
        this.ctx.fill();
        break;

      case 'squid':
        // Oval body + tentacles below
        this.ctx.fillStyle = color || '#E91E63';
        this.ctx.beginPath();
        this.ctx.ellipse(cx, cy - r * 0.15, r * 0.45, r * 0.5, 0, 0, Math.PI * 2);
        this.ctx.fill();
        // Tentacles
        for (let i = 0; i < 4; i++) {
          const tx = cx - r * 0.3 + i * r * 0.2;
          this.ctx.beginPath();
          this.ctx.moveTo(tx, cy + r * 0.2);
          this.ctx.lineTo(tx + r * 0.05 * (i % 2 ? 1 : -1), cy + r * 0.7);
          this.ctx.lineWidth = 3;
          this.ctx.strokeStyle = color || '#E91E63';
          this.ctx.stroke();
        }
        // Eyes
        this.ctx.fillStyle = '#FFF';
        this.ctx.beginPath();
        this.ctx.arc(cx - r * 0.15, cy - r * 0.2, r * 0.12, 0, Math.PI * 2);
        this.ctx.arc(cx + r * 0.15, cy - r * 0.2, r * 0.12, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(cx - r * 0.15, cy - r * 0.2, r * 0.05, 0, Math.PI * 2);
        this.ctx.arc(cx + r * 0.15, cy - r * 0.2, r * 0.05, 0, Math.PI * 2);
        this.ctx.fill();
        break;

      case 'beetle':
        // Round armored beetle
        this.ctx.fillStyle = '#795548';
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, r * 0.6, 0, Math.PI * 2);
        this.ctx.fill();
        // Shell line
        this.ctx.strokeStyle = '#5D4037';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(cx, cy - r * 0.6);
        this.ctx.lineTo(cx, cy + r * 0.6);
        this.ctx.stroke();
        // Shell highlights
        this.ctx.fillStyle = '#8D6E63';
        this.ctx.beginPath();
        this.ctx.arc(cx - r * 0.2, cy - r * 0.1, r * 0.15, 0, Math.PI * 2);
        this.ctx.fill();
        // Mandibles
        this.ctx.strokeStyle = '#4E342E';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(cx - r * 0.15, cy - r * 0.55);
        this.ctx.lineTo(cx - r * 0.3, cy - r * 0.75);
        this.ctx.moveTo(cx + r * 0.15, cy - r * 0.55);
        this.ctx.lineTo(cx + r * 0.3, cy - r * 0.75);
        this.ctx.stroke();
        break;

      case 'moth':
        // Spread wings + antennae
        this.ctx.fillStyle = color || '#9C27B0';
        // Wings
        this.ctx.beginPath();
        this.ctx.ellipse(cx - r * 0.4, cy, r * 0.5, r * 0.4, -0.2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.ellipse(cx + r * 0.4, cy, r * 0.5, r * 0.4, 0.2, 0, Math.PI * 2);
        this.ctx.fill();
        // Wing patterns
        this.ctx.fillStyle = '#CE93D8';
        this.ctx.beginPath();
        this.ctx.arc(cx - r * 0.4, cy, r * 0.15, 0, Math.PI * 2);
        this.ctx.arc(cx + r * 0.4, cy, r * 0.15, 0, Math.PI * 2);
        this.ctx.fill();
        // Body
        this.ctx.fillStyle = '#6A1B9A';
        this.ctx.beginPath();
        this.ctx.ellipse(cx, cy, r * 0.1, r * 0.4, 0, 0, Math.PI * 2);
        this.ctx.fill();
        // Antennae
        this.ctx.strokeStyle = '#6A1B9A';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(cx, cy - r * 0.4);
        this.ctx.quadraticCurveTo(cx - r * 0.3, cy - r * 0.7, cx - r * 0.4, cy - r * 0.8);
        this.ctx.moveTo(cx, cy - r * 0.4);
        this.ctx.quadraticCurveTo(cx + r * 0.3, cy - r * 0.7, cx + r * 0.4, cy - r * 0.8);
        this.ctx.stroke();
        break;

      case 'crystal':
        // Geometric prismatic shape
        this.ctx.fillStyle = '#00BCD4';
        this.ctx.beginPath();
        this.ctx.moveTo(cx, cy - r * 0.7);
        this.ctx.lineTo(cx + r * 0.5, cy - r * 0.2);
        this.ctx.lineTo(cx + r * 0.3, cy + r * 0.6);
        this.ctx.lineTo(cx - r * 0.3, cy + r * 0.6);
        this.ctx.lineTo(cx - r * 0.5, cy - r * 0.2);
        this.ctx.closePath();
        this.ctx.fill();
        // Facets
        this.ctx.strokeStyle = '#4DD0E1';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(cx, cy - r * 0.7);
        this.ctx.lineTo(cx, cy + r * 0.6);
        this.ctx.moveTo(cx - r * 0.5, cy - r * 0.2);
        this.ctx.lineTo(cx + r * 0.3, cy + r * 0.6);
        this.ctx.moveTo(cx + r * 0.5, cy - r * 0.2);
        this.ctx.lineTo(cx - r * 0.3, cy + r * 0.6);
        this.ctx.stroke();
        // Glow
        this.ctx.fillStyle = '#E0F7FA';
        this.ctx.beginPath();
        this.ctx.arc(cx - r * 0.1, cy - r * 0.15, r * 0.08, 0, Math.PI * 2);
        this.ctx.fill();
        break;

      case 'worm':
        // Segmented, wavy
        this.ctx.fillStyle = color || '#8BC34A';
        const segments = 4;
        for (let i = 0; i < segments; i++) {
          const sx = cx - r * 0.3 + i * r * 0.25;
          const sy = cy + Math.sin(i * 1.2 + Date.now() / 300) * r * 0.15;
          const segR = r * (0.25 - i * 0.02);
          this.ctx.beginPath();
          this.ctx.arc(sx, sy, segR, 0, Math.PI * 2);
          this.ctx.fill();
        }
        // Head (first segment)
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(cx - r * 0.3 - r * 0.05, cy + Math.sin(Date.now() / 300) * r * 0.15, r * 0.05, 0, Math.PI * 2);
        this.ctx.arc(cx - r * 0.3 + r * 0.05, cy + Math.sin(Date.now() / 300) * r * 0.15, r * 0.05, 0, Math.PI * 2);
        this.ctx.fill();
        break;

      default:
        this.renderFallback(x, y, width, height);
    }
  }

  // ============================================================
  //  HARDCORE ENEMIES (10 types)
  // ============================================================
  renderHardcoreEnemy(x, y, width, height, type, color) {
    this.ctx.fillStyle = color || '#8B0000';
    const cx = x + width / 2;
    const cy = y + height / 2;
    const r = Math.min(width, height) / 2;

    switch (type) {
      case 'darkMonster':
        this.ctx.beginPath();
        this.ctx.moveTo(x + width * 0.5, y);
        this.ctx.lineTo(x + width, y + height * 0.3);
        this.ctx.lineTo(x + width * 0.9, y + height);
        this.ctx.lineTo(x + width * 0.1, y + height);
        this.ctx.lineTo(x, y + height * 0.3);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.fillStyle = '#FF0000';
        this.ctx.shadowColor = '#FF0000';
        this.ctx.shadowBlur = 10;
        this.ctx.beginPath();
        this.ctx.arc(x + width * 0.35, y + height * 0.4, width * 0.1, 0, Math.PI * 2);
        this.ctx.arc(x + width * 0.65, y + height * 0.4, width * 0.1, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
        break;

      case 'demon':
        this.ctx.beginPath();
        this.ctx.arc(cx, cy + r * 0.1, r * 0.5, 0, Math.PI * 2);
        this.ctx.fill();
        // Horns
        this.ctx.beginPath();
        this.ctx.moveTo(cx - r * 0.3, cy - r * 0.1);
        this.ctx.lineTo(cx - r * 0.5, cy - r * 0.8);
        this.ctx.lineTo(cx - r * 0.1, cy - r * 0.2);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.moveTo(cx + r * 0.3, cy - r * 0.1);
        this.ctx.lineTo(cx + r * 0.5, cy - r * 0.8);
        this.ctx.lineTo(cx + r * 0.1, cy - r * 0.2);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.fillStyle = '#FF4500';
        this.ctx.shadowColor = '#FF4500';
        this.ctx.shadowBlur = 15;
        this.ctx.beginPath();
        this.ctx.arc(cx - r * 0.15, cy, r * 0.08, 0, Math.PI * 2);
        this.ctx.arc(cx + r * 0.15, cy, r * 0.08, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
        break;

      case 'skull':
        this.ctx.fillStyle = '#2D0A0A';
        this.ctx.beginPath();
        this.ctx.arc(cx, cy - r * 0.1, r * 0.5, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillRect(cx - r * 0.3, cy + r * 0.2, r * 0.6, r * 0.4);
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(cx - r * 0.15, cy - r * 0.15, r * 0.12, 0, Math.PI * 2);
        this.ctx.arc(cx + r * 0.15, cy - r * 0.15, r * 0.12, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#FF0000';
        this.ctx.shadowColor = '#FF0000';
        this.ctx.shadowBlur = 8;
        this.ctx.beginPath();
        this.ctx.arc(cx - r * 0.15, cy - r * 0.15, r * 0.05, 0, Math.PI * 2);
        this.ctx.arc(cx + r * 0.15, cy - r * 0.15, r * 0.05, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
        this.ctx.fillStyle = '#FFF';
        for (let i = 0; i < 5; i++) {
          this.ctx.fillRect(cx - r * 0.25 + i * r * 0.12, cy + r * 0.25, r * 0.08, r * 0.15);
        }
        break;

      case 'wraith':
        // Ghostly, semi-transparent with glow
        this.ctx.globalAlpha = 0.7;
        this.ctx.fillStyle = '#4A0066';
        this.ctx.beginPath();
        this.ctx.arc(cx, cy - r * 0.1, r * 0.5, Math.PI, 0);
        this.ctx.quadraticCurveTo(cx + r * 0.5, cy + r * 0.3, cx + r * 0.3, cy + r * 0.6);
        this.ctx.lineTo(cx + r * 0.1, cy + r * 0.4);
        this.ctx.lineTo(cx - r * 0.1, cy + r * 0.6);
        this.ctx.lineTo(cx - r * 0.3, cy + r * 0.4);
        this.ctx.quadraticCurveTo(cx - r * 0.5, cy + r * 0.3, cx - r * 0.5, cy - r * 0.1);
        this.ctx.fill();
        this.ctx.globalAlpha = 1.0;
        // Glowing eyes
        this.ctx.fillStyle = '#00FFFF';
        this.ctx.shadowColor = '#00FFFF';
        this.ctx.shadowBlur = 12;
        this.ctx.beginPath();
        this.ctx.arc(cx - r * 0.15, cy - r * 0.15, r * 0.08, 0, Math.PI * 2);
        this.ctx.arc(cx + r * 0.15, cy - r * 0.15, r * 0.08, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
        break;

      case 'hellhound':
        // Four-legged beast
        this.ctx.fillStyle = color || '#4A0000';
        // Body
        this.ctx.beginPath();
        this.ctx.ellipse(cx, cy, r * 0.6, r * 0.35, 0, 0, Math.PI * 2);
        this.ctx.fill();
        // Head
        this.ctx.beginPath();
        this.ctx.arc(cx - r * 0.5, cy - r * 0.2, r * 0.25, 0, Math.PI * 2);
        this.ctx.fill();
        // Legs
        this.ctx.fillRect(cx - r * 0.4, cy + r * 0.25, r * 0.12, r * 0.35);
        this.ctx.fillRect(cx - r * 0.15, cy + r * 0.25, r * 0.12, r * 0.35);
        this.ctx.fillRect(cx + r * 0.15, cy + r * 0.25, r * 0.12, r * 0.35);
        this.ctx.fillRect(cx + r * 0.35, cy + r * 0.25, r * 0.12, r * 0.35);
        // Fire eyes
        this.ctx.fillStyle = '#FF4500';
        this.ctx.shadowColor = '#FF4500';
        this.ctx.shadowBlur = 8;
        this.ctx.beginPath();
        this.ctx.arc(cx - r * 0.55, cy - r * 0.25, r * 0.06, 0, Math.PI * 2);
        this.ctx.arc(cx - r * 0.42, cy - r * 0.25, r * 0.06, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
        break;

      case 'eyeball':
        // Giant floating eye
        this.ctx.fillStyle = '#FFE0E0';
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, r * 0.6, 0, Math.PI * 2);
        this.ctx.fill();
        // Iris
        this.ctx.fillStyle = '#8B0000';
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, r * 0.35, 0, Math.PI * 2);
        this.ctx.fill();
        // Pupil
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, r * 0.15, 0, Math.PI * 2);
        this.ctx.fill();
        // Blood veins
        this.ctx.strokeStyle = '#FF0000';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
          const angle = (i / 5) * Math.PI * 2;
          this.ctx.beginPath();
          this.ctx.moveTo(cx + Math.cos(angle) * r * 0.35, cy + Math.sin(angle) * r * 0.35);
          this.ctx.lineTo(cx + Math.cos(angle) * r * 0.55, cy + Math.sin(angle) * r * 0.55);
          this.ctx.stroke();
        }
        break;

      case 'golem':
        // Blocky with glowing core
        this.ctx.fillStyle = '#5D4037';
        this.ctx.fillRect(x + width * 0.15, y + height * 0.05, width * 0.7, height * 0.9);
        // Cracks
        this.ctx.strokeStyle = '#3E2723';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(cx - r * 0.1, y + height * 0.1);
        this.ctx.lineTo(cx + r * 0.05, cy);
        this.ctx.lineTo(cx - r * 0.15, y + height * 0.8);
        this.ctx.stroke();
        // Glowing core
        this.ctx.fillStyle = '#FF6D00';
        this.ctx.shadowColor = '#FF6D00';
        this.ctx.shadowBlur = 12;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, r * 0.15, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
        // Eyes
        this.ctx.fillStyle = '#FF6D00';
        this.ctx.fillRect(cx - r * 0.25, cy - r * 0.3, r * 0.15, r * 0.08);
        this.ctx.fillRect(cx + r * 0.1, cy - r * 0.3, r * 0.15, r * 0.08);
        break;

      case 'banshee':
        // Ethereal, open mouth, wisps
        this.ctx.globalAlpha = 0.6;
        this.ctx.fillStyle = '#E1BEE7';
        this.ctx.beginPath();
        this.ctx.ellipse(cx, cy - r * 0.1, r * 0.4, r * 0.55, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.globalAlpha = 1.0;
        // Open screaming mouth
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.ellipse(cx, cy + r * 0.15, r * 0.2, r * 0.3, 0, 0, Math.PI * 2);
        this.ctx.fill();
        // Eyes
        this.ctx.fillStyle = '#7B1FA2';
        this.ctx.shadowColor = '#7B1FA2';
        this.ctx.shadowBlur = 10;
        this.ctx.beginPath();
        this.ctx.arc(cx - r * 0.15, cy - r * 0.2, r * 0.08, 0, Math.PI * 2);
        this.ctx.arc(cx + r * 0.15, cy - r * 0.2, r * 0.08, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
        // Wisps
        this.ctx.strokeStyle = '#CE93D8';
        this.ctx.lineWidth = 1;
        this.ctx.globalAlpha = 0.5;
        for (let i = 0; i < 3; i++) {
          this.ctx.beginPath();
          this.ctx.moveTo(cx - r * 0.3 + i * r * 0.3, cy + r * 0.4);
          this.ctx.quadraticCurveTo(cx - r * 0.3 + i * r * 0.3 + r * 0.1, cy + r * 0.6, cx - r * 0.3 + i * r * 0.3, cy + r * 0.8);
          this.ctx.stroke();
        }
        this.ctx.globalAlpha = 1.0;
        break;

      case 'spiderQueen':
        // Larger spider with egg sacs
        this.ctx.fillStyle = '#4A148C';
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, r * 0.4, 0, Math.PI * 2);
        this.ctx.fill();
        // Legs (8)
        this.ctx.strokeStyle = '#4A148C';
        this.ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          this.ctx.beginPath();
          this.ctx.moveTo(cx, cy);
          const lx = cx + Math.cos(angle) * r * 0.8;
          const ly = cy + Math.sin(angle) * r * 0.7;
          this.ctx.lineTo(lx, ly);
          this.ctx.stroke();
        }
        // Egg sacs
        this.ctx.fillStyle = '#CE93D8';
        this.ctx.beginPath();
        this.ctx.arc(cx - r * 0.3, cy + r * 0.3, r * 0.12, 0, Math.PI * 2);
        this.ctx.arc(cx + r * 0.3, cy + r * 0.3, r * 0.12, 0, Math.PI * 2);
        this.ctx.arc(cx, cy + r * 0.4, r * 0.1, 0, Math.PI * 2);
        this.ctx.fill();
        // Red eyes
        this.ctx.fillStyle = '#FF0000';
        this.ctx.shadowColor = '#FF0000';
        this.ctx.shadowBlur = 8;
        this.ctx.beginPath();
        this.ctx.arc(cx - r * 0.1, cy - r * 0.05, r * 0.06, 0, Math.PI * 2);
        this.ctx.arc(cx + r * 0.1, cy - r * 0.05, r * 0.06, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
        break;

      case 'reaper':
        // Hooded figure with scythe
        this.ctx.fillStyle = '#1A1A1A';
        // Hood/robe
        this.ctx.beginPath();
        this.ctx.arc(cx, cy - r * 0.2, r * 0.35, Math.PI, 0);
        this.ctx.lineTo(cx + r * 0.4, cy + r * 0.6);
        this.ctx.lineTo(cx - r * 0.4, cy + r * 0.6);
        this.ctx.closePath();
        this.ctx.fill();
        // Face void
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(cx, cy - r * 0.15, r * 0.18, 0, Math.PI * 2);
        this.ctx.fill();
        // Glowing eyes in void
        this.ctx.fillStyle = '#FF0000';
        this.ctx.shadowColor = '#FF0000';
        this.ctx.shadowBlur = 10;
        this.ctx.beginPath();
        this.ctx.arc(cx - r * 0.07, cy - r * 0.18, r * 0.04, 0, Math.PI * 2);
        this.ctx.arc(cx + r * 0.07, cy - r * 0.18, r * 0.04, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
        // Scythe
        this.ctx.strokeStyle = '#666';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(cx + r * 0.3, cy - r * 0.5);
        this.ctx.lineTo(cx + r * 0.35, cy + r * 0.5);
        this.ctx.stroke();
        this.ctx.strokeStyle = '#AAA';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(cx + r * 0.3, cy - r * 0.5);
        this.ctx.quadraticCurveTo(cx + r * 0.7, cy - r * 0.6, cx + r * 0.6, cy - r * 0.3);
        this.ctx.stroke();
        break;

      default:
        this.renderFallback(x, y, width, height);
    }
  }

  // ============================================================
  //  PROJECTILES
  // ============================================================
  renderProjectile(projectile) {
    if (!projectile || !projectile.active) return;

    const { x, y, width, height, type, color, isEnemy } = projectile;
    this.ctx.globalAlpha = 1.0;

    switch (type) {
      case 'laser':
        this.ctx.fillStyle = color || (isEnemy ? '#FF5722' : '#FFFF00');
        this.ctx.fillRect(x, y, width, height);
        this.ctx.shadowColor = color || '#FFFF00';
        this.ctx.shadowBlur = 5;
        this.ctx.fillRect(x, y, width, height);
        this.ctx.shadowBlur = 0;
        break;

      case 'banana':
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.ellipse(x + width / 2, y + height / 2, width / 2, height / 4, Math.PI / 4, 0, Math.PI * 2);
        this.ctx.fill();
        break;

      case 'snowball':
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.beginPath();
        this.ctx.arc(x + width / 2, y + height / 2, Math.min(width, height) / 2, 0, Math.PI * 2);
        this.ctx.fill();
        break;

      case 'star':
        this.ctx.fillStyle = color || '#FFD700';
        this.drawStar(x + width / 2, y + height / 2, 5, width / 2, width / 4);
        break;

      case 'laptop':
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(x, y + height * 0.2, width, height * 0.6);
        this.ctx.fillStyle = '#4FC3F7';
        this.ctx.fillRect(x + width * 0.1, y + height * 0.3, width * 0.8, height * 0.4);
        break;

      case 'rocket':
      case 'slowRocket':
      case 'fastRocket':
        this.ctx.fillStyle = color || '#FF4500';
        this.ctx.beginPath();
        this.ctx.moveTo(x + width / 2, y);
        this.ctx.lineTo(x + width, y + height * 0.7);
        this.ctx.lineTo(x + width * 0.7, y + height);
        this.ctx.lineTo(x + width * 0.3, y + height);
        this.ctx.lineTo(x, y + height * 0.7);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.fillStyle = '#FFFF00';
        this.ctx.beginPath();
        this.ctx.moveTo(x + width * 0.3, y + height);
        this.ctx.lineTo(x + width / 2, y + height * 1.3);
        this.ctx.lineTo(x + width * 0.7, y + height);
        this.ctx.closePath();
        this.ctx.fill();
        break;

      case 'grenade':
        // Round grenade
        this.ctx.fillStyle = '#555';
        this.ctx.beginPath();
        this.ctx.arc(x + width / 2, y + height / 2, width / 2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#FF6600';
        this.ctx.shadowColor = '#FF6600';
        this.ctx.shadowBlur = 8;
        this.ctx.beginPath();
        this.ctx.arc(x + width / 2, y + height / 2, width / 4, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
        break;

      case 'rapidFire':
      case 'machineGun':
        this.ctx.fillStyle = color || '#00FFFF';
        this.ctx.fillRect(x, y, width, height);
        this.ctx.shadowColor = color || '#00FFFF';
        this.ctx.shadowBlur = 4;
        this.ctx.fillRect(x + 1, y, width - 2, height);
        this.ctx.shadowBlur = 0;
        break;

      case 'doubleFire':
        this.ctx.fillStyle = '#FFFF00';
        this.ctx.fillRect(x, y, width, height);
        break;

      case 'fruitBlaster':
        // Colorful round
        this.ctx.fillStyle = '#FF1493';
        this.ctx.beginPath();
        this.ctx.arc(x + width / 2, y + height / 2, Math.min(width, height) / 2, 0, Math.PI * 2);
        this.ctx.fill();
        break;

      case 'starShower':
        this.ctx.fillStyle = '#FFD700';
        this.drawStar(x + width / 2, y + height / 2, 4, width / 2, width / 4);
        break;

      case 'confetti':
        const confettiColors = ['#FF00FF', '#00FF00', '#FFFF00', '#FF6600', '#00FFFF'];
        this.ctx.fillStyle = confettiColors[Math.floor(Math.random() * confettiColors.length)];
        this.ctx.fillRect(x, y, width, height);
        break;

      default:
        this.ctx.fillStyle = color || '#FFFF00';
        this.ctx.fillRect(x, y, width, height);
    }
  }

  drawStar(cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    const step = Math.PI / spikes;

    this.ctx.beginPath();
    this.ctx.moveTo(cx, cy - outerRadius);

    for (let i = 0; i < spikes; i++) {
      let sx = cx + Math.cos(rot) * outerRadius;
      let sy = cy + Math.sin(rot) * outerRadius;
      this.ctx.lineTo(sx, sy);
      rot += step;

      sx = cx + Math.cos(rot) * innerRadius;
      sy = cy + Math.sin(rot) * innerRadius;
      this.ctx.lineTo(sx, sy);
      rot += step;
    }

    this.ctx.lineTo(cx, cy - outerRadius);
    this.ctx.closePath();
    this.ctx.fill();
  }

  // ============================================================
  //  BOSS
  // ============================================================
  renderBoss(boss) {
    if (!boss || boss.destroyed) return;

    const { x, y, width, height, type, color, health, maxHealth, mode } = boss;
    this.ctx.globalAlpha = 1.0;

    if (mode === 'kids') {
      this.renderKidsBoss(x, y, width, height, type, color);
    } else {
      this.renderStandardBoss(x, y, width, height, type, color, mode);
    }

    // Health bar
    const barWidth = width;
    const barHeight = 8;
    const barY = y - 15;
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(x, barY, barWidth, barHeight);
    const healthPercent = health / maxHealth;
    this.ctx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : healthPercent > 0.25 ? '#FF9800' : '#F44336';
    this.ctx.fillRect(x, barY, barWidth * healthPercent, barHeight);
    this.ctx.strokeStyle = '#FFF';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x, barY, barWidth, barHeight);
  }

  renderKidsBoss(x, y, width, height, type, color) {
    const cx = x + width / 2;
    const cy = y + height / 2;

    switch (type) {
      case 'evilSnowman':
        // DARK dirty snowman with angry features
        const darkColor = '#6B5B4F';
        this.ctx.fillStyle = darkColor;

        // Dark aura
        this.ctx.shadowColor = '#FF0000';
        this.ctx.shadowBlur = 20;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy + height * 0.2, width * 0.4, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        // Body
        this.ctx.fillStyle = darkColor;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy + height * 0.2, width * 0.4, 0, Math.PI * 2);
        this.ctx.fill();
        // Head
        this.ctx.beginPath();
        this.ctx.arc(cx, cy - height * 0.2, width * 0.3, 0, Math.PI * 2);
        this.ctx.fill();

        // Angry V-shaped eyebrows (thick)
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(cx - width * 0.2, cy - height * 0.35);
        this.ctx.lineTo(cx - width * 0.08, cy - height * 0.28);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(cx + width * 0.2, cy - height * 0.35);
        this.ctx.lineTo(cx + width * 0.08, cy - height * 0.28);
        this.ctx.stroke();

        // BIG intense red eyes with dark pupils + strong glow
        this.ctx.fillStyle = '#FF0000';
        this.ctx.shadowColor = '#FF0000';
        this.ctx.shadowBlur = 18;
        this.ctx.beginPath();
        this.ctx.arc(cx - width * 0.12, cy - height * 0.25, width * 0.1, 0, Math.PI * 2);
        this.ctx.arc(cx + width * 0.12, cy - height * 0.25, width * 0.1, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
        // Dark pupils
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(cx - width * 0.12, cy - height * 0.25, width * 0.04, 0, Math.PI * 2);
        this.ctx.arc(cx + width * 0.12, cy - height * 0.25, width * 0.04, 0, Math.PI * 2);
        this.ctx.fill();

        // Ripped open mouth with TEETH
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(cx, cy - height * 0.08, width * 0.18, 0.1 * Math.PI, 0.9 * Math.PI);
        this.ctx.closePath();
        this.ctx.fill();
        // 5 triangular teeth
        this.ctx.fillStyle = '#FFF';
        for (let i = 0; i < 5; i++) {
          const tx = cx - width * 0.12 + i * width * 0.06;
          this.ctx.beginPath();
          this.ctx.moveTo(tx, cy - height * 0.08);
          this.ctx.lineTo(tx + width * 0.03, cy - height * 0.02);
          this.ctx.lineTo(tx - width * 0.03, cy - height * 0.02);
          this.ctx.closePath();
          this.ctx.fill();
        }

        // Broken crooked carrot nose
        this.ctx.fillStyle = '#CC5500';
        this.ctx.beginPath();
        this.ctx.moveTo(cx - width * 0.02, cy - height * 0.17);
        this.ctx.lineTo(cx + width * 0.2, cy - height * 0.12);
        this.ctx.lineTo(cx + width * 0.12, cy - height * 0.08);
        this.ctx.lineTo(cx + width * 0.01, cy - height * 0.1);
        this.ctx.closePath();
        this.ctx.fill();
        break;

      case 'evilDad':
        this.ctx.fillStyle = color || '#2C3E50';
        this.ctx.fillRect(x + width * 0.2, y + height * 0.3, width * 0.6, height * 0.6);
        this.ctx.fillStyle = '#FFDAB9';
        this.ctx.beginPath();
        this.ctx.arc(cx, y + height * 0.2, width * 0.2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(cx - width * 0.15, y + height * 0.12);
        this.ctx.lineTo(cx - width * 0.05, y + height * 0.18);
        this.ctx.moveTo(cx + width * 0.15, y + height * 0.12);
        this.ctx.lineTo(cx + width * 0.05, y + height * 0.18);
        this.ctx.stroke();
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(x + width * 0.55, y + height * 0.5, width * 0.35, height * 0.25);
        this.ctx.fillStyle = '#4FC3F7';
        this.ctx.fillRect(x + width * 0.58, y + height * 0.53, width * 0.29, height * 0.18);
        break;

      default:
        this.renderFallback(x, y, width, height);
    }
  }

  renderStandardBoss(x, y, width, height, type, color, mode) {
    this.ctx.fillStyle = color || (mode === 'hardcore' ? '#4A0000' : '#1B5E20');

    this.ctx.beginPath();
    this.ctx.moveTo(x + width * 0.5, y);
    this.ctx.lineTo(x + width, y + height * 0.3);
    this.ctx.lineTo(x + width * 0.9, y + height * 0.6);
    this.ctx.lineTo(x + width, y + height);
    this.ctx.lineTo(x, y + height);
    this.ctx.lineTo(x + width * 0.1, y + height * 0.6);
    this.ctx.lineTo(x, y + height * 0.3);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.fillStyle = mode === 'hardcore' ? '#FF0000' : '#FFEB3B';
    this.ctx.shadowColor = this.ctx.fillStyle;
    this.ctx.shadowBlur = 15;
    this.ctx.beginPath();
    this.ctx.arc(x + width * 0.35, y + height * 0.35, width * 0.08, 0, Math.PI * 2);
    this.ctx.arc(x + width * 0.65, y + height * 0.35, width * 0.08, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.shadowBlur = 0;

    this.ctx.fillStyle = '#FFF';
    for (let i = 0; i < 7; i++) {
      this.ctx.beginPath();
      this.ctx.moveTo(x + width * 0.25 + i * width * 0.08, y + height * 0.55);
      this.ctx.lineTo(x + width * 0.29 + i * width * 0.08, y + height * 0.7);
      this.ctx.lineTo(x + width * 0.21 + i * width * 0.08, y + height * 0.7);
      this.ctx.closePath();
      this.ctx.fill();
    }
  }

  // ============================================================
  //  BONUS ENEMY (UFO)
  // ============================================================
  renderBonusEnemy(ufo) {
    if (!ufo || ufo.destroyed) return;

    const { x, y, width, height, type } = ufo;
    const cx = x + width / 2;
    const cy = y + height / 2;
    const now = Date.now();
    const pulse = 0.7 + Math.sin(now / 200) * 0.3;

    this.ctx.globalAlpha = 1.0;

    let bodyColor, glowColor;
    switch (type) {
      case 'ufo_rainbow':
        bodyColor = `hsl(${(now / 10) % 360}, 80%, 60%)`;
        glowColor = '#FFD700';
        break;
      case 'ufo_silver':
        bodyColor = '#C0C0C0';
        glowColor = '#87CEEB';
        break;
      case 'ufo_gold':
        bodyColor = '#FFD700';
        glowColor = '#FFA500';
        break;
      case 'ufo_blood':
        bodyColor = '#8B0000';
        glowColor = '#FF0000';
        break;
      case 'ufo_void':
        bodyColor = '#1A0033';
        glowColor = '#9900FF';
        break;
      default:
        bodyColor = '#888';
        glowColor = '#FFF';
    }

    // Pulsing glow
    this.ctx.shadowColor = glowColor;
    this.ctx.shadowBlur = 15 * pulse;

    // UFO dome
    this.ctx.fillStyle = bodyColor;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy - height * 0.1, width * 0.25, Math.PI, 0);
    this.ctx.closePath();
    this.ctx.fill();

    // UFO body (disc)
    this.ctx.beginPath();
    this.ctx.ellipse(cx, cy, width * 0.5, height * 0.3, 0, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.shadowBlur = 0;

    // Window
    this.ctx.fillStyle = glowColor;
    this.ctx.globalAlpha = 0.8;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy - height * 0.15, width * 0.12, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.globalAlpha = 1.0;

    // Bottom lights
    this.ctx.fillStyle = glowColor;
    for (let i = 0; i < 3; i++) {
      this.ctx.beginPath();
      this.ctx.arc(cx - width * 0.25 + i * width * 0.25, cy + height * 0.15, 2, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  // ============================================================
  //  POWERUP
  // ============================================================
  renderPowerUp(powerup) {
    if (!powerup || !powerup.active) return;

    const { x, y, width, height, type, color } = powerup;
    this.ctx.globalAlpha = 1.0;

    this.ctx.fillStyle = color || '#FFD700';
    this.ctx.shadowColor = color || '#FFD700';
    this.ctx.shadowBlur = 15;
    this.ctx.beginPath();
    this.ctx.arc(x + width / 2, y + height / 2, width / 2, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.shadowBlur = 0;

    this.ctx.fillStyle = '#FFF';
    this.ctx.font = `${width * 0.5}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    const symbols = {
      rocket: 'R',
      doubleFire: 'x2',
      rapidFire: '>>',
      grenade: 'G',
      machineGun: 'MG',
      fruitBlaster: 'F',
      starShower: '*',
      confetti: 'C'
    };

    this.ctx.fillText(symbols[type] || '?', x + width / 2, y + height / 2);
  }

  // ============================================================
  //  MEDIPAK (Hardcore)
  // ============================================================
  renderMedipak(medipak) {
    if (!medipak || !medipak.active) return;

    const { x, y, width, height, floatOffset } = medipak;
    const renderY = y + (floatOffset || 0);

    this.ctx.globalAlpha = 1.0;
    this.ctx.fillStyle = '#00FF00';
    this.ctx.shadowColor = '#00FF00';
    this.ctx.shadowBlur = 15;
    this.ctx.beginPath();
    this.ctx.arc(x + width / 2, renderY + height / 2, width / 2, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.shadowBlur = 0;

    this.ctx.fillStyle = '#FFF';
    const crossSize = width * 0.6;
    const crossThick = width * 0.2;
    const centerX = x + width / 2;
    const centerY = renderY + height / 2;
    this.ctx.fillRect(centerX - crossThick / 2, centerY - crossSize / 2, crossThick, crossSize);
    this.ctx.fillRect(centerX - crossSize / 2, centerY - crossThick / 2, crossSize, crossThick);
  }

  // ============================================================
  //  PARTICLES
  // ============================================================
  renderParticles(particles) {
    if (!particles || particles.length === 0) return;
    particles.forEach(p => {
      this.ctx.globalAlpha = Math.max(0, p.life);
      this.ctx.fillStyle = p.color;
      this.ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    });
    this.ctx.globalAlpha = 1.0;
  }

  // ============================================================
  //  SCORE POPUPS
  // ============================================================
  renderScorePopups(popups) {
    if (!popups || popups.length === 0) return;

    popups.forEach(p => {
      this.ctx.globalAlpha = Math.max(0, p.life);
      this.ctx.font = 'bold 14px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillStyle = '#FFD700';
      this.ctx.fillText(p.text, p.x, p.y);

      if (p.label) {
        this.ctx.font = 'bold 12px Arial';
        this.ctx.fillStyle = '#FF4500';
        this.ctx.fillText(p.label, p.x, p.y - 16);
      }
    });
    this.ctx.globalAlpha = 1.0;
  }

  // ============================================================
  //  HUD
  // ============================================================
  renderHUD(score, lives, level, mode, powerupTimer, powerupLabel, comboCount, comboMultiplier) {
    this.ctx.globalAlpha = 1.0;
    this.ctx.fillStyle = '#FFF';
    this.ctx.font = '20px "Press Start 2P", monospace';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`SCORE: ${score}`, 20, 30);

    this.ctx.textAlign = 'center';
    this.ctx.fillText(`LEVEL ${level}`, this.canvas.width / 2, 30);

    this.ctx.textAlign = 'right';
    this.ctx.fillText(`LIVES: ${'♥'.repeat(Math.max(0, lives))}`, this.canvas.width - 20, 30);

    this.ctx.font = '12px Arial';
    this.ctx.fillStyle = '#888';
    this.ctx.textAlign = 'left';
    const modeNames = { kids: 'KINDERMODUS', normal: 'NORMAL', hardcore: 'HARDCORE' };
    this.ctx.fillText(modeNames[mode] || mode, 20, 55);

    // Active powerup with name
    if (powerupTimer > 0 && powerupLabel) {
      this.ctx.fillStyle = '#FFD700';
      this.ctx.font = '14px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`${powerupLabel}: ${(powerupTimer / 1000).toFixed(1)}s`, this.canvas.width / 2, 55);
    }

    // Combo display
    if (comboCount >= 3 && comboMultiplier > 1) {
      this.ctx.fillStyle = '#FF4500';
      this.ctx.font = 'bold 16px Arial';
      this.ctx.textAlign = 'right';
      this.ctx.fillText(`COMBO x${comboMultiplier}`, this.canvas.width - 20, 55);
    }
  }

  renderHardcoreHUD(score, energyPercent, level, wave, powerupTimer, powerupLabel, comboCount, comboMultiplier) {
    this.ctx.globalAlpha = 1.0;
    this.ctx.fillStyle = '#FFF';
    this.ctx.font = '20px "Press Start 2P", monospace';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`SCORE: ${score}`, 20, 30);

    this.ctx.textAlign = 'center';
    if (level >= 10) {
      this.ctx.fillText(`ENDLOS - WELLE ${wave}`, this.canvas.width / 2, 30);
    } else {
      this.ctx.fillText(`LEVEL ${level}`, this.canvas.width / 2, 30);
    }

    // Energy bar
    this.ctx.textAlign = 'right';
    this.ctx.font = '14px Arial';
    this.ctx.fillText('ENERGIE', this.canvas.width - 20, 20);

    const barX = this.canvas.width - 120;
    const barY = 28;
    const barWidth = 100;
    const barHeight = 15;

    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(barX, barY, barWidth, barHeight);
    const energyColor = energyPercent > 50 ? '#4CAF50' : energyPercent > 25 ? '#FF9800' : '#F44336';
    this.ctx.fillStyle = energyColor;
    this.ctx.fillRect(barX, barY, (barWidth * energyPercent) / 100, barHeight);
    this.ctx.strokeStyle = '#FFF';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(barX, barY, barWidth, barHeight);
    this.ctx.fillStyle = '#FFF';
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`${Math.floor(energyPercent)}%`, barX + barWidth / 2, barY + barHeight - 3);

    this.ctx.font = '12px Arial';
    this.ctx.fillStyle = '#888';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('HARDCORE', 20, 55);

    // Active powerup
    if (powerupTimer > 0 && powerupLabel) {
      this.ctx.fillStyle = '#FFD700';
      this.ctx.font = '14px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`${powerupLabel}: ${(powerupTimer / 1000).toFixed(1)}s`, this.canvas.width / 2, 60);
    }

    // Combo
    if (comboCount >= 3 && comboMultiplier > 1) {
      this.ctx.fillStyle = '#FF4500';
      this.ctx.font = 'bold 16px Arial';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(`COMBO x${comboMultiplier}`, 20, 75);
    }
  }

  // ============================================================
  //  OVERLAY SCREENS
  // ============================================================
  renderGameOver(score, isVictory = false, stats = null) {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = isVictory ? '#4CAF50' : '#FF0000';
    this.ctx.font = '48px "Press Start 2P", monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(isVictory ? 'VICTORY!' : 'GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 80);

    this.ctx.fillStyle = '#FFF';
    this.ctx.font = '24px Arial';
    this.ctx.fillText(`Final Score: ${score}`, this.canvas.width / 2, this.canvas.height / 2 - 20);

    if (stats) {
      this.ctx.font = '16px Arial';
      this.ctx.fillStyle = '#AAA';
      let yOff = this.canvas.height / 2 + 15;
      if (stats.accuracy > 0) {
        this.ctx.fillText(`Trefferquote: ${stats.accuracy}%${stats.accuracyMultiplier > 1 ? ` (x${stats.accuracyMultiplier})` : ''}`, this.canvas.width / 2, yOff);
        yOff += 22;
      }
      if (stats.speedMultiplier > 1) {
        this.ctx.fillText(`Speed Bonus: x${stats.speedMultiplier}`, this.canvas.width / 2, yOff);
        yOff += 22;
      }
      if (stats.maxCombo > 1) {
        this.ctx.fillText(`Max Combo: ${stats.maxCombo} Kills`, this.canvas.width / 2, yOff);
        yOff += 22;
      }
    }

    this.ctx.fillStyle = '#FFF';
    this.ctx.font = '20px Arial';
    this.ctx.fillText('Press SPACE to continue', this.canvas.width / 2, this.canvas.height / 2 + 90);
  }

  renderPause() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = '#FFF';
    this.ctx.font = '48px "Press Start 2P", monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);

    this.ctx.font = '20px Arial';
    this.ctx.fillText('Press ESC to resume', this.canvas.width / 2, this.canvas.height / 2 + 50);
  }

  renderLevelComplete(level, score, stats = null) {
    this.ctx.fillStyle = 'rgba(0, 0, 50, 0.9)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = '#4CAF50';
    this.ctx.font = '36px "Press Start 2P", monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`LEVEL ${level}`, this.canvas.width / 2, this.canvas.height / 2 - 80);
    this.ctx.fillText('COMPLETE!', this.canvas.width / 2, this.canvas.height / 2 - 30);

    this.ctx.fillStyle = '#FFF';
    this.ctx.font = '24px Arial';
    this.ctx.fillText(`Score: ${score}`, this.canvas.width / 2, this.canvas.height / 2 + 20);

    if (stats) {
      this.ctx.font = '16px Arial';
      this.ctx.fillStyle = '#AAA';
      let yOff = this.canvas.height / 2 + 50;

      this.ctx.fillText(`Zeit: ${stats.time}s${stats.speedMultiplier > 1 ? ` (x${stats.speedMultiplier} Bonus!)` : ''}`, this.canvas.width / 2, yOff);
      yOff += 22;
      this.ctx.fillText(`Trefferquote: ${stats.accuracy}%${stats.accuracyMultiplier > 1 ? ` (x${stats.accuracyMultiplier} Bonus!)` : ''}`, this.canvas.width / 2, yOff);
      yOff += 22;
      if (stats.maxCombo > 1) {
        this.ctx.fillText(`Max Combo: ${stats.maxCombo}`, this.canvas.width / 2, yOff);
        yOff += 22;
      }
    }

    this.ctx.fillStyle = '#FFF';
    this.ctx.font = '20px Arial';
    this.ctx.fillText('Press SPACE to continue', this.canvas.width / 2, this.canvas.height / 2 + 110);
  }
}
