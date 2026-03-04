// BOOST INVADERS - BESTENLISTE
// Supabase-persistent mit localStorage-Fallback

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Crown, ArrowLeft, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const STORAGE_KEY = 'boostInvadersHighscores';
const SUPABASE_URL = 'https://fmdxacmweuuzhjbnzktp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtZHhhY213ZXV1emhqYm56a3RwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3OTQ2MjYsImV4cCI6MjA4MDM3MDYyNn0.meRcL1wRqMbOu9qpIzMPCA0dLxsobmgYqn0NYLdqaO0';

// --- VALIDATION ---
const NAME_REGEX = /^[a-zA-Z0-9\s\-_äöüÄÖÜß]+$/;
const VALID_MODES = ['kids', 'normal', 'hardcore'];

function validateName(name) {
  if (typeof name !== 'string') return false;
  const trimmed = name.trim();
  return trimmed.length >= 1 && trimmed.length <= 20 && NAME_REGEX.test(trimmed);
}

function validateScoreEntry(entry) {
  if (!entry || typeof entry !== 'object') return false;
  if (!validateName(entry.name || entry.player_name)) return false;
  if (!Number.isInteger(entry.score) || entry.score < 0 || entry.score > 9999999) return false;
  if (!Number.isInteger(entry.level) || entry.level < 1 || entry.level > 999) return false;
  if (!VALID_MODES.includes(entry.mode)) return false;
  if (typeof entry.victory !== 'boolean') return false;
  return true;
}

// --- RATE LIMITING ---
let lastSaveTime = 0;
const MIN_SAVE_INTERVAL_MS = 2000;

// --- SUPABASE FUNCTIONS ---
async function fetchHighscoresFromSupabase(mode) {
  try {
    const url = `${SUPABASE_URL}/rest/v1/game_highscores?mode=eq.${encodeURIComponent(mode)}&order=score.desc&limit=10&select=player_name,score,level,mode,victory,accuracy_percent,speed_bonus_percent,max_combo,played_at`;
    const response = await fetch(url, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.map(row => ({
      name: row.player_name,
      score: row.score,
      level: row.level,
      mode: row.mode,
      victory: row.victory,
      accuracy: row.accuracy_percent || 0,
      speedBonus: row.speed_bonus_percent || 0,
      maxCombo: row.max_combo || 0,
      date: row.played_at,
    }));
  } catch (err) {
    console.warn('Supabase fetch failed, using localStorage:', err);
    return null;
  }
}

async function saveHighscoreToSupabase(data) {
  try {
    const url = `${SUPABASE_URL}/functions/v1/save-game-score`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`HTTP ${response.status}: ${errBody}`);
    }
    return await response.json();
  } catch (err) {
    console.warn('Supabase save failed, falling back to localStorage:', err);
    return null;
  }
}

// --- LOCALSTORAGE FALLBACK ---
function loadLocalHighscores() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return { kids: [], normal: [], hardcore: [] };
    const parsed = JSON.parse(data);
    if (!parsed || typeof parsed !== 'object') {
      return { kids: [], normal: [], hardcore: [] };
    }
    const result = { kids: [], normal: [], hardcore: [] };
    for (const mode of VALID_MODES) {
      const entries = Array.isArray(parsed[mode]) ? parsed[mode] : [];
      result[mode] = entries.filter(e => validateScoreEntry({ ...e, mode }));
    }
    return result;
  } catch (error) {
    console.warn('Fehler beim Laden der Highscores:', error);
    return { kids: [], normal: [], hardcore: [] };
  }
}

