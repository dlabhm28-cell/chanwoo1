import { ContactShadows, Environment, PointerLockControls, Sky, Stars, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { Physics } from '@react-three/cannon';
import { Suspense, useCallback, useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Crosshair, ScrollText, Trophy, Zap } from 'lucide-react';

import { Ground } from './components/Ground';
import { Level } from './components/Level';
import { CastleLevel, ShibuyaLevel } from './components/Scenery';
import { VillageLevel } from './components/Village';
import { OtherPlayer } from './components/OtherPlayer';
import { Pet } from './components/Pet';
import { Player } from './components/Player';
import { CinematicCamera, Phase2CinematicCamera } from './components/CinematicCamera';
import { PetLaser, QuickSlash, FireArrow, DomainExpansion } from './components/Projectiles';
import { SlimeSpawner } from './components/SlimeSpawner';
import { useMultiplayer } from './hooks/useMultiplayer';

import { getAudioContext } from './audio';

// Simple Audio API Helper
const playSound = (type: 'laser' | 'dash' | 'blackFlash' | 'rikaLaser' | 'bassDrop' | 'error' | 'hit') => {
  const audioCtx = getAudioContext();
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  
  osc.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  
  if (type === 'error') {
    osc.type = 'square';
    osc.frequency.setValueAtTime(300, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.1);
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
  } else if (type === 'laser') {
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1);
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
  } else if (type === 'rikaLaser') {
    // 웅장한 레이저 소리 (뿌아아앙)
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(300, audioCtx.currentTime + 0.5);
    osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 1.5);
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.2); // Fade in
    gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 1.0); // Hold
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.5); // Fade out
    
    // Add distortion for a rougher sound
    const dist = audioCtx.createWaveShaper();
    function makeDistortionCurve(amount = 50) {
      const k = typeof amount === 'number' ? amount : 50,
        n_samples = 44100,
        curve = new Float32Array(n_samples),
        deg = Math.PI / 180;
      for (let i = 0; i < n_samples; ++i) {
        const x = i * 2 / n_samples - 1;
        curve[i] = ( 3 + k ) * x * 20 * deg / ( Math.PI + k * Math.abs(x) );
      }
      return curve;
    }
    dist.curve = makeDistortionCurve(400); // 찌그러짐 추가
    osc.disconnect(gainNode);
    osc.connect(dist);
    dist.connect(gainNode);
    
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 1.5);
  } else if (type === 'dash') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(1000, audioCtx.currentTime + 0.2);
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  } else if (type === 'blackFlash') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(50, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(500, audioCtx.currentTime + 0.15);
    gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
    
    // Add distortion for that crackling black flash impact
    const dist = audioCtx.createWaveShaper();
    function makeDistortionCurve(amount = 50) {
      const k = typeof amount === 'number' ? amount : 50,
        n_samples = 44100,
        curve = new Float32Array(n_samples),
        deg = Math.PI / 180;
      for (let i = 0; i < n_samples; ++i ) {
        const x = i * 2 / n_samples - 1;
        curve[i] = ( 3 + k ) * x * 20 * deg / ( Math.PI + k * Math.abs(x) );
      }
      return curve;
    }
    dist.curve = makeDistortionCurve(100);
    dist.oversample = '4x';
    
    osc.disconnect();
    osc.connect(dist);
    dist.connect(gainNode);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
  } else if (type === 'bassDrop') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(100, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(10, audioCtx.currentTime + 2.0);
    gainNode.gain.setValueAtTime(0.6, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 2.0);
    osc.start();
    osc.stop(audioCtx.currentTime + 2.0);
  }
};

// Suppress PointerLock API errors from polluting the console
const originalConsoleError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('THREE.PointerLockControls: Unable to use Pointer Lock API')) return;
  if (typeof args[0] === 'string' && args[0].includes('Pointer lock cannot be acquired immediately')) return;
  originalConsoleError(...args);
};

if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && typeof event.reason.message === 'string' && event.reason.message.includes('Pointer lock cannot be acquired')) {
      event.preventDefault(); // Prevent standard error logging
    }
  });
}

const Taco = ({ startX, startZ }: { startX: number, startZ: number }) => {
  const ref = useRef<any>(null);
  useFrame(() => {
    if (ref.current) {
      ref.current.position.y -= 0.5;
      ref.current.rotation.x += 0.1;
      ref.current.rotation.y += 0.1;
    }
  });
  return (
    <group ref={ref} position={[startX, 30, startZ]}>
       <mesh>
         <boxGeometry args={[0.6, 0.2, 0.4]} />
         <meshStandardMaterial color="#facc15" />
       </mesh>
       <mesh position={[0, 0.1, 0]}>
         <boxGeometry args={[0.5, 0.1, 0.3]} />
         <meshStandardMaterial color="#ef4444" />
       </mesh>
       <mesh position={[0, 0.2, 0]}>
         <boxGeometry args={[0.5, 0.1, 0.3]} />
         <meshStandardMaterial color="#22c55e" />
       </mesh>
       <mesh position={[0, 0.3, 0]}>
         <boxGeometry args={[0.5, 0.1, 0.3]} />
         <meshStandardMaterial color="#713f12" />
       </mesh>
    </group>
  );
};

const SweetPotato = ({ startX, startZ }: { startX: number, startZ: number }) => {
  const ref = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.position.y -= delta * 15;
      ref.current.rotation.x += delta * 2;
      ref.current.rotation.z += delta * 2;
    }
  });

  return (
    <group ref={ref} position={[startX, 50, startZ]}>
      <mesh>
        <capsuleGeometry args={[0.3, 0.8, 4, 8]} />
        <meshStandardMaterial color="#f97316" />
      </mesh>
    </group>
  );
};

const JayTeacher = ({ startPos, onHit }: { startPos: [number, number, number], onHit: () => void }) => {
  const ref = useRef<THREE.Group>(null);
  const hasHit = useRef(false);

  useFrame((state, delta) => {
    if (ref.current && !hasHit.current) {
      if (ref.current.position.y > 0.5) {
        ref.current.position.y -= delta * 30; // Fall fast
        ref.current.rotation.x += delta * 5;
      } else {
        ref.current.position.y = 0.5;
        ref.current.rotation.x = 0;
        hasHit.current = true;
        onHit();
      }
    }
  });

  return (
    <group ref={ref} position={startPos}>
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[1, 2, 1]} />
        <meshStandardMaterial color="#3b82f6" />
      </mesh>
      <Html position={[0, 2.5, 0]} center>
        <div className="bg-blue-600 text-white font-bold px-2 py-1 rounded whitespace-nowrap text-xs border-2 border-white shadow-lg">
          Jay 선생님
        </div>
      </Html>
    </group>
  );
};

const ComputerFormula = ({ startPos, direction }: { startPos: [number, number, number], direction: [number, number, number] }) => {
  const ref = useRef<THREE.Group>(null);
  const formulas = ["O(N log N)", "E=mc²", "public static void main", "SELECT * FROM users", "console.log('Hello World')", "y = ax + b"];
  const [formula] = useState(formulas[Math.floor(Math.random() * formulas.length)]);

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.position.x += direction[0] * delta * 20;
      ref.current.position.y += direction[1] * delta * 20;
      ref.current.position.z += direction[2] * delta * 20;
    }
  });

  return (
    <group ref={ref} position={startPos}>
      <Html center>
        <div className="text-3xl font-black text-yellow-400 drop-shadow-md whitespace-nowrap pointer-events-none">
          {formula}
        </div>
      </Html>
    </group>
  );
};

const SweetPotatoRain = () => {
  const [potatoes, setPotatoes] = useState<{ id: number, x: number, z: number }[]>([]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setPotatoes(prev => {
        if (prev.length > 50) return prev.slice(prev.length - 50);
        return [...prev, { id: Math.random(), x: (Math.random() - 0.5) * 100, z: (Math.random() - 0.5) * 100 }];
      });
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {potatoes.map(p => (
        <SweetPotato key={p.id} startX={p.x} startZ={p.z} />
      ))}
    </>
  );
};

const RainTacos = () => {
  const [tacos, setTacos] = useState<{ id: number, x: number, z: number }[]>([]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setTacos(prev => {
        if (prev.length > 50) return prev.slice(prev.length - 50);
        return [...prev, { id: Math.random(), x: (Math.random() - 0.5) * 100, z: (Math.random() - 0.5) * 100 }];
      });
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {tacos.map(t => (
        <Taco key={t.id} startX={t.x} startZ={t.z} />
      ))}
    </>
  );
};

