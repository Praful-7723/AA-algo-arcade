import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Zap, Box, Share2, Target, Crosshair, ChevronRight, Check, AlertCircle, Maximize2, SkipForward, Activity, Flame, Skull, Settings2, RotateCcw, Play, BrainCircuit, Flag, MousePointer2, Trophy, Timer } from 'lucide-react';
import { SketchyToggle } from './components/SketchyToggle';
import { GithubButton } from './components/GithubButton';
import './index.css';

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
    } catch(e) {}
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
   const val = cyrb128(seedStr + "NeuralSalt"); // Added salt for dynamic feeling
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
    name: 'Sector 1 (Intro)', size: 5,
    maze: [ [0,0,1,0,0], [1,0,0,0,1], [0,0,1,0,0], [0,1,0,1,0], [0,0,0,0,0] ]
  },
  {
    name: 'Sector 2 (Complex)', size: 7,
    maze: [ [0,1,0,0,0,1,0], [0,1,0,1,0,0,0], [0,0,0,1,1,1,0], [1,1,0,0,0,0,0], [0,0,0,1,1,1,1], [0,1,0,0,0,0,0], [0,0,0,1,0,1,0] ]
  }
];

export default function App() {
  const [appState, setAppState] = useState('welcome'); 
  const [controlMode, setControlMode] = useState('tap'); // 'tap' or 'drag'
  const [sessionSeed, setSessionSeed] = useState(generateRandomSeed());
  
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
  
  const [aiVisited, setAiVisited] = useState(new Set());
  const [aiPath, setAiPath] = useState([]);
  
  // Heatmap State
  const [heatMap, setHeatMap] = useState({});
  
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

  const loadLevel = (idx) => {
    // If playing procedurally, use the seed + level as salt so each room is deterministic but changes!
    setMazeSeed(sessionSeed + "_level_" + idx); 
    
    // Heatmap resets per level
    setHeatMap({});
    
    if (idx < STATIC_LEVELS.length) {
      setLevelData(STATIC_LEVELS[idx]);
    } else {
      const size = Math.min(13, 5 + (idx * 2)); 
      setLevelData({
        name: `Sector ${idx + 1} (Seed: ${sessionSeed})`,
        size: size,
        maze: generateMaze(size)
      });
    }
  };

  const startGame = () => {
     AudioEngine.init();
     AudioEngine.tap();
     loadLevel(0); // Load level 0 deterministically
     setAppState('game');
  };

  const handleCellClick = (r, c) => {
    if (gameState !== 'playing') return;
    
    // Avoid double processing on drag
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
      
      // Heatmap Data (Wall Hits)
      setHeatMap(prev => ({...prev, [`w-${r}-${c}`]: (prev[`w-${r}-${c}`] || 0) + 1 }));
      return;
    }

    AudioEngine.tap();
    if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(10);

    setPlayerPosition({ r, c });
    
    // Heatmap Data (Valid Path Steps)
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
      setTimerRunning(false); 
      setUserTimeMs(timeMs);
      setGameState('user-done');
      setIsDragging(false); // Stop dragging upon win
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
      
      // Throttling same-cell processing to save performance during drag
      const curId = `${r}-${c}`;
      if (lastProcessedDrag.current !== curId) {
         lastProcessedDrag.current = curId;
         handleCellClick(r, c);
      }
    }
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
        totalSteps++; // visit
        if(r===END.r && c===END.c) { dfsFound=true; return; }
        [[1,0],[0,1],[-1,0],[0,-1]].forEach(([dr,dc]) => dfs(r+dr, c+dc));
        if(!dfsFound) totalSteps++; // backtrack
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
    setTimeMs(0); 
    setTimerRunning(true);
    setGameState(`ai-playing`);
    setAiVisited(new Set());
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
        setTimerRunning(false); 
        setTimeout(() => setGameState('user-done'), 500); 
        return;
      }
      const step = sequence[i];
      if (step.type === 'visit') {
        AudioEngine.aiTick(algo);
        setAiPath(p => [...p, `${step.r}-${step.c}`]);
        setAiVisited(prev => { const n = new Set(prev); n.add(`${step.r}-${step.c}`); return n; });
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
  };

  const nextLevel = () => {
    const nextIdx = levelIndex + 1;
    setLevelIndex(nextIdx);
    loadLevel(nextIdx);
    resetMatch();
  };

  const resetMatch = () => {
    setPlayerPosition(START);
    setPath(['0-0']);
    setWrongTries(0);
    setTimeMs(0);
    setUserTimeMs(0);
    setTimerRunning(false);
    setGameState('playing');
    setAiVisited(new Set());
    setAiPath([]);
  };

  const formatTime = (ms) => (ms / 1000).toFixed(1) + "s";


  // --- WELCOME SCREEN ---
  if (appState === 'welcome') {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: 'var(--primary)' }}>
        <motion.div
           initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.5 }}
           className="avatar" style={{ width: '100px', height: '100px', marginBottom: '2rem', boxShadow: 'var(--shadow-soft)' }}
        >
          <Zap size={50} className="text-blue-600" />
        </motion.div>
        
        <motion.h1 
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
          style={{ fontSize: '4.5rem', lineHeight: 1, textAlign: 'center', marginBottom: '1.5rem', color: '#111' }}
        >
          JOENTLY<br/>NEURAL
        </motion.h1>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="flex-col" style={{ gap: '1.5rem', marginBottom: '4rem', width: '100%', maxWidth: '320px' }}>
            
            {/* Transparent UI Layout Request */}
            <div className="flex-col" style={{ gap: '0.5rem' }}>
              <label className="text-sm font-extrabold flex-row" style={{ color: 'rgba(0,0,0,0.5)', letterSpacing: '0.1em', alignSelf: 'center' }}><Share2 size={16}/> SEED PROTOCOL</label>
              <div className="flex-row" style={{ gap: '0', background: 'rgba(255,255,255,0.2)', padding: '0.25rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.4)', backdropFilter: 'blur(8px)', boxShadow: '0 8px 32px rgba(0,0,0,0.05)' }}>
                 <input 
                   type="text" 
                   value={sessionSeed} 
                   onChange={(e) => setSessionSeed(e.target.value.toUpperCase().substring(0, 8))}
                   className="font-bold text-center"
                   style={{ flex: 1, padding: '0.75rem', borderRadius: '0.75rem', border: 'none', fontSize: '1.2rem', textTransform: 'uppercase', background: 'transparent', color: '#000', outline: 'none', letterSpacing: '2px' }}
                   placeholder="CODE"
                 />
                 <button 
                    onClick={() => setSessionSeed(generateRandomSeed())} 
                    style={{ background: 'rgba(0,0,0,0.05)', border: 'none', cursor: 'pointer', padding: '0 1.2rem', height: '100%', borderRadius: '0.75rem', color: '#000', outline: 'none', transition: 'background 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.1)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
                 >
                    <RotateCcw size={20} />
                 </button>
              </div>
            </div>

            <div className="flex-col" style={{ gap: '0.5rem' }}>
              <label className="text-sm font-extrabold flex-row" style={{ color: 'rgba(0,0,0,0.5)', letterSpacing: '0.1em', alignSelf: 'center' }}><Settings2 size={16}/> OVERRIDE SYSTEM</label>
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

        <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
           <GithubButton onClick={startGame} />
        </motion.div>
      </div>
    );
  }

  // --- GAME UI ---
  const isHeatmapViewing = gameState === 'heatmap';

  return (
    <div className="app-container">
      <header className="header" style={{ opacity: isHeatmapViewing ? 0.3 : 1, transition: 'opacity 0.3s' }}>
         <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} key={levelIndex} className="flex-col" style={{ alignItems: 'flex-start' }}>
           <div className="flex-row" style={{ gap: '0.5rem', marginBottom: '0.5rem' }}>
             <div className="pill-badge flex-row font-mono text-xs">
               <Activity size={12}/> 
               {levelData.name}
             </div>
             {levelIndex >= 2 && (
               <div className="pill-badge flex-row font-mono text-xs" style={{ background: '#111', color: 'var(--primary)' }}>
                 <Share2 size={12}/> {sessionSeed}
               </div>
             )}
           </div>
           <h1 style={{ fontSize: '1.8rem', lineHeight: '1.1' }}>JOENTLY<br/>NEURAL</h1>
         </motion.div>
         <div className="avatar" style={{ boxShadow: '2px 2px 0 #000' }}>
           <Zap size={24} className="text-blue-600" fill="#2563eb" />
         </div>
      </header>

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

      {/* Heatmap HUD (Only visible during heatmap) */}
      {isHeatmapViewing && (
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex-col" style={{ position: 'absolute', top: '150px', left: 0, right: 0, zIndex: 50, alignItems: 'center' }}>
            <div className="pill-badge flex-row" style={{ background: 'var(--danger)', color: '#fff', boxShadow: '0 5px 20px rgba(255,0,0,0.3)' }}>
               <Flame size={16} /> HUMAN ERROR HEATMAP
            </div>
            <p className="font-bold mt-2 text-center" style={{ width: '80%' }}>Red = Wall Collisions<br/>Orange = Dense Foot Traffic / Hesitation</p>
        </motion.div>
      )}

      {/* 3D Maze */}
      <motion.div 
        className="maze-wrapper 3d-pop"
        initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        onMouseDown={() => { if(controlMode==='drag') setIsDragging(true); }}
        onMouseMove={triggerDragInteraction}
        onTouchMove={triggerDragInteraction}
        style={{ touchAction: controlMode === 'drag' ? 'none' : 'auto' }}
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
                     const hits = heatMap[`w-${r}-${c}`] || 0;
                     if (hits > 0) heatStyle = { backgroundColor: `rgba(255, 0, 0, ${Math.min(hits * 0.4, 1)})`, borderColor: '#800000', boxShadow: 'none' };
                   } else {
                     const pathHits = heatMap[`v-${r}-${c}`] || 0;
                     if (pathHits > 0) heatStyle = { backgroundColor: `rgba(255, 100, 0, ${Math.min(pathHits * 0.25, 0.9)})`, zIndex: 2 };
                   }
                }

                return (
                  <motion.div 
                    initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: (r + c) * 0.01, type: 'spring' }}
                    key={pos} id={`cell-${r}-${c}`}
                    className={classes}
                    style={heatStyle}
                    onClick={() => {
                        if (controlMode === 'tap') handleCellClick(r, c);
                    }}
                    whileTap={!isW && controlMode==='tap' ? { scale: 0.8, zIndex: 10 } : {}}
                  >
                    {!isHeatmapViewing && isStart && <Flag size={GRID_SIZE > 7 ? 14 : 20} />}
                    {!isHeatmapViewing && isEnd && <Trophy size={GRID_SIZE > 7 ? 14 : 20} />}
                    
                    {gameState === 'playing' && playerPosition.r === r && playerPosition.c === c && !isStart && !isEnd && (
                      <motion.div layoutId="player" className="flex items-center justify-center absolute inset-0 w-full h-full">
                         <div className="w-4 h-4 bg-black rounded-full" />
                      </motion.div>
                    )}
                    
                    {gameState.includes('ai') && aiPath[aiPath.length - 1] === pos && !isStart && !isEnd && (
                      <div className="flex items-center justify-center absolute inset-0 w-full h-full">
                         <BrainCircuit size={GRID_SIZE > 7 ? 14 : 24} color="#000" />
                      </div>
                    )}
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Footer Instructions OR Heatmap specific Back button */}
      <div className="text-center mt-auto pb-4">
        {isHeatmapViewing ? (
           <button className="btn btn-dark" style={{ padding: '1rem 2rem' }} onClick={() => setGameState('user-done')}>
             Close Heatmap & Return
           </button>
        ) : gameState === 'playing' ? (
           <p className="text-muted text-sm font-medium">
             {controlMode === 'drag' ? "Swipe smoothly across the grid!" : "Tap carefully to step."}
           </p>
        ) : (
           <button className="btn btn-outline" onClick={resetMatch}>
             <RotateCcw size={20} /> Restart Sector
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
              style={{ paddingBottom: '2rem' }}
            >
               <h2 className="modal-title">Sector Cleared!</h2>
               
               <div className="score-board">
                  <div className="score-row user-score" style={{ border: '2px solid #000' }}>
                    <div className="flex-col" style={{ gap: '0.1rem', alignItems: 'flex-start' }}>
                        <span className="font-bold flex-row"><MousePointer2 size={16}/> You (Intuition)</span>
                        <span className="text-sm font-medium opacity-80">{formatTime(userTimeMs)}</span>
                    </div>
                    <span className="font-bold">{wrongTries} Faults</span>
                  </div>
                  <div className="score-row bg-slate-100">
                    <div className="flex-col" style={{ gap: '0.1rem', alignItems: 'flex-start' }}>
                        <span className="flex-row"><BrainCircuit size={16} /> AI (DFS)</span>
                        <span className="text-sm font-medium text-muted">{(aiStats.dfs.timeMs / 1000).toFixed(1)}s ({aiStats.dfs.ops} cells searched)</span>
                    </div>
                    <span>{aiStats.dfs.faults} Faults</span>
                  </div>
                  <div className="score-row bg-slate-100">
                    <div className="flex-col" style={{ gap: '0.1rem', alignItems: 'flex-start' }}>
                        <span className="flex-row"><Activity size={16} /> AI (BFS)</span>
                        <span className="text-sm font-medium text-muted">{(aiStats.bfs.timeMs / 1000).toFixed(1)}s ({aiStats.bfs.ops} cells searched)</span>
                    </div>
                    <span>{aiStats.bfs.faults} Faults</span>
                  </div>
                  <div className="score-row bg-slate-100">
                    <div className="flex-col" style={{ gap: '0.1rem', alignItems: 'flex-start' }}>
                        <span className="flex-row font-bold text-blue-600"><Zap size={16} /> AI (A* Genius)</span>
                        <span className="text-sm font-medium text-muted">{(aiStats.astar.timeMs / 1000).toFixed(1)}s ({aiStats.astar.ops} cells searched)</span>
                    </div>
                    <span className="font-bold">{aiStats.astar.faults} Faults</span>
                  </div>
               </div>

               <div className="flex gap-2" style={{ overflowX: 'auto', paddingBottom: '5px', marginTop: '1rem' }}>
                 <button className="btn btn-dark flex-1" onClick={() => watchAI('DFS')} style={{padding: '0.75rem', fontSize: '0.9rem', minWidth: '70px'}}>
                   DFS
                 </button>
                 <button className="btn btn-dark flex-1" onClick={() => watchAI('BFS')} style={{padding: '0.75rem', fontSize: '0.9rem', minWidth: '70px'}}>
                   BFS
                 </button>
                 <button className="btn btn-dark flex-1" onClick={() => watchAI('A*')} style={{background: '#2563EB', padding: '0.75rem', fontSize: '0.9rem', minWidth: '70px'}}>
                   A*
                 </button>
               </div>
               
               <div className="flex gap-2 mt-2">
                 <button className="btn btn-outline flex-1" onClick={() => setGameState('heatmap')} style={{ padding: '0.9rem 0' }}>
                   <Flame size={20} color="var(--danger)" /> Heatmap
                 </button>
                 <button className="btn btn-primary flex-1" onClick={nextLevel} style={{border: '2px solid #000', padding: '0.9rem 0' }}>
                   Next Sector <ChevronRight size={20} />
                 </button>
               </div>
               
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
