// BOOST INVADERS - GAME CONFIGURATION
// Datengetriebenes Schwierigkeitssystem - KEINE HARDCODED WERTE

export const GAME_CONFIG = {
  canvas: {
    width: 800,
    height: 600,
    backgroundColor: '#0a0a1a'
  },

  global: {
    doScale: ["enemyMoveSpeed", "enemyFireIntervalMs", "enemyProjectileSpeed"],
    doNotScale: ["playerMoveSpeed", "hitboxTolerance", "reactionWindowMs"],
    visibility: {
      minEnemySizePx: 32,
      opacityMustBe: 1.0,
      fallbackRect: {
        enabled: true,
        sizePx: 32,
        colors: ["#FF00FF", "#00FF00"]
      }
    }
  },

  player: {
    width: 48,
    height: 32,
    speed: 5,
    color: '#00FFFF',
    lives: 3,
    fireRate: 250,
    projectileSpeed: 8,
    projectileColor: '#FFFF00',
    projectileWidth: 4,
    projectileHeight: 12
  },

  renderOrder: [
    'background',
    'enemies',
    'enemyProjectiles',
    'player',
    'playerProjectiles',
    'powerups',
    'particles',
    'ui'
  ],

  // Modi-Konfiguration
  modes: {
    kids: {
      name: "Kindermodus",
      description: "Lustig, bunt und einfach! Perfekt fuer kleine Spieler.",
      levels: 3,
      difficultyPercentByLevel: [0, 10, 20],
      caps: {
        maxActiveEnemyProjectiles: [2, 3, 4],
        maxSimultaneousShooters: [1, 1, 2]
      },
      enemyBaseSpeed: 0.3,
      enemyBaseFireInterval: 3000,
      enemyProjectileBaseSpeed: 1.5,
      playerLives: 5,
      enemyRows: 3,
      enemyCols: 6,
      themes: {
        1: {
          name: "Smiley-Kugeln",
          enemyTypes: ["smiley", "heart", "rainbow", "butterfly"],
          projectileType: "banana",
          colors: ["#FFD700", "#FF6B6B", "#4ECDC4", "#95E1D3"],
          boss: null
        },
        2: {
          name: "Schneemaenner",
          enemyTypes: ["snowman", "penguin", "iceCreature"],
          projectileType: "snowball",
          colors: ["#FFFFFF", "#B8E0F7", "#87CEEB"],
          boss: {
            name: "Boeser Schneemann",
            width: 96,
            height: 96,
            health: 10,
            color: "#8B4513",
            eyeColor: "#FF0000"
          }
        },
        3: {
          name: "Lustige Monster",
          enemyTypes: ["funnyMonster", "blob", "cyclops"],
          projectileType: "star",
          colors: ["#9B59B6", "#3498DB", "#2ECC71", "#F39C12"],
          boss: {
            name: "Boeser Papa mit Laptop",
            width: 80,
            height: 80,
            health: 15,
            color: "#2C3E50",
            projectileType: "laptop"
          }
        }
      }
    },

    normal: {
      name: "Normalmodus",
      description: "Klassisches Space Invaders. 10 Level mit steigender Herausforderung.",
      levels: 10,
      difficultyPercentByLevel: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50],
      caps: {
        maxActiveEnemyProjectiles: [3, 3, 4, 4, 5, 5, 6, 6, 7, 7],
        maxSimultaneousShooters: [1, 1, 1, 2, 2, 2, 3, 3, 3, 3]
      },
      enemyBaseSpeed: 0.5,
      enemyBaseFireInterval: 2000,
      enemyProjectileBaseSpeed: 2.5,
      playerLives: 3,
      enemyRows: 4,
      enemyCols: 8,
      enemyTypes: ["alien", "reptile", "spider", "jellyfish", "mech", "squid", "beetle", "moth", "crystal", "worm"],
      projectileTypes: ["laser", "slowRocket"],
      colors: {
        enemies: ["#4CAF50", "#8BC34A", "#CDDC39", "#FF9800"],
        projectiles: ["#FF5722", "#F44336"]
      },
      bossEveryLevel: true
    },

    hardcore: {
      name: "Hardcoremodus",
      description: "Fuer Profis! Duester, schnell und gnadenlos - aber gewinnbar.",
      levels: 10,
      difficultyPercentByLevel: [50, 55, 60, 65, 70, 75, 80, 85, 90, 95],
      caps: {
        maxActiveEnemyProjectiles: [6, 6, 7, 7, 8, 8, 9, 9, 10, 10],
        maxSimultaneousShooters: [2, 2, 3, 3, 3, 4, 4, 4, 5, 5]
      },
      enemyBaseSpeed: 1.0,
      enemyBaseFireInterval: 1200,
      enemyProjectileBaseSpeed: 4.0,
      playerLives: 3,
      enemyRows: 5,
      enemyCols: 10,
      enemyTypes: ["darkMonster", "demon", "skull", "wraith", "hellhound", "eyeball", "golem", "banshee", "spiderQueen", "reaper"],
      projectileTypes: ["fastRocket", "multiShot", "splitProjectile"],
      colors: {
        enemies: ["#8B0000", "#4A0000", "#2D0A0A", "#6B2D5B"],
        projectiles: ["#FF0000", "#FF4500", "#DC143C"]
      },
      antiBulletHell: {
        mustKeepDodgeLanes: true,
        minSafeGapPx: 42,
        noSpawnOnPlayerX: true
      },
      bossEveryLevel: true
    }
  },

  // Bonuswaffen — jeder Typ hat definierte Effekte
  powerups: {
    duration: 5000,
    dropChance: {
      kids: 0.12,
      normal: 0.08,
      hardcore: 0.05
    },
    types: {
      kids: ["fruitBlaster", "starShower", "confetti"],
      normal: ["rocket", "doubleFire", "rapidFire", "grenade", "machineGun"],
      hardcore: ["rocket", "doubleFire", "rapidFire", "grenade", "machineGun"]
    }
  },

  // Data-driven powerup effects
  powerupEffects: {
    rapidFire:    { fireRate: 100, projectiles: 1, spread: 0,    pierce: false, aoe: 0,  damage: 1, label: "Schnellfeuer" },
    machineGun:   { fireRate: 80,  projectiles: 1, spread: 0.05, pierce: false, aoe: 0,  damage: 1, label: "MG" },
    doubleFire:   { fireRate: 250, projectiles: 2, spread: 0,    pierce: false, aoe: 0,  damage: 1, label: "Doppelschuss" },
    rocket:       { fireRate: 800, projectiles: 1, spread: 0,    pierce: true,  aoe: 0,  damage: 3, label: "Rakete" },
    grenade:      { fireRate: 1000,projectiles: 1, spread: 0,    pierce: false, aoe: 60, damage: 2, label: "Granate" },
    fruitBlaster: { fireRate: 150, projectiles: 3, spread: 0.15, pierce: false, aoe: 0,  damage: 1, label: "Fruchtkanone" },
    starShower:   { fireRate: 80,  projectiles: 1, spread: 0.05, pierce: false, aoe: 0,  damage: 1, label: "Sternregen" },
    confetti:     { fireRate: 60,  projectiles: 5, spread: 0.2,  pierce: false, aoe: 0,  damage: 1, label: "Konfetti" },
  },

  // Scoring system
  scoring: {
    comboWindow: 1500,       // ms between kills for combo
    comboMultipliers: [1, 1, 1.5, 1.5, 2, 2.5, 3, 3, 5], // index = killCount, value = multiplier
    speedBonusThresholds: [  // seconds for level completion
      { maxSeconds: 30, multiplier: 2.0 },
      { maxSeconds: 60, multiplier: 1.5 },
      { maxSeconds: 90, multiplier: 1.2 },
    ],
    accuracyBonusThreshold: 80, // >80% accuracy = x1.3
    accuracyMultiplier: 1.3,
    powerupCollectBonus: 50,
    bossKillBase: 500,
  },

  // Bonus enemies (UFOs)
  bonusEnemy: {
    spawnInterval: { kids: 25000, normal: 18000, hardcore: 12000 },
    spawnChance: 0.6,
    speed: { kids: 2, normal: 3, hardcore: 4.5 },
    health: { kids: 1, normal: 2, hardcore: 3 },
    points: { kids: 100, normal: 200, hardcore: 300 },
    types: {
      kids: ["ufo_rainbow"],
      normal: ["ufo_silver", "ufo_gold"],
      hardcore: ["ufo_blood", "ufo_void"],
    }
  },

  // Hit response (Kids/Normal only)
  hitResponse: {
    invulnerabilityMs: 1500,
    freezeMs: 300,
    shakeMs: 500,
    shakeIntensity: 8,
    blinkIntervalMs: 100,
  },

  // Particle system limits
  particles: {
    maxCount: 200,
    enemyDeathCount: 15,
    bossDeathCount: 35,
    gravity: 0.05,
  },

  states: {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'gameOver',
    LEVEL_COMPLETE: 'levelComplete',
    VICTORY: 'victory'
  }
};

// Schwierigkeits-Skalierungsfunktion
export function scaleDifficulty(baseValue, difficultyPercent, isSpeed = true) {
  const multiplier = 1 + (difficultyPercent / 100);
  return isSpeed ? baseValue * multiplier : baseValue / multiplier;
}

// Validierung
export function getConfigValue(path, config = GAME_CONFIG) {
  const keys = path.split('.');
  let value = config;

  for (const key of keys) {
    if (value === undefined || value === null) {
      throw new Error(`STOP: Config-Wert fehlt: ${path}`);
    }
    value = value[key];
  }

  if (value === undefined || value === null) {
    throw new Error(`STOP: Config-Wert fehlt: ${path}`);
  }

  return value;
}