function saveLocalHighscore(mode, name, score, level, victory, accuracy, speedBonus, maxCombo) {
  try {
    const data = loadLocalHighscores();
    const entry = {
      name: name.substring(0, 20),
      score,
      level,
      victory,
      accuracy: accuracy || 0,
      speedBonus: speedBonus || 0,
      maxCombo: maxCombo || 0,
      date: new Date().toISOString()
    };

    data[mode] = [...data[mode], entry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.warn('Fehler beim Speichern des Highscores:', error);
    return false;
  }
}

// --- PUBLIC API ---
export async function loadHighscores() {
  const localData = loadLocalHighscores();

  // Try Supabase for each mode in parallel
  const [kids, normal, hardcore] = await Promise.all(
    VALID_MODES.map(mode => fetchHighscoresFromSupabase(mode))
  );

  return {
    kids: kids || localData.kids,
    normal: normal || localData.normal,
    hardcore: hardcore || localData.hardcore,
  };
}

// Synchronous version for quick access
export function loadHighscoresSync() {
  return loadLocalHighscores();
}

export async function saveHighscore(mode, name, score, level, victory, accuracy, speedBonus, maxCombo) {
  // Rate limit
  const now = Date.now();
  if (now - lastSaveTime < MIN_SAVE_INTERVAL_MS) {
    console.warn('Rate limited: too fast between saves');
    return false;
  }
  lastSaveTime = now;

  // Validate
  if (!validateName(name)) {
    console.warn('Invalid name rejected');
    return false;
  }
  if (!VALID_MODES.includes(mode)) return false;
  if (!Number.isInteger(score) || score < 0 || score > 9999999) return false;
  if (!Number.isInteger(level) || level < 1 || level > 999) return false;
  if (typeof victory !== 'boolean') return false;

  const cleanName = name.trim().substring(0, 20);

  // Save to localStorage as fallback
  saveLocalHighscore(mode, cleanName, score, level, victory, accuracy, speedBonus, maxCombo);

  // Try Supabase
  await saveHighscoreToSupabase({
    name: cleanName,
    score,
    level,
    mode,
    victory,
    accuracy: accuracy || 0,
    speedBonus: speedBonus || 0,
    maxCombo: maxCombo || 0,
  });

  return true;
}

export function getTopScore(mode) {
  const data = loadLocalHighscores();
  return data[mode]?.[0]?.score || 0;
}

// --- LEADERBOARD COMPONENT ---
export default function Leaderboard({ onBack, initialMode = 'normal' }) {
  const [highscores, setHighscores] = useState({ kids: [], normal: [], hardcore: [] });
  const [activeMode, setActiveMode] = useState(initialMode);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    loadHighscores().then(data => {
      setHighscores(data);
      setLoading(false);
    });
  }, []);

  const clearScores = (mode) => {
    if (window.confirm(`Alle ${mode.toUpperCase()} Highscores loeschen?`)) {
      const data = loadLocalHighscores();
      data[mode] = [];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setHighscores(prev => ({ ...prev, [mode]: [] }));
    }
  };

  const getRankIcon = (index) => {
    switch (index) {
      case 0:
        return <Crown className="w-6 h-6 text-yellow-400" />;
      case 1:
        return <Medal className="w-6 h-6 text-gray-300" />;
      case 2:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-gray-500 font-bold">{index + 1}</span>;
    }
  };

  const modeColors = {
    kids: 'from-pink-500 to-yellow-400',
    normal: 'from-blue-500 to-green-400',
    hardcore: 'from-red-600 to-purple-600'
  };

  return (
    <div className="min-h-screen bg-[#0a0a1a] p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={onBack}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Zurueck
          </Button>
          <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-400" />
            Bestenliste
          </h1>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
            <span className="ml-3 text-gray-400">Lade Bestenliste...</span>
          </div>
        ) : (
          <Tabs value={activeMode} onValueChange={setActiveMode} className="w-full">
            <TabsList className="grid grid-cols-3 bg-gray-800 mb-6">
              <TabsTrigger value="kids" className="data-[state=active]:bg-pink-500">
                Kinder
              </TabsTrigger>
              <TabsTrigger value="normal" className="data-[state=active]:bg-blue-500">
                Normal
              </TabsTrigger>
              <TabsTrigger value="hardcore" className="data-[state=active]:bg-red-600">
                Hardcore
              </TabsTrigger>
            </TabsList>

            {VALID_MODES.map(mode => (
              <TabsContent key={mode} value={mode}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-2xl bg-gradient-to-br ${modeColors[mode]} p-0.5`}
                >
                  <div className="bg-gray-900 rounded-2xl p-4 md:p-6">
                    {highscores[mode].length === 0 ? (
                      <div className="text-center py-12 text-gray-400">
                        <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Noch keine Highscores vorhanden.</p>
                        <p className="text-sm mt-2">Spiele diesen Modus, um der Erste zu sein!</p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-3">
                          {highscores[mode].map((entry, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className={`
                                flex items-center gap-4 p-4 rounded-xl
                                ${index === 0 ? 'bg-yellow-400/10 border border-yellow-400/30' : 'bg-gray-800/50'}
                              `}
                            >
                              <div className="flex-shrink-0">
                                {getRankIcon(index)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-white truncate">{entry.name}</p>
                                <p className="text-sm text-gray-400">
                                  Level {entry.level} {entry.victory && ' Sieg!'}
                                  {entry.maxCombo > 0 && ` | x${entry.maxCombo} Combo`}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className={`font-bold text-xl ${index === 0 ? 'text-yellow-400' : 'text-white'}`}>
                                  {entry.score.toLocaleString()}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(entry.date).toLocaleDateString('de-DE')}
                                </p>
                              </div>
                            </motion.div>
                          ))}
                        </div>

                        <div className="mt-6 flex justify-end">
                          <Button
                            variant="ghost"
                            onClick={() => clearScores(mode)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Loeschen
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </div>
  );
}

// --- HIGHSCORE INPUT DIALOG ---
export function HighscoreInput({ score, level, mode, victory, accuracy, speedBonus, maxCombo, onSave, onSkip }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    if (val.trim() && !validateName(val.trim())) {
      setError('Nur Buchstaben, Zahlen, Leerzeichen und Bindestriche erlaubt');
    } else {
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    if (!validateName(trimmed)) {
      setError('Ungueltiger Name');
      return;
    }

    setSaving(true);
    await saveHighscore(mode, trimmed, score, level, victory, accuracy || 0, speedBonus || 0, maxCombo || 0);
    setSaving(false);
    onSave();
  };

  const modeNames = {
    kids: 'Kindermodus',
    normal: 'Normalmodus',
    hardcore: 'Hardcoremodus'
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.8, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-gray-900 rounded-2xl p-8 max-w-md w-full border-2 border-purple-500"
      >
        <div className="text-center mb-6">
          {victory ? (
            <>
              <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-yellow-400">SIEG!</h2>
            </>
          ) : (
            <>
              <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-white">Gut gespielt!</h2>
            </>
          )}
          <p className="text-gray-400 mt-2">{modeNames[mode]}</p>
        </div>

        <div className="bg-gray-800 rounded-xl p-4 mb-6">
          <div className="text-center mb-3">
            <p className="text-gray-400 text-sm">Dein Ergebnis</p>
            <p className="text-4xl font-bold text-white">{score.toLocaleString()}</p>
            <p className="text-gray-400 text-sm mt-1">Level {level}</p>
          </div>
          {/* Score breakdown */}
          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-700">
            {accuracy > 0 && (
              <div className="text-center">
                <p className="text-xs text-gray-500">Trefferquote</p>
                <p className="text-sm font-bold text-green-400">{accuracy}%</p>
              </div>
            )}
            {speedBonus > 0 && (
              <div className="text-center">
                <p className="text-xs text-gray-500">Speed-Bonus</p>
                <p className="text-sm font-bold text-blue-400">x{(speedBonus / 100).toFixed(1)}</p>
              </div>
            )}
            {maxCombo > 0 && (
              <div className="text-center">
                <p className="text-xs text-gray-500">Max Combo</p>
                <p className="text-sm font-bold text-orange-400">x{maxCombo}</p>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-400 text-sm mb-2">
              Dein Name fuer die Bestenliste:
            </label>
            <Input
              type="text"
              value={name}
              onChange={handleNameChange}
              placeholder="Vorname oder Alias"
              maxLength={20}
              className="bg-gray-800 border-gray-600 text-white"
              autoFocus
            />
            {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={onSkip}
              className="flex-1 text-gray-400"
              disabled={saving}
            >
              Ueberspringen
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || !!error || saving}
              className="flex-1 bg-purple-600 hover:bg-purple-500"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Speichern
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
