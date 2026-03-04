// BOOST INVADERS - GAME ENGINE
// Haupt-Spiellogik mit Partikeln, Combo-Scoring, Data-Driven Powerups, Bonus-Gegner

import { GAME_CONFIG, scaleDifficulty, getConfigValue } from './GameConfig';

export class GameEngine {
  constructor(renderer) {
    this.renderer = renderer;
    this.reset();
  }

  reset() {
    this.state = GAME_CONFIG.states.MENU;
    this.mode = null;
    this.level = 1;
    this.score = 0;
    this.player = null;
    this.enemies = [];
    this.enemyProjectiles = [];
    this.playerProjectiles = [];
    this.powerups = [];
    this.medipaks = [];
    this.boss = null;
    this.bonusEnemy = null;
    this.stars = [];
    this.lastTime = 0;
    this.deltaTime = 0;
    this.lastEnemyShot = 0;
    this.activePowerup = null;
    this.powerupEndTime = 0;
    this.keys = {};
    this.lastPlayerShot = 0;
    this.lastMedipakDrop = 0;
    this.invulnerableUntil = 0;
    this.wave = 1;

    // Particle system
    this.particles = [];
    this.scorePopups = [];

    // Scoring/Combo
    this.comboCount = 0;
    this.lastKillTime = 0;
    this.comboMultiplier = 1;
    this.maxComboThisGame = 0;
    this.levelStartTime = 0;
    this.shotsFired = 0;
    this.shotsHit = 0;
    this.powerupsCollected = 0;

    // Hit response
    this.hitFreezeUntil = 0;
    this.screenShakeUntil = 0;
    this.screenShakeIntensity = 0;

    // Bonus enemy
    this.lastBonusSpawn = 0;

    this.generateStars();
  }

  generateStars() {
    this.stars = [];
    for (let i = 0; i < 100; i++) {
      this.stars.push({
        x: Math.random() * GAME_CONFIG.canvas.width,
        y: Math.random() * GAME_CONFIG.canvas.height,
        size: Math.random() * 2 + 1,
        brightness: Math.random() * 0.5 + 0.5,
        speed: Math.random() * 0.5 + 0.2
      });
    }
  }

  startGame(mode) {
    if (!GAME_CONFIG.modes[mode]) {
      throw new Error(`STOP: Ungueltiger Modus: ${mode}`);
    }

    this.mode = mode;
    this.level = 1;
    this.score = 0;
    this.state = GAME_CONFIG.states.PLAYING;
    this.comboCount = 0;
    this.lastKillTime = 0;
    this.maxComboThisGame = 0;
    this.shotsFired = 0;
    this.shotsHit = 0;
    this.powerupsCollected = 0;
    this.particles = [];
    this.scorePopups = [];
    this.bonusEnemy = null;
    this.lastBonusSpawn = Date.now();

    this.initPlayer();
    this.initLevel();
  }

  initPlayer() {
    const config = GAME_CONFIG.player;
    const modeConfig = GAME_CONFIG.modes[this.mode];

    this.player = {
      x: GAME_CONFIG.canvas.width / 2 - config.width / 2,
      y: GAME_CONFIG.canvas.height - config.height - 20,
      width: config.width,
      height: config.height,
      speed: config.speed,
      color: config.color,
      visible: true
    };

    if (this.mode === 'hardcore') {
      this.player.energyPercent = 100;
      this.player.maxEnergyPercent = 100;
      this.invulnerableUntil = 0;
    } else {
      this.player.lives = modeConfig.playerLives || config.lives;
    }
  }

  initLevel() {
    const modeConfig = GAME_CONFIG.modes[this.mode];

    if (!modeConfig) {
      throw new Error(`STOP: Modus-Config fehlt: ${this.mode}`);
    }

    this.enemies = [];
    this.enemyProjectiles = [];
    this.playerProjectiles = [];
    this.powerups = [];
    this.medipaks = [];
    this.boss = null;
    this.bonusEnemy = null;
    this.levelStartTime = Date.now();

    const effectiveLevel = this.mode === 'hardcore' ? Math.min(this.level, 10) : this.level;
    const difficultyIndex = Math.min(effectiveLevel - 1, modeConfig.difficultyPercentByLevel.length - 1);
    const difficultyPercent = modeConfig.difficultyPercentByLevel[difficultyIndex];

    this.spawnEnemies(modeConfig, difficultyPercent);
  }

