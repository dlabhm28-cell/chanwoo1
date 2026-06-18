import { useFrame, useThree } from '@react-three/fiber';
import { useSphere } from '@react-three/cannon';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useControls } from '../hooks/useControls';
import { EnergyBlast, SpiritBombVisual, Dagger, Bomb, Explosion, WindEffect, LightningStrike, WindStorm, GiantKatana, SniperBullet, DomainExpansion, FireArrow, CrackleEffect, RikaSummon, QuickSlash, Meteor, Blackhole, Planet, CockroachSwarm, BadBreath, UnitedStatesOfSmash, ShatteredGlass, UnlimitedVoidEffect, SelfEmbodimentofPerfectionEffect, TimeCellMoonPalaceEffect, SpaceCleaveEffect, HollowPurpleEffect } from './Projectiles';

import { RobloxCharacter } from './RobloxCharacter';

const SPEED = 5;
const JUMP_FORCE = 4;

export const Player = ({ onShoot, onThrowBomb, onUseEnergy, onTriggerCooldown, cooldowns, onSpiritBomb, energy, emitMove, emitAttack, players, stats }: { 
  onShoot: () => void, 
  onThrowBomb: () => void,
  onUseEnergy?: (amount: number) => void,
  onTriggerCooldown?: (skill: string) => void,
  cooldowns?: { rika: number, slash: number, meteor: number },
  onSpiritBomb: () => void,
  energy: number,
  emitMove: (pos: [number, number, number], rot: [number, number, number], danceType?: number) => void,
  emitAttack: (type: string, data: any) => void,
  players: any[],
  stats: any
}) => {
  const { camera } = useThree();
  const { forward, backward, left, right, jump, spiritBomb, dagger, bomb, charge, weapon1, weapon2, weapon3, weapon4, weapon5, weapon6, weapon7, weapon8, weapon9, weapon0, sniper, domain, fuga, theWorld, summon, barrier, dashAttack, blackFlash, frameFreeze, unlimitedVoid, selfEmbodiment, timeCellMoonPalace, spaceCleave, hollowPurple } = useControls();
  
  const [ref, api] = useSphere(() => ({
    mass: 1,
    type: 'Dynamic',
    fixedRotation: true,
    allowSleep: false,
    position: [0, 2, 0],
    args: [0.5],
  }));

  const velocity = useRef([0, 0, 0]);
  useEffect(() => {
    const unsubscribe = api.velocity.subscribe((v) => (velocity.current = v));
    return () => unsubscribe();
  }, [api.velocity]);

  const pos = useRef([0, 0, 0]);
  useEffect(() => {
    const unsubscribe = api.position.subscribe((p) => (pos.current = p));
    return () => unsubscribe();
  }, [api.position]);

  const [blasts, setBlasts] = useState<{ id: number; pos: [number, number, number]; dir: [number, number, number] }[]>([]);
  const [daggers, setDaggers] = useState<{ id: number; pos: [number, number, number]; dir: [number, number, number] }[]>([]);
  const [bombs, setBombs] = useState<{ id: number; pos: [number, number, number]; dir: [number, number, number] }[]>([]);
  const [explosions, setExplosions] = useState<{ id: number; pos: [number, number, number] }[]>([]);
  const [windEffects, setWindEffects] = useState<{ id: number; pos: [number, number, number] }[]>([]);
  const [activeSpiritBomb, setActiveSpiritBomb] = useState(false);

  const [weaponType, setWeaponType] = useState<'lightning' | 'dagger' | 'rika' | 'slash' | 'meteor' | 'blackhole' | 'planet' | 'cockroach' | 'badbreath' | 'uss'>('lightning');

  const [windStorms, setWindStorms] = useState<{ id: number; pos: [number, number, number] }[]>([]);
  const [giantKatanas, setGiantKatanas] = useState<{ id: number; pos: [number, number, number]; rot: number }[]>([]);
  const [sniperBullets, setSniperBullets] = useState<{ id: number; pos: [number, number, number]; dir: [number, number, number] }[]>([]);
  const [domainExpansions, setDomainExpansions] = useState<{ id: number; pos: [number, number, number]; rot: number }[]>([]);
  const [fireArrows, setFireArrows] = useState<{ id: number; pos: [number, number, number]; dir: [number, number, number] }[]>([]);
  const [voids, setVoids] = useState<{ id: number; pos: [number, number, number] }[]>([]);
  const [selfEmbodiments, setSelfEmbodiments] = useState<{ id: number; pos: [number, number, number]; rot: number }[]>([]);
  const [timeCells, setTimeCells] = useState<{ id: number; pos: [number, number, number] }[]>([]);
  const [spaceCleaves, setSpaceCleaves] = useState<{ id: number; pos: [number, number, number]; rot: number }[]>([]);
  const [hollowPurples, setHollowPurples] = useState<{ id: number; pos: [number, number, number]; dir: [number, number, number] }[]>([]);

  const [bombCount, setBombCount] = useState(0);
  const prevSniper = useRef(false);
  const prevDomain = useRef(false);
  const prevFuga = useRef(false);
  const prevTheWorld = useRef(false);
  const prevSummon = useRef(false);
  const prevBarrier = useRef(false);
  const prevUnlimitedVoid = useRef(false);
  const prevSelfEmbodiment = useRef(false);
  const prevTimeCell = useRef(false);
  const prevSpaceCleave = useRef(false);
  const prevHollowPurple = useRef(false);

  const [lightnings, setLightnings] = useState<{ id: number; pos: [number, number, number]; isPowerful: boolean; isUltimate?: boolean; isRainbow?: boolean; forceColor?: string }[]>([]);
  const [crackles, setCrackles] = useState<{ id: number; pos: [number, number, number]; color: string }[]>([]);
  const [chargeProgress, setChargeProgress] = useState(0);
  const [isBarrierActive, setIsBarrierActive] = useState(false);
  const [barrierEffect, setBarrierEffect] = useState(false);
  const [isVoidDashing, setIsVoidDashing] = useState(false);
  const voidDashTimer = useRef(0);
  const [rikaSummons, setRikaSummons] = useState<{ id: number; pos: [number, number, number]; rot: number }[]>([]);
  const [quickSlashes, setQuickSlashes] = useState<{ id: number; pos: [number, number, number]; rot: number }[]>([]);
  const barrierTimer = useRef<any>(null);
  const chargeStart = useRef<number | null>(null);
  const [blackholes, setBlackholes] = useState<{ id: number; pos: [number, number, number] }[]>([]);
  const [planets, setPlanets] = useState<{ id: number; pos: [number, number, number]; rot: number }[]>([]);
  const [cockroachSwarms, setCockroachSwarms] = useState<{ id: number; pos: [number, number, number]; rot: number; amount: number }[]>([]);
  const [badBreaths, setBadBreaths] = useState<{ id: number; pos: [number, number, number]; rot: number }[]>([]);
  const [usses, setUsses] = useState<{ id: number; pos: [number, number, number]; rot: number }[]>([]);
  const [shatters, setShatters] = useState<{ id: number; pos: [number, number, number] }[]>([]);

  const [danceType, setDanceType] = useState(0);
  const [isThirdPerson, setIsThirdPerson] = useState(false);

  useEffect(() => {
    const handleShatter = (e: any) => {
      setShatters(prev => [...prev, { id: Math.random() * 100000 + Date.now(), pos: e.detail.pos }]);
    };
    const handleStartDance = (e: any) => {
      setDanceType(e.detail.type);
      emitMove(
        [pos.current[0], pos.current[1], pos.current[2]],
        [camera.rotation.x, camera.rotation.y, camera.rotation.z],
        e.detail.type
      );
    };
    const handleToggleThirdPerson = () => setIsThirdPerson(prev => !prev);
    
    window.addEventListener('shatterDied', handleShatter);
    window.addEventListener('startDance', handleStartDance);
    window.addEventListener('toggleThirdPerson', handleToggleThirdPerson);
    return () => {
      window.removeEventListener('shatterDied', handleShatter);
      window.removeEventListener('startDance', handleStartDance);
      window.removeEventListener('toggleThirdPerson', handleToggleThirdPerson);
    };
  }, []);

  useEffect(() => {
    if (weapon1) setWeaponType('lightning');
    if (weapon2) setWeaponType('dagger');
    if (weapon3) setWeaponType('rika');
    if (weapon4) setWeaponType('slash');
    if (weapon5) setWeaponType('meteor');
    if (weapon6) setWeaponType('blackhole');
    if (weapon7) setWeaponType('planet');
    if (weapon8) setWeaponType('cockroach');
    if (weapon9) setWeaponType('badbreath');
    if (weapon0) setWeaponType('uss');
  }, [weapon1, weapon2, weapon3, weapon4, weapon5, weapon6, weapon7, weapon8, weapon9, weapon0]);

  const fireDomain = () => {
    const rot = camera.rotation.y;
    const domainPos: [number, number, number] = [pos.current[0], 0, pos.current[2]];

    setDomainExpansions(prev => [...prev, { id: Math.random() * 1000000 + Date.now(), pos: domainPos, rot }]);
    window.dispatchEvent(new CustomEvent('domainTrigger'));
    
    emitAttack('domain', { pos: domainPos, rot });
  };

  const fireSelfEmbodiment = () => {
    const sePos: [number, number, number] = [pos.current[0], 0.1, pos.current[2]];
    const rot = camera.rotation.y;
    setSelfEmbodiments(prev => [...prev, { id: Math.random() * 1000000 + Date.now(), pos: sePos, rot }]);
    emitAttack('selfEmbodiment', { pos: sePos, rot });
  };

  const fireTimeCell = () => {
    const tcPos: [number, number, number] = [pos.current[0], 0.1, pos.current[2]];
    setTimeCells(prev => [...prev, { id: Math.random() * 1000000 + Date.now(), pos: tcPos }]);
    emitAttack('timeCellMoonPalace', { pos: tcPos });
  };

  const fireSpaceCleave = () => {
    if (energy < 50) return;
    if (onUseEnergy) onUseEnergy(50);
    window.dispatchEvent(new CustomEvent('showSystemMessage', { detail: { text: "공간참! (World Bisecting Slash)", color: "#ff0044" } }));
    
    const rot = camera.rotation.y;
    const scPos: [number, number, number] = [pos.current[0], pos.current[1] + 1, pos.current[2]];
    setSpaceCleaves(prev => [...prev, { id: Math.random() * 1000000 + Date.now(), pos: scPos, rot }]);
  };

  const fireHollowPurple = () => {
    if (energy < 80) { window.dispatchEvent(new CustomEvent('playSound', { detail: { type: 'error' } })); return; }
    if (onUseEnergy) onUseEnergy(80);
    window.dispatchEvent(new CustomEvent('showSystemMessage', { detail: { text: "허식 「자」 (Hollow Purple)", color: "#a855f7" } }));
    
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    const hpPos: [number, number, number] = [pos.current[0], pos.current[1] + 1, pos.current[2]];
    setHollowPurples(prev => [...prev, { id: Math.random() * 1000000 + Date.now(), pos: hpPos, dir: [direction.x, direction.y, direction.z] }]);
  };

  const fireUnlimitedVoid = () => {
    const voidPos: [number, number, number] = [pos.current[0], 0.1, pos.current[2]];
    setVoids(prev => [...prev, { id: Math.random() * 1000000 + Date.now(), pos: voidPos }]);
    emitAttack('unlimitedVoid', { pos: voidPos }); // if needed for mutliplayer
  };

  const fireFuga = () => {
    if (energy < 15) return;
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    const spawnPos = new THREE.Vector3(pos.current[0], pos.current[1] + 1.2, pos.current[2]);
    spawnPos.add(direction.clone().multiplyScalar(1.5));

    setFireArrows(prev => [...prev, { 
      id: Math.random() * 1000000 + Date.now(), 
      pos: [spawnPos.x, spawnPos.y, spawnPos.z], 
      dir: [direction.x, direction.y, direction.z] 
    }]);
    emitAttack('fuga', {
      pos: [spawnPos.x, spawnPos.y, spawnPos.z],
      dir: [direction.x, direction.y, direction.z]
    });
    onShoot();
  };

  const fireTheWorld = () => {
    if (energy < 20) return;
    window.dispatchEvent(new CustomEvent('theWorldTrigger'));
    emitAttack('theWorld', {});
    onShoot();
  };

  useEffect(() => {
    if (domain && !prevDomain.current) {
      fireDomain();
    }
    prevDomain.current = domain;
  }, [domain]);

  useEffect(() => {
    if (unlimitedVoid && !prevUnlimitedVoid.current) {
      fireUnlimitedVoid();
    }
    prevUnlimitedVoid.current = unlimitedVoid;
  }, [unlimitedVoid]);

  useEffect(() => {
    if (selfEmbodiment && !prevSelfEmbodiment.current) {
      fireSelfEmbodiment();
    }
    prevSelfEmbodiment.current = selfEmbodiment;
  }, [selfEmbodiment]);

  useEffect(() => {
    if (timeCellMoonPalace && !prevTimeCell.current) {
      fireTimeCell();
    }
    prevTimeCell.current = timeCellMoonPalace;
  }, [timeCellMoonPalace]);

  useEffect(() => {
    if (spaceCleave && !prevSpaceCleave.current) {
      fireSpaceCleave();
    }
    prevSpaceCleave.current = spaceCleave;
  }, [spaceCleave]);

  useEffect(() => {
    if (hollowPurple && !prevHollowPurple.current) {
      fireHollowPurple();
    }
    prevHollowPurple.current = hollowPurple;
  }, [hollowPurple]);

  useEffect(() => {
    if (fuga && !prevFuga.current) {
      fireFuga();
    }
    prevFuga.current = fuga;
  }, [fuga]);

  useEffect(() => {
    if (theWorld && !prevTheWorld.current) {
      fireTheWorld();
    }
    prevTheWorld.current = theWorld;
  }, [theWorld]);

  const fireSummon = () => {
    if (energy < 40) return;
    window.dispatchEvent(new CustomEvent('summonTrigger', { 
      detail: { pos: [pos.current[0], pos.current[1], pos.current[2]] } 
    }));
    onShoot(); // Consume energy/feedback
    emitAttack('summon', { pos: [pos.current[0], pos.current[1], pos.current[2]] });
  };

  useEffect(() => {
    if (summon && !prevSummon.current) {
      fireSummon();
    }
    prevSummon.current = summon;
  }, [summon, energy]);

  const prevWeapon5 = useRef(false);
  const [meteors, setMeteors] = useState<{ id: number; pos: [number, number, number]; rot: number }[]>([]);

  const fireRika = (level: number) => {
    if (energy < 20) return;
    if (onUseEnergy) onUseEnergy(20 + level * 10);
    window.dispatchEvent(new CustomEvent('showSystemMessage', { detail: { text: "완전현현! 리카!! (Lv" + level + ")", color: "#ff00ff" } }));
    window.dispatchEvent(new CustomEvent('playSound', { detail: { type: 'rikaLaser' } }));
      
    const rot = Math.atan2(camera.getWorldDirection(new THREE.Vector3()).x, camera.getWorldDirection(new THREE.Vector3()).z);
    const spawnPos: [number, number, number] = [
      pos.current[0] - Math.sin(rot) * 2,
      0,
      pos.current[2] - Math.cos(rot) * 2
    ];
    setRikaSummons(prev => [...prev, { id: Math.random() * 1000000 + Date.now(), pos: spawnPos, rot }]);
  };

  const fireSlash = (level: number) => {
    if (energy < 15) return;
    if (onUseEnergy) onUseEnergy(15 + level * 10);
    window.dispatchEvent(new CustomEvent('showSystemMessage', { detail: { text: "발도술 (Iaijutsu)!! (Lv" + level + ")", color: "#aaffff" } }));
    window.dispatchEvent(new CustomEvent('playSound', { detail: { type: 'dash' } }));
      
    const rot = Math.atan2(camera.getWorldDirection(new THREE.Vector3()).x, camera.getWorldDirection(new THREE.Vector3()).z);
    const spawnPos: [number, number, number] = [
      pos.current[0],
      0,
      pos.current[2]
    ];
    // Can pass level to QuickSlash but let's just trigger it. It naturally gets stronger? We could spawn multiple slashes or just one.
    setQuickSlashes(prev => [...prev, { id: Math.random() * 1000000 + Date.now(), pos: spawnPos, rot }]);
  };

  const fireMeteor = (level: number) => {
    if (energy < 30) return;
    if (onUseEnergy) onUseEnergy(30 + level * 20);
    // 5 = meteor
    const rot = Math.atan2(camera.getWorldDirection(new THREE.Vector3()).x, camera.getWorldDirection(new THREE.Vector3()).z);
    
    // Spawn meteor slightly ahead of the player to avoid hitting themselves directly
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    direction.y = 0;
    direction.normalize();

    const spawnPos: [number, number, number] = [
      pos.current[0] + direction.x * 20,
      0,
      pos.current[2] + direction.z * 20
    ];
    setMeteors(prev => [...prev, { id: Math.random() * 1000000 + Date.now(), pos: spawnPos, rot }]);
  };

  const fireBlackhole = (level: number) => {
    if (energy < 40) return;
    if (onUseEnergy) onUseEnergy(40 + level * 20);
    
    window.dispatchEvent(new CustomEvent('showSystemMessage', { detail: { text: "블랙홀 생성!! (Lv" + level + ")", color: "#8800ff" } }));
    window.dispatchEvent(new CustomEvent('playSound', { detail: { type: 'bassDrop' } }));
      
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    direction.y = 0;
    direction.normalize();

    const spawnPos: [number, number, number] = [
      pos.current[0] + direction.x * 15,
      5,
      pos.current[2] + direction.z * 15
    ];
    setBlackholes(prev => [...prev, { id: Math.random() * 1000000 + Date.now(), pos: spawnPos }]);
  };

  const firePlanet = (level: number) => {
    if (energy < 60) return;
    if (onUseEnergy) onUseEnergy(60 + level * 20);
    
    window.dispatchEvent(new CustomEvent('showSystemMessage', { detail: { text: "합동 폭격: 행성 투척!! (Lv" + level + ")", color: "#facc15" } }));
    window.dispatchEvent(new CustomEvent('playSound', { detail: { type: 'bassDrop' } }));
      
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    direction.y = 0;
    direction.normalize();
    const rot = Math.atan2(direction.x, direction.z);

    const spawnPos: [number, number, number] = [
      pos.current[0] + direction.x * 25,
      0,
      pos.current[2] + direction.z * 25
    ];
    setPlanets(prev => [...prev, { id: Math.random() * 1000000 + Date.now(), pos: spawnPos, rot }]);
  };

  const fireCockroaches = (level: number) => {
    if (energy < 15) return;
    if (onUseEnergy) onUseEnergy(15 + level * 10);
    
    const amount = 300 * Math.pow(3, level - 1);
    window.dispatchEvent(new CustomEvent('showSystemMessage', { detail: { text: `바선생 소환!! x${amount} (Lv${level})`, color: "#5c4033" } }));
      
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    direction.y = 0;
    direction.normalize();
    const rot = Math.atan2(direction.x, direction.z);

    const spawnPos: [number, number, number] = [
      pos.current[0],
      0,
      pos.current[2]
    ];
    setCockroachSwarms(prev => [...prev, { id: Math.random() * 1000000 + Date.now(), pos: spawnPos, rot, amount }]);
  };

  const fireBadBreath = (level: number) => {
    if (energy < 10) return;
    if (onUseEnergy) onUseEnergy(10 + level * 5);
    
    window.dispatchEvent(new CustomEvent('showSystemMessage', { detail: { text: `입냄새 발사!! (Lv${level})`, color: "#22c55e" } }));
      
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    direction.y = 0;
    direction.normalize();
    const rot = Math.atan2(direction.x, direction.z);

    const spawnPos: [number, number, number] = [
      pos.current[0] + direction.x * 2,
      1,
      pos.current[2] + direction.z * 2
    ];
    setBadBreaths(prev => [...prev, { id: Math.random() * 1000000 + Date.now(), pos: spawnPos, rot }]);
  };

  const fireUss = (level: number) => {
    if (energy < 50) return;
    if (onUseEnergy) onUseEnergy(50 + level * 20);
    
    window.dispatchEvent(new CustomEvent('showSystemMessage', { detail: { text: `UNITED STATES OF SMASH!! (Lv${level})`, color: "#ef4444" } }));
      
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    direction.y = 0;
    direction.normalize();
    const rot = Math.atan2(direction.x, direction.z);

    const spawnPos: [number, number, number] = [
      pos.current[0] + direction.x * 5,
      0,
      pos.current[2] + direction.z * 5
    ];
    setUsses(prev => [...prev, { id: Math.random() * 1000000 + Date.now(), pos: spawnPos, rot }]);
  };

  const fireSniper = () => {
    if (energy < 10) return;
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    const spawnPos = new THREE.Vector3(pos.current[0], pos.current[1] + 1.2, pos.current[2]);
    spawnPos.add(direction.clone().multiplyScalar(1.5));

    setSniperBullets(prev => [...prev, { 
      id: Math.random() * 1000000 + Date.now(), 
      pos: [spawnPos.x, spawnPos.y, spawnPos.z], 
      dir: [direction.x, direction.y, direction.z] 
    }]);
    emitAttack('sniper', {
      pos: [spawnPos.x, spawnPos.y, spawnPos.z],
      dir: [direction.x, direction.y, direction.z]
    });
    onShoot();
  };

  useEffect(() => {
    if (prevSniper.current && !sniper) {
      fireSniper();
    }
    if (prevSniper.current !== sniper) {
      window.dispatchEvent(new CustomEvent('sniperAim', { detail: { aiming: sniper } }));
    }
    prevSniper.current = sniper;
  }, [sniper]);

  const prevDashAttack = useRef(false);
  const isDashing = useRef(false);
  const dashTimer = useRef(0);
  const dashCombo = useRef(0);
  const dashAngleOffset = useRef(0);

  useEffect(() => {
    if (dashAttack && !prevDashAttack.current) {
      if (dashCombo.current < 8 && energy >= (dashCombo.current === 0 ? 30 : 5)) {
        isDashing.current = true;
        dashTimer.current = 15;
        dashCombo.current += 1;
        
        onShoot(); // consume energy
        
        if (dashCombo.current === 1) {
          window.dispatchEvent(new CustomEvent('showSystemMessage', { detail: { text: "번개의 호흡 제1형: 벽력일섬", color: "#fbbf24" } }));
          dashAngleOffset.current = 0;
        } else if (dashCombo.current === 8) {
          window.dispatchEvent(new CustomEvent('showSystemMessage', { detail: { text: "번개의 호흡 제1형: 벽력일섬 8연!!", color: "#fbbf24" } }));
          dashAngleOffset.current = 0;
        } else {
          // Zigzag alternate +30 and -30 degrees
          dashAngleOffset.current = dashCombo.current % 2 === 0 ? Math.PI / 6 : -Math.PI / 6;
        }

        window.dispatchEvent(new CustomEvent('playSound', { detail: { type: 'dash' } }));
        setLightnings(prev => [...prev.slice(-20), { id: Math.random() * 1000000 + Date.now(), pos: [pos.current[0], 0, pos.current[2]], isPowerful: true, forceColor: "#fbbf24" }]);
      }
    }
    prevDashAttack.current = dashAttack;
  }, [dashAttack, energy]);

  const prevBlackFlash = useRef(false);
  const prevFrameFreeze = useRef(false);

  useEffect(() => {
    if (frameFreeze && !prevFrameFreeze.current && energy >= 30) {
      if (onUseEnergy) onUseEnergy(30);
      window.dispatchEvent(new CustomEvent('showSystemMessage', { detail: { text: "유리 프레임 동결!", color: "#88ccff" } }));
      
      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);
      const spawnPos = new THREE.Vector3(pos.current[0], pos.current[1], pos.current[2]);
      
      // Send a massive explosion event that freezes enemies
      window.dispatchEvent(new CustomEvent('bombExplode', { 
        detail: { pos: [spawnPos.x, spawnPos.y, spawnPos.z], radius: 40, damageMultiplier: 0, team: 'player', isFrameFreeze: true } 
      }));
      window.dispatchEvent(new CustomEvent('playSound', { detail: { type: 'magic' } }));
    }
    prevFrameFreeze.current = frameFreeze;
  }, [frameFreeze, energy]);

  useEffect(() => {
    if (blackFlash && !prevBlackFlash.current && energy >= 20) {
      onShoot(); // consume energy base
      
      window.dispatchEvent(new CustomEvent('showSystemMessage', { detail: { text: "흑섬 (Black Flash)!!", color: "#ff0000" } }));
      window.dispatchEvent(new CustomEvent('playSound', { detail: { type: 'blackFlash' } }));
      
      const p = pos.current;
      const currentCamera = camera;
      const direction = new THREE.Vector3();
      currentCamera.getWorldDirection(direction);
      direction.setY(0);
      if (direction.lengthSq() < 0.001) direction.set(0, 0, -1);
      direction.normalize();

      // Black Flash punch - originate from the player body
      const dist = 0.5;
      const impactPos: [number, number, number] = [p[0] + direction.x * dist, p[1] + 1, p[2] + direction.z * dist];

      setCrackles(prev => [
        ...prev,
        { id: Math.random() * 1000000 + Date.now(), pos: impactPos, color: "blackflash" }
      ]);
      
      window.dispatchEvent(new CustomEvent('bombExplode', { 
        detail: { pos: impactPos, radius: 4, team: 'player', damageMultiplier: 8.0, launchForce: 12 } 
      }));
    }
    prevBlackFlash.current = blackFlash;
  }, [blackFlash, energy, camera, onShoot]);

  useEffect(() => {
    if (barrier && !prevBarrier.current) {
      if (energy >= 50 && !isBarrierActive) {
        setIsBarrierActive(true);
        setBarrierEffect(true);
        (window as any).isInvincible = true;
        
        // Show text UI
        window.dispatchEvent(new CustomEvent('showSystemMessage', { detail: { text: "이거 방탄 배리어야! 하하하!!", color: "#3b82f6" } }));
        
        if (barrierTimer.current) clearTimeout(barrierTimer.current);
        barrierTimer.current = setTimeout(() => {
          setIsBarrierActive(false);
          setBarrierEffect(false);
          (window as any).isInvincible = false;
        }, 10000);
      }
    }
    prevBarrier.current = barrier;
  }, [barrier, energy, isBarrierActive]);

  useEffect(() => {
    const handleExplode = (e: any) => {
      // Player only takes damage from enemy team or teamless explosions
      if (e.detail.team === 'player' || (window as any).isInvincible) return;

      const dx = pos.current[0] - e.detail.pos[0];
      const dy = pos.current[1] - e.detail.pos[1];
      const dz = pos.current[2] - e.detail.pos[2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      
      if (dist < e.detail.radius) {
        const damage = (1 - dist / e.detail.radius) * 10 * (e.detail.damageMultiplier || 1);
        window.dispatchEvent(new CustomEvent('playerDamage', { detail: { amount: damage } }));
      }
    };
    window.addEventListener('bombExplode', handleExplode);
    return () => window.removeEventListener('bombExplode', handleExplode);
  }, []);

  const shoot = () => {
    if (energy < 5) return;
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);

    // Spawn ahead
    const spawnPos = new THREE.Vector3(pos.current[0], pos.current[1] + 1.0, pos.current[2]);
    spawnPos.add(direction.clone().multiplyScalar(1.2));

    setBlasts(prev => [...prev.slice(-20), { 
      id: Math.random() * 1000000 + Date.now(), 
      pos: [spawnPos.x, spawnPos.y, spawnPos.z], 
      dir: [direction.x, direction.y, direction.z] 
    }]);
    emitAttack('blast', {
      pos: [spawnPos.x, spawnPos.y, spawnPos.z],
      dir: [direction.x, direction.y, direction.z]
    });
    onShoot();
  };

  const handleDaggerFinish = (id: number, hitPos: [number, number, number]) => {
    setDaggers(prev => prev.filter(d => d.id !== id));
    setWindEffects(prev => [...prev.slice(-15), { id: Math.random() * 1000000 + Date.now(), pos: hitPos }]);
  };

  const explodeBomb = (id: number, explodePos: [number, number, number]) => {
    setBombs(prev => prev.filter(b => b.id !== id));
    setExplosions(prev => [...prev.slice(-10), { id: Math.random() * 1000000 + Date.now(), pos: explodePos }]);
    
    const strMultiplier = 1 + (stats?.str || 0) * 0.1;
    const event = new CustomEvent('bombExplode', { 
      detail: { pos: explodePos, radius: 8, team: 'player', damageMultiplier: strMultiplier } 
    });
    window.dispatchEvent(event);
  };

  const callLightning = (level: number) => {
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    
    const strMultiplier = 1 + (stats?.str || 0) * 0.1;
    if (level === 5) {
      // Rainbow Ultimate
      const strikes: { id: number; pos: [number, number, number]; isPowerful: boolean; isUltimate: boolean; isRainbow: boolean }[] = [];
      const radius = 12;
      for (let i = 0; i < 10; i++) {
        const angle = (i / 10) * Math.PI * 2;
        const x = pos.current[0] + Math.cos(angle) * radius;
        const z = pos.current[2] + Math.sin(angle) * radius;
        strikes.push({ id: Math.random() * 1000000 + Date.now() + i, pos: [x, 0, z], isPowerful: true, isUltimate: true, isRainbow: true });
        
        setTimeout(() => {
          const event = new CustomEvent('bombExplode', { 
            detail: { pos: [x, 0, z], radius: 35, team: 'player', damageMultiplier: strMultiplier * 2 } 
          });
          window.dispatchEvent(event);
        }, 200 + i * 40);
      }
      setLightnings(prev => [...prev, ...strikes]);
    } else if (level === 3 || level === 4) {
      const count = level === 4 ? 12 : 8;
      const strikes: { id: number; pos: [number, number, number]; isPowerful: boolean; isUltimate: boolean }[] = [];
      const radius = 10;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const x = pos.current[0] + Math.cos(angle) * radius;
        const z = pos.current[2] + Math.sin(angle) * radius;
        strikes.push({ id: Math.random() * 1000000 + Date.now() + i, pos: [x, 0, z], isPowerful: true, isUltimate: true });
        
        setTimeout(() => {
          const event = new CustomEvent('bombExplode', { 
            detail: { pos: [x, 0, z], radius: 25, team: 'player', damageMultiplier: strMultiplier * 1.5 } 
          });
          window.dispatchEvent(event);
        }, 200 + i * 50);
      }
      setLightnings(prev => [...prev, ...strikes]);
    } else {
      const isPowerful = level === 2;
      const targetPos = new THREE.Vector3(pos.current[0], 0, pos.current[2]);
      const flatDir = direction.clone().setY(0);
      if (flatDir.lengthSq() < 0.001) flatDir.set(0, 0, -1);
      targetPos.add(flatDir.normalize().multiplyScalar(15));
      
      setLightnings(prev => [...prev, { id: Math.random() * 1000000 + Date.now(), pos: [targetPos.x, targetPos.y, targetPos.z], isPowerful }]);
      emitAttack('lightning', {
        pos: [targetPos.x, targetPos.y, targetPos.z],
        isPowerful
      });
      
      setTimeout(() => {
        const event = new CustomEvent('bombExplode', { 
          detail: { pos: [targetPos.x, 0, targetPos.z], radius: isPowerful ? 15 : 6, team: 'player', damageMultiplier: strMultiplier * (isPowerful ? 3 : 1) } 
        });
        window.dispatchEvent(event);
      }, 200);
    }
    onShoot();
  };

  useEffect(() => {
    let interval: any;
    if (charge) {
      if (chargeStart.current === null) chargeStart.current = Date.now();
      interval = setInterval(() => {
        const elapsed = (Date.now() - chargeStart.current!) / 1000;
        setChargeProgress(Math.min(1, elapsed / 5));
      }, 20);
    } else {
      if (chargeStart.current !== null) {
        const elapsed = (Date.now() - chargeStart.current) / 1000;
        if (weaponType === 'lightning') {
          if (elapsed >= 5) callLightning(5);
          else if (elapsed >= 3.5) callLightning(4);
          else if (elapsed >= 2.2) callLightning(3);
          else if (elapsed >= 1.0) callLightning(2);
          else if (energy >= 15) callLightning(1);
        } else if (weaponType === 'dagger') {
          if (elapsed >= 3.5) throwDaggerShot(3);
          else if (elapsed >= 1.5) throwDaggerShot(2);
          else if (energy >= 2) throwDaggerShot(1);
        } else if (weaponType === 'rika') {
          if (elapsed >= 3.5) fireRika(3);
          else if (elapsed >= 1.5) fireRika(2);
          else if (energy >= 20) fireRika(1);
        } else if (weaponType === 'slash') {
          if (elapsed >= 3.5) fireSlash(3);
          else if (elapsed >= 1.5) fireSlash(2);
          else if (energy >= 15) fireSlash(1);
        } else if (weaponType === 'meteor') {
          if (elapsed >= 3.5) fireMeteor(3);
          else if (elapsed >= 1.5) fireMeteor(2);
          else if (energy >= 30) fireMeteor(1);
        } else if (weaponType === 'blackhole') {
          if (elapsed >= 3.5) fireBlackhole(3);
          else if (elapsed >= 1.5) fireBlackhole(2);
          else if (energy >= 40) fireBlackhole(1);
        } else if (weaponType === 'planet') {
          if (elapsed >= 3.5) firePlanet(3);
          else if (elapsed >= 1.5) firePlanet(2);
          else if (energy >= 60) firePlanet(1);
        } else if (weaponType === 'cockroach') {
          if (elapsed >= 3.5) fireCockroaches(3);
          else if (elapsed >= 1.5) fireCockroaches(2);
          else if (energy >= 15) fireCockroaches(1);
        } else if (weaponType === 'badbreath') {
          if (elapsed >= 3.5) fireBadBreath(3);
          else if (elapsed >= 1.5) fireBadBreath(2);
          else if (energy >= 10) fireBadBreath(1);
        } else if (weaponType === 'uss') {
          if (elapsed >= 3.5) fireUss(3);
          else if (elapsed >= 1.5) fireUss(2);
          else if (energy >= 50) fireUss(1);
        }
        chargeStart.current = null;
        setChargeProgress(0);
      }
    }
    return () => clearInterval(interval);
  }, [charge, energy, weaponType]);

  const throwBomb = () => {
    if (energy < 20) return;
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);

    // FIX: Stabilize gravity launch. Spawn further ahead to avoid collision with player.
    const forwardDir = direction.clone().setY(0);
    if (forwardDir.lengthSq() < 0.001) forwardDir.set(0, 0, -1);
    forwardDir.normalize();
    const spawnPos = new THREE.Vector3(pos.current[0], pos.current[1] + 1.2, pos.current[2]);
    spawnPos.add(forwardDir.clone().multiplyScalar(2.0)); // Increased offset

    const bombVelocity = new THREE.Vector3(forwardDir.x * 0.1, 0.05, forwardDir.z * 0.1); // Reduced throw force by 10x from previous x1

    setBombs(prev => [...prev, { 
      id: Math.random() * 1000000 + Date.now(), 
      pos: [spawnPos.x, spawnPos.y, spawnPos.z], 
      dir: [forwardDir.x, forwardDir.y, forwardDir.z] 
    }]);
    emitAttack('bomb', {
      pos: [spawnPos.x, spawnPos.y, spawnPos.z],
      dir: [forwardDir.x, forwardDir.y, forwardDir.z]
    });
    onThrowBomb();
  };


  const summonSpiritBomb = () => {
    if (energy < 80 || activeSpiritBomb) return;
    setActiveSpiritBomb(true);
    emitAttack('spiritBomb', {
      pos: [pos.current[0], pos.current[1] + 10, pos.current[2]]
    });
    onSpiritBomb();
    setTimeout(() => setActiveSpiritBomb(false), 5000);
  };

  useEffect(() => {
    const handleMouseDown = () => {
      if (document.pointerLockElement === null) return;
      shoot();
    };

    const handleResetPosition = () => {
      api.position.set(0, 5, 0);
      api.velocity.set(0, 0, 0);
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('resetPosition', handleResetPosition);
    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('resetPosition', handleResetPosition);
    };
  }, [energy]);

  useEffect(() => {
    if (spiritBomb) summonSpiritBomb();
  }, [spiritBomb]);

  const throwDaggerShot = (level: number) => {
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    const spawnPos = new THREE.Vector3(pos.current[0], pos.current[1] + 1.2, pos.current[2]);
    const forwardDir = direction.clone().setY(0);
    if (forwardDir.lengthSq() < 0.001) forwardDir.set(0, 0, -1);
    forwardDir.normalize();
    
    if (level === 3) {
      // Giant Katana Sweep
      setGiantKatanas(prev => [...prev, { 
        id: Math.random() * 1000000 + Date.now(), 
        pos: [pos.current[0], 0.5, pos.current[2]], 
        rot: camera.rotation.y 
      }]);
      emitAttack('katana', {
        pos: [pos.current[0], 0.5, pos.current[2]],
        rot: camera.rotation.y
      });
    } else if (level === 2) {
      // Wind Storm
      const targetPos = new THREE.Vector3(pos.current[0], 0, pos.current[2]);
      targetPos.add(forwardDir.clone().multiplyScalar(10));
      setWindStorms(prev => [...prev, { id: Math.random() * 1000000 + Date.now(), pos: [targetPos.x, targetPos.y, targetPos.z] }]);
      emitAttack('windStorm', {
        pos: [targetPos.x, targetPos.y, targetPos.z]
      });
    } else {
      // Level 1: Normal dagger
      const rightSide = new THREE.Vector3(0.6, -0.2, -0.8);
      rightSide.applyQuaternion(camera.quaternion);
      spawnPos.add(rightSide).add(direction.clone().multiplyScalar(1.2));
      
      setDaggers(prev => [...prev, { 
        id: Math.random() * 1000000 + Date.now(), 
        pos: [spawnPos.x, spawnPos.y, spawnPos.z], 
        dir: [direction.x, direction.y, direction.z] 
      }]);
      emitAttack('dagger', {
        pos: [spawnPos.x, spawnPos.y, spawnPos.z],
        dir: [direction.x, direction.y, direction.z]
      });
    }
    onShoot();
  };

  useEffect(() => {
    if (dagger) throwDaggerShot(1);
  }, [dagger]);

  useEffect(() => {
    if (bomb) throwBomb();
  }, [bomb]);

  useEffect(() => {
    // Lightning charge logic is handled in the main effect now
  }, []);

  // Track un-dash timeout
  const timeSinceLastDash = useRef(0);

  useFrame((state, delta) => {
    const { camera: currentCamera } = state;
    if (!currentCamera) return;

    if (isVoidDashing) {
      voidDashTimer.current += delta;
      
      const direction = new THREE.Vector3();
      currentCamera.getWorldDirection(direction);
      direction.setY(0);
      if (direction.lengthSq() < 0.001) direction.set(0, 0, -1);
      direction.normalize();

      const moveSpeed = (SPEED + (stats?.agi || 0) * 0.5) * 5; // 5x speed boost

      api.velocity.set(direction.x * moveSpeed, velocity.current[1], direction.z * moveSpeed);

      if (Math.floor(voidDashTimer.current * 10) > Math.floor((voidDashTimer.current - delta) * 10)) {
        window.dispatchEvent(new CustomEvent('bombExplode', {
          detail: { pos: pos.current, radius: 6, damageMultiplier: 5, team: 'player' }
        }));
      }

      // Dash finishes after 10s
      if (voidDashTimer.current > 10) {
        setIsVoidDashing(false);
        voidDashTimer.current = 0;
        window.dispatchEvent(new CustomEvent('voidDashEnd'));
      }
    } else if ((window as any).isCinematic) {
       // Freeze velocity
       api.velocity.set(0, velocity.current[1], 0);
       return; // SKIP CAMERA OVERRIDE
    } else {
      if (!isDashing.current && dashCombo.current > 0) {
        timeSinceLastDash.current += 1;
        // If we wait for roughly ~30 frames without clicking dash again, combo resets
        if (timeSinceLastDash.current > 30) {
          dashCombo.current = 0;
          timeSinceLastDash.current = 0;
        }
      } else if (isDashing.current) {
        timeSinceLastDash.current = 0;
      }

      if (isDashing.current) {
        dashTimer.current -= 1;
        
        const direction = new THREE.Vector3();
        currentCamera.getWorldDirection(direction);
        direction.setY(0);
        if (direction.lengthSq() < 0.001) direction.set(0, 0, -1);
        direction.normalize();
        
        // Apply zigzag offset
        if (dashAngleOffset.current !== 0) {
          direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), dashAngleOffset.current);
        }
        
        // push forward fast
        api.velocity.set(direction.x * (45 + (stats?.agi || 0)), velocity.current[1], direction.z * (45 + (stats?.agi || 0)));
        
        // Damage everything along the path, apply launch force on combo hits!
        const launch = dashCombo.current > 1 ? 15 : 0;
        window.dispatchEvent(new CustomEvent('bombExplode', { 
           detail: { pos: [pos.current[0], pos.current[1], pos.current[2]], radius: 4.5, team: 'player', damageMultiplier: 3.0 * (1 + (stats?.str || 0) * 0.1), launchForce: launch } 
        }));
        
        if (dashTimer.current <= 0) {
          isDashing.current = false;
          api.velocity.set(0, Math.min(velocity.current[1], 0), 0);
        }
      } else {
        const direction = new THREE.Vector3();
        const frontVector = new THREE.Vector3(0, 0, (backward ? 1 : 0) - (forward ? 1 : 0));
        const sideVector = new THREE.Vector3((left ? 1 : 0) - (right ? 1 : 0), 0, 0);
        
        // Cancel dance
        if (danceType !== 0 && (forward || backward || left || right || jump)) {
          setDanceType(0);
          emitMove(
            [pos.current[0], pos.current[1], pos.current[2]],
            [currentCamera.rotation.x, currentCamera.rotation.y, currentCamera.rotation.z],
            0
          );
        }

        const moveSpeed = SPEED + (stats?.agi || 0) * 0.5;

        // Calculate movement relative to camera
        const cameraRotation = new THREE.Euler(0, currentCamera.rotation.y, 0); // Only horizontal rotation
        direction
          .subVectors(frontVector, sideVector)
          .normalize()
          .multiplyScalar(moveSpeed)
          .applyEuler(cameraRotation);

        api.velocity.set(direction.x, velocity.current[1], direction.z);

        if (jump && Math.abs(velocity.current[1]) < 0.1) {
          api.velocity.set(velocity.current[0], JUMP_FORCE, velocity.current[2]);
        }
      }
    }

    // Zoom logic
    if (currentCamera instanceof THREE.PerspectiveCamera) {
      if (sniper) {
        currentCamera.fov = THREE.MathUtils.lerp(currentCamera.fov, 30, 0.2);
      } else {
        currentCamera.fov = THREE.MathUtils.lerp(currentCamera.fov, 75, 0.2);
      }
      currentCamera.updateProjectionMatrix();
    }

    if (danceType !== 0) {
      const direction = new THREE.Vector3(0, 0, 1);
      direction.applyQuaternion(currentCamera.quaternion);
      currentCamera.position.set(pos.current[0] + direction.x * 3.5, pos.current[1] + 1.0 + direction.y * 3.5, pos.current[2] + direction.z * 3.5);
    } else if (isThirdPerson) {
      const direction = new THREE.Vector3(0, 0, 1);
      direction.applyQuaternion(currentCamera.quaternion);
      currentCamera.position.set(pos.current[0] + direction.x * 4.0, pos.current[1] + 1.2 + direction.y * 4.0, pos.current[2] + direction.z * 4.0);
    } else {
      currentCamera.position.set(pos.current[0], pos.current[1] + 1.2, pos.current[2]);
    }
    
    // Fall check
    if (pos.current[1] < -10) {
      api.position.set(0, 5, 0);
      api.velocity.set(0, 0, 0);
    }

    // Sync movement
    if (state.clock.elapsedTime % 0.05 < 0.016) { // Throttle movement emits for performance
      emitMove(
        [pos.current[0], pos.current[1], pos.current[2]],
        [currentCamera.rotation.x, currentCamera.rotation.y, currentCamera.rotation.z]
      );
      window.dispatchEvent(new CustomEvent('playerMove', { 
        detail: { 
          pos: [pos.current[0], pos.current[1], pos.current[2]],
          rot: [currentCamera.rotation.x, currentCamera.rotation.y, currentCamera.rotation.z] 
        } 
      }));
    }
  });

  return (
    <>
      <mesh ref={ref as any}>
        <sphereGeometry args={[0.5, 8, 8]} />
        <meshStandardMaterial 
          color={"white"} 
          opacity={0} 
          transparent 
        />
        <RobloxCharacter playerId={"local"} danceType={danceType} visible={danceType !== 0 || isThirdPerson} position={[0, -0.4, 0]} isLocalPlayer={true} scale={0.65} />
      </mesh>

      {rikaSummons.map((r) => (
        <RikaSummon
          key={r.id}
          position={r.pos}
          rotation={r.rot}
          onFinish={() => setRikaSummons(prev => prev.filter(item => item.id !== r.id))}
        />
      ))}
      
      {quickSlashes.map((qs) => (
        <QuickSlash
          key={qs.id}
          position={qs.pos}
          rotation={qs.rot}
          onFinish={() => setQuickSlashes(prev => prev.filter(item => item.id !== qs.id))}
        />
      ))}
      
      {meteors.map((m) => (
        <Meteor
          key={m.id}
          position={m.pos}
          rotation={m.rot}
          onFinish={() => setMeteors(prev => prev.filter(item => item.id !== m.id))}
        />
      ))}
      
      {blackholes.map((b) => (
        <Blackhole
          key={b.id}
          position={b.pos}
          onFinish={() => setBlackholes(prev => prev.filter(item => item.id !== b.id))}
        />
      ))}

      {planets.map((p) => (
        <Planet
          key={p.id}
          position={p.pos}
          rotation={p.rot}
          onFinish={() => setPlanets(prev => prev.filter(item => item.id !== p.id))}
        />
      ))}

      {cockroachSwarms.map((s) => (
        <CockroachSwarm
          key={s.id}
          position={s.pos}
          rotation={s.rot}
          amount={s.amount}
          onFinish={() => setCockroachSwarms(prev => prev.filter(item => item.id !== s.id))}
        />
      ))}

      {badBreaths.map((b) => (
        <BadBreath
          key={b.id}
          position={b.pos}
          rotation={b.rot}
          onFinish={() => setBadBreaths(prev => prev.filter(item => item.id !== b.id))}
        />
      ))}

      {usses.map((u) => (
        <UnitedStatesOfSmash
          key={u.id}
          position={u.pos}
          rotation={u.rot}
          onFinish={() => setUsses(prev => prev.filter(item => item.id !== u.id))}
        />
      ))}

      {shatters.map((s) => (
        <ShatteredGlass
          key={s.id}
          position={s.pos}
          onFinish={() => setShatters(prev => prev.filter(item => item.id !== s.id))}
        />
      ))}
      
      {crackles.map(c => (
        <CrackleEffect
          key={c.id}
          position={c.pos}
          color={c.color}
          onFinish={() => setCrackles(prev => prev.filter(item => item.id !== c.id))}
        />
      ))}
      
      {blasts.map((b) => (
        <EnergyBlast 
          key={b.id} 
          position={b.pos} 
          direction={b.dir} 
          onFinish={() => setBlasts(prev => prev.filter(item => item.id !== b.id))} 
        />
      ))}

      {daggers.map((d) => (
        <Dagger 
          key={d.id} 
          position={d.pos} 
          direction={d.dir} 
          onFinish={(hitPos) => handleDaggerFinish(d.id, hitPos)} 
        />
      ))}

      {bombs.map((bm) => (
        <Bomb 
          key={bm.id} 
          position={bm.pos} 
          direction={bm.dir} 
          onExplode={(explodePos) => explodeBomb(bm.id, explodePos)} 
        />
      ))}

      {explosions.map((e) => (
        <Explosion 
          key={e.id} 
          position={e.pos} 
          onFinish={() => setExplosions(prev => prev.filter(item => item.id !== e.id))} 
        />
      ))}

      {windEffects.map((w) => (
        <WindEffect 
          key={w.id} 
          position={w.pos} 
          onFinish={() => setWindEffects(prev => prev.filter(item => item.id !== w.id))} 
        />
      ))}

      {lightnings.map((l) => (
        <LightningStrike 
          key={l.id} 
          position={l.pos} 
          isPowerful={l.isPowerful}
          isUltimate={l.isUltimate}
          isRainbow={l.isRainbow}
          forceColor={l.forceColor}
          onFinish={() => setLightnings(prev => prev.filter(item => item.id !== l.id))} 
        />
      ))}

      {windStorms.map((ws) => (
        <WindStorm 
          key={ws.id} 
          position={ws.pos} 
          onFinish={() => setWindStorms(prev => prev.filter(item => item.id !== ws.id))} 
        />
      ))}

      {giantKatanas.map((gk) => (
        <GiantKatana 
          key={gk.id} 
          position={gk.pos} 
          rotation={gk.rot} 
          onFinish={() => setGiantKatanas(prev => prev.filter(item => item.id !== gk.id))} 
        />
      ))}

      {sniperBullets.map((sb) => (
        <SniperBullet 
          key={sb.id} 
          position={sb.pos} 
          direction={sb.dir} 
          onFinish={(hitPos, hitSomething, isFinal) => {
            if (isFinal) {
              setSniperBullets(prev => prev.filter(item => item.id !== sb.id));
            }

            if (hitSomething) {
              window.dispatchEvent(new CustomEvent('sniperHit'));
              
              // Sniper damage
              const strMultiplier = 1 + (stats?.str || 0) * 0.1;
              const intMultiplier = 1 + (stats?.int || 0) * 0.05;
              const event = new CustomEvent('bombExplode', { 
                detail: { pos: hitPos, radius: 4 * intMultiplier, damageMultiplier: 8 * strMultiplier, team: 'player' } 
              });
              window.dispatchEvent(event);
            }
          }} 
        />
      ))}

      {domainExpansions.map((de) => (
        <DomainExpansion 
          key={de.id} 
          position={de.pos} 
          rotation={de.rot} 
          onFinish={() => setDomainExpansions(prev => prev.filter(item => item.id !== de.id))} 
        />
      ))}

      {selfEmbodiments.map((se) => (
        <SelfEmbodimentofPerfectionEffect
          key={se.id}
          position={se.pos}
          rotation={se.rot}
          onFinish={() => setSelfEmbodiments(prev => prev.filter(item => item.id !== se.id))}
        />
      ))}
      {timeCells.map((tc) => (
        <TimeCellMoonPalaceEffect
          key={tc.id}
          position={tc.pos}
          onFinish={() => setTimeCells(prev => prev.filter(item => item.id !== tc.id))}
        />
      ))}
      {spaceCleaves.map((sc) => (
        <SpaceCleaveEffect
          key={sc.id}
          position={sc.pos}
          rotation={sc.rot}
          onFinish={() => setSpaceCleaves(prev => prev.filter(item => item.id !== sc.id))}
        />
      ))}
      {hollowPurples.map((hp) => (
        <HollowPurpleEffect
          key={hp.id}
          position={hp.pos}
          direction={hp.dir}
          onFinish={() => setHollowPurples(prev => prev.filter(item => item.id !== hp.id))}
        />
      ))}

      {voids.map((v) => (
        <UnlimitedVoidEffect
          key={v.id}
          position={v.pos}
          onFinish={() => {
            setVoids(prev => prev.filter(item => item.id !== v.id));
            setIsVoidDashing(true);
            voidDashTimer.current = 0;
            window.dispatchEvent(new CustomEvent('voidDashStart'));
          }}
        />
      ))}

      {fireArrows.map((fa) => (
        <FireArrow 
          key={fa.id} 
          position={fa.pos} 
          direction={fa.dir} 
        />
      ))}

      {chargeProgress > 0 && (
        <group position={[pos.current[0], pos.current[1] + 2.5, pos.current[2]]} rotation={[0, camera.rotation.y, 0]}>
          {/* Background */}
          <mesh position={[0, 0, -1.01]}>
            <planeGeometry args={[1.5, 0.2]} />
            <meshBasicMaterial color="black" transparent opacity={0.6} />
          </mesh>
          
          {/* Progress Bar */}
          <mesh position={[-0.75 + (chargeProgress * 1.5) / 2, 0, -1]}>
            <planeGeometry args={[chargeProgress * 1.5, 0.15]} />
            <meshBasicMaterial 
              color={
                weaponType === 'lightning' ? (
                  chargeProgress === 1 ? "#ff00ff" : 
                  chargeProgress >= 0.7 ? "#ef4444" : 
                  chargeProgress >= 0.4 ? "#fbbf24" : "#4ade80"
                ) : (
                  chargeProgress >= 0.7 ? "#0ea5e9" : 
                  chargeProgress >= 0.3 ? "#ffffff" : "#cbd5e1"
                )
              } 
            />
          </mesh>
          
          <group position={[0, 0.25, -1]}>
             <mesh position={[-0.8, 0, 0]} scale={0.06}>
               <sphereGeometry args={[1]} />
               <meshBasicMaterial color={weaponType === 'lightning' ? "#facc15" : "#cbd5e1"} />
             </mesh>
             {/* Small visual indicators for level */}
             {[0, 1, 2, 3, 4].map((i) => (
               <mesh key={i} position={[-0.4 + i * 0.2, 0, 0]} scale={0.05}>
                 <sphereGeometry args={[1]} />
                 <meshBasicMaterial 
                   color={chargeProgress >= (i + 1) / 5 ? "#ffffff" : "#333"} 
                 />
               </mesh>
             ))}
          </group>
        </group>
      )}


      {/* Floating Dagger Indicators (Aimer) */}
      <group position={[pos.current[0], pos.current[1] + 1.2, pos.current[2]]} rotation={[0, camera.rotation.y, 0]}>
        {[0.6, -0.6].map((xOffset, i) => (
          <group key={i} position={[xOffset, -0.2, -0.8]} rotation={[Math.PI / 1.8, 0, 0]} scale={0.5}>
            {/* Mirroring the aimer by adjusting rotation if needed, but here simple scale is fine */}
            <group rotation={[0, 0, 0]}>
              {/* Blade Tip */}
              <mesh position={[0, 0.25, 0]}>
                <coneGeometry args={[0.12, 0.45, 4]} />
                <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={2} transparent opacity={0.6} />
              </mesh>
              {/* Blade Body parts */}
              <mesh position={[0, 0, 0]}>
                <boxGeometry args={[0.04, 0.5, 0.04]} />
                <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={2} transparent opacity={0.6} />
              </mesh>
              <mesh position={[0.1, 0, 0]}>
                <boxGeometry args={[0.06, 0.4, 0.02]} />
                <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={2} transparent opacity={0.6} />
              </mesh>
              <mesh position={[-0.1, 0, 0]}>
                <boxGeometry args={[0.06, 0.4, 0.02]} />
                <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={2} transparent opacity={0.6} />
              </mesh>
              {/* Ring */}
              <mesh position={[0, -0.12, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.1, 0.03, 8, 16]} />
                <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={2} transparent opacity={0.6} />
              </mesh>
              {/* Handle */}
              <mesh position={[0, -0.35, 0]}>
                <cylinderGeometry args={[0.05, 0.05, 0.4, 12]} />
                <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={2} transparent opacity={0.6} />
              </mesh>
            </group>
          </group>
        ))}
      </group>

      {activeSpiritBomb && <SpiritBombVisual position={[pos.current[0], pos.current[1] + 10, pos.current[2]]} intStat={stats?.int} />}
      
      {barrierEffect && (
        <group position={[pos.current[0], pos.current[1], pos.current[2]]}>
          <mesh>
            <sphereGeometry args={[1.5, 32, 32]} />
            <meshStandardMaterial color="#3b82f6" transparent opacity={0.3} emissive="#3b82f6" emissiveIntensity={2} />
          </mesh>
          <mesh>
            <sphereGeometry args={[1.52, 32, 32]} />
            <meshStandardMaterial color="#ffffff" wireframe transparent opacity={0.1} />
          </mesh>
        </group>
      )}
    </>
  );
};

