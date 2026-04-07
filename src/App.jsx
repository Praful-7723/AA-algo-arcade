import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Share2, ChevronRight, Activity, Flame, Settings2, RotateCcw, BrainCircuit, Flag, MousePointer2, Trophy, Timer, ChevronUp, ChevronDown, ChevronLeft } from 'lucide-react';
import GithubButton from './components/ui/demo';
import { SketchyToggle } from './components/SketchyToggle';
import { PremiumLoader } from './components/ui/PremiumLoader';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import './index.css';

const APP_NAME = 'ALGO ARCADE';
const MotionSpan = motion.span;
const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const normalizeRoomCode = (value) => value.replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 6);

const generateRoomCode = () => Array.from({ length: 6 }, () => (
  ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)]
)).join('');

const getOrCreatePlayerId = () => {
  const storageKey = 'algo-arcade-player-id';
  const existing = window.localStorage.getItem(storageKey);
  if (existing) return existing;
  const id = `player-${crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)}`;
  window.localStorage.setItem(storageKey, id);
  return id;
};

const getOrCreatePlayerLabel = () => {
  const storageKey = 'algo-arcade-player-label';
  const existing = window.localStorage.getItem(storageKey);
  if (existing) return existing;
  const label = `Player ${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
  window.localStorage.setItem(storageKey, label);
  return label;
};

const sanitizePlayerName = (value) => {
  const trimmed = value.trim().replace(/\s+/g, ' ');
  return trimmed.slice(0, 16) || getOrCreatePlayerLabel();
};

const summarizeResults = (players, results) => players
  .filter((player) => player.active || results.some((result) => result.player_id === player.player_id))
  .map((player) => {
    const playerResults = results.filter((result) => result.player_id === player.player_id);
    const totals = playerResults.reduce((acc, result) => ({
      sectors: acc.sectors + 1,
      timeMs: acc.timeMs + result.time_ms,
      faults: acc.faults + result.faults,
      pathLength: acc.pathLength + result.path_length,
    }), { sectors: 0, timeMs: 0, faults: 0, pathLength: 0 });
    return { ...player, ...totals };
  })
  .sort((a, b) => b.sectors - a.sectors || a.timeMs - b.timeMs || a.faults - b.faults || a.pathLength - b.pathLength);

const joinNames = (names) => {
  if (names.length === 0) return 'the room';
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;
};

function LiquidChromeFilters() {
  return (
    <svg aria-hidden="true" className="liquid-filter-stage" focusable="false">
      <defs>
        <filter id="algo-liquid-metal">
          <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="3" result="noise" seed="7">
            <animate attributeName="baseFrequency" dur="9s" values="0.012;0.024;0.012" repeatCount="indefinite" />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="14" />
        </filter>
      </defs>
    </svg>
  );
}

function ChromeText({ children, className = '' }) {
  return (
    <span className={`chrome-text ${className}`}>
      <span className="chrome-text__depth" aria-hidden="true">{children}</span>
      <span className="chrome-text__rim" aria-hidden="true">{children}</span>
      <span className="chrome-text__liquid" aria-hidden="true">{children}</span>
      <span className="chrome-text__sharp">{children}</span>
      <MotionSpan
        className="chrome-text__shine"
        aria-hidden="true"
        animate={{ backgroundPosition: ['180% 0', '-180% 0'] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'linear' }}
      >
        {children}
      </MotionSpan>
    </span>
  );
}

function AlgoArcadeLogo({ compact = false }) {
  const idSuffix = compact ? 'small' : 'large';
  const chromeId = `aa-chrome-${idSuffix}`;
  const accentId = `aa-accent-${idSuffix}`;
  const glowId = `aa-glow-${idSuffix}`;

  return (
    <svg
      className={compact ? 'aa-logo aa-logo--small' : 'aa-logo'}
      viewBox="0 0 112 112"
      role="img"
      aria-label="Algo Arcade AA logo"
    >
      <defs>
        <linearGradient id={chromeId} x1="22" y1="18" x2="92" y2="96" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.16" stopColor="#aeb8bf" />
          <stop offset="0.32" stopColor="#f9fbfc" />
          <stop offset="0.52" stopColor="#707a82" />
          <stop offset="0.72" stopColor="#dfe5e9" />
          <stop offset="1" stopColor="#ffffff" />
        </linearGradient>
        <linearGradient id={accentId} x1="22" y1="70" x2="90" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#6cc800" />
          <stop offset="0.5" stopColor="#a2fc2b" />
          <stop offset="1" stopColor="#fffd7a" />
        </linearGradient>
        <filter id={glowId} x="-35%" y="-35%" width="170%" height="170%">
          <feGaussianBlur stdDeviation="2.4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g>
        <path
          d="M15 89C24 62 32 39 43 18C54 39 62 62 71 89"
          stroke="#101210"
          strokeWidth="17"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M41 89C50 62 58 39 69 18C80 39 88 62 97 89"
          stroke="#101210"
          strokeWidth="17"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M15 89C24 62 32 39 43 18C54 39 62 62 71 89"
          stroke={`url(#${chromeId})`}
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M41 89C50 62 58 39 69 18C80 39 88 62 97 89"
          stroke={`url(#${chromeId})`}
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M29 64C38 56 48 56 56 64C64 72 75 72 86 64"
          stroke="#101210"
          strokeWidth="11"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M29 64C38 56 48 56 56 64C64 72 75 72 86 64"
          stroke={`url(#${accentId})`}
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
          filter={`url(#${glowId})`}
        />
        <path d="M24 31C30 24 35 19 43 14" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity="0.58" />
        <path d="M76 28C81 36 85 47 90 61" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity="0.36" />
        <circle cx="29" cy="64" r="5" fill="#a2fc2b" stroke="#101210" strokeWidth="1.8" />
        <circle cx="56" cy="64" r="5" fill="#fffd7a" stroke="#101210" strokeWidth="1.8" />
        <circle cx="86" cy="64" r="5" fill="#a2fc2b" stroke="#101210" strokeWidth="1.8" />
      </g>
    </svg>
  );
}

// --- AUDIO ENGINE ---
const AudioEngine = (() => {
  let audioCtx = null;
  const init = () => {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  };

  const playTone = (freq, type, duration, vol=0.1) => {
    if (!audioCtx) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(vol, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch {
      return;
    }
  };

  return {
    init,
    tap: () => playTone(800, 'sine', 0.1, 0.05),
    wrong: () => playTone(150, 'sawtooth', 0.3, 0.1),
    win: () => {
      [400, 500, 600, 800].forEach((f, i) => {
        setTimeout(() => playTone(f, 'square', 0.15, 0.05), i * 100);
      });
    },
    aiTick: (type) => {
      const baseFreq = type === 'A*' ? 1000 : type === 'BFS' ? 600 : 400;
      playTone(baseFreq + Math.random()*200, 'sine', 0.05, 0.02);
    }
  };
})();

// --- SEEDED RANDOM GENERATOR ---
const cyrb128 = (str) => {
    let h1 = 1779033703, h2 = 3144134277, h3 = 1013904242, h4 = 2773480762;
    for (let i = 0, k; i < str.length; i++) {
        k = str.charCodeAt(i);
        h1 = h2 ^ Math.imul(h1 ^ k, 597399067); h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
        h3 = h4 ^ Math.imul(h3 ^ k, 951274213); h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067); h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213); h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
    return (h1^h2^h3^h4)>>>0;
}
const mulberry32 = (a) => {
    return function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}
let randomFn = Math.random; 
const setMazeSeed = (seedStr) => {
   const val = cyrb128(seedStr + "NeuralSalt");
   randomFn = mulberry32(val);
};
const generateRandomSeed = () => Math.random().toString(36).substring(2, 6).toUpperCase();

// --- LEVEL GENERATOR ---
const generateMaze = (size) => {
  const grid = Array.from({length: size}, () => Array(size).fill(1));
  const dirs = [[0, 2], [2, 0], [0, -2], [-2, 0]];
  
  const carve = (r, c) => {
    grid[r][c] = 0;
    const shuffled = dirs.sort(() => randomFn() - 0.5);
    for (let [dr, dc] of shuffled) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size && grid[nr][nc] === 1) {
        grid[r + dr/2][c + dc/2] = 0;
        carve(nr, nc);
      }
    }
  };
  carve(0, 0);
  grid[size-1][size-1] = 0; 
  if (size >= 3) {
      grid[size-2][size-1] = 0;
      grid[size-1][size-2] = 0;
  }
  return grid;
};

const STATIC_LEVELS = [
  {
    name: 'Sector 1', size: 5,
    maze: [ [0,0,1,0,0], [1,0,0,0,1], [0,0,1,0,0], [0,1,0,1,0], [0,0,0,0,0] ]
  },
  {
    name: 'Sector 2', size: 7,
    maze: [ [0,1,0,0,0,1,0], [0,1,0,1,0,0,0], [0,0,0,1,1,1,0], [1,1,0,0,0,0,0], [0,0,0,1,1,1,1], [0,1,0,0,0,0,0], [0,0,0,1,0,1,0] ]
  }
];