  spawnEnemies(modeConfig, difficultyPercent) {
    const rows = modeConfig.enemyRows || 4;
    const cols = modeConfig.enemyCols || 8;
    const enemyWidth = 40;
    const enemyHeight = 32;
    const padding = 15;
    const startX = (GAME_CONFIG.canvas.width - (cols * (enemyWidth + padding))) / 2;
    const startY = 80;

    let enemyTypes;
    let colors;

    if (this.mode === 'kids') {
      const theme = modeConfig.themes[this.level];
      if (!theme) {
        throw new Error(`STOP: Kinder-Theme fehlt fuer Level ${this.level}`);
      }
      enemyTypes = theme.enemyTypes;
      colors = theme.colors;
    } else {
      enemyTypes = modeConfig.enemyTypes || ['alien'];
      colors = modeConfig.colors?.enemies || ['#4CAF50'];
    }

    const baseSpeed = modeConfig.enemyBaseSpeed;
    const scaledSpeed = scaleDifficulty(baseSpeed, difficultyPercent, true);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const typeIndex = (row + Math.floor(col / 3)) % enemyTypes.length;
        const colorIndex = (row + col) % colors.length;

        this.enemies.push({
          x: startX + col * (enemyWidth + padding),
          y: startY + row * (enemyHeight + padding),
          width: enemyWidth,
          height: enemyHeight,
          type: enemyTypes[typeIndex],
          color: colors[colorIndex],
          mode: this.mode,
          destroyed: false,
          speed: scaledSpeed,
          direction: 1,
          canShoot: row === rows - 1,
          points: (rows - row) * 10
        });
      }
    }
  }

  spawnBoss() {
    const modeConfig = GAME_CONFIG.modes[this.mode];
    let bossConfig;

    if (this.mode === 'kids') {
      const theme = modeConfig.themes[this.level];
      if (!theme?.boss) return;
      bossConfig = theme.boss;
    } else {
      bossConfig = {
        name: `Level ${this.level} Boss`,
        width: 120,
        height: 80,
        health: 15 + this.level * 5,
        color: this.mode === 'hardcore' ? '#4A0000' : '#1B5E20'
      };
    }

    this.boss = {
      x: GAME_CONFIG.canvas.width / 2 - bossConfig.width / 2,
      y: 60,
      width: bossConfig.width,
      height: bossConfig.height,
      health: bossConfig.health,
      maxHealth: bossConfig.health,
      color: bossConfig.color,
      type: this.mode === 'kids' ?
        (this.level === 2 ? 'evilSnowman' : 'evilDad') :
        'standardBoss',
      mode: this.mode,
      destroyed: false,
      direction: 1,
      speed: 1.5,
      lastShot: 0,
      fireRate: 1500,
      phase: 1
    };
  }

  // --- UPDATE LOOP ---
  update(timestamp) {
    if (this.state === GAME_CONFIG.states.PAUSED) return;
    if (this.state !== GAME_CONFIG.states.PLAYING) return;

    if (this.lastTime === 0) {
      this.lastTime = timestamp;
      return;
    }

    this.deltaTime = timestamp - this.lastTime;
    this.lastTime = timestamp;

    const now = Date.now();

    // Hit freeze check (Kids/Normal)
    if (now < this.hitFreezeUntil) {
      // Still update particles and popups during freeze
      this.updateParticles();
      this.updateScorePopups();
      return;
    }

    this.updateStars();
    this.updatePlayer();
    this.updateEnemies();

    if (this.boss) {
      this.updateBoss();
    }

    this.updateBonusEnemy(now);
    this.updateProjectiles();
    this.updatePowerups();

    if (this.mode === 'hardcore') {
      this.updateMedipaks();
    }

    this.checkCollisions();
    this.checkLevelComplete();
    this.checkPowerupExpiry();
    this.updateComboDecay(now);
    this.updateParticles();
    this.updateScorePopups();
    this.maybeSpawnBonusEnemy(now);
  }

  updateStars() {
    this.stars.forEach(star => {
      star.y += star.speed;
      if (star.y > GAME_CONFIG.canvas.height) {
        star.y = 0;
        star.x = Math.random() * GAME_CONFIG.canvas.width;
      }
    });
  }

  updatePlayer() {
    if (!this.player) return;

    const speed = this.player.speed;

    if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) {
      this.player.x = Math.max(0, this.player.x - speed);
    }
    if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) {
      this.player.x = Math.min(
        GAME_CONFIG.canvas.width - this.player.width,
        this.player.x + speed
      );
    }
    if (this.keys[' '] || this.keys['Space']) {
      this.playerShoot();
    }
  }

  // --- DATA-DRIVEN POWERUP SHOOTING ---
  playerShoot() {
    const now = Date.now();
    const effects = this.activePowerup ? GAME_CONFIG.powerupEffects[this.activePowerup] : null;
    const fireRate = effects ? effects.fireRate : GAME_CONFIG.player.fireRate;

    if (now - this.lastPlayerShot < fireRate) return;
    this.lastPlayerShot = now;
    this.shotsFired++;

    const projectileConfig = GAME_CONFIG.player;
    const numProjectiles = effects ? effects.projectiles : 1;
    const spread = effects ? effects.spread : 0;
    const pierce = effects ? effects.pierce : false;
    const aoe = effects ? effects.aoe : 0;
    const damage = effects ? effects.damage : 1;
    const pType = this.activePowerup || 'laser';

    const centerX = this.player.x + this.player.width / 2;

    for (let i = 0; i < numProjectiles; i++) {
      let offsetX = 0;
      let speedX = 0;

      if (numProjectiles > 1) {
        // Fan spread
        const t = numProjectiles === 1 ? 0 : (i / (numProjectiles - 1)) * 2 - 1; // -1 to 1
        offsetX = t * 15;
        speedX = t * spread * projectileConfig.projectileSpeed;
      } else if (spread > 0) {
        // Single projectile with random spread
        speedX = (Math.random() - 0.5) * spread * projectileConfig.projectileSpeed * 2;
      }

      this.playerProjectiles.push({
        x: centerX - projectileConfig.projectileWidth / 2 + offsetX,
        y: this.player.y,
        width: pType === 'grenade' ? 8 : pType === 'rocket' ? 6 : projectileConfig.projectileWidth,
        height: pType === 'grenade' ? 8 : pType === 'rocket' ? 14 : projectileConfig.projectileHeight,
        speed: projectileConfig.projectileSpeed,
        speedX: speedX,
        color: this.getProjectileColor(pType),
        type: pType,
        isEnemy: false,
        active: true,
        pierce: pierce,
        aoe: aoe,
        damage: damage,
      });
    }
  }

  getProjectileColor(type) {
    const colorMap = {
      laser: '#FFFF00',
      rapidFire: '#00FFFF',
      machineGun: '#FF8800',
      doubleFire: '#FFFF00',
      rocket: '#FF4500',
      grenade: '#FF6600',
      fruitBlaster: '#FF1493',
      starShower: '#FFD700',
      confetti: '#FF00FF',
    };
    return colorMap[type] || '#FFFF00';
  }

  updateEnemies() {
    const modeConfig = GAME_CONFIG.modes[this.mode];
    const difficultyIndex = Math.min(this.level - 1, modeConfig.difficultyPercentByLevel.length - 1);
    const difficultyPercent = modeConfig.difficultyPercentByLevel[difficultyIndex];

    let hitEdge = false;
    const activeEnemies = this.enemies.filter(e => !e.destroyed);

    activeEnemies.forEach(enemy => {
      enemy.x += enemy.speed * enemy.direction;

      if (enemy.x <= 0 || enemy.x + enemy.width >= GAME_CONFIG.canvas.width) {
        hitEdge = true;
      }
    });

    if (hitEdge) {
      activeEnemies.forEach(enemy => {
        enemy.direction *= -1;
        enemy.y += 20;
      });
    }

    this.enemyShoot(modeConfig, difficultyPercent);
  }

  enemyShoot(modeConfig, difficultyPercent) {
    const now = Date.now();

    const effectiveLevel = this.mode === 'hardcore' ? Math.min(this.level, 10) : this.level;
    const capsIndex = Math.min(effectiveLevel - 1, modeConfig.caps.maxActiveEnemyProjectiles.length - 1);
    const maxProjectiles = modeConfig.caps.maxActiveEnemyProjectiles[capsIndex];
    const maxShooters = modeConfig.caps.maxSimultaneousShooters[capsIndex];

    const activeProjectiles = this.enemyProjectiles.filter(p => p.active).length;
    if (activeProjectiles >= maxProjectiles) return;

    const baseInterval = modeConfig.enemyBaseFireInterval;
    const scaledInterval = scaleDifficulty(baseInterval, difficultyPercent, false);

    if (now - this.lastEnemyShot < scaledInterval) return;
    this.lastEnemyShot = now;

    const shootingEnemies = this.enemies.filter(e => !e.destroyed && e.canShoot);
    const shuffled = shootingEnemies.sort(() => Math.random() - 0.5);
    const shooters = shuffled.slice(0, Math.min(maxShooters, maxProjectiles - activeProjectiles));

    let projectileType = 'laser';
    let projectileColor = '#FF5722';

    if (this.mode === 'kids') {
      const theme = modeConfig.themes[this.level];
      projectileType = theme?.projectileType || 'banana';
      projectileColor = '#FFD700';
    } else if (this.mode === 'hardcore') {
      projectileType = modeConfig.projectileTypes[Math.floor(Math.random() * modeConfig.projectileTypes.length)];
      projectileColor = modeConfig.colors.projectiles[0];
    }

    const baseSpeed = modeConfig.enemyProjectileBaseSpeed;
    const scaledSpeed = scaleDifficulty(baseSpeed, difficultyPercent, true);

    shooters.forEach(enemy => {
      if (this.mode === 'hardcore' && modeConfig.antiBulletHell?.noSpawnOnPlayerX) {
        const playerCenterX = this.player.x + this.player.width / 2;
        const enemyCenterX = enemy.x + enemy.width / 2;
        if (Math.abs(playerCenterX - enemyCenterX) < modeConfig.antiBulletHell.minSafeGapPx) {
          return;
        }
      }

      this.enemyProjectiles.push({
        x: enemy.x + enemy.width / 2 - 4,
        y: enemy.y + enemy.height,
        width: 8,
        height: 16,
        speed: scaledSpeed,
        color: projectileColor,
        type: projectileType,
        isEnemy: true,
        active: true
      });
    });
  }

  updateBoss() {
    if (!this.boss || this.boss.destroyed) return;

    this.boss.x += this.boss.speed * this.boss.direction;
    if (this.boss.x <= 0 || this.boss.x + this.boss.width >= GAME_CONFIG.canvas.width) {
      this.boss.direction *= -1;
    }

    const now = Date.now();
    if (now - this.boss.lastShot > this.boss.fireRate) {
      this.boss.lastShot = now;
      this.bossShoot();
    }
  }

  bossShoot() {
    const modeConfig = GAME_CONFIG.modes[this.mode];
    let projectileType = 'laser';
    let projectileColor = '#FF0000';

    if (this.mode === 'kids') {
      const theme = modeConfig.themes[this.level];
      projectileType = theme?.boss?.projectileType || 'snowball';
      projectileColor = '#87CEEB';
    }

    const angles = this.boss.phase === 1 ? [0] : [-0.2, 0, 0.2];

    angles.forEach(angle => {
      this.enemyProjectiles.push({
        x: this.boss.x + this.boss.width / 2 - 6,
        y: this.boss.y + this.boss.height,
        width: 12,
        height: 20,
        speed: 3,
        speedX: angle * 3,
        color: projectileColor,
        type: projectileType,
        isEnemy: true,
        active: true
      });
    });
  }

  updateProjectiles() {
    this.playerProjectiles.forEach(proj => {
      if (!proj.active) return;
      proj.y -= proj.speed;
      if (proj.speedX) proj.x += proj.speedX;
      if (proj.y < 0) proj.active = false;
    });

    this.enemyProjectiles.forEach(proj => {
      if (!proj.active) return;
      proj.y += proj.speed;
      if (proj.speedX) proj.x += proj.speedX;
      if (proj.y > GAME_CONFIG.canvas.height) proj.active = false;
    });

    this.playerProjectiles = this.playerProjectiles.filter(p => p.active);
    this.enemyProjectiles = this.enemyProjectiles.filter(p => p.active);
  }

  updatePowerups() {
    this.powerups.forEach(powerup => {
      if (!powerup.active) return;
      powerup.y += 2;
      if (powerup.y > GAME_CONFIG.canvas.height) powerup.active = false;
    });

    this.powerups = this.powerups.filter(p => p.active);
  }

  updateMedipaks() {
    const now = Date.now();

    this.medipaks.forEach(medipak => {
      if (!medipak.active) return;
      medipak.y += 1.5;
      medipak.floatOffset = Math.sin(now / 300 + medipak.id) * 3;
      if (now - medipak.spawnTime > 8000) medipak.active = false;
      if (medipak.y > GAME_CONFIG.canvas.height) medipak.active = false;
    });

    this.medipaks = this.medipaks.filter(m => m.active);
  }

  // --- BONUS ENEMY (UFO) ---
  maybeSpawnBonusEnemy(now) {
    if (this.bonusEnemy) return;
    const config = GAME_CONFIG.bonusEnemy;
    const interval = config.spawnInterval[this.mode];
    if (now - this.lastBonusSpawn < interval) return;
    if (Math.random() > config.spawnChance) {
      this.lastBonusSpawn = now;
      return;
    }

    this.lastBonusSpawn = now;
    const types = config.types[this.mode];
    const fromLeft = Math.random() > 0.5;

    this.bonusEnemy = {
      x: fromLeft ? -50 : GAME_CONFIG.canvas.width + 50,
      y: 30,
      width: 44,
      height: 24,
      speed: config.speed[this.mode] * (fromLeft ? 1 : -1),
      health: config.health[this.mode],
      maxHealth: config.health[this.mode],
      points: config.points[this.mode],
      type: types[Math.floor(Math.random() * types.length)],
      mode: this.mode,
      destroyed: false,
      spawnTime: now,
    };
  }

  updateBonusEnemy(now) {
    if (!this.bonusEnemy) return;
    this.bonusEnemy.x += this.bonusEnemy.speed;
    // Off-screen removal
    if (this.bonusEnemy.x < -100 || this.bonusEnemy.x > GAME_CONFIG.canvas.width + 100) {
      this.bonusEnemy = null;
    }
  }

  // --- COLLISIONS ---
  checkCollisions() {
    if (!this.player) return;
    const now = Date.now();

    // Player projectiles vs enemies
    this.playerProjectiles.forEach(proj => {
      if (!proj.active) return;

      // vs regular enemies
      this.enemies.forEach(enemy => {
        if (enemy.destroyed) return;
        if (this.collides(proj, enemy)) {
          this.shotsHit++;

          // AoE (grenade)
          if (proj.aoe > 0) {
            this.explodeAt(proj.x + proj.width / 2, proj.y, proj.aoe, proj.damage);
            proj.active = false;
          } else {
            if (!proj.pierce) proj.active = false;
            enemy.destroyed = true;
            const basePoints = enemy.points * (proj.damage || 1);
            this.registerKill(enemy.x + enemy.width / 2, enemy.y, basePoints, enemy.color);

            if (this.mode === 'hardcore') {
              this.maybeDropMedipak(enemy.x, enemy.y);
            } else {
              this.maybeDropPowerup(enemy.x, enemy.y);
            }
          }
        }
      });

      // vs boss
      if (this.boss && !this.boss.destroyed && proj.active && this.collides(proj, this.boss)) {
        this.shotsHit++;
        if (!proj.pierce) proj.active = false;
        this.boss.health -= (proj.damage || 1);
        if (this.boss.health <= this.boss.maxHealth / 2 && this.boss.phase === 1) {
          this.boss.phase = 2;
          this.boss.speed *= 1.5;
          this.boss.fireRate *= 0.7;
        }
        if (this.boss.health <= 0) {
          this.boss.destroyed = true;
          const bossPoints = GAME_CONFIG.scoring.bossKillBase * this.comboMultiplier;
          this.score += Math.floor(bossPoints);
          this.addExplosion(this.boss.x + this.boss.width / 2, this.boss.y + this.boss.height / 2, GAME_CONFIG.particles.bossDeathCount, this.boss.color);
          this.addScorePopup(this.boss.x + this.boss.width / 2, this.boss.y, Math.floor(bossPoints), 'BOSS!');
          // Bigger screen shake for boss
          this.screenShakeUntil = now + 800;
          this.screenShakeIntensity = 12;
        }
      }

      // vs bonus enemy
      if (this.bonusEnemy && !this.bonusEnemy.destroyed && proj.active && this.collides(proj, this.bonusEnemy)) {
        this.shotsHit++;
        if (!proj.pierce) proj.active = false;
        this.bonusEnemy.health -= (proj.damage || 1);
        if (this.bonusEnemy.health <= 0) {
          const pts = this.bonusEnemy.points;
          this.score += pts;
          this.addExplosion(this.bonusEnemy.x + this.bonusEnemy.width / 2, this.bonusEnemy.y, 20, '#FFD700');
          this.addScorePopup(this.bonusEnemy.x + this.bonusEnemy.width / 2, this.bonusEnemy.y, pts, 'BONUS!');
          this.bonusEnemy = null;
        }
      }
    });

    // Enemy projectiles vs player
    this.enemyProjectiles.forEach(proj => {
      if (!proj.active) return;
      if (this.collides(proj, this.player)) {
        proj.active = false;
        this.handlePlayerHit();
      }
    });

    // Powerups vs player
    if (this.mode !== 'hardcore') {
      this.powerups.forEach(powerup => {
        if (!powerup.active) return;
        if (this.collides(powerup, this.player)) {
          powerup.active = false;
          this.activatePowerup(powerup.type);
          this.powerupsCollected++;
          this.score += GAME_CONFIG.scoring.powerupCollectBonus;
          this.addScorePopup(powerup.x, powerup.y, GAME_CONFIG.scoring.powerupCollectBonus, 'POWER!');
        }
      });
    }

    // Hardcore: powerups also work
    if (this.mode === 'hardcore') {
      this.powerups.forEach(powerup => {
        if (!powerup.active) return;
        if (this.collides(powerup, this.player)) {
          powerup.active = false;
          this.activatePowerup(powerup.type);
          this.powerupsCollected++;
          this.score += GAME_CONFIG.scoring.powerupCollectBonus;
        }
      });
    }

    // Medipaks vs player (Hardcore)
    if (this.mode === 'hardcore') {
      this.medipaks.forEach(medipak => {
        if (!medipak.active) return;
        if (this.collides(medipak, this.player)) {
          medipak.active = false;
          this.healPlayer();
        }
      });
    }

    // Enemies reaching player
    this.enemies.forEach(enemy => {
      if (enemy.destroyed) return;
      if (enemy.y + enemy.height >= this.player.y) {
        this.handlePlayerHit();
      }
    });
  }

  // --- AoE EXPLOSION (Grenade) ---
  explodeAt(cx, cy, radius, damage) {
    this.addExplosion(cx, cy, 25, '#FF6600');
    this.screenShakeUntil = Date.now() + 400;
    this.screenShakeIntensity = 6;

    this.enemies.forEach(enemy => {
      if (enemy.destroyed) return;
      const ex = enemy.x + enemy.width / 2;
      const ey = enemy.y + enemy.height / 2;
      const dist = Math.sqrt((cx - ex) ** 2 + (cy - ey) ** 2);
      if (dist <= radius) {
        enemy.destroyed = true;
        const pts = enemy.points * damage;
        this.registerKill(ex, ey, pts, enemy.color);
        if (this.mode === 'hardcore') {
          this.maybeDropMedipak(enemy.x, enemy.y);
        } else {
          this.maybeDropPowerup(enemy.x, enemy.y);
        }
      }
    });
  }

  // --- KILL REGISTRATION (Combo + Score + Particles) ---
  registerKill(x, y, basePoints, color) {
    const now = Date.now();

    // Combo system
    if (now - this.lastKillTime < GAME_CONFIG.scoring.comboWindow) {
      this.comboCount++;
    } else {
      this.comboCount = 1;
    }
    this.lastKillTime = now;

    // Get combo multiplier from config
    const multipliers = GAME_CONFIG.scoring.comboMultipliers;
    this.comboMultiplier = multipliers[Math.min(this.comboCount, multipliers.length - 1)];

    if (this.comboCount > this.maxComboThisGame) {
      this.maxComboThisGame = this.comboCount;
    }

    // Calculate final points
    const finalPoints = Math.floor(basePoints * this.comboMultiplier);
    this.score += finalPoints;

    // Particles
    this.addExplosion(x, y, GAME_CONFIG.particles.enemyDeathCount, color);

    // Score popup
    let comboLabel = '';
    if (this.comboCount >= 8) comboLabel = 'UNSTOPPABLE!';
    else if (this.comboCount >= 6) comboLabel = 'PENTA!';
    else if (this.comboCount >= 5) comboLabel = 'QUAD!';
    else if (this.comboCount >= 3) comboLabel = 'TRIPLE!';

    const popupText = this.comboMultiplier > 1
      ? `+${finalPoints} x${this.comboMultiplier}`
      : `+${finalPoints}`;
    this.addScorePopup(x, y, finalPoints, comboLabel, popupText);
  }

  updateComboDecay(now) {
    if (this.comboCount > 0 && now - this.lastKillTime > GAME_CONFIG.scoring.comboWindow) {
      this.comboCount = 0;
      this.comboMultiplier = 1;
    }
  }

  // --- HIT RESPONSE ---
  handlePlayerHit() {
    const now = Date.now();

    if (now < this.invulnerableUntil) return;

    if (this.mode === 'hardcore') {
      this.player.energyPercent = Math.max(0, this.player.energyPercent - 10);
      this.invulnerableUntil = now + 350;

      if (this.player.energyPercent <= 0) {
        this.state = GAME_CONFIG.states.GAME_OVER;
      }
    } else {
      // Kids/Normal: Full hit response
      this.player.lives--;

      // Invulnerability
      this.invulnerableUntil = now + GAME_CONFIG.hitResponse.invulnerabilityMs;

      // Gameplay freeze
      this.hitFreezeUntil = now + GAME_CONFIG.hitResponse.freezeMs;

      // Screen shake
      this.screenShakeUntil = now + GAME_CONFIG.hitResponse.shakeMs;
      this.screenShakeIntensity = GAME_CONFIG.hitResponse.shakeIntensity;

      // Explosion at player
      this.addExplosion(
        this.player.x + this.player.width / 2,
        this.player.y + this.player.height / 2,
        10, '#FF0000'
      );

      if (this.player.lives <= 0) {
        this.state = GAME_CONFIG.states.GAME_OVER;
      }
    }
  }

  // --- PARTICLES ---
  addExplosion(cx, cy, count, baseColor) {
    const modeColors = {
      kids: ['#FF6B6B', '#FFD700', '#4ECDC4', '#FF69B4', '#98FB98'],
      normal: ['#FFD700', '#FF8C00', '#FF6347', '#FFA500'],
      hardcore: ['#FF0000', '#8B0000', '#DC143C', '#4A0000', '#FF4500'],
    };

    const colors = this.mode ? modeColors[this.mode] : [baseColor];

    for (let i = 0; i < count; i++) {
      if (this.particles.length >= GAME_CONFIG.particles.maxCount) break;

      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = 1 + Math.random() * 3;

      this.particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        decay: 0.015 + Math.random() * 0.02,
        size: 2 + Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)] || baseColor,
      });
    }
  }

  updateParticles() {
    this.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += GAME_CONFIG.particles.gravity;
      p.life -= p.decay;
    });
    this.particles = this.particles.filter(p => p.life > 0);
  }

  // --- SCORE POPUPS ---
  addScorePopup(x, y, points, label = '', displayText = null) {
    this.scorePopups.push({
      x,
      y,
      text: displayText || `+${points}`,
      label,
      life: 1.0,
      decay: 0.015,
    });
  }

  updateScorePopups() {
    this.scorePopups.forEach(p => {
      p.y -= 1;
      p.life -= p.decay;
    });
    this.scorePopups = this.scorePopups.filter(p => p.life > 0);
  }

  // --- POWERUP/MEDIPAK DROPS ---
  maybeDropMedipak(x, y) {
    const now = Date.now();
    if (this.medipaks.filter(m => m.active).length >= 1) return;
    if (now - this.lastMedipakDrop < 12000) return;
    if (this.player.energyPercent >= 100) return;
    if (Math.random() > 0.06) return;

    this.lastMedipakDrop = now;
    this.medipaks.push({
      id: Date.now(),
      x, y,
      width: 32, height: 32,
      active: true,
      spawnTime: now,
      floatOffset: 0
    });
  }

  healPlayer() {
    if (this.mode !== 'hardcore') return;
    this.player.energyPercent = Math.min(100, this.player.energyPercent + 20);
  }

  collides(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
  }

  maybeDropPowerup(x, y) {
    const dropChance = GAME_CONFIG.powerups.dropChance[this.mode];
    if (Math.random() > dropChance) return;

    const types = GAME_CONFIG.powerups.types[this.mode];
    const type = types[Math.floor(Math.random() * types.length)];

    this.powerups.push({
      x, y,
      width: 30, height: 30,
      type, color: '#FFD700',
      active: true
    });
  }

  activatePowerup(type) {
    this.activePowerup = type;
    this.powerupEndTime = Date.now() + GAME_CONFIG.powerups.duration;
  }

  checkPowerupExpiry() {
    if (this.activePowerup && Date.now() > this.powerupEndTime) {
      this.activePowerup = null;
      this.powerupEndTime = 0;
    }
  }

  // --- LEVEL COMPLETE ---
  checkLevelComplete() {
    const activeEnemies = this.enemies.filter(e => !e.destroyed);

    if (activeEnemies.length === 0) {
      if (this.boss && !this.boss.destroyed) return;

      const modeConfig = GAME_CONFIG.modes[this.mode];
      const needsBoss = this.mode === 'kids' ?
        (this.level > 1 && modeConfig.themes[this.level]?.boss) :
        modeConfig.bossEveryLevel;

      if (needsBoss && !this.boss) {
        this.spawnBoss();
        return;
      }

      // Calculate level-end bonuses
      this.calculateLevelBonuses();

      const maxLevel = GAME_CONFIG.modes[this.mode].levels;

      if (this.mode === 'hardcore' && this.level >= 10) {
        this.wave++;
        this.state = GAME_CONFIG.states.LEVEL_COMPLETE;
      } else if (this.level >= maxLevel) {
        this.state = GAME_CONFIG.states.VICTORY;
      } else {
        this.state = GAME_CONFIG.states.LEVEL_COMPLETE;
      }
    }
  }

  calculateLevelBonuses() {
    const now = Date.now();
    const levelTime = (now - this.levelStartTime) / 1000;

    // Speed bonus
    let speedMultiplier = 1.0;
    for (const threshold of GAME_CONFIG.scoring.speedBonusThresholds) {
      if (levelTime < threshold.maxSeconds) {
        speedMultiplier = threshold.multiplier;
        break;
      }
    }

    // Accuracy bonus
    const accuracy = this.shotsFired > 0 ? (this.shotsHit / this.shotsFired) * 100 : 0;
    let accuracyMultiplier = 1.0;
    if (accuracy > GAME_CONFIG.scoring.accuracyBonusThreshold) {
      accuracyMultiplier = GAME_CONFIG.scoring.accuracyMultiplier;
    }

    // Store for level complete screen
    this.lastLevelStats = {
      time: Math.floor(levelTime),
      speedMultiplier,
      accuracy: Math.floor(accuracy),
      accuracyMultiplier,
      maxCombo: this.maxComboThisGame,
    };

    // Apply bonuses
    if (speedMultiplier > 1.0 || accuracyMultiplier > 1.0) {
      const bonus = Math.floor(this.score * 0.1 * (speedMultiplier + accuracyMultiplier - 2));
      if (bonus > 0) {
        this.score += bonus;
      }
    }
  }

  nextLevel() {
    this.level++;
    this.shotsFired = 0;
    this.shotsHit = 0;
    this.comboCount = 0;
    this.lastKillTime = 0;
    this.initLevel();
    this.state = GAME_CONFIG.states.PLAYING;
  }

  // --- RENDER ---
  render() {
    const now = Date.now();
    const ctx = this.renderer.ctx;

    // Screen shake
    let shakeX = 0, shakeY = 0;
    if (now < this.screenShakeUntil) {
      shakeX = (Math.random() - 0.5) * this.screenShakeIntensity * 2;
      shakeY = (Math.random() - 0.5) * this.screenShakeIntensity * 2;
    }

    ctx.save();
    if (shakeX || shakeY) {
      ctx.translate(shakeX, shakeY);
    }

    this.renderer.clear();

    // 1. Background
    this.renderer.renderBackground(this.stars);

    // 2. Enemies
    this.enemies.forEach(enemy => {
      this.renderer.renderEnemy(enemy);
    });

    // 3. Enemy projectiles
    this.enemyProjectiles.forEach(proj => {
      this.renderer.renderProjectile(proj);
    });

    // 4. Boss
    if (this.boss) {
      this.renderer.renderBoss(this.boss);
    }

    // 4b. Bonus enemy
    if (this.bonusEnemy) {
      this.renderer.renderBonusEnemy(this.bonusEnemy);
    }

    // 5. Player (with invulnerability blink)
    if (this.player) {
      const isInvulnerable = now < this.invulnerableUntil;
      const shouldBlink = isInvulnerable && Math.floor(now / GAME_CONFIG.hitResponse.blinkIntervalMs) % 2 === 0;
      if (!shouldBlink) {
        this.renderer.renderPlayer(this.player);
      } else {
        // Render with reduced opacity
        ctx.globalAlpha = 0.3;
        this.renderer.renderPlayer(this.player);
        ctx.globalAlpha = 1.0;
      }
    }

    // 6. Player projectiles
    this.playerProjectiles.forEach(proj => {
      this.renderer.renderProjectile(proj);
    });

    // 7. Power-ups
    this.powerups.forEach(powerup => {
      this.renderer.renderPowerUp(powerup);
    });

    // 7b. Medipaks (Hardcore)
    if (this.mode === 'hardcore') {
      this.medipaks.forEach(medipak => {
        this.renderer.renderMedipak(medipak);
      });
    }

    // 8. Particles
    this.renderer.renderParticles(this.particles);

    // 9. Score popups
    this.renderer.renderScorePopups(this.scorePopups);

    // 10. UI/HUD
    if (this.state === GAME_CONFIG.states.PLAYING && this.player) {
      const powerupTimer = this.powerupEndTime > now ? this.powerupEndTime - now : 0;
      const powerupLabel = this.activePowerup ? (GAME_CONFIG.powerupEffects[this.activePowerup]?.label || this.activePowerup) : null;

      if (this.mode === 'hardcore') {
        this.renderer.renderHardcoreHUD(
          this.score,
          this.player.energyPercent,
          this.level,
          this.wave,
          powerupTimer,
          powerupLabel,
          this.comboCount,
          this.comboMultiplier
        );
      } else {
        this.renderer.renderHUD(
          this.score,
          this.player.lives,
          this.level,
          this.mode,
          powerupTimer,
          powerupLabel,
          this.comboCount,
          this.comboMultiplier
        );
      }
    }

    ctx.restore();

    // Overlay screens (outside shake)
    if (this.state === GAME_CONFIG.states.PAUSED) {
      this.renderer.renderPause();
    } else if (this.state === GAME_CONFIG.states.GAME_OVER) {
      this.renderer.renderGameOver(this.score, false, this.lastLevelStats);
    } else if (this.state === GAME_CONFIG.states.VICTORY) {
      this.renderer.renderGameOver(this.score, true, this.lastLevelStats);
    } else if (this.state === GAME_CONFIG.states.LEVEL_COMPLETE) {
      this.renderer.renderLevelComplete(this.level, this.score, this.lastLevelStats);
    }
  }

  // --- CONTROLS ---
  togglePause() {
    if (this.state === GAME_CONFIG.states.PLAYING) {
      this.state = GAME_CONFIG.states.PAUSED;
    } else if (this.state === GAME_CONFIG.states.PAUSED) {
      this.state = GAME_CONFIG.states.PLAYING;
      this.lastTime = 0;
    }
  }

  setKey(key, pressed) {
    this.keys[key] = pressed;
  }

  handleSpace() {
    if (this.state === GAME_CONFIG.states.LEVEL_COMPLETE) {
      this.nextLevel();
    } else if (this.state === GAME_CONFIG.states.GAME_OVER ||
               this.state === GAME_CONFIG.states.VICTORY) {
      return 'menu';
    }
    return null;
  }

  // Get game result for highscore
  getGameResult() {
    const accuracy = this.shotsFired > 0 ? Math.floor((this.shotsHit / this.shotsFired) * 100) : 0;
    return {
      score: this.score,
      level: this.level,
      wave: this.wave,
      mode: this.mode,
      victory: this.state === GAME_CONFIG.states.VICTORY,
      accuracy,
      speedBonus: Math.floor((this.lastLevelStats?.speedMultiplier || 1) * 100),
      maxCombo: this.maxComboThisGame,
    };
  }
}