export default function App() {
  const { socket, players, emitMove, emitAttack, emitUpdateProfile, emitUpdateScore, emitChat } = useMultiplayer();
  const [scene, setScene] = useState<'combat' | 'village'>('combat');
  const [chatMessages, setChatMessages] = useState<{playerId: string, nickname: string, message: string, timestamp: number}[]>([]);
  const [isChatting, setIsChatting] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [showShop, setShowShop] = useState(false);
  const [weaponLevel, setWeaponLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const maxXp = level * 100;
  const [hp, setHp] = useState(200);
  const maxHp = 200 + (level * 20);
  const [energy, setEnergy] = useState(100);
  
  // Quests
  const [activeQuests, setActiveQuests] = useState([
    { id: 1, title: "슬라임 사냥", target: 5, current: 0, reward: 500, type: 'kill_slime' },
    { id: 2, title: "생존의 달인", target: 60, current: 0, reward: 1000, type: 'timer' },
    { id: 3, title: "대형 슬라임 처치", target: 20, current: 0, reward: 2000, type: 'kill_slime' },
    { id: 4, title: "극한의 생존", target: 300, current: 0, reward: 5000, type: 'timer' },
  ]);
  const [completedQuests, setCompletedQuests] = useState<number[]>([]);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showRewardMenu, setShowRewardMenu] = useState(false);
  const [availableRewards, setAvailableRewards] = useState<any[]>([]);
  const [ownedPets, setOwnedPets] = useState<string[]>([]);
  const [playerPos, setPlayerPos] = useState<[number, number, number]>([0, 0, 0]);
  const playerPosRef = useRef<[number, number, number]>([0, 0, 0]);
  const [playerRot, setPlayerRot] = useState<[number, number, number]>([0, 0, 0]);

  const [statPoints, setStatPoints] = useState(0);
  const [stats, setStats] = useState({
    str: 0, // Damage multiplier
    agi: 0, // Speed multiplier
    int: 0, // Energy regen
  });
  const [showStatMenu, setShowStatMenu] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [isFlying, setIsFlying] = useState(false);
  const [sizeModifier, setSizeModifier] = useState(1);
  const [isImprisoned, setIsImprisoned] = useState(false);
  
  // Admin Features
  const [isSlime, setIsSlime] = useState(false);
  const isGodModeRef = useRef(false);
  const [isGodModeUI, setIsGodModeUI] = useState(false);
  const hasShieldRef = useRef(false);
  const [hasShieldUI, setHasShieldUI] = useState(false);
  const noCooldownRef = useRef(false);
  const [noCooldownUI, setNoCooldownUI] = useState(false);
  const [isInvisible, setIsInvisible] = useState(false);
  const [isChicken, setIsChicken] = useState(false);
  const [isRagdoll, setIsRagdoll] = useState(false);
  const [isForcedDance, setIsForcedDance] = useState(false);
  const [tacoRainTimer, setTacoRainTimer] = useState(0);
  const [sweetPotatoRainTimer, setSweetPotatoRainTimer] = useState(0);
  const [earthquakeTimer, setEarthquakeTimer] = useState(0);
  const [jayTeacherEvents, setJayTeacherEvents] = useState<{ id: number, startPos: [number, number, number] }[]>([]);
  const [computerFormulas, setComputerFormulas] = useState<{ id: number, startPos: [number, number, number], direction: [number, number, number] }[]>([]);
  const [isNukeActive, setIsNukeActive] = useState(false);
  
  const [isSpiritBombActive, setIsSpiritBombActive] = useState(false);
  const [explosionEvent, setExplosionEvent] = useState<{ pos: [number, number, number], radius: number, damageMultiplier?: number, team?: string } | null>(null);

  const [isStarted, setIsStarted] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockCooldown, setLockCooldown] = useState(false);
  const lockCooldownTimer = useRef<any>(null);
  const lastUnlockTime = useRef(0);
  const controlsRef = useRef<any>(null);
  const [bossHp, setBossHp] = useState<number | null>(null);
  const [bossMaxHp, setBossMaxHp] = useState<number>(5000);
  const [isApocalypse, setIsApocalypse] = useState(false);
  const [systemMessage, setSystemMessage] = useState<{ text: string, color: string } | null>(null);
  const [showHitIndicator, setShowHitIndicator] = useState(false);
  const [isSniperAiming, setIsSniperAiming] = useState(false);
  const [domainText, setDomainText] = useState(false);
  const [isTimeStopped, setIsTimeStopped] = useState(false);
  const [theWorldText, setTheWorldText] = useState("");
  const [isVoidDashing, setIsVoidDashing] = useState(false);
  const [nickname, setNickname] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const [showAIPrompt, setShowAIPrompt] = useState(false);
  const [hasAIPartner, setHasAIPartner] = useState(false);
  const [isNPCDialogOpen, setIsNPCDialogOpen] = useState(false);

  const [petLasers, setPetLasers] = useState<{ id: number, startPos: [number, number, number], endPos: [number, number, number], color: string }[]>([]);
  const [enemySlashes, setEnemySlashes] = useState<{ id: number; pos: [number, number, number]; rot: number }[]>([]);
  const [enemyFugas, setEnemyFugas] = useState<{ id: number; pos: [number, number, number]; dir: [number, number, number] }[]>([]);
  const [enemyDomains, setEnemyDomains] = useState<{ id: number; pos: [number, number, number]; rot: number }[]>([]);
  const [bossCinematic, setBossCinematic] = useState<{ pos: [number, number, number], playerPos: [number, number, number], active: boolean } | null>(null);
  const [phase2Cinematic, setPhase2Cinematic] = useState<{ pos: [number, number, number], active: boolean } | null>(null);
  const [playerTrait, setPlayerTrait] = useState<'none'|'fire'|'ice'|'iron'|'assassin'|'vampire'|'lightning'|'berserker'|'pig'|'god'>('none');
  const [assassinSpeedStacks, setAssassinSpeedStacks] = useState(0);
  const [ironDefenseStacks, setIronDefenseStacks] = useState(0);
  const [isBerserk, setIsBerserk] = useState(false);
  const [pigStacks, setPigStacks] = useState(0);
  const [isLightningAura, setIsLightningAura] = useState(false);
  const playerTraitRef = useRef(playerTrait);
  useEffect(() => { playerTraitRef.current = playerTrait; }, [playerTrait]);

  const [combatSceneType, setCombatSceneType] = useState<'field' | 'castle' | 'shibuya'>('field');

  const [isAwakened, setIsAwakened] = useState(false);
  const isAwakenedRef = useRef(false);

  useEffect(() => {
    isAwakenedRef.current = isAwakened;
  }, [isAwakened]);

  useEffect(() => {
    if (tacoRainTimer > 0) {
      const timer = setTimeout(() => setTacoRainTimer(p => p - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [tacoRainTimer]);

  useEffect(() => {
    if (sweetPotatoRainTimer > 0) {
      const timer = setTimeout(() => setSweetPotatoRainTimer(p => p - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [sweetPotatoRainTimer]);

  useEffect(() => {
    if (earthquakeTimer > 0) {
      const timer = setTimeout(() => setEarthquakeTimer(p => p - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [earthquakeTimer]);

  useEffect(() => {
    const handleExplosion = (e: any) => {
      let mult = (e.detail.damageMultiplier || 1);
      if (isAwakenedRef.current && e.detail.team !== 'enemy') {
        mult *= 5;
      }
      if (isBerserk && e.detail.team !== 'enemy') {
        mult *= 2.5; // Berserker 2.5x damage
      }
      if (pigStacks > 0 && e.detail.team !== 'enemy') {
        mult *= (1 + pigStacks * 0.2); // Up to 2x at 5 stacks
      }
      setExplosionEvent({
        ...e.detail,
        damageMultiplier: mult,
        trait: e.detail.team !== 'enemy' ? playerTraitRef.current : 'none'
      });
      setTimeout(() => setExplosionEvent(null), 100);

      if (e.detail.team !== 'enemy') {
        if (playerTraitRef.current === 'iron') {
          setIronDefenseStacks(prev => prev + 1);
        }
      }
    };
    
    const handleBossHp = (e: any) => {
      setBossHp(e.detail.hp);
      if (e.detail.maxHp) setBossMaxHp(e.detail.maxHp);
    };

    const handleEnemyKilled = (e: any) => {
      handleKill(e);
      if (e.detail?.type === 'boss' && e.detail?.isPhase2Done) {
        setCombatSceneType('field');
      }
    };

    const handleApocalypse = (e: any) => {
      setIsApocalypse(e.detail.active);
    };

    const handleSystemMsg = (e: any) => {
      setSystemMessage({ text: e.detail.text, color: e.detail.color || "#ffffff" });
      setTimeout(() => setSystemMessage(null), 3000);
    };

    const handlePlayerDamage = (e: any) => {
      if (isGodModeRef.current || hasShieldRef.current) return;
      setHp(prev => {
         const defenseMult = 1 - Math.min(ironDefenseStacks * 0.01, 0.9);
         return Math.max(0, prev - (e.detail.amount || 1) * defenseMult);
      });
    };

    const handlePlayerHeal = (e: any) => {
      setHp(prev => Math.min(200, prev + e.detail.amount));
    };

    const handleLightningHit = () => {
      setIsLightningAura(true);
      setTimeout(() => setIsLightningAura(false), 500);
    };

    const handlePigAteSlime = () => {
      setPigStacks(prev => Math.min(5, prev + 1));
      
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.6);
        gain.gain.setValueAtTime(0.5, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
      }
      
      setSystemMessage({ text: "꺼억~ (슬라임 포식)", color: "#fcd34d" });
      setHp(prev => Math.min(200, prev + 30));
    };

    const handleExplosionDamageToPlayer = (e: any) => {
      // Assuming player is always at state.camera.position (handled in useFrame)
      // But we can't access frame state here easily without a ref.
      // Let's rely on the player component or just assume explosions from 'enemy' team damage player in App.tsx
      // Wait, App.tsx doesn't know player position easily without a ref.
    };

    const handleSniperHit = () => {
      setShowHitIndicator(true);
      setTimeout(() => setShowHitIndicator(false), 150);
    };

    const handleSniperAim = (e: any) => {
      setIsSniperAiming(e.detail.aiming);
    };

    const handleDomainTrigger = () => {
      setDomainText(true);
      setTimeout(() => setDomainText(false), 3000);
    };

    const handleNpcDialog = (e: any) => {
      setIsNPCDialogOpen(e.detail);
    };

    const handleEnemySlash = (e: any) => {
      const { pos, target } = e.detail;
      const id = Date.now() + Math.random();
      
      // Calculate rotation from pos to target
      const dx = target[0] - pos[0];
      const dz = target[2] - pos[2];
      const rot = Math.atan2(dx, dz);
      
      setEnemySlashes(prev => [...prev, { id, pos, rot }]);
      
      setTimeout(() => {
        setEnemySlashes(prev => prev.filter(s => s.id !== id));
        // Player takes heavy damage (assumes player was the target / slash hit them)
        window.dispatchEvent(new CustomEvent('playerDamage', { detail: { amount: 30 } }));
        playSound('hit');
      }, 500); // 500ms duration for QuickSlash visual
    };

    const handleEnemyFuga = (e: any) => {
      const { pos, target } = e.detail;
      const id = Date.now() + Math.random();
      
      const dx = target[0] - pos[0];
      const dy = target[1] - pos[1];
      const dz = target[2] - pos[2];
      const len = Math.sqrt(dx*dx + dy*dy + dz*dz) || 1;
      const dir: [number, number, number] = [dx/len, dy/len, dz/len];
      
      setEnemyFugas(prev => [...prev, { id, pos, dir }]);
      
      // The `FireArrow` projectile will take 3-4 seconds to explode.
      // But we can trigger global bombExplode at the target approx 2 seconds later.
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('bombExplode', { 
           detail: { pos: target, radius: 10, damageMultiplier: 4, team: 'enemy' } 
        }));
        setEnemyFugas(prev => prev.filter(f => f.id !== id));
      }, 3000); 
    };

    const handleEnemyDomain = (e: any) => {
      setDomainText(true);
      setTimeout(() => setDomainText(false), 3000);
      
      const id = Date.now() + Math.random();
      setEnemyDomains(prev => [...prev, { id, pos: e.detail.pos, rot: 0 }]);

      // Domain lifespan is handled by onFinish of the DomainExpansion component
      // But we will also dispatch continuous damage here for 13 seconds since The Malevolent Shrine lasts 13 sec
      for (let i = 0; i < 26; i++) {
        setTimeout(() => {
           window.dispatchEvent(new CustomEvent('playerDamage', { detail: { amount: 15 } }));
           playSound('hit');
        }, i * 500);
      }
    };

    const handleBossSpawnCinematic = (e: any) => {
      setBossCinematic({ pos: e.detail.pos, playerPos: [0,0,0], active: true }); 
      setCombatSceneType('castle');
      playSound('bassDrop');
    };

    const handlePhase2Cinematic = (e: any) => {
      setPhase2Cinematic({ pos: e.detail.pos, active: true });
      setCombatSceneType('shibuya');
      playSound('bassDrop');
    };

    const handleItemPicked = (e: any) => {
      const { type } = e.detail;
      if (type === 'heal') {
        setHp(prev => Math.min(maxHp, prev + 50));
        setSystemMessage({ text: "HP 회복!", color: "#4ade80" });
      } else if (type === 'energy') {
        setEnergy(prev => Math.min(100 + (stats.int * 5), prev + 40));
        setSystemMessage({ text: "에너지 충전!", color: "#fbbf24" });
      } else if (type === 'stat') {
        setStatPoints(prev => prev + 1);
        setSystemMessage({ text: "스탯 포인트 획득!", color: "#8b5cf6" });
      }
      setTimeout(() => setSystemMessage(null), 1500);
    };

    const handlePetAttack = (e: any) => {
      // Find a position to attack - for now just near player or let's say it targets a random enemy via event
      // To make it real, we'll dispatch an event that SlimeSpawner listens to
      window.dispatchEvent(new CustomEvent('requestPetTarget', { detail: { pos: e.detail.pos, color: e.detail.color } }));
    };

    const handleTheWorldTrigger = () => {
      setTheWorldText("더 월드");
      setIsTimeStopped(true);
      (window as any).isTimeStopped = true;
      
      setTimeout(() => {
        setTheWorldText("시간은 다시 흐른다");
        setTimeout(() => {
          setTheWorldText("");
          setIsTimeStopped(false);
          (window as any).isTimeStopped = false;
        }, 1500);
      }, 5000); 
    };

    const handlePlayerMove = (e: any) => {
      playerPosRef.current = e.detail.pos;
      setPlayerPos(e.detail.pos);
      if (e.detail.rot) setPlayerRot(e.detail.rot);
    };

    const handlePetShootVisual = (e: any) => {
      playSound('laser');
      setPetLasers(prev => [...prev.slice(-10), {
        id: Math.random() * 1000000 + Date.now(),
        startPos: e.detail.startPos,
        endPos: e.detail.endPos,
        color: e.detail.color
      }]);
    };

    const handlePlaySound = (e: any) => {
      playSound(e.detail.type);
    };

    const handleChatMessage = (e: any) => {
      setChatMessages(prev => [...prev.slice(-20), e.detail]);
    };

    const handleVoidDashStart = () => setIsVoidDashing(true);
    const handleVoidDashEnd = () => setIsVoidDashing(false);

    const handleRemoteAttack = (e: any) => {
      const { type, action, pos, active } = e.detail;
      if (type === 'adminAction') {
        if (action === 'killAll') {
          // Explode everywhere
          window.dispatchEvent(new CustomEvent('bombExplode', { detail: { pos: [0,0,0], radius: 9999, damageMultiplier: 9999, team: 'admin' } }));
        } else if (action === 'imprison') {
          setIsImprisoned(true);
          setSystemMessage({ text: "관리자에 의해 감옥에 갇혔습니다!", color: "#ef4444" });
          setTimeout(() => setIsImprisoned(false), 10000); // 10 seconds prison
        } else if (action === 'pull' && pos) {
          window.dispatchEvent(new CustomEvent('adminPull', { detail: { pos } }));
          setSystemMessage({ text: "관리자에 의해 강제 소환되었습니다!", color: "#8b5cf6" });
        } else if (action === 'apocalypse') {
          setIsApocalypse(active);
          window.dispatchEvent(new CustomEvent('apocalypseTrigger', { detail: { active } }));
        } else if (action === 'rainTacos') {
          window.dispatchEvent(new CustomEvent('rainTacos'));
          setSystemMessage({ text: "하늘에서 타코가 내립니다! 🌮", color: "#facc15" });
        } else if (action === 'danceAll') {
          window.dispatchEvent(new CustomEvent('adminDance'));
          setSystemMessage({ text: "춤을 멈출 수 없습니다! 💃", color: "#ec4899" });
        } else if (action === 'chickenAll') {
          window.dispatchEvent(new CustomEvent('adminChicken'));
          setSystemMessage({ text: "당신은 이제 닭입니다! 꼬꼬! 🐔", color: "#fb923c" });
        } else if (action === 'ragdollAll') {
          window.dispatchEvent(new CustomEvent('adminRagdoll'));
          setSystemMessage({ text: "으아악! 🤸", color: "#9ca3af" });
        } else if (action === 'explodeAll') {
          window.dispatchEvent(new CustomEvent('bombExplode', { detail: { pos: [0,0,0], radius: 9999, damageMultiplier: 9999, team: 'admin' } }));
          setSystemMessage({ text: "펑! 💥", color: "#ef4444" });
        } else if (action === 'nuke') {
          window.dispatchEvent(new CustomEvent('adminNuke'));
        } else if (action === 'serverMessage') {
          window.dispatchEvent(new CustomEvent('showSystemMessage', { detail: { text: `[서버 공지] ${e.detail.text}`, color: "#facc15" } }));
          window.dispatchEvent(new CustomEvent('playSound', { detail: 'levelUp' }));
        }
      }
    };

    window.addEventListener('remoteAttack', handleRemoteAttack);
    window.addEventListener('voidDashStart', handleVoidDashStart);
    window.addEventListener('voidDashEnd', handleVoidDashEnd);
    window.addEventListener('bombExplode', handleExplosion);
    window.addEventListener('yinYangExplode', handleExplosion);
    window.addEventListener('bossUpdateHp', handleBossHp);
    window.addEventListener('enemyKilled', handleEnemyKilled);
    window.addEventListener('apocalypseTrigger', handleApocalypse);
    window.addEventListener('showSystemMessage', handleSystemMsg);
    window.addEventListener('playerDamage', handlePlayerDamage);
    window.addEventListener('playerHeal', handlePlayerHeal);
    window.addEventListener('lightningHit', handleLightningHit);
    window.addEventListener('pigAteSlime', handlePigAteSlime);
    window.addEventListener('sniperHit', handleSniperHit);
    window.addEventListener('sniperAim', handleSniperAim);
    window.addEventListener('domainTrigger', handleDomainTrigger);
    window.addEventListener('npcDialog', handleNpcDialog);
    window.addEventListener('enemySlash', handleEnemySlash);
    window.addEventListener('enemyFuga', handleEnemyFuga);
    window.addEventListener('enemyDomain', handleEnemyDomain);
    window.addEventListener('bossSpawnCinematic', handleBossSpawnCinematic);
    window.addEventListener('bossPhase2Cinematic', handlePhase2Cinematic);
    window.addEventListener('theWorldTrigger', handleTheWorldTrigger);
    window.addEventListener('itemPicked', handleItemPicked);
    window.addEventListener('playerMove', handlePlayerMove);
    window.addEventListener('petAttack', handlePetAttack);
    window.addEventListener('petShootVisual', handlePetShootVisual);
    window.addEventListener('playSound', handlePlaySound);
    window.addEventListener('chatMessage', handleChatMessage);
    
    const handleAdminDance = () => { setIsForcedDance(true); setTimeout(() => setIsForcedDance(false), 10000); };
    const handleAdminChicken = () => { setIsChicken(true); setTimeout(() => setIsChicken(false), 15000); };
    const handleAdminRagdoll = () => { setIsRagdoll(true); setTimeout(() => setIsRagdoll(false), 5000); };
    const handleRainTacos = () => { setTacoRainTimer(15); }; // 15 seconds of taco rain
    const handleAdminNuke = () => {
      setSystemMessage({ text: "⚠️ 3초 후 핵폭탄이 투하됩니다! ⚠️", color: "#ef4444" });
      setTimeout(() => {
        setIsNukeActive(true);
        window.dispatchEvent(new CustomEvent('bombExplode', { detail: { pos: [0, 0, 0], radius: 9999, damageMultiplier: 9999, team: 'admin' } }));
        setTimeout(() => setIsNukeActive(false), 3000);
      }, 3000);
    };
    
    window.addEventListener('adminDance', handleAdminDance);
    window.addEventListener('adminChicken', handleAdminChicken);
    window.addEventListener('adminRagdoll', handleAdminRagdoll);
    window.addEventListener('rainTacos', handleRainTacos);
    window.addEventListener('adminNuke', handleAdminNuke);

    return () => {
      window.removeEventListener('adminDance', handleAdminDance);
      window.removeEventListener('adminChicken', handleAdminChicken);
      window.removeEventListener('adminRagdoll', handleAdminRagdoll);
      window.removeEventListener('rainTacos', handleRainTacos);
      window.removeEventListener('adminNuke', handleAdminNuke);
      window.removeEventListener('remoteAttack', handleRemoteAttack);
      window.removeEventListener('voidDashStart', handleVoidDashStart);
      window.removeEventListener('voidDashEnd', handleVoidDashEnd);
      window.removeEventListener('bombExplode', handleExplosion);
      window.removeEventListener('yinYangExplode', handleExplosion);
      window.removeEventListener('bossUpdateHp', handleBossHp);
      window.removeEventListener('enemyKilled', handleEnemyKilled);
      window.removeEventListener('apocalypseTrigger', handleApocalypse);
      window.removeEventListener('showSystemMessage', handleSystemMsg);
      window.removeEventListener('playerDamage', handlePlayerDamage);
      window.removeEventListener('playerHeal', handlePlayerHeal);
      window.removeEventListener('lightningHit', handleLightningHit);
      window.removeEventListener('pigAteSlime', handlePigAteSlime);
      window.removeEventListener('sniperHit', handleSniperHit);
      window.removeEventListener('sniperAim', handleSniperAim);
      window.removeEventListener('domainTrigger', handleDomainTrigger);
      window.removeEventListener('npcDialog', handleNpcDialog);
      window.removeEventListener('enemySlash', handleEnemySlash);
      window.removeEventListener('enemyFuga', handleEnemyFuga);
      window.removeEventListener('enemyDomain', handleEnemyDomain);
      window.removeEventListener('bossSpawnCinematic', handleBossSpawnCinematic);
      window.removeEventListener('bossPhase2Cinematic', handlePhase2Cinematic);
      window.removeEventListener('theWorldTrigger', handleTheWorldTrigger);
      window.removeEventListener('itemPicked', handleItemPicked);
      window.removeEventListener('playerMove', handlePlayerMove);
      window.removeEventListener('petAttack', handlePetAttack);
      window.removeEventListener('petShootVisual', handlePetShootVisual);
      window.removeEventListener('playSound', handlePlaySound);
      window.removeEventListener('chatMessage', handleChatMessage);
    };
  }, [maxHp, stats.int]);

  const [shopPurchases, setShopPurchases] = useState({ suit: false, gauntlet: false, jarvis: false });
  const hasAllIronmanItems = shopPurchases.suit && shopPurchases.gauntlet && shopPurchases.jarvis;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Chat Toggle
      if ((e.key === 't' || e.key === 'T') && isJoined && isStarted) {
        if (!isChatting && document.activeElement?.tagName !== 'INPUT') {
          setIsChatting(true);
          document.exitPointerLock?.();
          // Small delay to allow focus without typing 't'
          setTimeout(() => {
             const chatInputEl = document.getElementById('chat-input') as HTMLInputElement;
             if (chatInputEl) chatInputEl.focus();
          }, 50);
          e.preventDefault();
        }
      }

      if (document.activeElement?.tagName === 'INPUT') return;
      
      // Special actions
      if (e.key.toLowerCase() === 'h' && isStarted) {
        setSweetPotatoRainTimer(15);
        window.dispatchEvent(new CustomEvent('showSystemMessage', { detail: { text: "호박고구마비가 내립니다!", color: "#f97316" } }));
      }
      
      if (e.key.toLowerCase() === 'u' && isStarted) {
        setEarthquakeTimer(5);
        window.dispatchEvent(new CustomEvent('showSystemMessage', { detail: { text: "대지진이 발생했습니다!", color: "#ef4444" } }));
        window.dispatchEvent(new CustomEvent('playSound', { detail: 'bassDrop' }));
      }
      
      if (e.key.toLowerCase() === 'j' && isStarted && nickname === '조찬우') {
        const id = Math.random();
        setJayTeacherEvents(prev => [...prev, { id, startPos: [playerPosRef.current[0], playerPosRef.current[1] + 30, playerPosRef.current[2]] }]);
        window.dispatchEvent(new CustomEvent('showSystemMessage', { detail: { text: "Jay 선생님이 나타났습니다!", color: "#3b82f6" } }));
      }

      // Tab to change perspective
      if (e.code === 'Tab' && isJoined) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('toggleThirdPerson'));
      }
      
      if (e.key === 'Shift' && isStarted) {
         if (playerTraitRef.current === 'pig') {
           setPlayerTrait('god');
           playSound('bassDrop');
           setSystemMessage({ text: "신성한 각성! (어드민 패널 개방)", color: "#fbbf24" });
           setShowAdminPanel(true);
           document.exitPointerLock?.();
         } else if (playerTraitRef.current === 'god') {
           setShowAdminPanel(prev => !prev);
           if (!showAdminPanel) {
             document.exitPointerLock?.();
           }
         } else if (hasAllIronmanItems) {
           window.dispatchEvent(new CustomEvent('ironmanSnap'));
           playSound('bassDrop');
           setSystemMessage({ text: "I am Iron Man... (핑거 스냅!)", color: "#ffb347" });
           setTimeout(() => setSystemMessage(null), 3000);
         }
      }

      // 2. Shop Interaction & Awakening
      if (e.key.toLowerCase() === 'e' && isStarted) {
        if (scene === 'village' && !showShop && Math.hypot(playerPos[0] - 15, playerPos[2] - -15) < 10) {
          setShowShop(true);
          document.exitPointerLock?.();
        } else if (scene === 'combat') {
          if (playerTraitRef.current === 'berserker') {
            setIsBerserk(prev => {
              const next = !prev;
              if (next) {
                playSound('bassDrop');
                setSystemMessage({ text: "버서커 폭주! (화염 강화)", color: "#ef4444" });
                setHp(prev => prev + 50);
              } else {
                setSystemMessage({ text: "폭주 해제", color: "#ffffff" });
              }
              return next;
            });
          } else if (playerTraitRef.current === 'pig' && nickname === '조찬우') {
            window.dispatchEvent(new CustomEvent('pigEatSlime'));
          } else {
            setIsAwakened(prev => {
              const next = !prev;
              if (next) {
                playSound('bassDrop');
                setSystemMessage({ text: "우주적 각성! (Cosmic Awakening)", color: "#a855f7" });
              } else {
                setSystemMessage({ text: "각성 해제", color: "#ffffff" });
              }
              return next;
            });
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [scene, showShop, isStarted, isJoined, isChatting]);

  // Quest Timer
  useEffect(() => {
    if (!isStarted) return;
    const timer = setInterval(() => {
      setActiveQuests(quests => quests.map(q => {
        if (q.type === 'timer' && !completedQuests.includes(q.id)) {
          const next = q.current + 1;
          if (next >= q.target) {
            handleQuestComplete(q);
          }
          return { ...q, current: Math.min(q.target, next) };
        }
        return q;
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, [isStarted, completedQuests]);

  const selectReward = (reward: any) => {
    if (reward.type === 'pet') {
      setOwnedPets(prev => [...prev, reward.value]);
    } else if (reward.type === 'buff') {
      if (reward.value === 'regen') setStats(s => ({ ...s, int: s.int + 5 }));
      if (reward.value === 'hp') setHp(h => h + 100);
      if (reward.value === 'speed') setStats(s => ({ ...s, agi: s.agi + 5 }));
    }
    setShowRewardMenu(false);
    setSystemMessage({ text: `${reward.title} 획득!`, color: "#fbbf24" });
    setTimeout(() => setSystemMessage(null), 2000);
  };

  const handleQuestComplete = (quest: any) => {
    setCompletedQuests(prev => [...prev, quest.id]);
    setScore(prev => prev + quest.reward);
    emitUpdateScore(quest.reward);
    setXp(prev => {
      const newXp = prev + quest.reward * 0.5;
      // Already handled in handleKill's setXp logic, but let's just add it directly here for quests
      return newXp; 
    });
    setSystemMessage({ text: `퀘스트 완료: ${quest.title}!`, color: "#4ade80" });
    setTimeout(() => setSystemMessage(null), 3000);
  };

  // Energy regeneration
  useEffect(() => {
    const timer = setInterval(() => {
      const regenRate = 0.5 + (stats.int * 0.1);
      const maxEnergy = 100 + (stats.int * 5) + (level * 2);
      setEnergy(prev => Math.min(maxEnergy, prev + regenRate));
    }, 100);
    return () => clearInterval(timer);
  }, [stats.int, level]);

  const incrementScore = useCallback(() => {
    setScore(s => s + 100);
    emitUpdateScore(100);
  }, [emitUpdateScore]);

  const handleKill = useCallback((e: any) => {
    const xpGain = e.detail.xp || 10;
    
    if (playerTraitRef.current === 'assassin') {
       setAssassinSpeedStacks(prev => prev + 1);
    }
    
    // Progress Kill Quest
    setActiveQuests(quests => quests.map(q => {
      if (q.type === 'kill_slime' && !completedQuests.includes(q.id)) {
        const next = q.current + 1;
        if (next >= q.target) {
          handleQuestComplete(q);
        }
        return { ...q, current: Math.min(q.target, next) };
      }
      return q;
    }));

    setXp(prev => {
      const newXp = prev + xpGain;
      if (newXp >= maxXp) {
        setLevel(l => l + 1);
        setStatPoints(p => p + 3);
        setHp(prevHp => Math.min(maxHp + 50, prevHp + 50)); 
        setShowLevelUp(true);
        
        // Prepare Rewards
        const rewardsPool = [
          { id: 'pet_dragon', title: '화염용의 아기', desc: '자동으로 적을 추적 공격합니다.', type: 'pet', icon: '🐲', value: 'dragon' },
          { id: 'pet_robot', title: '수호 로봇', desc: '플레이어를 지키며 레이저를 쏩니다.', type: 'pet', icon: '🤖', value: 'robot' },
          { id: 'skill_super_regen', title: '초재생능력', desc: '에너지 재생 효율이 2x 증가합니다.', type: 'buff', icon: '🔋', value: 'regen' },
          { id: 'skill_shield', title: '강철 피부', desc: '최대 체력이 100 증가합니다.', type: 'buff', icon: '🛡️', value: 'hp' },
          { id: 'skill_haste', title: '신속', desc: '이동 속도가 영구히 증가합니다.', type: 'buff', icon: '👟', value: 'speed' },
        ];
        // Pick 3 random
        const shuffled = [...rewardsPool].sort(() => 0.5 - Math.random());
        const selectedReward = shuffled[0]; // Auto select the first one
        
        setTimeout(() => {
          setShowLevelUp(false);
          // Automatically apply the reward instead of showing menu
          if (selectedReward.type === 'pet') {
            setOwnedPets(prev => [...prev, selectedReward.value]);
          } else if (selectedReward.type === 'buff') {
            if (selectedReward.value === 'regen') setStats(s => ({ ...s, int: s.int + 5 }));
            if (selectedReward.value === 'hp') setHp(h => h + 100);
            if (selectedReward.value === 'speed') setStats(s => ({ ...s, agi: s.agi + 5 }));
          }
          window.dispatchEvent(new CustomEvent('showSystemMessage', { 
            detail: { text: `${selectedReward.title} 획득!`, color: "#fbbf24" } 
          }));
        }, 2000);

        window.dispatchEvent(new CustomEvent('showSystemMessage', { 
          detail: { text: `LEVEL UP! Level ${level + 1}`, color: "#fbbf24" } 
        }));
        return 0;
      }
      return newXp;
    });
    setScore(prev => prev + xpGain);
    emitUpdateScore(xpGain);
  }, [maxXp, level, maxHp, emitUpdateScore]);

  const useEnergy = useCallback((amount: number) => {
    if (noCooldownRef.current) return;
    setEnergy(prev => Math.max(0, prev - amount));
  }, []);

  useEffect(() => {
    if (noCooldownUI) {
      setEnergy(9999);
    }
  }, [noCooldownUI]);

  const triggerSpiritBomb = useCallback(() => {
    if (energy < 80) return;
    useEnergy(80);
    setIsSpiritBombActive(true);
    setTimeout(() => setIsSpiritBombActive(false), 4000);
  }, [energy, useEnergy]);

  return (
    <div className="w-full h-screen bg-black overflow-hidden relative font-sans">
      <Canvas shadows camera={{ fov: 45, position: [0, 5, 10] }}>
        <Suspense fallback={null}>
          {isApocalypse ? (
            <>
              <color attach="background" args={["#450a0a"]} />
              <fog attach="fog" args={["#450a0a", 5, 50]} />
              <ambientLight intensity={0.2} color="#ff0000" />
              <pointLight position={[10, 20, 10]} intensity={5} color="#ff0000" />
            </>
          ) : (
            <>
              <Sky sunPosition={[100, 20, 100]} />
              <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
              <ambientLight intensity={0.5} />
              <pointLight position={[10, 10, 10]} castShadow intensity={1.5} />
            </>
          )}
          <Environment preset={isApocalypse ? "sunset" : "night"} />
          
          <Physics gravity={[0, -9.81, 0]}>
            <Player 
              onShoot={() => useEnergy(5)} 
              onThrowBomb={() => useEnergy(20)}
              onUseEnergy={useEnergy}
              onSpiritBomb={triggerSpiritBomb} 
              energy={energy} 
              emitMove={emitMove}
              emitAttack={emitAttack}
              players={players}
              stats={{...stats, agi: stats.agi + (playerTraitRef.current === 'assassin' ? assassinSpeedStacks * 2 : 0) + (isBerserk ? 5 : 0)}}
              isAwakened={isAwakened}
              isBerserk={isBerserk}
              pigStacks={pigStacks}
              isLightningAura={isLightningAura}
              sizeModifier={sizeModifier}
              isFlying={isFlying}
              isImprisoned={isImprisoned}
              isSlime={isSlime}
              hasShield={hasShieldUI}
              noCooldown={noCooldownUI}
              isInvisible={isInvisible}
              isChicken={isChicken}
              isRagdoll={isRagdoll}
              isForcedDance={isForcedDance}
              isEarthquake={earthquakeTimer > 0}
            />
            
            {ownedPets.map((p, i) => (
              <Pet key={i} playerPos={playerPos} type={p as any} />
            ))}

            {petLasers.map((l) => (
              <PetLaser 
                key={l.id} 
                startPos={l.startPos} 
                endPos={l.endPos} 
                color={l.color} 
                onFinish={() => setPetLasers(prev => prev.filter(item => item.id !== l.id))} 
              />
            ))}

            {enemySlashes.map((s) => (
              <QuickSlash
                key={s.id}
                position={s.pos}
                rotation={s.rot}
                team="enemy"
                onFinish={() => {}}
              />
            ))}

            {enemyFugas.map((f) => (
              <FireArrow
                key={f.id}
                position={f.pos}
                direction={f.dir}
                team="enemy"
              />
            ))}

            {enemyDomains.map(d => (
              <DomainExpansion
                key={d.id}
                position={d.pos}
                rotation={d.rot}
                onFinish={() => setEnemyDomains(prev => prev.filter(x => x.id !== d.id))}
              />
            ))}

            {players.map((p, i) => (
              <OtherPlayer key={p.id || `p_${i}`} id={p.id} player={p} />
            ))}

            {scene === 'combat' ? (
              <>
                {combatSceneType === 'field' && (
                  <>
                    <Ground />
                    <Level />
                  </>
                )}
                {combatSceneType === 'castle' && <CastleLevel />}
                {combatSceneType === 'shibuya' && <ShibuyaLevel />}
                
                {isStarted && <SlimeSpawner playerPos={playerPos} playerRot={playerRot} hasAIPartner={hasAIPartner} onKill={(xp: number) => window.dispatchEvent(new CustomEvent('enemyKilled', { detail: { xp } }))} isSpiritBombActive={isSpiritBombActive} explosionEvent={explosionEvent} />}
              </>
            ) : (
              <VillageLevel />
            )}
          </Physics>

          {bossCinematic?.active && (
            <CinematicCamera targetPos={bossCinematic.pos} onFinish={() => setBossCinematic(null)} />
          )}
          {phase2Cinematic?.active && (
            <Phase2CinematicCamera targetPos={phase2Cinematic.pos} onFinish={() => setPhase2Cinematic(null)} />
          )}
          {tacoRainTimer > 0 && <RainTacos />}
          {sweetPotatoRainTimer > 0 && <SweetPotatoRain />}

          {jayTeacherEvents.map(j => (
            <JayTeacher key={j.id} startPos={j.startPos} onHit={() => {
              // Shoot formulas when hitting the ground
              const newFormulas = [];
              for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                newFormulas.push({
                  id: Math.random(),
                  startPos: [j.startPos[0], 1.5, j.startPos[2]] as [number, number, number],
                  direction: [Math.cos(angle), 0, Math.sin(angle)] as [number, number, number]
                });
              }
              setComputerFormulas(prev => [...prev, ...newFormulas]);
              window.dispatchEvent(new CustomEvent('bombExplode', { detail: { pos: [j.startPos[0], 0, j.startPos[2]], radius: 15, damageMultiplier: 5, team: 'player' } }));
              window.dispatchEvent(new CustomEvent('playSound', { detail: 'explosion' }));
              
              // Remove the teacher after 2 seconds
              setTimeout(() => {
                setJayTeacherEvents(prev => prev.filter(p => p.id !== j.id));
              }, 2000);

              // Remove formulas after 3 seconds
              setTimeout(() => {
                setComputerFormulas(prev => prev.filter(f => !newFormulas.find(nf => nf.id === f.id)));
              }, 3000);
            }} />
          ))}

          {computerFormulas.map(c => (
            <ComputerFormula key={c.id} startPos={c.startPos} direction={c.direction} />
          ))}
          <PointerLockControls 
            ref={controlsRef}
            onLock={() => { setIsLocked(true); setIsStarted(true); }} 
            onUnlock={() => {
              setIsLocked(false);
              setLockCooldown(true);
              lastUnlockTime.current = Date.now();
              if (lockCooldownTimer.current) clearTimeout(lockCooldownTimer.current);
              lockCooldownTimer.current = setTimeout(() => setLockCooldown(false), 1500);
            }} 
          />
        </Suspense>
      </Canvas>

      {/* Cinematic UI Overlay */}
      <AnimatePresence>
        {bossCinematic?.active && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 1 } }}
            className="absolute inset-0 z-50 pointer-events-none flex flex-col justify-center items-center"
          >
            {/* Cinematic Bars */}
            <motion.div 
               initial={{ y: "-100%" }} 
               animate={{ y: 0 }} 
               exit={{ y: "-100%", transition: { duration: 1 } }}
               className="absolute top-0 w-full h-32 bg-black opacity-90 shadow-[0_10px_20px_rgba(0,0,0,0.8)]" 
            />
            <motion.div 
               initial={{ y: "100%" }} 
               animate={{ y: 0 }} 
               exit={{ y: "100%", transition: { duration: 1 } }}
               className="absolute bottom-0 w-full h-32 bg-black opacity-90 shadow-[0_-10px_20px_rgba(0,0,0,0.8)]" 
            />
            
            {/* Warning Text */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.2, opacity: 0, transition: { duration: 0.5 } }}
              transition={{ type: "spring", stiffness: 100, damping: 10, delay: 0.5 }}
              className="relative z-10"
            >
               <h1 className="text-6xl md:text-8xl font-black text-red-600 tracking-[0.2em] uppercase drop-shadow-[0_0_20px_rgba(220,38,38,1)] text-center font-mono">
                  WARNING<br/>
                  <span className="text-4xl md:text-6xl text-red-400 mt-4 block tracking-[0.3em]">대악마 강림</span>
               </h1>
            </motion.div>
            
            {/* Red Pulse Overlay */}
            <motion.div 
              animate={{ opacity: [0, 0.3, 0] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="absolute inset-0 bg-red-900 mix-blend-color-burn" 
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8">
        {/* Boss HP Bar */}
        <AnimatePresence>
          {bossHp !== null && bossHp > 0 && (
            <motion.div 
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -100, opacity: 0 }}
              className="absolute top-8 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4"
            >
              <div className="bg-black/60 backdrop-blur-xl border border-red-500/80 p-4 rounded-2xl shadow-[0_0_50px_rgba(255,0,0,0.4)]">
                <div className="flex justify-between items-end mb-2">
                  <div className="text-red-600 font-black text-2xl tracking-tighter uppercase italic flex items-center gap-2 animate-pulse">
                    <span className="w-3 h-3 bg-red-600 rounded-full animate-ping" />
                    DESTINY BREAKER: ARCH-DEMON
                  </div>
                  <div className="text-white font-mono font-bold">{Math.ceil((bossHp / bossMaxHp) * 100)}%</div>
                </div>
                <div className="h-6 bg-gray-900 rounded-full overflow-hidden border-2 border-red-900 p-1">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-red-800 via-red-600 to-orange-600 rounded-full shadow-[0_0_20px_rgba(255,0,0,0.6)]"
                    initial={{ width: '100%' }}
                    animate={{ width: `${(bossHp / bossMaxHp) * 100}%` }}
                    transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showLevelUp && (
            <motion.div
              initial={{ scale: 0, rotate: -20, opacity: 0 }}
              animate={{ scale: 1.2, rotate: 0, opacity: 1 }}
              exit={{ scale: 2, opacity: 0 }}
              className="fixed inset-0 flex items-center justify-center z-[200] pointer-events-none"
            >
              <div className="relative">
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="absolute inset-0 bg-yellow-400 blur-3xl rounded-full"
                />
                <h1 className="text-9xl font-[900] italic text-white drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] tracking-tighter uppercase relative">
                  LEVEL <span className="text-yellow-400">UP</span>
                </h1>
                <div className="text-white text-center font-bold text-2xl tracking-widest mt-4 bg-black/50 py-2 rounded-full border border-white/20">
                  얻은 포인트: <span className="text-yellow-400">+3 STATS</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* System Message UI */}
        <AnimatePresence>
          {systemMessage && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 1.2 }}
              className="fixed bottom-1/4 left-1/2 -translate-x-1/2 z-[100] pointer-events-none"
            >
              <div 
                className="px-8 py-4 rounded-xl border-4 border-white/50 bg-black/80 backdrop-blur-md shadow-2xl"
                style={{ borderColor: systemMessage.color }}
              >
                <h2 className="text-4xl font-extrabold italic text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
                  {systemMessage.text}
                </h2>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reward Selection Menu Removed */}

        {/* Apocalypse Overlay */}
        {isApocalypse && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            className="fixed inset-0 bg-red-900 pointer-events-none z-40"
          />
        )}

        {/* Stat Menu */}
        <AnimatePresence>
          {showStatMenu && (
            <motion.div 
              initial={{ x: 300, opacity: 0, scale: 0.8 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              exit={{ x: 300, opacity: 0, scale: 0.8 }}
              className="fixed right-8 top-1/2 -translate-y-1/2 w-80 bg-gradient-to-br from-blue-900/90 to-black/90 backdrop-blur-2xl border-4 border-blue-400/50 p-8 rounded-[2rem] shadow-[0_0_50px_rgba(59,130,246,0.3)] z-[150] pointer-events-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-white font-[900] text-2xl italic uppercase tracking-tighter">PLAYER STATUS</h3>
                <div className="bg-yellow-400 text-black px-2 py-0.5 rounded-lg text-xs font-black italic">POINTS: {statPoints}</div>
              </div>

              <div className="space-y-6">
                {[
                  { id: 'str', name: 'STR (근력)', desc: '공격력 및 범위 증가', icon: '⚔️', color: 'bg-red-500', shadow: 'shadow-red-500/50' },
                  { id: 'agi', name: 'AGI (민첩)', desc: '이동 속도 증가', icon: '💨', color: 'bg-green-500', shadow: 'shadow-green-500/50' },
                  { id: 'int', name: 'INT (지력)', desc: '에너지 재생 및 스킬 강화', icon: '🌀', color: 'bg-blue-500', shadow: 'shadow-blue-500/50' },
                ].map(stat => (
                  <div key={stat.id} className="relative group">
                    <div className="flex justify-between items-end mb-1">
                      <div className="flex flex-col">
                        <span className="text-white font-black text-sm flex items-center gap-2">
                          {stat.icon} {stat.name}
                        </span>
                        <span className="text-white/40 text-[9px] uppercase font-bold">{stat.desc}</span>
                      </div>
                      <span className="text-3xl text-white font-black italic tracking-tighter leading-none">{stats[stat.id as keyof typeof stats]}</span>
                    </div>
                    
                    {statPoints > 0 && (
                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setStats(prev => ({ ...prev, [stat.id]: prev[stat.id as keyof typeof stats] + 1 }));
                          setStatPoints(p => p - 1);
                        }}
                        className={`w-full py-2 mt-2 ${stat.color} ${stat.shadow} shadow-lg rounded-xl text-white text-xs font-black uppercase tracking-widest transition-all hover:brightness-110`}
                      >
                        UPGRADE +
                      </motion.button>
                    )}
                  </div>
                ))}
              </div>

              <button 
                onClick={() => setShowStatMenu(false)}
                className="w-full mt-8 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl text-white font-black text-sm uppercase tracking-tighter transition-all"
              >
                닫기 (CLOSE)
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* UI Overlay Content */}
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-4">
            <motion.div 
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="bg-black/50 backdrop-blur-md p-4 border border-blue-500/30 rounded-xl"
            >
              <div className="text-blue-400 text-xs uppercase tracking-widest font-bold mb-1">처치 수</div>
              <div className="text-4xl text-white font-black tabular-nums">{score.toLocaleString()}</div>
            </motion.div>

            {/* Quests UI */}
            <motion.div 
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="bg-black/50 backdrop-blur-md p-4 border border-green-500/30 rounded-xl w-64"
            >
              <div className="flex items-center gap-2 mb-3">
                <ScrollText className="w-4 h-4 text-green-400" />
                <div className="text-green-400 text-xs uppercase tracking-widest font-bold">퀘스트 (QUESTS)</div>
              </div>
              <div className="space-y-3">
                {activeQuests.map(q => {
                  const isDone = completedQuests.includes(q.id);
                  return (
                    <div key={q.id} className={`flex flex-col gap-1 ${isDone ? 'opacity-40' : ''}`}>
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-white font-bold">{q.title}</span>
                        <span className="text-white/60">{q.current} / {q.target}</span>
                      </div>
                      <div className="h-1 bg-gray-900 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 transition-all duration-300" 
                          style={{ width: `${(q.current/q.target)*100}%` }}
                        />
                      </div>
                      {isDone && <div className="text-[8px] text-green-400 font-bold flex items-center gap-1"><Trophy className="w-2 h-2" /> 완료됨</div>}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>

          <div className="flex flex-col items-end gap-2">
            {/* XP Bar */}
            <div className="bg-black/50 backdrop-blur-md p-3 border border-yellow-500/30 rounded-xl w-64 mb-2 pointer-events-auto">
               <div className="flex justify-between text-[10px] text-white/60 font-mono mb-1 uppercase tracking-widest">
                 <span>Lv. {level}</span>
                 <span>XP {Math.floor((xp/maxXp)*100)}%</span>
               </div>
               <div className="h-2 bg-gray-900 rounded-full overflow-hidden">
                 <motion.div 
                   className="h-full bg-yellow-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]"
                   animate={{ width: `${(xp/maxXp)*100}%` }}
                 />
               </div>
               <button 
                 onClick={() => setShowStatMenu(!showStatMenu)}
                 className="w-full mt-2 py-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded text-white font-bold text-[10px] uppercase transition-all"
               >
                 {showStatMenu ? "Close Stats" : `Stat Menu (${statPoints})`}
               </button>
            </div>

            <div className="bg-black/50 backdrop-blur-md p-4 border border-red-500/30 rounded-xl w-64 text-right">
              <div className="flex items-center justify-end gap-2 mb-2">
                <div className="w-4 h-4 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                <span className="text-red-500 text-xs font-bold uppercase tracking-widest">배리어 에너지 (HP)</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-red-500"
                  initial={{ width: '100%' }}
                  animate={{ width: `${hp}%` }}
                />
              </div>
            </div>

            <div className="bg-black/50 backdrop-blur-md p-4 border border-yellow-500/30 rounded-xl w-64 text-right">
              <div className="flex items-center justify-end gap-2 mb-2">
                <Zap className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="text-yellow-500 text-xs font-bold uppercase tracking-widest">에너지 코어</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.5)]"
                  initial={{ width: '100%' }}
                  animate={{ width: `${energy}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sniper Scope Overlay */}
        <AnimatePresence>
          {isSniperAiming && (
            <motion.div 
              initial={{ opacity: 0, scale: 1.2 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none"
            >
              {/* Outer Ring */}
              <div className="w-[600px] h-[600px] border-[2px] border-green-500/30 rounded-full flex items-center justify-center relative">
                <div className="absolute inset-0 border-[60px] border-black/60 rounded-full" />
                {/* Crosshairs */}
                <div className="w-full h-[1px] bg-green-500/50 absolute" />
                <div className="h-full w-[1px] bg-green-500/50 absolute" />
                {/* Reference markings */}
                <div className="absolute top-0 w-[2px] h-4 bg-green-500/50" />
                <div className="absolute bottom-0 w-[2px] h-4 bg-green-500/50" />
                <div className="absolute left-0 h-[2px] w-4 bg-green-500/50" />
                <div className="absolute right-0 h-[2px] w-4 bg-green-500/50" />
                {/* Center Circle */}
                <div className="w-6 h-6 border border-green-400 rounded-full opacity-50" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hit Indicator (Center Red Dot) */}
        <AnimatePresence>
          {showHitIndicator && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1.5 }}
              exit={{ opacity: 0 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50"
            >
              <div className="w-6 h-6 bg-red-600 rounded-full blur-[2px] shadow-[0_0_20px_#ff0000]" />
              <div className="absolute inset-0 border-2 border-red-500 rounded-full animate-ping" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Normal Crosshair */}
        {!isSniperAiming && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <Crosshair className="w-8 h-8 text-white/50 animate-pulse" />
          </div>
        )}

        <div className="flex justify-center mb-4">
          <div className="bg-black/40 backdrop-blur-sm px-6 py-2 rounded-full text-white/60 text-sm border border-white/10">
            <span className="text-white font-bold tracking-tighter mr-4">WASD</span> 이동
            <span className="mx-4 text-white/20">|</span>
            <span className="text-white font-bold tracking-tighter mr-4">Q</span> 단검
            <span className="mx-4 text-white/20">|</span>
            <span className="text-white font-bold tracking-tighter mr-4">R</span> 차지
            <span className="mx-4 text-white/20">|</span>
            <span className="text-white font-bold tracking-tighter mr-4">1 / 2</span> 무기
            <span className="mx-4 text-white/20">|</span>
            <span className="text-white font-bold tracking-tighter mr-4">3</span> 리카 소환
            <span className="mx-4 text-white/20">|</span>
            <span className="text-white font-bold tracking-tighter mr-4">4</span> 발도술
            <span className="mx-4 text-white/20">|</span>
            <span className="text-white font-bold tracking-tighter mr-4">X</span> 폭탄
            <span className="mx-4 text-white/20">|</span>
            <span className="text-white font-bold tracking-tighter mr-4">Z</span> 저격
            <span className="mx-4 text-white/20">|</span>
            <span className="text-white font-bold tracking-tighter mr-4">ENTER</span> 궁극기
          </div>
        </div>

      </div>

      <AnimatePresence>
        {(!isStarted || (!isLocked && !isChatting && !showShop && !showStatMenu && !isNPCDialogOpen)) && hp > 0 && (
          <motion.div 
            id="play-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl ${lockCooldown ? 'pointer-events-none opacity-80' : 'pointer-events-auto cursor-pointer'}`}
            onClick={async (e) => {
              if (playerTrait === 'none') return;
              // Wait at least 1.5 seconds since last unlock to prevent browser error
              if (Date.now() - lastUnlockTime.current < 2000) {
                setSystemMessage({ text: "잠시 후 다시 클릭해주세요 (마우스 잠금 대기 중)", color: "#ffcc00" });
                setTimeout(() => setSystemMessage(null), 1500);
                return;
              }
              if (!lockCooldown && controlsRef.current && controlsRef.current.domElement) {
                try {
                  const promise = controlsRef.current.domElement.requestPointerLock({ unadjustedMovement: true }).catch((e) => {
                    // Fallback if unadjustedMovement is not supported
                    return controlsRef.current?.domElement.requestPointerLock();
                  });
                  if (promise && promise.catch) {
                    promise.catch((e: any) => {
                      // Silently ignore remaining pointer lock errors or re-trigger cooldown
                      setLockCooldown(true);
                      lastUnlockTime.current = Date.now();
                      if (lockCooldownTimer.current) clearTimeout(lockCooldownTimer.current);
                      lockCooldownTimer.current = setTimeout(() => setLockCooldown(false), 2000);
                    });
                  }
                } catch (e) {
                  setLockCooldown(true);
                  lastUnlockTime.current = Date.now();
                  if (lockCooldownTimer.current) clearTimeout(lockCooldownTimer.current);
                  lockCooldownTimer.current = setTimeout(() => setLockCooldown(false), 2000);
                }
              }
            }}
          >
            <div className="text-center pointer-events-none">
              <motion.h1 
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="text-7xl font-black text-white mb-8 tracking-tighter"
              >
                슬라임 버스터 <span className="text-blue-500">보스 헌트</span>
              </motion.h1>
              
              {playerTrait === 'none' ? (
                <div className="pointer-events-auto mt-8 flex flex-col items-center">
                  <div className="text-2xl font-bold text-white mb-6">시작 전 특성을 선택하세요</div>
                  <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
                    <button onClick={(e) => { e.stopPropagation(); setPlayerTrait('fire'); }} className="px-6 py-4 bg-red-600/80 hover:bg-red-500 text-white rounded-xl font-bold border border-red-400 transition-all cursor-pointer">
                      <div className="text-xl mb-1">🔥 불 속성</div>
                      <div className="text-xs opacity-80">공격 시 50% 확률로 화상</div>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setPlayerTrait('ice'); }} className="px-6 py-4 bg-blue-600/80 hover:bg-blue-500 text-white rounded-xl font-bold border border-blue-400 transition-all cursor-pointer">
                      <div className="text-xl mb-1">❄️ 얼음 속성</div>
                      <div className="text-xs opacity-80">공격 시 30% 확률로 빙결</div>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setPlayerTrait('iron'); }} className="px-6 py-4 bg-gray-600/80 hover:bg-gray-500 text-white rounded-xl font-bold border border-gray-400 transition-all cursor-pointer">
                      <div className="text-xl mb-1">🛡️ 철 속성</div>
                      <div className="text-xs opacity-80">공격할 때마다 방어력 1% 증가</div>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setPlayerTrait('assassin'); }} className="px-6 py-4 bg-purple-600/80 hover:bg-purple-500 text-white rounded-xl font-bold border border-purple-400 transition-all cursor-pointer">
                      <div className="text-xl mb-1">🗡️ 암살자 속성</div>
                      <div className="text-xs opacity-80">몹 처치 시 속도 1 증가</div>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setPlayerTrait('vampire'); }} className="px-6 py-4 bg-red-900/80 hover:bg-red-800 text-white rounded-xl font-bold border border-red-700 transition-all cursor-pointer">
                      <div className="text-xl mb-1">🦇 뱀파이어</div>
                      <div className="text-xs opacity-80">공격 데미지의 20% 흡혈</div>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setPlayerTrait('lightning'); }} className="px-6 py-4 bg-yellow-600/80 hover:bg-yellow-500 text-white rounded-xl font-bold border border-yellow-400 transition-all cursor-pointer">
                      <div className="text-xl mb-1">⚡ 번개 속성</div>
                      <div className="text-xs opacity-80">타격 시 번개 아우라 발산</div>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setPlayerTrait('berserker'); }} className="px-6 py-4 bg-orange-600/80 hover:bg-orange-500 text-white rounded-xl font-bold border border-orange-400 transition-all cursor-pointer">
                      <div className="text-xl mb-1">😡 버서커</div>
                      <div className="text-xs opacity-80">E키로 화염폭주 (강화)</div>
                    </button>
                    {nickname === '조찬우' && (
                    <button onClick={(e) => { e.stopPropagation(); setPlayerTrait('pig'); }} className="px-6 py-4 bg-pink-500/80 hover:bg-pink-400 text-white rounded-xl font-bold border border-pink-300 transition-all cursor-pointer">
                      <div className="text-xl mb-1">🐷 돼지 속성</div>
                      <div className="text-xs opacity-80">E키로 슬라임 포식 (최대 1.5배)</div>
                    </button>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-blue-400 font-bold mb-12 tracking-widest uppercase">
                    {lockCooldown ? "잠시 대기..." : (isStarted ? "클릭하여 전투 재개" : "클릭하여 전투 시작")}
                  </div>
                  <div className="text-green-400 font-bold mb-8 text-sm">
                    선택된 특성: {playerTrait === 'fire' ? '🔥 불' : playerTrait === 'ice' ? '❄️ 얼음' : playerTrait === 'iron' ? '🛡️ 철' : playerTrait === 'assassin' ? '🗡️ 암살자' : playerTrait === 'vampire' ? '🦇 뱀파이어' : playerTrait === 'lightning' ? '⚡ 번개' : playerTrait === 'berserker' ? '😡 버서커' : '🐷 돼지'}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 max-w-md mx-auto text-left">
                    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                      <div className="text-white/40 text-[10px] uppercase mb-1">이동</div>
                      <div className="text-white font-bold">WASD / SPACE</div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                      <div className="text-white/40 text-[10px] uppercase mb-1">에너지 발사</div>
                      <div className="text-white font-bold">마우스 클릭</div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                      <div className="text-white/40 text-[10px] uppercase mb-1">단검 / 발사</div>
                      <div className="text-white font-bold">Q Key / LMB</div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                      <div className="text-white/40 text-[10px] uppercase mb-1">무량공처 (Unlimited Void)</div>
                      <div className="text-white font-bold text-purple-400">K Key (50 EN)</div>
                    </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                  <div className="text-white/40 text-[10px] uppercase mb-1">공간참 (Space Cleave)</div>
                  <div className="text-white font-bold text-red-500">O Key (50 EN)</div>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                  <div className="text-white/40 text-[10px] uppercase mb-1">허식 「자」 (Hollow Purple)</div>
                  <div className="text-white font-bold text-purple-500">P Key (80 EN)</div>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                  <div className="text-white/40 text-[10px] uppercase mb-1">특수 차지</div>
                  <div className="text-white font-bold">R Key (홀드)</div>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                  <div className="text-white/40 text-[10px] uppercase mb-1">무기 선택</div>
                  <div className="text-white font-bold text-[9px]">1:번개|2:단검|3:리카|4:발도|5:메테오|6:블랙홀|7:행성|8:바선생|9:입냄새|0:스매쉬</div>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                  <div className="text-white/40 text-[10px] uppercase mb-1">폭탄 던지기</div>
                  <div className="text-white font-bold">X Key</div>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                  <div className="text-white/40 text-[10px] uppercase mb-1">프레임 동결</div>
                  <div className="text-white font-bold text-blue-400">Y Key</div>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-blue-500/30">
                  <div className="text-blue-400 text-[10px] uppercase mb-1">방탄 배리어</div>
                  <div className="text-white font-bold">M Key (50 EN)</div>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                  <div className="text-white/40 text-[10px] uppercase mb-1">저격 소총</div>
                  <div className="text-white font-bold">Z Key (홀드: 조준 / 해제: 발사)</div>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 col-span-2">
                  <div className="text-blue-400 text-[10px] uppercase mb-1">궁극기 능력</div>
                  <div className="text-white font-bold">ENTER (80%)</div>
                </div>
              </div>
              </>
            )}
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {energy < 10 && isStarted && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-12 text-red-500 font-black tracking-tighter text-xl uppercase animate-bounce"
          >
            에너지 부족
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {hp <= 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[60] flex items-center justify-center bg-red-900/60 backdrop-blur-xl pointer-events-auto"
          >
            <div className="text-center">
              <motion.h1 
                initial={{ scale: 0.5, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="text-8xl font-black text-white mb-4 tracking-tighter italic"
              >
                MISSION FAILED
              </motion.h1>
              <div className="text-red-500 font-bold text-xl mb-12 uppercase tracking-[0.3em]">배리어가 완전히 파괴되었습니다</div>
              <button 
                onClick={() => {
                  setHp(100);
                  setScore(0);
                  setIsStarted(false);
                }}
                className="px-16 py-4 bg-red-600 text-white font-black text-xl rounded-full hover:bg-red-500 hover:scale-105 transition-all shadow-[0_0_30px_rgba(220,38,38,0.5)] cursor-pointer active:scale-95"
              >
                전투 재개하기
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {domainText && (
          <motion.div 
            initial={{ opacity: 0, scale: 2, filter: 'blur(20px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, x: -100 }}
            className="absolute inset-0 z-[70] flex items-center justify-center pointer-events-none"
          >
            <div className="relative">
              <motion.h2 
                animate={{ 
                  textShadow: ["0 0 20px #f00", "0 0 50px #f00", "0 0 20px #f00"] 
                }}
                transition={{ duration: 1, repeat: Infinity }}
                className="text-[12rem] font-black text-white italic tracking-tighter"
                style={{ fontFamily: 'serif' }}
              >
                영역 전개
              </motion.h2>
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                className="h-1 bg-red-600 mt-2 shadow-[0_0_20px_#f00]"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {theWorldText && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 2 }}
            className="absolute inset-0 z-[80] flex items-center justify-center pointer-events-none"
          >
            <h2 
              className="text-8xl font-black text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.8)] italic"
              style={{ fontFamily: 'serif' }}
            >
              {theWorldText}
            </h2>
          </motion.div>
        )}
      </AnimatePresence>

      {isTimeStopped && (
        <div className="absolute inset-0 z-[60] pointer-events-none backdrop-invert duration-1000" />
      )}

      {isVoidDashing && (
        <div className="absolute inset-0 z-[65] pointer-events-none overflow-hidden">
          {/* Manga speed lines effect - horizontal */}
          <div className="absolute inset-0 flex flex-col justify-between">
            {Array.from({ length: 40 }).map((_, i) => (
              <motion.div
                key={i}
                className="h-1 bg-white opacity-80"
                style={{
                  width: `${Math.random() * 50 + 20}%`,
                  marginLeft: i % 2 === 0 ? 'auto' : '0',
                }}
                initial={{ x: i % 2 === 0 ? 100 : -100 }}
                animate={{ x: i % 2 === 0 ? -2000 : 2000 }}
                transition={{
                  duration: Math.random() * 0.2 + 0.1,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
            ))}
          </div>
          {/* Vignette */}
          <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(255,255,255,0.2)] mix-blend-overlay" />
        </div>
      )}

      {/* Scoreboard */}
      {isJoined && (
        <div className="absolute top-4 right-4 z-50 bg-black/60 border border-white/10 p-4 rounded-xl min-w-[200px] backdrop-blur-md font-sans pointer-events-none">
          <h3 className="text-white font-bold mb-2 border-b border-white/20 pb-1 uppercase tracking-widest text-xs">SCORE BOARD</h3>
          <div className="space-y-1">
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#00ffcc] font-bold">{nickname} (You)</span>
              <span className="text-[#00ffcc] font-mono font-bold">{score}</span>
            </div>
            {players.filter(p => p.nickname).sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 5).map((p, i) => (
              <div key={p.id || `s_${i}`} className="flex justify-between items-center text-sm">
                <span className="text-gray-300 font-medium truncate max-w-[120px]">{i+1}. {p.nickname}</span>
                <span className="text-gray-400 font-mono">{p.score || 0}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scene Toggle Button */}
      {isJoined && isStarted && (
        <div className="absolute top-4 left-4 z-50">
          <button 
            onClick={() => {
              if (scene === 'combat') {
                setScene('village');
                window.dispatchEvent(new CustomEvent('resetPosition'));
              } else {
                setScene('combat');
                window.dispatchEvent(new CustomEvent('resetPosition'));
              }
            }}
            className="px-6 py-3 bg-indigo-600/80 text-white font-bold rounded-xl border-2 border-indigo-400 hover:bg-indigo-500 transition-colors shadow-[0_0_15px_rgba(99,102,241,0.5)] backdrop-blur-md pointer-events-auto"
          >
            {scene === 'combat' ? '마을로 귀환' : '전투 구역으로 이동'}
          </button>
        </div>
      )}

      {/* Shop Interaction Hint */}
      {scene === 'village' && !showShop && isStarted && Math.hypot(playerPos[0] - 15, playerPos[2] - -15) < 8 && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-auto">
          <button 
            onClick={() => {
              setShowShop(true);
              document.exitPointerLock?.();
            }}
            className="px-6 py-3 bg-yellow-500 text-black font-black text-xl rounded-xl border-4 border-yellow-300 hover:scale-105 transition-transform shadow-[0_0_20px_rgba(234,179,8,0.5)] cursor-pointer"
          >
            [ E ] 상점 열기
          </button>
        </div>
      )}

      {/* Shop Overlay */}
      {showShop && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md pointer-events-auto">
          <div className="p-8 bg-gray-900 border-4 border-purple-500 rounded-3xl min-w-[500px] text-white shadow-[0_0_50px_rgba(168,85,247,0.3)]">
            <div className="flex justify-between items-center mb-6 border-b border-white/20 pb-4">
              <h2 className="text-3xl font-black text-purple-400 uppercase tracking-widest">마을 상점</h2>
              <div className="text-xl font-bold font-mono text-yellow-400">보유 점수: {score}</div>
            </div>
            
            <div className="space-y-4 mb-8">
              <div className="bg-black/50 p-4 rounded-xl border border-white/10 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg text-blue-300">무기 강화</h3>
                  <p className="text-sm text-gray-400">전투력이 크게 상승합니다 (현재 Lv.{weaponLevel})</p>
                </div>
                <button 
                  onClick={() => {
                    const cost = weaponLevel * 50;
                    if (score >= cost) {
                      setScore(s => s - cost);
                      setWeaponLevel(l => l + 1);
                      setStats(s => ({ ...s, str: s.str + 5 }));
                      playSound('bassDrop');
                    } else {
                      playSound('error');
                    }
                  }}
                  className={`px-4 py-2 rounded-lg font-bold ${score >= weaponLevel * 50 ? 'bg-blue-600 hover:bg-blue-500' : 'bg-gray-700 text-gray-500'}`}
                >
                  {weaponLevel * 50} 점수
                </button>
              </div>

              <div className="bg-black/50 p-4 rounded-xl border border-white/10 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg text-pink-300">펫 구매: 미니 리카</h3>
                  <p className="text-sm text-gray-400">주변 적을 지속적으로 공격합니다.</p>
                </div>
                <button 
                  onClick={() => {
                    if (score >= 200 && !ownedPets.includes('rika')) {
                      setScore(s => s - 200);
                      setOwnedPets(p => [...p, 'rika']);
                      playSound('bassDrop');
                    } else {
                      playSound('error');
                    }
                  }}
                  disabled={ownedPets.includes('rika')}
                  className={`px-4 py-2 rounded-lg font-bold ${ownedPets.includes('rika') ? 'bg-green-700 text-gray-300' : score >= 200 ? 'bg-pink-600 hover:bg-pink-500' : 'bg-gray-700 text-gray-500'}`}
                >
                  {ownedPets.includes('rika') ? '보유중' : '200 점수'}
                </button>
              </div>

              <div className="bg-black/50 p-4 rounded-xl border border-white/10 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg text-orange-300">스탯 물약</h3>
                  <p className="text-sm text-gray-400">마나(에너지) 회복 속도를 늘려줍니다.</p>
                </div>
                <button 
                  onClick={() => {
                    if (score >= 100) {
                      setScore(s => s - 100);
                      setStats(s => ({ ...s, int: s.int + 5 }));
                      playSound('bassDrop');
                    } else {
                      playSound('error');
                    }
                  }}
                  className={`px-4 py-2 rounded-lg font-bold ${score >= 100 ? 'bg-orange-600 hover:bg-orange-500' : 'bg-gray-700 text-gray-500'}`}
                >
                  100 점수
                </button>
              </div>

              <div className="bg-black/50 p-4 rounded-xl border border-white/10 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg text-red-400">아머 슈트</h3>
                  <p className="text-sm text-gray-400">아이언맨의 기본 슈트 파츠</p>
                </div>
                <button 
                  onClick={() => {
                    if (score >= 500 && !shopPurchases.suit) {
                      setScore(s => s - 500);
                      setShopPurchases(s => ({ ...s, suit: true }));
                      playSound('bassDrop');
                    } else {
                      playSound('error');
                    }
                  }}
                  disabled={shopPurchases.suit}
                  className={`px-4 py-2 rounded-lg font-bold ${shopPurchases.suit ? 'bg-green-700 text-gray-300' : score >= 500 ? 'bg-red-600 hover:bg-red-500' : 'bg-gray-700 text-gray-500'}`}
                >
                  {shopPurchases.suit ? '보유중' : '500 점수'}
                </button>
              </div>

              <div className="bg-black/50 p-4 rounded-xl border border-white/10 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg text-yellow-400">인피니티 건틀렛</h3>
                  <p className="text-sm text-gray-400">진정한 힘을 깨우는 장갑</p>
                </div>
                <button 
                  onClick={() => {
                    if (score >= 1000 && !shopPurchases.gauntlet) {
                      setScore(s => s - 1000);
                      setShopPurchases(s => ({ ...s, gauntlet: true }));
                      playSound('bassDrop');
                    } else {
                      playSound('error');
                    }
                  }}
                  disabled={shopPurchases.gauntlet}
                  className={`px-4 py-2 rounded-lg font-bold ${shopPurchases.gauntlet ? 'bg-green-700 text-gray-300' : score >= 1000 ? 'bg-yellow-600 hover:bg-yellow-500' : 'bg-gray-700 text-gray-500'}`}
                >
                  {shopPurchases.gauntlet ? '보유중' : '1000 점수'}
                </button>
              </div>

              <div className="bg-black/50 p-4 rounded-xl border border-white/10 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg text-blue-400">JARVIS AI</h3>
                  <p className="text-sm text-gray-400">최첨단 인공지능 비서</p>
                </div>
                <button 
                  onClick={() => {
                    if (score >= 700 && !shopPurchases.jarvis) {
                      setScore(s => s - 700);
                      setShopPurchases(s => ({ ...s, jarvis: true }));
                      playSound('bassDrop');
                    } else {
                      playSound('error');
                    }
                  }}
                  disabled={shopPurchases.jarvis}
                  className={`px-4 py-2 rounded-lg font-bold ${shopPurchases.jarvis ? 'bg-green-700 text-gray-300' : score >= 700 ? 'bg-blue-600 hover:bg-blue-500' : 'bg-gray-700 text-gray-500'}`}
                >
                  {shopPurchases.jarvis ? '보유중' : '700 점수'}
                </button>
              </div>
            </div>

            <div className="text-right">
              <button 
                onClick={() => setShowShop(false)}
                className="px-8 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Imprisoned UI Overlay */}
      {isImprisoned && (
        <div className="absolute inset-0 z-[95] pointer-events-none flex flex-col justify-center items-center">
           <div className="absolute inset-0 bg-black/50 repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(0,0,0,0.8) 40px, rgba(0,0,0,0.8) 60px)" style={{ background: 'repeating-linear-gradient(90deg, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 40px, rgba(0,0,0,0.9) 40px, rgba(0,0,0,0.9) 60px)' }}></div>
           <div className="text-red-500 text-6xl font-black font-sans bg-black/80 px-10 py-5 rounded-full z-10 border-4 border-red-500 animate-pulse">
             감옥에 갇혔습니다!
           </div>
        </div>
      )}

      {/* Admin Panel */}
      {showAdminPanel && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[100] pointer-events-auto bg-black/90 backdrop-blur-lg border border-yellow-500/50 p-6 rounded-xl text-white font-sans w-[800px] max-w-[90vw] shadow-[0_0_30px_rgba(251,191,36,0.3)] max-h-[85vh] overflow-y-auto flex flex-col md:flex-row gap-6">
          <div className="flex-1 flex flex-col gap-4">
            <div className="text-xl font-bold text-yellow-400 mb-2 text-center md:text-left">👑 어드민 패널</div>
            
            <div className="border border-white/10 p-3 rounded bg-white/5">
              <div className="text-sm font-bold text-gray-300 mb-2">스탯 수동 조작</div>
              <div className="flex gap-2 mb-2">
                <label className="flex-1 text-xs text-gray-400 flex flex-col gap-1">
                  STR (공격력)
                  <input type="number" value={stats.str} onChange={(e) => setStats(s => ({...s, str: Number(e.target.value)}))} className="bg-black/50 border border-white/20 rounded px-2 py-1 text-white" />
                </label>
                <label className="flex-1 text-xs text-gray-400 flex flex-col gap-1">
                  AGI (속도)
                  <input type="number" value={stats.agi} onChange={(e) => setStats(s => ({...s, agi: Number(e.target.value)}))} className="bg-black/50 border border-white/20 rounded px-2 py-1 text-white" />
                </label>
                <label className="flex-1 text-xs text-gray-400 flex flex-col gap-1">
                  INT (에너지)
                  <input type="number" value={stats.int} onChange={(e) => setStats(s => ({...s, int: Number(e.target.value)}))} className="bg-black/50 border border-white/20 rounded px-2 py-1 text-white" />
                </label>
              </div>
              <button onClick={() => { setStats({ str: 9999, agi: 9999, int: 9999 }); setLevel(9999); setHp(999999); }} className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded font-bold transition-all text-sm">스탯 뻥튀기 (Max All)</button>
            </div>

            <div className="border border-white/10 p-3 rounded bg-white/5 flex flex-col gap-2">
              <div className="text-sm font-bold text-gray-300">서버 공지 전송</div>
              <div className="flex gap-2">
                <input type="text" id="admin-notice-input" className="flex-1 bg-black/50 border border-white/20 rounded px-2 py-1 text-white text-sm" placeholder="메시지 입력..." />
                <button onClick={() => { 
                  const input = document.getElementById('admin-notice-input') as HTMLInputElement;
                  if (input && input.value) {
                    emitAttack('adminAction', { action: 'serverMessage', text: input.value });
                    window.dispatchEvent(new CustomEvent('showSystemMessage', { detail: { text: `[서버 공지] ${input.value}`, color: "#facc15" } }));
                    window.dispatchEvent(new CustomEvent('playSound', { detail: 'levelUp' }));
                    input.value = '';
                  }
                }} className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded font-bold transition-all text-sm">전송</button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="text-sm font-bold text-gray-300">상태 토글</div>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => { isGodModeRef.current = !isGodModeRef.current; setIsGodModeUI(isGodModeRef.current); }} className={`px-2 py-2 rounded font-bold transition-all text-xs ${isGodModeUI ? 'bg-yellow-500 text-black' : 'bg-white/10 hover:bg-white/20'}`}>{isGodModeUI ? '신 모드 (무적) ON' : '신 모드 (무적) OFF'}</button>
                <button onClick={() => { hasShieldRef.current = !hasShieldRef.current; setHasShieldUI(hasShieldRef.current); }} className={`px-2 py-2 rounded font-bold transition-all text-xs ${hasShieldUI ? 'bg-blue-500 text-white' : 'bg-white/10 hover:bg-white/20'}`}>{hasShieldUI ? '방어막 ON' : '방어막 OFF'}</button>
                <button onClick={() => { noCooldownRef.current = !noCooldownRef.current; setNoCooldownUI(noCooldownRef.current); }} className={`px-2 py-2 rounded font-bold transition-all text-xs ${noCooldownUI ? 'bg-green-500 text-white' : 'bg-white/10 hover:bg-white/20'}`}>{noCooldownUI ? '쿨타임 없음 ON' : '쿨타임 없음 OFF'}</button>
                <button onClick={() => setIsInvisible(p => !p)} className={`px-2 py-2 rounded font-bold transition-all text-xs ${isInvisible ? 'bg-gray-500 text-white' : 'bg-white/10 hover:bg-white/20'}`}>{isInvisible ? '투명 ON' : '투명 OFF'}</button>
                <button onClick={() => setIsSlime(p => !p)} className={`px-2 py-2 rounded font-bold transition-all text-xs ${isSlime ? 'bg-green-600 text-white' : 'bg-white/10 hover:bg-white/20'}`}>{isSlime ? '슬라임 폼 ON' : '슬라임 변신'}</button>
                <button onClick={() => setIsFlying(p => !p)} className={`px-2 py-2 rounded font-bold transition-all text-xs ${isFlying ? 'bg-cyan-500 text-white' : 'bg-white/10 hover:bg-white/20'}`}>{isFlying ? '비행 중 (Land)' : '비행 (Fly)'}</button>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <div className="text-sm font-bold text-gray-300">액션</div>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => window.dispatchEvent(new CustomEvent('resetPosition'))} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded font-bold transition-all text-sm">순간이동 (Spawn)</button>
                <button onClick={() => { emitAttack('adminAction', { action: 'killAll' }); window.dispatchEvent(new CustomEvent('bombExplode', { detail: { pos: [0,0,0], radius: 9999, damageMultiplier: 9999, team: 'admin' } })); }} className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded font-bold transition-all text-sm">모두 죽이기</button>
                <button onClick={() => { emitAttack('adminAction', { action: 'imprison' }); window.dispatchEvent(new CustomEvent('adminImprisonMobs')); }} className="px-4 py-2 bg-orange-600 hover:bg-orange-500 rounded font-bold transition-all text-sm">모두 가두기</button>
                <button onClick={() => emitAttack('adminAction', { action: 'pull', pos: playerPos })} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded font-bold transition-all text-sm">모두 소환</button>
              </div>
              
              <button onClick={() => window.dispatchEvent(new CustomEvent('adminSpawnBoss'))} className="w-full px-4 py-2 bg-red-900 hover:bg-red-800 rounded font-bold transition-all text-sm">보스 강제 소환</button>
              <button onClick={() => { setIsApocalypse(p => !p); window.dispatchEvent(new CustomEvent('apocalypseTrigger', { detail: { active: !isApocalypse } })); emitAttack('adminAction', { action: 'apocalypse', active: !isApocalypse }); }} className="w-full px-4 py-2 bg-red-950 hover:bg-red-900 rounded font-bold transition-all text-sm border border-red-500">{isApocalypse ? "종말 끄기" : "서버 종말 발동"}</button>
              <button onClick={() => { emitAttack('adminAction', { action: 'nuke' }); window.dispatchEvent(new CustomEvent('adminNuke')); }} className="w-full px-4 py-2 bg-orange-700 hover:bg-orange-600 rounded font-bold transition-all text-sm border border-yellow-500 shadow-[0_0_15px_rgba(251,146,60,0.8)] animate-pulse">핵폭탄 투하 (NUKE) ☢️</button>
              <button onClick={() => { window.dispatchEvent(new CustomEvent('theWorldTrigger')); emitAttack('theWorld', {}); }} className="w-full px-4 py-2 bg-purple-900 hover:bg-purple-800 rounded font-bold transition-all text-sm">시간 정지 (The World)</button>
              
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
                <button onClick={() => { emitAttack('adminAction', { action: 'rainTacos' }); window.dispatchEvent(new CustomEvent('rainTacos')); }} className="px-2 py-2 bg-yellow-600 hover:bg-yellow-500 rounded font-bold transition-all text-xs">타코 내리기 🌮</button>
                <button onClick={() => { emitAttack('adminAction', { action: 'danceAll' }); window.dispatchEvent(new CustomEvent('adminDance')); }} className="px-2 py-2 bg-pink-600 hover:bg-pink-500 rounded font-bold transition-all text-xs">모두 춤추기 💃</button>
                <button onClick={() => { emitAttack('adminAction', { action: 'chickenAll' }); window.dispatchEvent(new CustomEvent('adminChicken')); }} className="px-2 py-2 bg-orange-400 hover:bg-orange-300 rounded font-bold transition-all text-xs text-black">모두 닭 되기 🐔</button>
                <button onClick={() => { emitAttack('adminAction', { action: 'ragdollAll' }); window.dispatchEvent(new CustomEvent('adminRagdoll')); }} className="px-2 py-2 bg-gray-600 hover:bg-gray-500 rounded font-bold transition-all text-xs">모두 넘어지기 🤸</button>
                <button onClick={() => { emitAttack('adminAction', { action: 'explodeAll' }); window.dispatchEvent(new CustomEvent('bombExplode', { detail: { pos: [0,0,0], radius: 9999, damageMultiplier: 9999, team: 'admin' } })); window.dispatchEvent(new CustomEvent('showSystemMessage', { detail: { text: "펑! 💥", color: "#ef4444" } })); }} className="px-2 py-2 bg-red-600 hover:bg-red-500 rounded font-bold transition-all text-xs">모두 터지기 💥</button>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setSizeModifier(0.2)} className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-500 rounded font-bold transition-all text-xs">작아지기</button>
                <button onClick={() => setSizeModifier(5)} className="flex-1 px-4 py-2 bg-pink-600 hover:bg-pink-500 rounded font-bold transition-all text-xs">커지기</button>
                <button onClick={() => setSizeModifier(1)} className="flex-1 px-2 py-2 bg-gray-600 hover:bg-gray-500 rounded font-bold transition-all text-xs">크기 복구</button>
              </div>
            </div>
            <button onClick={() => { setShowAdminPanel(false); document.body.requestPointerLock(); }} className="mt-auto w-full py-2 bg-white/10 hover:bg-white/20 rounded font-bold text-sm">닫기 (Close)</button>
          </div>
        </div>
      )}

      {/* Nuke Flash Overlay */}
      {isNukeActive && (
        <div className="absolute inset-0 z-[150] pointer-events-none bg-white animate-pulse" style={{ animationDuration: '0.2s' }}>
           <div className="absolute inset-0 flex items-center justify-center text-red-600 font-black text-9xl">
              ☢️
           </div>
        </div>
      )}

      {/* Chat UI */}
      {isJoined && (
        <div className="absolute bottom-4 left-4 z-50 pointer-events-auto font-sans flex flex-col justify-end max-w-sm pointer-events-none">
          <div className="w-80 h-48 overflow-y-auto mb-2 flex flex-col justify-end space-y-1">
            {chatMessages.map((msg, i) => (
              <div key={i} className="text-sm bg-black/60 px-3 py-1 rounded-md backdrop-blur-md border border-white/10">
                <span className="font-bold text-[#00ffcc] mr-2">{msg.nickname}:</span>
                <span className="text-white">{msg.message}</span>
              </div>
            ))}
          </div>
          
          <div className="pointer-events-auto">
            {isChatting ? (
              <input
                id="chat-input"
                autoFocus
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => {
                  // Stop character echoing to controls by stopping propagation
                  e.stopPropagation();
                  if (e.key === 'Enter') {
                    if (chatInput.trim().length > 0) {
                      if (chatInput.trim() === '/e dance') {
                        window.dispatchEvent(new CustomEvent('startDance', { detail: { type: 1 } }));
                      } else if (chatInput.trim() === '/e dance2') {
                        window.dispatchEvent(new CustomEvent('startDance', { detail: { type: 2 } }));
                      } else if (chatInput.trim() === '/e dance3') {
                        window.dispatchEvent(new CustomEvent('startDance', { detail: { type: 3 } }));
                      } else if (chatInput.trim() === '/e gangnam' || chatInput.trim() === '/e gagnam') {
                        window.dispatchEvent(new CustomEvent('startDance', { detail: { type: 4 } }));
                      } else if (chatInput.trim().startsWith('/e laugh')) {
                        window.dispatchEvent(new CustomEvent('startDance', { detail: { type: 5 } }));
                        const inputStr = chatInput.trim();
                        const slashIndex = inputStr.indexOf('/', 8);
                        if (slashIndex !== -1) {
                          emitChat(inputStr.substring(slashIndex + 1).trim(), nickname);
                        } else {
                          emitChat('하하하!', nickname);
                        }
                      } else if (chatInput.trim() === '/e poop') {
                        window.dispatchEvent(new CustomEvent('startDance', { detail: { type: 6 } }));
                      } else {
                        emitChat(chatInput, nickname);
                      }
                    }
                    setChatInput("");
                    setIsChatting(false);
                  }
                  if (e.key === 'Escape') {
                    setIsChatting(false);
                    setChatInput("");
                  }
                }}
                onBlur={() => setIsChatting(false)}
                className="w-80 px-3 py-2 bg-black/80 text-white border border-[#00ffcc]/50 rounded-md outline-none text-sm focus:border-[#00ffcc] shadow-[0_0_10px_rgba(0,255,204,0.2)]"
                placeholder="채팅 입력... (Enter 확인, Esc 취소)"
                maxLength={50}
              />
            ) : (
              <button 
                onClick={() => setIsChatting(true)}
                className="w-80 text-left px-3 py-2 bg-black/40 text-gray-400 border border-white/10 rounded-md outline-none text-sm cursor-text hover:bg-black/60 transition-colors"
              >
                [ T ] 키를 눌러 채팅하기...
              </button>
            )}
          </div>
        </div>
      )}

      {/* Nickname & AI Entry Overlay */}
      <AnimatePresence>
        {!isJoined && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md pointer-events-auto"
          >
            <div className="text-center">
              {!showAIPrompt ? (
                <>
                  <h1 className="text-4xl font-black text-white mb-6 uppercase tracking-widest text-[#00ffcc]">다크 판타지: 어비스</h1>
                  <div className="text-gray-400 font-bold mb-4">닉네임을 알려주세요</div>
                  <input 
                    type="text" 
                    value={nickname} 
                    onChange={e => setNickname(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && nickname.trim().length > 0) {
                        setShowAIPrompt(true);
                      }
                    }}
                    className="w-64 px-4 py-3 bg-black/50 text-white font-bold border border-white/20 rounded-md outline-none focus:border-[#00ffcc] focus:ring-1 focus:ring-[#00ffcc] text-center mb-6"
                    placeholder="닉네임"
                    maxLength={10}
                  />
                  <br />
                  <button 
                    onClick={() => {
                      if (nickname.trim().length > 0) {
                        setShowAIPrompt(true);
                      }
                    }}
                    className="px-8 py-3 bg-[#00ffcc] text-black font-black uppercase tracking-widest hover:bg-white transition-colors"
                  >
                    확인
                  </button>
                </>
              ) : (
                <>
                  <h1 className="text-4xl font-black text-white mb-6 uppercase tracking-widest text-[#00ffcc]">AI 파트너 소환</h1>
                  <div className="text-gray-400 font-bold mb-8 text-lg bg-black/50 p-4 rounded-xl border border-white/20 max-w-sm mx-auto">
                    전투를 시작하기 전에 AI를 추가하시겠습니까?<br/><span className="text-sm">(AI는 같은 팀입니다!)</span>
                  </div>
                  <div className="flex gap-4 justify-center">
                    <button 
                      onClick={() => {
                        setIsJoined(true);
                        emitUpdateProfile(nickname);
                        setHasAIPartner(true);
                      }}
                      className="px-8 py-3 bg-[#00ffcc] text-black font-black uppercase tracking-widest hover:bg-white transition-colors rounded-md"
                    >
                      수락!
                    </button>
                    <button 
                      onClick={() => {
                        setIsJoined(true);
                        emitUpdateProfile(nickname);
                      }}
                      className="px-8 py-3 bg-gray-600 text-white font-black uppercase tracking-widest hover:bg-gray-500 transition-colors rounded-md"
                    >
                      아니오
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