export default function App() {
  const [appState, setAppState] = useState('welcome'); 
  const [controlMode, setControlMode] = useState('tap');
  const [sessionSeed, setSessionSeed] = useState(generateRandomSeed());
  const [playerId] = useState(getOrCreatePlayerId);
  const [playerLabel] = useState(getOrCreatePlayerLabel);
  const [playerName, setPlayerName] = useState(playerLabel);
  
  const [levelIndex, setLevelIndex] = useState(0);
  const [levelData, setLevelData] = useState(STATIC_LEVELS[0]);
  
  const GRID_SIZE = levelData.size;
  const INITIAL_MAZE = levelData.maze;
  const START = { r: 0, c: 0 };
  const END = { r: GRID_SIZE - 1, c: GRID_SIZE - 1 };

  const [playerPosition, setPlayerPosition] = useState(START);
  const [path, setPath] = useState(['0-0']);
  const [wrongTries, setWrongTries] = useState(0);
  const [gameState, setGameState] = useState('playing'); 
  
  const [aiVisited, setAiVisited] = useState(new Map());
  const [aiPath, setAiPath] = useState([]);
  const [aiPreviewAlgo, setAiPreviewAlgo] = useState(null);
  const aiPreviewIntervalRef = useRef(null);
  
  // Heatmap State
  const [heatMap, setHeatMap] = useState({});
  const [aiHeatMap, setAiHeatMap] = useState({});
  const [heatmapMode, setHeatmapMode] = useState('human'); // 'human' or 'ai-dfs' or 'ai-bfs' or 'ai-astar'
  
  // Drag State
  const [isDragging, setIsDragging] = useState(false);
  const lastProcessedDrag = useRef(null);

  // Stats & Timers
  const [timeMs, setTimeMs] = useState(0);
  const [userTimeMs, setUserTimeMs] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [aiStats, setAiStats] = useState({ 
    dfs: { faults: 0, ops: 0, timeMs: 0 }, 
    bfs: { faults: 0, ops: 0, timeMs: 0 },
    astar: { faults: 0, ops: 0, timeMs: 0 }
  });
  const [challengeModalOpen, setChallengeModalOpen] = useState(false);
  const [challengeMode, setChallengeMode] = useState('sector');
  const [joinCode, setJoinCode] = useState('');
  const [friendRoom, setFriendRoom] = useState(null);
  const [friendResults, setFriendResults] = useState([]);
  const [friendPlayers, setFriendPlayers] = useState([]);
  const [challengeLoading, setChallengeLoading] = useState(false);
  const [challengeMessage, setChallengeMessage] = useState('');
  const [roomNotice, setRoomNotice] = useState(null);
  const [roomExitCountdown, setRoomExitCountdown] = useState(null);
  const [quitPromptOpen, setQuitPromptOpen] = useState(false);
  const [restartPromptOpen, setRestartPromptOpen] = useState(false);
  const [booting, setBooting] = useState(true);
  const closedRoomNoticeRef = useRef(null);
  const allowBrowserExitRef = useRef(false);
  const handleBackRef = useRef(null);
  
  // Use D-pad for large grids
  const useDpad = GRID_SIZE > 7;
  
  const isValid = (r, c) => r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE;
  const isWall = (r, c) => INITIAL_MAZE[r][c] === 1;

  // Global Mouse Up
  useEffect(() => {
    const stopDrag = () => setIsDragging(false);
    window.addEventListener('mouseup', stopDrag);
    window.addEventListener('touchend', stopDrag);
    return () => {
      window.removeEventListener('mouseup', stopDrag);
      window.removeEventListener('touchend', stopDrag);
    }
  }, []);

  // Timer Hook
  useEffect(() => {
    let interval;
    if (timerRunning) interval = setInterval(() => setTimeMs(t => t + 100), 100);
    return () => clearInterval(interval);
  }, [timerRunning]);

  useEffect(() => {
    const timeout = setTimeout(() => setBooting(false), 4000);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => () => {
    if (aiPreviewIntervalRef.current) clearInterval(aiPreviewIntervalRef.current);
  }, []);

  // Keyboard / D-pad movement
  const movePlayer = useCallback((dr, dc) => {
    if (gameState !== 'playing') return;
    const nr = playerPosition.r + dr;
    const nc = playerPosition.c + dc;
    if (!isValid(nr, nc)) return;
    handleCellClick(nr, nc);
  }, [playerPosition, gameState, GRID_SIZE, INITIAL_MAZE]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== 'playing') return;
      switch (e.key) {
        case 'ArrowUp': case 'w': case 'W': movePlayer(-1, 0); break;
        case 'ArrowDown': case 's': case 'S': movePlayer(1, 0); break;
        case 'ArrowLeft': case 'a': case 'A': movePlayer(0, -1); break;
        case 'ArrowRight': case 'd': case 'D': movePlayer(0, 1); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [movePlayer]);

  const fetchFriendResults = async (roomId) => {
    if (!supabase || !roomId) return;
    const { data, error } = await supabase
      .from('challenge_results')
      .select('*')
      .eq('room_id', roomId)
      .order('time_ms', { ascending: true })
      .order('faults', { ascending: true });
    if (error) {
      setChallengeMessage(error.message);
      return;
    }
    setFriendResults(data || []);
  };

  const fetchFriendPlayers = async (roomId) => {
    if (!supabase || !roomId) return;
    const { data, error } = await supabase
      .from('challenge_players')
      .select('*')
      .eq('room_id', roomId)
      .order('joined_at', { ascending: true });
    if (error) {
      setChallengeMessage(error.message);
      return;
    }
    setFriendPlayers(data || []);
  };

  const fetchFriendRoom = async (roomId) => {
    if (!supabase || !roomId) return;
    const { data, error } = await supabase
      .from('challenge_rooms')
      .select('*')
      .eq('id', roomId)
      .maybeSingle();
    if (error) {
      setChallengeMessage(error.message);
      return;
    }
    if (data) setFriendRoom(data);
  };

  useEffect(() => {
    if (!supabase || !friendRoom?.id) return undefined;
    console.log(`[Realtime] Initializing sync for room ${friendRoom.id}...`);
    fetchFriendResults(friendRoom.id);
    fetchFriendPlayers(friendRoom.id);
    fetchFriendRoom(friendRoom.id);
    
    const channel = supabase
      .channel(`room-${friendRoom.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'challenge_rooms',
          filter: `id=eq.${friendRoom.id}`,
        },
        () => {
          console.log('[Realtime] Room change detected');
          fetchFriendRoom(friendRoom.id);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'challenge_players',
          filter: `room_id=eq.${friendRoom.id}`,
        },
        () => {
          console.log('[Realtime] Players change detected');
          fetchFriendPlayers(friendRoom.id);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'challenge_results',
          filter: `room_id=eq.${friendRoom.id}`,
        },
        () => {
          console.log('[Realtime] Results change detected');
          fetchFriendResults(friendRoom.id);
        }
      )
      .subscribe((status, err) => {
        console.log(`[Realtime] Subscription status: ${status}`, err || '');
      });

    const syncInterval = setInterval(() => {
      fetchFriendRoom(friendRoom.id);
      fetchFriendPlayers(friendRoom.id);
      fetchFriendResults(friendRoom.id);
    }, 3500);

    return () => {
      console.log(`[Realtime] Tearing down sync for room ${friendRoom.id}...`);
      clearInterval(syncInterval);
      supabase.removeChannel(channel);
    };
  }, [friendRoom?.id]);

  const activateFriendRoom = (room) => {
    setFriendRoom(room);
    setFriendResults([]);
    setFriendPlayers([]);
    setRoomNotice(null);
    setRoomExitCountdown(null);
    closedRoomNoticeRef.current = null;
    setChallengeMessage(`${room.mode === 'global' ? 'Global run' : 'Sector challenge'} active.`);
  };

  const showRoomNotice = useCallback((title, body, tone = 'info') => {
    setRoomNotice({ title, body, tone });
  }, []);

  const clearFriendMode = useCallback((message = 'Back to solo mode.') => {
    setFriendRoom(null);
    setFriendResults([]);
    setFriendPlayers([]);
    setRoomNotice(null);
    setRoomExitCountdown(null);
    closedRoomNoticeRef.current = null;
    setChallengeModalOpen(false);
    setChallengeMessage(message);
  }, []);

  const forceQuitApp = useCallback(() => {
    allowBrowserExitRef.current = true;
    setQuitPromptOpen(false);
    window.close();
    setTimeout(() => {
      window.history.go(-2);
    }, 80);
  }, []);

  const savePlayerName = () => {
    const cleanName = sanitizePlayerName(playerName);
    window.localStorage.setItem('algo-arcade-player-label', cleanName);
    setPlayerName(cleanName);
    return cleanName;
  };

  const registerChallengePlayer = async (room, role, label) => {
    if (!supabase || !room?.id) return { error: new Error('Supabase is not configured.') };
    return supabase
      .from('challenge_players')
      .upsert({
        room_id: room.id,
        player_id: playerId,
        player_label: label,
        role,
        active: true,
      }, { onConflict: 'room_id,player_id' })
      .select()
      .single();
  };

  const createChallenge = async () => {
    if (!isSupabaseConfigured || !supabase) {
      setChallengeMessage('Supabase is not configured.');
      return;
    }
    const cleanName = savePlayerName();
    setChallengeLoading(true);
    setChallengeMessage('');
    for (let attempt = 0; attempt < 4; attempt++) {
      const roomCode = generateRoomCode();
      const { data, error } = await supabase
        .from('challenge_rooms')
        .insert({
          room_code: roomCode,
          mode: challengeMode,
          seed: sessionSeed,
          level_index: levelIndex,
          current_level_index: levelIndex,
          created_by_player_id: playerId,
          creator_label: cleanName,
          max_players: 4,
        })
        .select()
        .single();

      if (!error && data) {
        const { error: playerError } = await registerChallengePlayer(data, 'host', cleanName);
        if (playerError) {
          setChallengeMessage(playerError.message || 'Room created, but joining it failed.');
          setChallengeLoading(false);
          return;
        }
        activateFriendRoom(data);
        setJoinCode(data.room_code);
        setChallengeLoading(false);
        return;
      }

      if (error?.code !== '23505') {
        setChallengeMessage(error?.message || 'Could not create challenge.');
        setChallengeLoading(false);
        return;
      }
    }
    setChallengeMessage('Could not find a fresh room code. Try again.');
    setChallengeLoading(false);
  };

  const joinChallenge = async () => {
    if (!isSupabaseConfigured || !supabase) {
      setChallengeMessage('Supabase is not configured.');
      return;
    }
    const roomCode = normalizeRoomCode(joinCode);
    if (roomCode.length < 4) {
      setChallengeMessage('Enter a valid challenge code.');
      return;
    }
    const cleanName = savePlayerName();
    setChallengeLoading(true);
    setChallengeMessage('');
    const { data, error } = await supabase
      .from('challenge_rooms')
      .select('*')
      .eq('room_code', roomCode)
      .eq('status', 'open')
      .maybeSingle();

    if (error || !data) {
      setChallengeMessage(error?.message || 'No active challenge found for that code.');
      setChallengeLoading(false);
      return;
    }

    const { count, error: countError } = await supabase
      .from('challenge_players')
      .select('id', { count: 'exact', head: true })
      .eq('room_id', data.id)
      .eq('active', true);
    if (countError) {
      setChallengeMessage(countError.message);
      setChallengeLoading(false);
      return;
    }
    if ((count || 0) >= (data.max_players || 4)) {
      const { data: existingPlayer } = await supabase
        .from('challenge_players')
        .select('id')
        .eq('room_id', data.id)
        .eq('player_id', playerId)
        .maybeSingle();
      if (!existingPlayer) {
        setChallengeMessage('Room is full. Friend mode supports up to 4 players.');
        setChallengeLoading(false);
        return;
      }
    }

    const { error: playerError } = await registerChallengePlayer(data, 'guest', cleanName);
    if (playerError) {
      setChallengeMessage(playerError.message || 'Could not join the room.');
      setChallengeLoading(false);
      return;
    }

    const targetLevel = data.mode === 'global' ? data.current_level_index ?? data.level_index : data.level_index;
    setSessionSeed(data.seed);
    setLevelIndex(targetLevel);
    loadLevel(targetLevel, data.seed);
    resetMatch();
    activateFriendRoom(data);
    setChallengeModalOpen(false);
    setChallengeLoading(false);
  };

  const leaveChallenge = useCallback(async () => {
    const roomToClose = friendRoom;
    if (roomToClose?.status === 'closed') {
      clearFriendMode();
      return;
    }
    if (supabase && roomToClose?.created_by_player_id === playerId) {
      const { data, error } = await supabase
        .from('challenge_rooms')
        .update({ status: 'closed', closed_by_player_id: playerId, closed_reason: 'host_exit' })
        .eq('id', roomToClose.id)
        .select()
        .single();
      if (error) {
        setChallengeMessage(error.message);
        return;
      }
      setFriendRoom(data || { ...roomToClose, status: 'closed', closed_by_player_id: playerId, closed_reason: 'host_exit' });
      setChallengeModalOpen(false);
      showRoomNotice('Room Closed', 'Final results are locked. Returning to normal mode in 10 seconds.', 'closed');
      setChallengeMessage('Room closed. Final results are ready.');
    } else if (supabase && roomToClose?.id) {
      await supabase
        .from('challenge_players')
        .update({ active: false })
        .eq('room_id', roomToClose.id)
        .eq('player_id', playerId);
      clearFriendMode();
    }
  }, [clearFriendMode, friendRoom, playerId, showRoomNotice]);

  const closeAIPreview = useCallback(() => {
    if (aiPreviewIntervalRef.current) {
      clearInterval(aiPreviewIntervalRef.current);
      aiPreviewIntervalRef.current = null;
    }
    setTimerRunning(false);
    setAiPreviewAlgo(null);
    setAiVisited(new Map());
    setAiPath([]);
    setGameState('user-done');
  }, []);

  const handleAppBack = useCallback(() => {
    if (quitPromptOpen) {
      forceQuitApp();
      return;
    }

    if (challengeModalOpen) {
      setChallengeModalOpen(false);
      return;
    }

    if (roomNotice?.tone === 'waiting') {
      setRoomNotice(null);
      return;
    }

    if (gameState.includes('ai')) {
      closeAIPreview();
      return;
    }

    if (gameState === 'heatmap') {
      setGameState('user-done');
      return;
    }

    if (gameState === 'user-done') {
      setGameState('playing');
      return;
    }

    if (appState === 'game') {
      if (friendRoom?.status === 'open') {
        leaveChallenge();
      }
      setAppState('welcome');
      return;
    }

    setQuitPromptOpen(true);
  }, [appState, challengeModalOpen, closeAIPreview, forceQuitApp, friendRoom?.status, gameState, leaveChallenge, quitPromptOpen, roomNotice?.tone]);

  useEffect(() => {
    handleBackRef.current = handleAppBack;
  }, [handleAppBack]);

  useEffect(() => {
    window.history.replaceState({ algoArcade: true }, '', window.location.href);
    window.history.pushState({ algoArcade: true }, '', window.location.href);

    const handlePopState = () => {
      if (allowBrowserExitRef.current) return;
      handleBackRef.current?.();
      window.history.pushState({ algoArcade: true }, '', window.location.href);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const submitChallengeResult = async (finishedTimeMs) => {
    if (!supabase || !friendRoom) return;
    const cleanName = savePlayerName();
    await supabase
      .from('challenge_players')
      .update({ player_label: cleanName, active: true })
      .eq('room_id', friendRoom.id)
      .eq('player_id', playerId);
    const { error } = await supabase
      .from('challenge_results')
      .upsert({
        room_id: friendRoom.id,
        player_id: playerId,
        player_label: cleanName,
        level_index: levelIndex,
        time_ms: finishedTimeMs,
        faults: wrongTries,
        path_length: path.length,
        completed_at: new Date().toISOString(),
      }, { onConflict: 'room_id,player_id,level_index' });

    if (error) {
      setChallengeMessage(error.message);
      return;
    }
    setChallengeMessage('Result synced.');
  };

  const activeChallengePlayers = () => friendPlayers.filter((player) => player.active);

  const levelChallengeResults = (targetLevel = levelIndex) => friendResults
    .filter((result) => result.level_index === targetLevel)
    .sort((a, b) => a.time_ms - b.time_ms || a.faults - b.faults || a.path_length - b.path_length);

  const allPlayersFinishedLevel = (targetLevel = levelIndex) => {
    const activePlayers = activeChallengePlayers();
    const completedIds = new Set(levelChallengeResults(targetLevel).map((result) => result.player_id));
    return activePlayers.length > 1 && activePlayers.every((player) => completedIds.has(player.player_id));
  };

  const waitingPlayerNames = (targetLevel = levelIndex) => {
    const completedIds = new Set(levelChallengeResults(targetLevel).map((result) => result.player_id));
    return activeChallengePlayers()
      .filter((player) => !completedIds.has(player.player_id))
      .map((player) => player.player_id === playerId ? 'you' : player.player_label);
  };

  const closeCurrentRoom = async (reason) => {
    if (!supabase || !friendRoom?.id || friendRoom.status === 'closed') return;
    const { error } = await supabase
      .from('challenge_rooms')
      .update({ status: 'closed', closed_by_player_id: playerId, closed_reason: reason })
      .eq('id', friendRoom.id);
    if (error) setChallengeMessage(error.message);
  };

  useEffect(() => {
    if (!friendRoom || friendRoom.status !== 'closed') return;
    if (closedRoomNoticeRef.current === friendRoom.id) return;
    closedRoomNoticeRef.current = friendRoom.id;
    const hostClosed = friendRoom.closed_reason === 'host_exit';
    const isCreator = friendRoom.created_by_player_id === playerId;
    if (friendRoom.created_by_player_id === playerId) {
      setChallengeMessage(hostClosed ? 'Room closed.' : 'Room closed. Final results are ready.');
    } else {
      setChallengeMessage(hostClosed ? 'Room ended by the host. Final results are ready.' : 'Room ended. Final results are ready.');
    }
    showRoomNotice(
      isCreator ? 'Room Closed' : 'Room Ended',
      `${hostClosed && !isCreator ? 'The host closed the room.' : 'Final results are locked.'} Returning to normal mode in 10 seconds.`,
      'closed'
    );
    setRoomExitCountdown(10);
    setChallengeModalOpen(false);
  }, [friendRoom, gameState, playerId, showRoomNotice]);

  useEffect(() => {
    if (roomExitCountdown === null) return undefined;
    if (roomExitCountdown <= 0) {
      clearFriendMode('Normal algorithm mode restored.');
      return undefined;
    }
    const timeout = setTimeout(() => setRoomExitCountdown((value) => (
      value === null ? null : Math.max(0, value - 1)
    )), 1000);
    return () => clearTimeout(timeout);
  }, [clearFriendMode, roomExitCountdown]);

  useEffect(() => {
    if (!roomNotice || roomNotice.tone !== 'waiting') return undefined;
    const timeout = setTimeout(() => {
      setRoomNotice((notice) => notice?.tone === 'waiting' ? null : notice);
    }, 4200);
    return () => clearTimeout(timeout);
  }, [roomNotice]);

  useEffect(() => {
    if (!friendRoom || friendRoom.mode !== 'sector' || friendRoom.status !== 'open') return;
    if (friendRoom.created_by_player_id !== playerId) return;
    const activePlayersInRoom = friendPlayers.filter((player) => player.active);
    const completedIds = new Set(
      friendResults
        .filter((result) => result.level_index === friendRoom.level_index)
        .map((result) => result.player_id)
    );
    if (activePlayersInRoom.length <= 1 || !activePlayersInRoom.every((player) => completedIds.has(player.player_id))) return;
    supabase
      ?.from('challenge_rooms')
      .update({ status: 'closed', closed_by_player_id: playerId, closed_reason: 'sector_complete' })
      .eq('id', friendRoom.id)
      .then(({ error }) => {
        if (error) setChallengeMessage(error.message);
      });
  }, [friendRoom, friendPlayers, friendResults, playerId]);

  const loadLevel = useCallback((idx, seedOverride = sessionSeed) => {
    setMazeSeed(seedOverride + "_level_" + idx); 
    setHeatMap({});
    setAiHeatMap({});
    
    if (idx < STATIC_LEVELS.length) {
      setLevelData(STATIC_LEVELS[idx]);
    } else {
      const size = Math.min(13, 5 + (idx * 2)); 
      setLevelData({
        name: `Sector ${idx + 1}`,
        size: size,
        maze: generateMaze(size)
      });
    }
  }, [sessionSeed]);

  useEffect(() => {
    if (!friendRoom || friendRoom.mode !== 'global' || friendRoom.status !== 'open') return;
    if (typeof friendRoom.current_level_index !== 'number') return;
    if (friendRoom.current_level_index <= levelIndex) return;
    setLevelIndex(friendRoom.current_level_index);
    loadLevel(friendRoom.current_level_index, friendRoom.seed);
    resetMatch();
    setChallengeMessage(`Advanced to Sector ${friendRoom.current_level_index + 1}.`);
  }, [friendRoom, levelIndex, loadLevel]);

  const startGame = () => {
     AudioEngine.init();
     AudioEngine.tap();
     loadLevel(0);
     setAppState('game');
  };

  const handleCellClick = (r, c) => {
    if (gameState !== 'playing') return;
    
    const posId = `${r}-${c}`;
    
    const dr = Math.abs(r - playerPosition.r);
    const dc = Math.abs(c - playerPosition.c);
    const isAdjacent = (dr === 1 && dc === 0) || (dr === 0 && dc === 1);
    const isAlreadyInPath = path.includes(posId);
    
    if (!isAdjacent && !isAlreadyInPath) return;

    if (!timerRunning) setTimerRunning(true);
    AudioEngine.init(); 

    if (isWall(r, c)) {
      AudioEngine.wrong();
      setWrongTries((prev) => prev + 1);
      if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(50);
      
      const cellId = `cell-${r}-${c}`;
      document.getElementById(cellId)?.classList.add('wrong');
      setTimeout(() => document.getElementById(cellId)?.classList.remove('wrong'), 400);
      
      setHeatMap(prev => ({...prev, [`w-${r}-${c}`]: (prev[`w-${r}-${c}`] || 0) + 1 }));
      return;
    }

    AudioEngine.tap();
    if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(10);

    setPlayerPosition({ r, c });
    
    setHeatMap(prev => ({...prev, [`v-${r}-${c}`]: (prev[`v-${r}-${c}`] || 0) + 1 }));

    if (isAlreadyInPath) {
      const idx = path.indexOf(posId);
      setPath(path.slice(0, idx + 1));
    } else {
      setPath((prev) => [...prev, posId]);
    }

    if (r === END.r && c === END.c) {
      AudioEngine.win();
      if (window.navigator && window.navigator.vibrate) window.navigator.vibrate([100, 50, 100]);
      const finishedTimeMs = timeMs;
      setTimerRunning(false); 
      setUserTimeMs(finishedTimeMs);
      setGameState('user-done');
      setIsDragging(false);
      submitChallengeResult(finishedTimeMs);
      precalculateAlgorithms();
    }
  };

  // Drag Handlers
  const triggerDragInteraction = (e) => {
    if (gameState !== 'playing' || controlMode !== 'drag' || !isDragging && !e.touches) return;
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const el = document.elementFromPoint(clientX, clientY);
    if (el && el.id && el.id.startsWith('cell-')) {
      const parts = el.id.split('-');
      const r = parseInt(parts[1], 10);
      const c = parseInt(parts[2], 10);
      
      const curId = `${r}-${c}`;
      if (lastProcessedDrag.current !== curId) {
         lastProcessedDrag.current = curId;
         handleCellClick(r, c);
      }
    }
  };

  // Generate AI heatmap data for each algorithm
  const generateAIHeatmap = (algo) => {
    const aiHeat = {};
    if (algo === 'dfs') {
      const dfsVisited = new Set();
      let found = false;
      const dfs = (r, c) => {
        if (found) return;
        if (!isValid(r, c) || dfsVisited.has(`${r}-${c}`)) return;
        if (isWall(r, c)) { 
          aiHeat[`w-${r}-${c}`] = (aiHeat[`w-${r}-${c}`] || 0) + 1;
          return; 
        }
        dfsVisited.add(`${r}-${c}`);
        aiHeat[`v-${r}-${c}`] = (aiHeat[`v-${r}-${c}`] || 0) + 1;
        if (r === END.r && c === END.c) { found = true; return; }
        [[1,0],[0,1],[-1,0],[0,-1]].forEach(([dr,dc]) => dfs(r+dr, c+dc));
        if (!found) {
          aiHeat[`v-${r}-${c}`] = (aiHeat[`v-${r}-${c}`] || 0) + 1; // backtrack counts as revisit
        }
      };
      dfs(START.r, START.c);
    } else if (algo === 'bfs') {
      const bfsVisited = new Set([`0-0`]);
      aiHeat[`v-0-0`] = 1;
      const q = [[0, 0]];
      let found = false;
      while (q.length > 0 && !found) {
        const [r, c] = q.shift();
        if (r === END.r && c === END.c) { found = true; break; }
        [[1,0],[0,1],[-1,0],[0,-1]].forEach(([dr,dc]) => {
          const nr = r+dr, nc = c+dc;
          if (!isValid(nr, nc) || bfsVisited.has(`${nr}-${nc}`)) return;
          bfsVisited.add(`${nr}-${nc}`);
          if (isWall(nr, nc)) { 
            aiHeat[`w-${nr}-${nc}`] = (aiHeat[`w-${nr}-${nc}`] || 0) + 1;
            return; 
          }
          aiHeat[`v-${nr}-${nc}`] = (aiHeat[`v-${nr}-${nc}`] || 0) + 1;
          q.push([nr, nc]);
        });
      }
    } else { // astar
      const h = (r, c) => Math.abs(r - END.r) + Math.abs(c - END.c);
      const open = [{ r: START.r, c: START.c, g: 0, f: h(START.r, START.c) }];
      const closed = new Set();
      aiHeat[`v-${START.r}-${START.c}`] = 1;
      while (open.length > 0) {
        open.sort((a, b) => b.f - a.f);
        const curr = open.pop();
        const key = `${curr.r}-${curr.c}`;
        if (closed.has(key)) continue;
        closed.add(key);
        aiHeat[`v-${curr.r}-${curr.c}`] = (aiHeat[`v-${curr.r}-${curr.c}`] || 0) + 1;
        if (curr.r === END.r && curr.c === END.c) break;
        [[1,0],[0,1],[-1,0],[0,-1]].forEach(([dr,dc]) => {
          const nr = curr.r+dr, nc = curr.c+dc;
          if (!isValid(nr, nc) || closed.has(`${nr}-${nc}`)) return;
          if (isWall(nr, nc)) { 
            aiHeat[`w-${nr}-${nc}`] = (aiHeat[`w-${nr}-${nc}`] || 0) + 1;
            closed.add(`${nr}-${nc}`);
            return; 
          }
          open.push({ r: nr, c: nc, g: curr.g+1, f: curr.g+1+h(nr, nc) });
        });
      }
    }
    return aiHeat;
  };

  const precalculateAlgorithms = () => {
    // DFS
    const runDFS = () => {
      let ops = 0, faults = 0, totalSteps = 0;
      const dfsVisited = new Set();
      let dfsFound = false;
      const dfs = (r, c) => {
        if(dfsFound) return;
        if(!isValid(r,c) || dfsVisited.has(`${r}-${c}`)) return;
        if(isWall(r,c)) { faults++; totalSteps++; return; }
        ops++;
        dfsVisited.add(`${r}-${c}`);
        totalSteps++;
        if(r===END.r && c===END.c) { dfsFound=true; return; }
        [[1,0],[0,1],[-1,0],[0,-1]].forEach(([dr,dc]) => dfs(r+dr, c+dc));
        if(!dfsFound) totalSteps++;
      };
      dfs(START.r, START.c);
      return { faults, ops, timeMs: totalSteps * 40 };
    };

    // BFS
    const runBFS = () => {
      let ops = 0, faults = 0, totalSteps = 0;
      const bfsVisited = new Set([`0-0`]);
      const q = [[0,0]];
      let bfsFound = false;
      while(q.length > 0 && !bfsFound) {
         ops++;
         const [r, c] = q.shift();
         totalSteps++; 
         if(r === END.r && c === END.c) { bfsFound = true; break; }
         [[1,0],[0,1],[-1,0],[0,-1]].forEach(([dr,dc]) => {
           const nr=r+dr, nc=c+dc;
           if(!isValid(nr,nc) || bfsVisited.has(`${nr}-${nc}`)) return;
           if(isWall(nr,nc)) { faults++; totalSteps++; bfsVisited.add(`${nr}-${nc}`); return; }
           bfsVisited.add(`${nr}-${nc}`);
           q.push([nr,nc]);
         });
      }
      return { faults, ops, timeMs: totalSteps * 40 };
    };

    // A*
    const runAStar = () => {
      let ops = 0, faults = 0, totalSteps = 0;
      const h = (r,c) => Math.abs(r - END.r) + Math.abs(c - END.c);
      const open = [{ r: START.r, c: START.c, g: 0, f: h(START.r, START.c) }];
      const closed = new Set();
      
      while(open.length > 0) {
        open.sort((a,b) => b.f - a.f);
        const curr = open.pop();
        const key = `${curr.r}-${curr.c}`;
        if (closed.has(key)) continue;
        closed.add(key);
        ops++; totalSteps++; 
        
        if (curr.r === END.r && curr.c === END.c) return { faults, ops, timeMs: totalSteps * 40 };
        
        [[1,0],[0,1],[-1,0],[0,-1]].forEach(([dr,dc]) => {
          const nr=curr.r+dr, nc=curr.c+dc;
          if(!isValid(nr,nc) || closed.has(`${nr}-${nc}`)) return;
          if(isWall(nr,nc)) { faults++; totalSteps++; closed.add(`${nr}-${nc}`); return; }
          open.push({ r: nr, c: nc, g: curr.g+1, f: curr.g+1+h(nr,nc) });
        });
      }
      return { faults, ops, timeMs: totalSteps * 40 };
    };
    setAiStats({ dfs: runDFS(), bfs: runBFS(), astar: runAStar() });
  };

  const watchAI = (algo) => {
    AudioEngine.init();
    if (aiPreviewIntervalRef.current) {
      clearInterval(aiPreviewIntervalRef.current);
      aiPreviewIntervalRef.current = null;
    }
    setAiPreviewAlgo(algo);
    setTimeMs(0); 
    setTimerRunning(true);
    setGameState(`ai-playing`);
    setAiVisited(new Map());
    setAiPath([]);
    const sequence = []; 
    let found = false;
    
    if (algo === 'DFS') {
      const dfsVisited = new Set();
      const dfs = (r, c) => {
        if (found) return;
        if (!isValid(r, c) || dfsVisited.has(`${r}-${c}`)) return;
        if (isWall(r, c)) { sequence.push({ type: 'wrong', r, c }); return; }
        dfsVisited.add(`${r}-${c}`);
        sequence.push({ type: 'visit', r, c });
        if (r === END.r && c === END.c) { found = true; return; }
        [[1,0],[0,1],[-1,0],[0,-1]].forEach(([dr,dc]) => dfs(r+dr, c+dc));
        if(!found) sequence.push({ type: 'backtrack', r, c });
      };
      dfs(START.r, START.c);
    } else if (algo === 'BFS') {
      const bfsVisited = new Set([`0-0`]);
      const q = [[0,0]];
      while(q.length > 0 && !found) {
         const [r, c] = q.shift();
         sequence.push({ type: 'visit', r, c });
         if(r === END.r && c === END.c) { found = true; break; }
         [[1,0],[0,1],[-1,0],[0,-1]].forEach(([dr,dc]) => {
           const nr=r+dr, nc=c+dc;
           if(!isValid(nr,nc) || bfsVisited.has(`${nr}-${nc}`)) return;
           if(isWall(nr,nc)) { sequence.push({ type: 'wrong', r: nr, c: nc }); bfsVisited.add(`${nr}-${nc}`); return; }
           bfsVisited.add(`${nr}-${nc}`);
           q.push([nr,nc]);
         });
      }
    } else { // A*
      const h = (r,c) => Math.abs(r - END.r) + Math.abs(c - END.c);
      const open = [{ r: START.r, c: START.c, g: 0, f: h(START.r, START.c) }];
      const closed = new Set();
      while(open.length > 0 && !found) {
        open.sort((a,b) => b.f - a.f);
        const curr = open.pop();
        const key = `${curr.r}-${curr.c}`;
        if (closed.has(key)) continue;
        closed.add(key);
        sequence.push({ type: 'visit', r: curr.r, c: curr.c });
        if (curr.r === END.r && curr.c === END.c) { found = true; break; }
        
        [[1,0],[0,1],[-1,0],[0,-1]].forEach(([dr,dc]) => {
          const nr=curr.r+dr, nc=curr.c+dc;
          if(!isValid(nr,nc) || closed.has(`${nr}-${nc}`)) return;
          if(isWall(nr,nc)) { sequence.push({ type: 'wrong', r: nr, c: nc }); closed.add(`${nr}-${nc}`); return; }
          open.push({ r: nr, c: nc, g: curr.g+1, f: curr.g+1+h(nr,nc) });
        });
      }
    }

    let i = 0;
    const interval = setInterval(() => {
      if (i >= sequence.length) {
        clearInterval(interval);
        aiPreviewIntervalRef.current = null;
        setTimerRunning(false); 
        setTimeout(() => {
          setAiPreviewAlgo(null);
          setGameState('user-done');
        }, 500); 
        return;
      }
      const step = sequence[i];
      if (step.type === 'visit') {
        AudioEngine.aiTick(algo);
        setAiPath(p => [...p, `${step.r}-${step.c}`]);
        setAiVisited(prev => { const n = new Map(prev); if(!n.has(`${step.r}-${step.c}`)) n.set(`${step.r}-${step.c}`, n.size); return n; });
      } else if (step.type === 'backtrack') {
        setAiPath(p => p.filter(x => x !== `${step.r}-${step.c}`));
      } else if (step.type === 'wrong') {
        const cellId = `cell-${step.r}-${step.c}`;
        const el = document.getElementById(cellId);
        if(el) {
          el.classList.add('wrong');
          setTimeout(() => el.classList.remove('wrong'), 150);
        }
      }
      i++;
    }, 40); 
    aiPreviewIntervalRef.current = interval;
  };

  const nextLevel = () => {
    const nextIdx = levelIndex + 1;
    const nextSeed = friendRoom?.mode === 'global' ? friendRoom.seed : sessionSeed;
    if (friendRoom) {
      if (friendRoom.status === 'closed') {
        showRoomNotice(
          friendRoom.mode === 'global' ? 'Global Room Closed' : 'Sector Room Ended',
          'Final results are locked. Normal algorithm mode will resume automatically.',
          'closed'
        );
        return;
      }

      if (activeChallengePlayers().length < 2) {
        showRoomNotice('Waiting Room', 'Please wait for at least one friend to join before moving sectors.', 'waiting');
        return;
      }

      if (!allPlayersFinishedLevel(levelIndex)) {
        showRoomNotice(
          'Sector Locked',
          `Please wait for ${joinNames(waitingPlayerNames(levelIndex))} to finish this sector.`,
          'waiting'
        );
        return;
      }

      if (friendRoom.mode === 'sector') {
        closeCurrentRoom('sector_complete');
        showRoomNotice('Sector Room Complete', 'Final results are locked. Returning to normal mode in 10 seconds.', 'closed');
        return;
      }

      supabase
        ?.from('challenge_rooms')
        .update({ current_level_index: nextIdx })
        .eq('id', friendRoom.id)
        .then(({ error }) => {
          if (error) setChallengeMessage(error.message);
        });
    }

    setLevelIndex(nextIdx);
    loadLevel(nextIdx, nextSeed);
    resetMatch();
  };

  const resetMatch = () => {
    setPlayerPosition({ r: 0, c: 0 });
    setPath(['0-0']);
    setWrongTries(0);
    setTimeMs(0);
    setUserTimeMs(0);
    setTimerRunning(false);
    setGameState('playing');
    setAiVisited(new Map());
    setAiPath([]);
  };

  const formatTime = (ms) => (ms / 1000).toFixed(1) + "s";


  if (booting) {
    return (
      <div className="app-container boot-screen">
        <PremiumLoader />
      </div>
    );
  }


  // --- WELCOME SCREEN ---
  if (appState === 'welcome') {
    return (
      <div className="app-container welcome-screen">
        <LiquidChromeFilters />
        <motion.div
           initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.5 }}
           className="logo-3d"
        >
          <AlgoArcadeLogo />
        </motion.div>
        
        <motion.h1 
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
          className="welcome-title"
        >
          <ChromeText>
            <span className="brand-line">ALGO</span>
            <span className="brand-line">ARCADE</span>
          </ChromeText>
        </motion.h1>
        <motion.p
          initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 0.5 }} transition={{ delay: 0.15 }}
          className="welcome-subtitle"
        >
          ALGORITHM MAZE ARCADE
        </motion.p>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="welcome-controls">
            
            {/* Control Mode Toggle - Clean */}
            <div className="control-section">
              <label className="control-label">
                <Settings2 size={14}/> CONTROL MODE
              </label>
              <SketchyToggle 
                 options={[
                    { id: 'tap', label: 'TAP' },
                    { id: 'drag', label: 'SWIPE' }
                 ]}
                 activeOption={controlMode}
                 onChange={(val) => setControlMode(val)}
              />
            </div>

        </motion.div>

        <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="welcome-start-area">
           <GithubButton onClick={startGame} />
        </motion.div>

        <AnimatePresence>
          {quitPromptOpen && (
            <motion.div className="modal-overlay quit-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.div
                className="quit-card"
                initial={{ y: 24, opacity: 0, scale: 0.96 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 24, opacity: 0, scale: 0.96 }}
              >
                <span className="room-inbox-kicker">Exit Check</span>
                <h2>Quit Algo Arcade?</h2>
                <p>Press back again or choose Quit to leave the app. Stay keeps you on the home screen.</p>
                <div className="quit-actions">
                  <button className="btn btn-outline flex-1" type="button" onClick={() => setQuitPromptOpen(false)}>Stay</button>
                  <button className="btn btn-dark flex-1" type="button" onClick={forceQuitApp}>Quit</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // --- GAME UI ---
  const isHeatmapViewing = gameState === 'heatmap';
  
  // Decide which heatmap data to show
  const activeHeatData = (() => {
    if (heatmapMode === 'human') return heatMap;
    return aiHeatMap;
  })();
  const friendModeActive = Boolean(friendRoom);
  const activePlayers = activeChallengePlayers();
  const currentChallengeResults = levelChallengeResults(levelIndex);
  const myChallengeResult = currentChallengeResults.find((result) => result.player_id === playerId);
  const challengeWinner = currentChallengeResults[0];
  const allPlayersDoneCurrent = friendModeActive && allPlayersFinishedLevel(levelIndex);
  const waitingNamesCurrent = friendModeActive ? waitingPlayerNames(levelIndex) : [];
  const overallChallengeResults = friendModeActive ? summarizeResults(friendPlayers, friendResults) : [];
  const challengeScorePlayers = friendModeActive
    ? (friendPlayers.length ? friendPlayers : [{ player_id: playerId, player_label: sanitizePlayerName(playerName), active: true }])
      .filter((player) => player.active || currentChallengeResults.some((result) => result.player_id === player.player_id))
    : [];
  const roomClosed = friendRoom?.status === 'closed';
  const challengeStatusText = (() => {
    if (!friendModeActive) return '';
    if (roomClosed) {
      if (friendRoom.closed_reason === 'host_exit' && friendRoom.created_by_player_id !== playerId) return 'Host closed the room. Final results are ready.';
      return friendRoom.created_by_player_id === playerId ? 'Room closed. Final results are ready.' : 'Room ended. Final results are ready.';
    }
    if (activePlayers.length < 2) return 'Waiting for at least one friend to join.';
    if (allPlayersDoneCurrent) return friendRoom.mode === 'sector' ? 'Sector complete. Room results are final.' : 'All clear. Next sector is unlocked.';
    return `Waiting for ${joinNames(waitingNamesCurrent)} to finish.`;
  })();
  const maxOverallSectors = Math.max(1, ...overallChallengeResults.map((player) => player.sectors));
  const activeRoomNotice = roomNotice && friendModeActive;

  return (
    <div className="app-container game-screen">
      <LiquidChromeFilters />
      <header className="header" style={{ opacity: isHeatmapViewing ? 0.3 : 1, transition: 'opacity 0.3s' }}>
         <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} key={levelIndex} className="flex-col" style={{ alignItems: 'flex-start' }}>
           <div className="flex-row" style={{ gap: '0.5rem', marginBottom: '0.25rem' }}>
             <div className="pill-badge flex-row font-mono text-xs">
               <Activity size={12}/> 
               {levelData.name}
             </div>
             {levelIndex >= 2 && (
               <div className="pill-badge flex-row font-mono text-xs" style={{ background: '#111', color: 'var(--primary)' }}>
                 <Share2 size={12}/> {sessionSeed}
               </div>
             )}
             {friendModeActive && (
               <div className="pill-badge flex-row font-mono text-xs" style={{ background: '#111', color: 'var(--accent)' }}>
                 <Share2 size={12}/> {friendRoom.room_code}
               </div>
             )}
           </div>
           <h1 className="header-title">
             <ChromeText>{APP_NAME}</ChromeText>
           </h1>
         </motion.div>
         <div className="flex flex-row items-center gap-1">
           {(!friendRoom || friendRoom.status === 'closed') && (
             <button className="logo-trigger p-2 flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity" style={{ color: '#111' }} type="button" onClick={() => watchAI('astar')} aria-label="Let AI Clear Sector">
               <BrainCircuit size={24} strokeWidth={2.5} />
             </button>
           )}
           <button className="logo-trigger p-2 flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity" style={{ color: '#111' }} type="button" onClick={() => setRestartPromptOpen(true)} aria-label="Restart Sector">
             <RotateCcw size={24} strokeWidth={2.5} />
           </button>
           <button className="logo-3d-small logo-trigger" style={{ marginLeft: '0.25rem' }} type="button" onClick={() => setChallengeModalOpen(true)} aria-label="Open friend challenge">
             <AlgoArcadeLogo compact />
           </button>
         </div>
      </header>

      <AnimatePresence>
          {restartPromptOpen && (
            <motion.div className="modal-overlay quit-overlay" style={{ zIndex: 9999 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.div
                className="quit-card"
                style={{ 
                  background: 'rgba(25, 25, 25, 0.45)', 
                  backdropFilter: 'blur(24px) saturate(150%)',
                  WebkitBackdropFilter: 'blur(24px) saturate(150%)',
                  border: '1px solid rgba(255,255,255,0.12)', 
                  boxShadow: '0 30px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
                  color: 'white' 
                }}
                initial={{ y: 24, opacity: 0, scale: 0.96 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 24, opacity: 0, scale: 0.96 }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
                  <RotateCcw size={32} color="#a2fc2b" style={{ filter: 'drop-shadow(0 0 12px rgba(162,252,43,0.4))' }} />
                  <h2 style={{ color: '#fff', fontSize: '1.5rem', marginTop: '0.5rem', letterSpacing: '-0.02em' }}>Restart Sector?</h2>
                  <p style={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center', fontSize: '0.85rem' }}>
                    Resetting clears your progress here. You'll stay in Sector {levelIndex + 1}.
                  </p>
                </div>
                <div className="quit-actions" style={{ gap: '0.65rem' }}>
                  <button className="btn" style={{ background: 'rgba(162, 252, 43, 0.1)', border: '1px solid rgba(162, 252, 43, 0.4)', color: '#A2FC2B', backdropFilter: 'blur(8px)' }} type="button" onClick={() => { setRestartPromptOpen(false); resetMatch(); }}>
                    Restart Now
                  </button>
                  <button className="btn btn-outline" style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.05)' }} type="button" onClick={() => setRestartPromptOpen(false)}>
                    Cancel
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        {activeRoomNotice && gameState !== 'user-done' && (
          <motion.div
            className={`room-inbox-message ${roomNotice.tone}`}
            initial={{ y: -12, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -12, opacity: 0, scale: 0.97 }}
          >
            <span className="room-inbox-kicker">Room Inbox</span>
            <strong>{roomNotice.title}</strong>
            <p>{roomNotice.body}</p>
            {roomExitCountdown !== null && <span className="room-countdown">{roomExitCountdown}s to solo mode</span>}
          </motion.div>
        )}
      </AnimatePresence>

      {/* HUD Stats */}
      <div className="stats-grid" style={{ opacity: isHeatmapViewing ? 0 : 1, transition: 'opacity 0.3s' }}>
         <div className="stat-card">
            <div className="stat-value">{wrongTries}</div>
            <div className="stat-label flex-row"><MousePointer2 size={14}/> YOUR FAULTS</div>
         </div>
         <div className="stat-card dark">
            <div className="stat-value">{formatTime(timeMs)}</div>
            <div className="stat-label flex-row"><Timer size={14}/> TIME</div>
         </div>
      </div>

      {/* Heatmap HUD */}
      {isHeatmapViewing && (
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="heatmap-hud">
            <div className="heatmap-tabs">
              <button className={`heatmap-tab ${heatmapMode === 'human' ? 'active' : ''}`} onClick={() => { setHeatmapMode('human'); }}>
                <MousePointer2 size={14} /> You
              </button>
              <button className={`heatmap-tab ${heatmapMode === 'ai-dfs' ? 'active' : ''}`} onClick={() => { setHeatmapMode('ai-dfs'); setAiHeatMap(generateAIHeatmap('dfs')); }}>
                <BrainCircuit size={14} /> DFS
              </button>
              <button className={`heatmap-tab ${heatmapMode === 'ai-bfs' ? 'active' : ''}`} onClick={() => { setHeatmapMode('ai-bfs'); setAiHeatMap(generateAIHeatmap('bfs')); }}>
                <Activity size={14} /> BFS
              </button>
              <button className={`heatmap-tab ${heatmapMode === 'ai-astar' ? 'active' : ''}`} onClick={() => { setHeatmapMode('ai-astar'); setAiHeatMap(generateAIHeatmap('astar')); }}>
                <Zap size={14} /> A*
              </button>
            </div>
            <p className="heatmap-legend">
              {heatmapMode === 'human' ? 'Red = Wall Collisions · Orange = Hesitation' : `Red = Wall Checks · Orange = Cells Explored`}
            </p>
        </motion.div>
      )}

      {/* Maze */}
      <motion.div 
        className="maze-wrapper"
        initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        onMouseDown={() => { if(controlMode==='drag') setIsDragging(true); }}
        onMouseMove={triggerDragInteraction}
        onTouchMove={triggerDragInteraction}
        style={{ touchAction: (controlMode === 'drag' || useDpad) ? 'none' : 'auto' }}
      >
        <div 
          className="maze-grid"
          style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
        >
          <AnimatePresence>
            {INITIAL_MAZE.map((row, r) => 
              row.map((cell, c) => {
                const pos = `${r}-${c}`;
                const isStart = r === 0 && c === 0;
                const isEnd = r === END.r && c === END.c;
                const isW = cell === 1;
                const isPlayerPath = path.includes(pos);
                const isAIVisited = aiVisited.has(pos);
                const isAIPath = aiPath.includes(pos);
                
                let classes = `cell cell-3d`;
                if (isW) classes += ' wall';
                if (isStart) classes += ' start';
                if (isEnd) classes += ' end';
                
                if (gameState.includes('ai')) {
                  if (isAIPath && !isStart && !isEnd) classes += ' path ai-glow';
                  else if (isAIVisited && !isW && !isStart && !isEnd) classes += ' ai-visited';
                } else if (!isHeatmapViewing) {
                   if (isPlayerPath && !isStart && !isEnd) classes += ' path glow';
                }

                 // Heatmap logic rendering
                 let heatStyle = {};
                 if (isHeatmapViewing) {
                    if (isW) {
                      const hits = activeHeatData[`w-${r}-${c}`] || 0;
                      if (hits > 0) heatStyle = { backgroundColor: `rgba(255, 0, 0, ${Math.min(hits * 0.4, 1)})`, borderColor: '#800000', boxShadow: 'none' };
                    } else {
                      const pathHits = activeHeatData[`v-${r}-${c}`] || 0;
                      if (pathHits > 0) heatStyle = { backgroundColor: `rgba(255, 100, 0, ${Math.min(pathHits * 0.25, 0.9)})`, zIndex: 2 };
                    }
                 } else if (gameState.includes('ai') && isAIVisited && !isW && !isStart && !isEnd) {
                    const order = aiVisited.get(pos);
                    const total = Math.max(1, aiVisited.size);
                    const ratio = order / total;
                    const hue = 240 - (ratio * 240);
                    heatStyle = { backgroundColor: `hsla(${hue}, 100%, 50%, 0.5)`, borderColor: `hsla(${hue}, 100%, 30%, 0.8)` };
                 }

                return (
                  <motion.div 
                    initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: (r + c) * 0.01, type: 'spring' }}
                    key={pos} id={`cell-${r}-${c}`}
                    className={classes}
                    style={heatStyle}
                    onClick={() => {
                        if (controlMode === 'tap' && !useDpad) handleCellClick(r, c);
                    }}
                    whileTap={!isW && controlMode==='tap' && !useDpad ? { scale: 0.8, zIndex: 10 } : {}}
                  >
                    {!isHeatmapViewing && isStart && <Flag size={GRID_SIZE > 7 ? 12 : 18} />}
                    {!isHeatmapViewing && isEnd && <Trophy size={GRID_SIZE > 7 ? 12 : 18} />}
                    
                    {gameState === 'playing' && playerPosition.r === r && playerPosition.c === c && !isStart && !isEnd && (
                      <motion.div layoutId="player" className="player-dot" />
                    )}
                    
                    {gameState.includes('ai') && aiPath[aiPath.length - 1] === pos && !isStart && !isEnd && (
                      <div className="ai-head">
                         <BrainCircuit size={GRID_SIZE > 7 ? 12 : 20} color="#000" />
                      </div>
                    )}
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* D-Pad for large grids */}
      {useDpad && gameState === 'playing' && (
        <div className="dpad-container">
          <button className="dpad-btn dpad-up" onClick={() => movePlayer(-1, 0)}>
            <ChevronUp size={22} strokeWidth={3} />
          </button>
          <div className="dpad-row">
            <button className="dpad-btn dpad-left" onClick={() => movePlayer(0, -1)}>
              <ChevronLeft size={22} strokeWidth={3} />
            </button>
            <div className="dpad-center" />
            <button className="dpad-btn dpad-right" onClick={() => movePlayer(0, 1)}>
              <ChevronRight size={22} strokeWidth={3} />
            </button>
          </div>
          <button className="dpad-btn dpad-down" onClick={() => movePlayer(1, 0)}>
            <ChevronDown size={22} strokeWidth={3} />
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="game-footer">
        {isHeatmapViewing ? (
           <button className="btn btn-dark" style={{ padding: '0.75rem 1.5rem' }} onClick={() => { setGameState('user-done'); setHeatmapMode('human'); }}>
             Close Heatmap
           </button>
        ) : gameState.includes('ai') && friendModeActive ? (
           <div className="ai-preview-footer">
             <span><BrainCircuit size={14} /> {aiPreviewAlgo || 'AI'} live route</span>
             <button className="btn btn-dark" type="button" onClick={closeAIPreview}>
               Close Preview
             </button>
           </div>
        ) : gameState === 'playing' && !useDpad ? (
           <p className="text-muted text-sm font-medium">
             {friendModeActive ? `${friendRoom.mode === 'global' ? 'Global' : 'Sector'} challenge active` : controlMode === 'drag' ? "Swipe across the grid" : "Tap to step"}
           </p>
        ) : gameState === 'playing' && useDpad ? (
           <p className="text-muted text-sm font-medium">
             {friendModeActive ? `${friendRoom.mode === 'global' ? 'Global' : 'Sector'} challenge active` : 'Use the D-Pad to navigate'}
           </p>
        ) : (
           <button className="btn btn-outline" onClick={resetMatch} style={{ padding: '0.6rem 1.5rem' }}>
             <RotateCcw size={18} /> Restart
           </button>
        )}
      </div>

      {/* Win Modal */}
      <AnimatePresence>
        {gameState === 'user-done' && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div 
              className="modal-content light"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
               <h2 className="modal-title">Sector Cleared!</h2>
               
               <div className="score-board">
                  <div className="score-row user-score" style={{ border: '2px solid #000' }}>
                    <div className="flex-col" style={{ gap: '0.1rem', alignItems: 'flex-start' }}>
                        <span className="font-bold flex-row"><MousePointer2 size={16}/> You</span>
                        <span className="text-sm font-medium opacity-80">
                          {formatTime(myChallengeResult?.time_ms || userTimeMs)}
                          {friendModeActive && myChallengeResult ? ` · ${myChallengeResult.path_length} steps` : ''}
                        </span>
                    </div>
                    <span className="font-bold">{myChallengeResult?.faults ?? wrongTries} Faults</span>
                  </div>
                  {friendModeActive ? (
                    <>
                      <div className="score-row bg-slate-100">
                        <div className="flex-col" style={{ gap: '0.1rem', alignItems: 'flex-start' }}>
                          <span className="flex-row font-bold"><Trophy size={16} /> Result</span>
                          <span className="text-sm font-medium text-muted">
                            Room {friendRoom.room_code} · {friendRoom.mode === 'global' ? 'Global Run' : 'This Sector'}
                          </span>
                        </div>
                        <span className="font-bold">
                          {roomClosed ? 'Final' : !challengeWinner ? 'Syncing' : challengeWinner.player_id === playerId ? 'You lead' : `${challengeWinner.player_label} leads`}
                        </span>
                      </div>
                      <div className="score-section-title">This Sector</div>
                      {challengeScorePlayers.map((player) => {
                        const result = currentChallengeResults.find((item) => item.player_id === player.player_id);
                        const isWinner = result && challengeWinner?.player_id === player.player_id;
                        return (
                          <div key={player.player_id} className={`score-row bg-slate-100 ${result ? '' : 'waiting'} ${isWinner ? 'winner' : ''}`}>
                            <div className="flex-col" style={{ gap: '0.1rem', alignItems: 'flex-start' }}>
                              <span className="flex-row">
                                {isWinner ? <Trophy size={16} /> : <Share2 size={16} />}
                                {player.player_id === playerId ? `${player.player_label} (You)` : player.player_label}
                              </span>
                              <span className="text-sm font-medium text-muted">
                                {result ? `${formatTime(result.time_ms)} · ${result.path_length} steps` : 'Waiting for clear'}
                              </span>
                            </div>
                            <span>{result ? `${result.faults} Faults` : 'Live'}</span>
                          </div>
                        );
                      })}
                      {activeRoomNotice && (
                        <div className={`room-inbox-message room-inbox-message--inline ${roomNotice.tone}`}>
                          <span className="room-inbox-kicker">Room Inbox</span>
                          <strong>{roomNotice.title}</strong>
                          <p>{roomNotice.body}</p>
                          {roomExitCountdown !== null && <span className="room-countdown">{roomExitCountdown}s to solo mode</span>}
                        </div>
                      )}
                      <div className="score-section-title">{roomClosed ? 'Final Overall' : 'Overall Run'}</div>
                      <div className="overall-bars">
                        {overallChallengeResults.map((player, index) => {
                          const barWidth = `${Math.max(8, (player.sectors / maxOverallSectors) * 100)}%`;
                          return (
                            <div key={player.player_id} className={`overall-bar-row ${index === 0 && player.sectors ? 'winner' : ''}`}>
                              <div className="overall-bar-top">
                                <span>#{index + 1} {player.player_id === playerId ? `${player.player_label} (You)` : player.player_label}</span>
                                <strong>{player.sectors} sector{player.sectors === 1 ? '' : 's'}</strong>
                              </div>
                              <div className="overall-bar-track">
                                <span className="overall-bar-fill" style={{ width: barWidth }} />
                              </div>
                              <div className="overall-bar-meta">
                                <span>{player.sectors ? formatTime(player.timeMs) : 'No clears yet'}</span>
                                <span>{player.faults} faults · {player.pathLength} steps</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="ai-compare-card">
                        <div>
                          <span className="room-inbox-kicker">AI Replay</span>
                          <strong>Compare your route</strong>
                          <p>Preview a live algorithm solution and see whether your choices beat the machine.</p>
                        </div>
                        <div className="ai-compare-actions">
                          <button className="btn btn-dark flex-1" type="button" onClick={() => watchAI('DFS')}>DFS</button>
                          <button className="btn btn-dark flex-1" type="button" onClick={() => watchAI('BFS')}>BFS</button>
                          <button className="btn btn-primary flex-1" type="button" onClick={() => watchAI('A*')}>A*</button>
                        </div>
                      </div>
                      <p className="challenge-message">{challengeStatusText}</p>
                    </>
                  ) : (
                    <>
                      <div className="score-row bg-slate-100">
                        <div className="flex-col" style={{ gap: '0.1rem', alignItems: 'flex-start' }}>
                            <span className="flex-row"><BrainCircuit size={16} /> DFS</span>
                            <span className="text-sm font-medium text-muted">{(aiStats.dfs.timeMs / 1000).toFixed(1)}s · {aiStats.dfs.ops} ops</span>
                        </div>
                        <span>{aiStats.dfs.faults} Faults</span>
                      </div>
                      <div className="score-row bg-slate-100">
                        <div className="flex-col" style={{ gap: '0.1rem', alignItems: 'flex-start' }}>
                            <span className="flex-row"><Activity size={16} /> BFS</span>
                            <span className="text-sm font-medium text-muted">{(aiStats.bfs.timeMs / 1000).toFixed(1)}s · {aiStats.bfs.ops} ops</span>
                        </div>
                        <span>{aiStats.bfs.faults} Faults</span>
                      </div>
                      <div className="score-row bg-slate-100">
                        <div className="flex-col" style={{ gap: '0.1rem', alignItems: 'flex-start' }}>
                            <span className="flex-row font-bold text-blue-600"><Zap size={16} /> A*</span>
                            <span className="text-sm font-medium text-muted">{(aiStats.astar.timeMs / 1000).toFixed(1)}s · {aiStats.astar.ops} ops</span>
                        </div>
                        <span className="font-bold">{aiStats.astar.faults} Faults</span>
                      </div>
                    </>
                  )}
               </div>

               <div className="modal-actions">
                 {!friendModeActive && (
                   <div className="flex gap-2">
                     <button className="btn btn-dark flex-1" onClick={() => watchAI('DFS')} style={{padding: '0.65rem', fontSize: '0.85rem'}}>
                       DFS
                     </button>
                     <button className="btn btn-dark flex-1" onClick={() => watchAI('BFS')} style={{padding: '0.65rem', fontSize: '0.85rem'}}>
                       BFS
                     </button>
                     <button className="btn btn-dark flex-1" onClick={() => watchAI('A*')} style={{background: '#2563EB', padding: '0.65rem', fontSize: '0.85rem'}}>
                       A*
                     </button>
                   </div>
                 )}
                 
                 <div className="flex gap-2">
                   {!friendModeActive && (
                     <button className="btn btn-outline flex-1" onClick={() => setGameState('heatmap')} style={{ padding: '0.7rem 0' }}>
                       <Flame size={18} color="var(--danger)" /> Heatmap
                     </button>
                   )}
                   <button className="btn btn-primary flex-1" onClick={nextLevel} style={{border: '2px solid #000', padding: '0.7rem 0' }}>
                     Next <ChevronRight size={18} />
                   </button>
                 </div>
               </div>
               
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {challengeModalOpen && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div
              className="modal-content light challenge-sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              <div className="challenge-header">
                <div>
                  <h2 className="modal-title">Friend Challenge</h2>
                  <p className="challenge-copy">Name up, share a code, and race the same maze with up to 4 players.</p>
                </div>
                <button className="challenge-close" type="button" onClick={() => setChallengeModalOpen(false)}>×</button>
              </div>

              <label className="challenge-name-row">
                <span>Your name</span>
                <input
                  value={playerName}
                  onChange={(event) => setPlayerName(event.target.value.slice(0, 16))}
                  onBlur={savePlayerName}
                  placeholder="PLAYER NAME"
                  maxLength={16}
                  aria-label="Player name"
                />
              </label>

              {friendModeActive && (
                <div className="challenge-active-card">
                  <span className="challenge-kicker">{roomClosed ? 'Closed room' : 'Active room'}</span>
                  <strong>{friendRoom.room_code}</strong>
                  <p>{friendRoom.mode === 'global' ? 'Global run stays synced across future sectors.' : 'This code is locked to the current sector.'}</p>
                  <div className="challenge-roster" aria-label="Room players">
                    <span className="challenge-kicker">Players {activePlayers.length}/{friendRoom.max_players || 4}</span>
                    <div className="challenge-player-list">
                      {(friendPlayers.length ? friendPlayers : [{ player_id: playerId, player_label: sanitizePlayerName(playerName), role: 'host', active: true }]).map((player) => (
                        <span key={player.player_id} className={`challenge-player-pill ${player.active ? '' : 'inactive'}`}>
                          {player.player_id === playerId ? `${player.player_label} (You)` : player.player_label}
                          {player.role === 'host' ? ' · Host' : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                  {overallChallengeResults.length > 0 && (
                    <div className="challenge-mini-board">
                      <span className="challenge-kicker">{roomClosed ? 'Final overall' : 'Overall so far'}</span>
                      {overallChallengeResults.slice(0, 4).map((player, index) => (
                        <div key={player.player_id} className="challenge-mini-row">
                          <span>#{index + 1} {player.player_id === playerId ? `${player.player_label} (You)` : player.player_label}</span>
                          <span>{player.sectors} · {formatTime(player.timeMs)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <button className="btn btn-outline" type="button" onClick={leaveChallenge}>
                    {roomClosed || friendRoom.created_by_player_id !== playerId ? 'Exit Friend Mode' : 'Close Room'}
                  </button>
                </div>
              )}

              <div className="challenge-options">
                <button
                  type="button"
                  className={`challenge-option ${challengeMode === 'sector' ? 'active' : ''}`}
                  onClick={() => setChallengeMode('sector')}
                >
                  <strong>This Sector</strong>
                  <span>Race only {levelData.name}</span>
                </button>
                <button
                  type="button"
                  className={`challenge-option ${challengeMode === 'global' ? 'active' : ''}`}
                  onClick={() => setChallengeMode('global')}
                >
                  <strong>Global Run</strong>
                  <span>Same maze seed until exit</span>
                </button>
              </div>

              <button className="btn btn-dark" type="button" onClick={createChallenge} disabled={challengeLoading}>
                <Share2 size={18} /> {challengeLoading ? 'Working...' : 'Create Code'}
              </button>

              <div className="join-code-row">
                <input
                  value={joinCode}
                  onChange={(event) => setJoinCode(normalizeRoomCode(event.target.value))}
                  placeholder="ENTER CODE"
                  maxLength={6}
                  aria-label="Challenge code"
                />
                <button className="btn btn-primary" type="button" onClick={joinChallenge} disabled={challengeLoading}>
                  Join
                </button>
              </div>

              {friendRoom?.room_code && (
                <div className="challenge-code-display">
                  <span>Share this code</span>
                  <strong>{friendRoom.room_code}</strong>
                </div>
              )}

              {challengeMessage && <p className="challenge-message">{challengeMessage}</p>}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {quitPromptOpen && (
          <motion.div className="modal-overlay quit-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div
              className="quit-card"
              initial={{ y: 24, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 24, opacity: 0, scale: 0.96 }}
            >
              <span className="room-inbox-kicker">Exit Check</span>
              <h2>Quit Algo Arcade?</h2>
              <p>Press back again or choose Quit to leave the app. Stay keeps you here.</p>
              <div className="quit-actions">
                <button className="btn btn-outline flex-1" type="button" onClick={() => setQuitPromptOpen(false)}>Stay</button>
                <button className="btn btn-dark flex-1" type="button" onClick={forceQuitApp}>Quit</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
