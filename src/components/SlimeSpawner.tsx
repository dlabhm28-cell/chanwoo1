import { useState, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { Slime } from './Slime';
import { Skeleton } from './Skeleton';
import { BossDemon } from './BossDemon';
import { ItemDrop, ItemType } from './ItemDrop';
import { RobloxCharacter } from './RobloxCharacter';
import { CrackleEffect } from './Projectiles';

import { Bomber } from './Bomber';
import { Armored } from './Armored';

export const SlimeSpawner = ({ onKill, isSpiritBombActive, explosionEvent, playerPos, playerRot, hasAIPartner }: { 
  onKill: (xp: number) => void, 
  isSpiritBombActive: boolean,
  explosionEvent: { pos: [number, number, number], radius: number, team?: string } | null,
  playerPos: [number, number, number],
  playerRot: [number, number, number],
  hasAIPartner?: boolean
}) => {
  const [enemies, setEnemies] = useState<{ id: number; type: 'slime' | 'skeleton' | 'boss' | 'bomber' | 'armored'; position: [number, number, number], isKing: boolean }[]>([]);
  const [allies, setAllies] = useState<{ id: number; type: 'alliedSlime' | 'alliedSkeleton' | 'alliedAI'; position: [number, number, number] }[]>([]);
  const [drops, setDrops] = useState<{ id: number; type: ItemType; position: [number, number, number] }[]>([]);
  const [ashEffects, setAshEffects] = useState<{ id: number; position: [number, number, number] }[]>([]);
  const [mobsImprisoned, setMobsImprisoned] = useState(false);
  const spawnTimer = useRef(0);
  const scoreRef = useRef(0);
  const bossSpawned = useRef(false);
  const lastSummonTime = useRef(0);

  useEffect(() => {
    const handleTransfigure = (e: any) => {
      const { pos, radius, chance } = e.detail;
      setEnemies(prev => {
        const remaining: typeof prev = [];
        const newAllies: typeof allies = [];
        
        prev.forEach(enemy => {
          const dx = enemy.position[0] - pos[0];
          const dz = enemy.position[2] - pos[2];
          const dist = Math.sqrt(dx * dx + dz * dz);
          
          if (dist < radius && Math.random() < (chance || 0.3)) {
            // Transform!
            let newType: any = 'transfiguredMutant';
            if (enemy.type === 'boss') newType = 'alliedBossDemon';
            else if (enemy.type === 'slime' && enemy.isKing) newType = 'alliedKingSlime';
            else if (enemy.type === 'skeleton' && enemy.isKing) newType = 'alliedKingSkeleton';

            newAllies.push({
              id: Math.random() * 1000000 + Date.now(),
              type: newType,
              position: enemy.position as [number, number, number]
            });
            // Spawn transform particles
            window.dispatchEvent(new CustomEvent('bombExplode', { 
               detail: { pos: enemy.position, radius: 2, damageMultiplier: 0, team: 'player', color: '#a855f7' } 
            }));
          } else {
            remaining.push(enemy);
          }
        });

        if (newAllies.length > 0) {
          setAllies(a => [...a, ...newAllies]);
        }
        
        return remaining;
      });
    };

    window.addEventListener('transfigureEnemies', handleTransfigure);
    return () => {
      window.removeEventListener('transfigureEnemies', handleTransfigure);
    };
  }, []);

  useEffect(() => {
    if (hasAIPartner) {
       setAllies(prev => {
         if (prev.some(a => a.type === 'alliedAI')) return prev;
         return [...prev, { id: Date.now() + Math.random(), type: 'alliedAI', position: [playerPos[0] + 2, 1, playerPos[2]] }];
       });
    }
  }, [hasAIPartner]); // Mount or prop change

  useFrame((state, delta) => {
    if ((window as any).isTimeStopped) return;

    spawnTimer.current += delta;
    if (spawnTimer.current > 3.0 && enemies.length < 15) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 20 + Math.random() * 10;
      const x = state.camera.position.x + Math.cos(angle) * dist;
      const z = state.camera.position.z + Math.sin(angle) * dist;
      
      const rand = Math.random();
      let type: 'slime' | 'skeleton' | 'bomber' | 'armored' = 'slime';
      if (scoreRef.current > 5) {
         if (rand < 0.2) type = 'bomber';
         else if (rand < 0.4) type = 'armored';
         else if (rand < 0.8) type = 'skeleton';
      } else {
         if (scoreRef.current > 15 && rand > 0.6) type = 'skeleton';
         if (scoreRef.current > 30 && rand > 0.4) type = 'skeleton';
      }
      
      const isKing = type === 'slime' && Math.random() > 0.4 && scoreRef.current > 3;

      setEnemies(prev => [...prev, { id: Math.random() * 1000000 + Date.now(), type, position: [x, 2, z], isKing }]);
      spawnTimer.current = 0;
    }

    // Handle Summoning (using a globally accessible trigger or checking key state)
    // For simplicity, let's listen for a custom event from Player
  });

  const spawnBoss = (pos: [number, number, number]) => {
    if (bossSpawned.current) return;
    setEnemies(prev => [...prev, { id: Math.random() * 1000000 + Date.now() + 2, type: 'boss', position: [pos[0], 5, pos[2]], isKing: false }]);
    bossSpawned.current = true;
    window.dispatchEvent(new CustomEvent('showSystemMessage', { 
      detail: { text: "⚠️ 대악마가 소환되었습니다! 전장을 이탈하지 마십시오! ⚠️", color: "#ff4400" } 
    }));
    window.dispatchEvent(new CustomEvent('bossSpawnCinematic', { detail: { pos } }));
  };

  const removeEnemy = (id: number, type: string, isKing: boolean, pos: [number, number, number]) => {
    setEnemies(prev => prev.filter(e => e.id !== id));
    scoreRef.current += 1;
    
    let xp = 15;
    if (type === 'skeleton') xp = 35;
    else if (type === 'bomber') xp = 20;
    else if (type === 'armored') xp = 50;
    if (type === 'boss') xp = 1000;
    if (isKing) xp = 60;
    
    onKill(xp);

    // Item Drops
    const dropRand = Math.random();
    if (dropRand > 0.6) {
      const type: ItemType = dropRand > 0.95 ? 'stat' : (dropRand > 0.8 ? 'energy' : 'heal');
      setDrops(prev => [...prev.slice(-20), { id: Math.random() * 1000000 + Date.now(), type, position: [pos[0], 2, pos[2]] }]);
    }

    // 100% Boss chance on King Slime death if not already spawned recently
    if (isKing) {
      spawnBoss(pos);
    }
    
    if (type === 'boss') {
      bossSpawned.current = false; // Allow next boss to spawn
    }
  };

  const pickUpItem = (id: number, type: ItemType) => {
    setDrops(prev => prev.filter(d => d.id !== id));
    window.dispatchEvent(new CustomEvent('itemPicked', { detail: { type } }));
  };

  useEffect(() => {
    const handleSummon = (e: any) => {
      const { pos: p, type: t } = e.detail;
      const type = t || (Math.random() > 0.5 ? 'alliedSlime' : 'alliedSkeleton');
      setAllies(prev => [...prev, { id: Math.random() * 1000000 + Date.now() + 3, type, position: [p[0] + (Math.random()-0.5)*4, 1, p[2] + (Math.random()-0.5)*4] }]);
    };
    window.addEventListener('summonTrigger', handleSummon);
    return () => window.removeEventListener('summonTrigger', handleSummon);
  }, []);

  useEffect(() => {
    const handlePetRequest = (e: any) => {
      if (enemies.length === 0) return;
      // Target random enemy
      const target = enemies[Math.floor(Math.random() * enemies.length)];
      if (target) {
        window.dispatchEvent(new CustomEvent('petShootVisual', {
          detail: { startPos: e.detail.pos, endPos: target.position, color: e.detail.color }
        }));
        
        // Let visual event handle explosion delay if desired, or explode instantly
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('bombExplode', { 
            detail: { pos: target.position, radius: 3, team: 'player', damageMultiplier: 2 } 
          }));
        }, 200);
      }
    };

    window.addEventListener('requestPetTarget', handlePetRequest);

    const handleSnap = () => {
      // dust all enemies
      enemies.forEach(e => {
        setAshEffects(prev => [...prev, { id: e.id, position: e.position }]);
        window.dispatchEvent(new CustomEvent('enemyKilled', { detail: { type: e.type, isKing: e.isKing, isAsh: true } }));
      });
      setEnemies([]);
    };

    const handlePigEat = () => {
      setEnemies(prev => {
         const slimes = prev.filter(e => e.type === 'slime' || e.type === 'skeleton');
         if (slimes.length === 0) return prev;
         
         let closest = slimes[0];
         let minDist = Infinity;
         for (const s of slimes) {
            const dist = Math.hypot(s.position[0] - playerPos[0], s.position[2] - playerPos[2]);
            if (dist < minDist) { minDist = dist; closest = s; }
         }
         if (minDist < 10) {
            window.dispatchEvent(new CustomEvent('pigAteSlime'));
            return prev.filter(e => e.id !== closest.id);
         }
         return prev;
      });
    };

    window.addEventListener('ironmanSnap', handleSnap);
    window.addEventListener('pigEatSlime', handlePigEat);

    const handleAdminBossSpawn = () => {
      spawnBoss([playerPos[0] + 15, playerPos[1], playerPos[2] + 15]);
    };
    window.addEventListener('adminSpawnBoss', handleAdminBossSpawn);

    const handleAdminImprison = () => {
      setMobsImprisoned(true);
      setTimeout(() => setMobsImprisoned(false), 10000); // 10 seconds imprisonment
    };
    window.addEventListener('adminImprisonMobs', handleAdminImprison);

    return () => {
      window.removeEventListener('requestPetTarget', handlePetRequest);
      window.removeEventListener('ironmanSnap', handleSnap);
      window.removeEventListener('pigEatSlime', handlePigEat);
      window.removeEventListener('adminSpawnBoss', handleAdminBossSpawn);
      window.removeEventListener('adminImprisonMobs', handleAdminImprison);
    };
  }, [enemies]);

  // Pass enemy positions to allies so they can track them
  const enemyPositions = enemies.map(e => e.position);

  return (
    <>
      {enemies.map(e => {
        let CurrentEnemy: any = Slime;
        if (e.type === 'skeleton') CurrentEnemy = Skeleton;
        else if (e.type === 'bomber') CurrentEnemy = Bomber;
        else if (e.type === 'armored') CurrentEnemy = Armored;
        else if (e.type === 'boss') CurrentEnemy = BossDemon;

        return (
          <group key={e.id}>
            <CurrentEnemy 
              position={e.position} 
              isKing={e.isKing}
              playerPos={playerPos}
              onDie={() => {
                removeEnemy(e.id, e.type, e.isKing, e.position);
              }} 
              isSpiritBombActive={isSpiritBombActive} 
              explosionEvent={explosionEvent}
              isImprisoned={mobsImprisoned}
            />
            {mobsImprisoned && (
              <mesh position={[e.position[0], e.position[1] + 1, e.position[2]]}>
                 <boxGeometry args={[2.5, 3, 2.5]} />
                 <meshStandardMaterial color="#3b82f6" wireframe transparent opacity={0.6} />
              </mesh>
            )}
          </group>
        );
      })}

      {allies.map(a => {
        // We'll create these allied components next
        if (a.type === 'transfiguredMutant' as any) {
           return <TransfiguredMutant key={a.id} position={a.position} enemies={enemies} onDie={() => setAllies(p => p.filter(al => al.id !== a.id))} explosionEvent={explosionEvent} />
        }
        if (a.type === 'alliedBossDemon' as any) return <TransfiguredBoss type="demon" key={a.id} position={a.position} enemies={enemies} onDie={() => setAllies(p => p.filter(al => al.id !== a.id))} explosionEvent={explosionEvent} />
        if (a.type === 'alliedKingSlime' as any) return <TransfiguredBoss type="slime" key={a.id} position={a.position} enemies={enemies} onDie={() => setAllies(p => p.filter(al => al.id !== a.id))} explosionEvent={explosionEvent} />
        if (a.type === 'alliedKingSkeleton' as any) return <TransfiguredBoss type="skeleton" key={a.id} position={a.position} enemies={enemies} onDie={() => setAllies(p => p.filter(al => al.id !== a.id))} explosionEvent={explosionEvent} />
        if (a.type === 'alliedAI') return <AlliedAI playerPos={playerPos} playerRot={playerRot} key={a.id} position={a.position} enemies={enemies} onDie={() => setAllies(p => p.filter(al => al.id !== a.id))} />

        return a.type === 'alliedSlime' ? (
          <AlliedSlime key={a.id} position={a.position} enemies={enemies} onDie={() => setAllies(p => p.filter(al => al.id !== a.id))} explosionEvent={explosionEvent} />
        ) : (
          <AlliedSkeleton key={a.id} position={a.position} enemies={enemies} onDie={() => setAllies(p => p.filter(al => al.id !== a.id))} explosionEvent={explosionEvent} />
        );
      })}

      {drops.map(d => (
        <ItemDrop key={d.id} id={d.id} position={d.position} type={d.type} onPickUp={pickUpItem} />
      ))}

      {ashEffects.map(a => (
        <AshDustEffect key={a.id} position={a.position} onFinish={() => setAshEffects(p => p.filter(e => e.id !== a.id))} />
      ))}
    </>
  );
};

// --- Ash Dust Effect ---
const AshDustEffect = ({ position, onFinish }: { position: [number, number, number], onFinish: () => void }) => {
  const [particles] = useState(() => Array.from({ length: 50 }).map((_, i) => ({
    id: i,
    x: position[0] + (Math.random() - 0.5) * 1.5,
    y: position[1] + Math.random() * 2,
    z: position[2] + (Math.random() - 0.5) * 1.5,
    vx: Math.random() * 0.8 + 0.2, // wind blowing mainly in +X
    vy: Math.random() * 0.5,
    vz: (Math.random() - 0.5) * 0.5 + 0.2,
    size: Math.random() * 0.15 + 0.05,
    life: 1.0,
    rotSpeedX: (Math.random() - 0.5) * 5,
    rotSpeedY: (Math.random() - 0.5) * 5,
    rotSpeedZ: (Math.random() - 0.5) * 5
  })));

  const group = useRef<THREE.Group>(null);
  const isFinished = useRef(false);

  useFrame((state, delta) => {
    let aliveCount = 0;
    const children = group.current?.children;
    if (!children) return;

    for (let i = 0; i < particles.length; i++) {
        let p = particles[i];
        p.life -= delta * 0.3; // take approx 3.3 seconds to vanish
        if (p.life > 0) {
            aliveCount++;
            p.x += p.vx * delta * 4;
            p.y += p.vy * delta * 4;
            p.z += p.vz * delta * 4;
            
            p.vx += delta * 0.5; // accelerate in wind
            
            const mesh = children[i] as THREE.Mesh;
            if (mesh) {
                mesh.position.set(p.x, p.y, p.z);
                mesh.rotation.x += p.rotSpeedX * delta;
                mesh.rotation.y += p.rotSpeedY * delta;
                mesh.rotation.z += p.rotSpeedZ * delta;
                (mesh.material as THREE.MeshBasicMaterial).opacity = p.life;
            }
        } else {
             const mesh = children[i] as THREE.Mesh;
             if (mesh) {
                  mesh.visible = false;
             }
        }
    }
    
    if (aliveCount === 0 && !isFinished.current) {
        isFinished.current = true;
        onFinish();
    }
  });

  return (
    <group ref={group}>
      {particles.map((p) => (
        <mesh key={p.id} position={[p.x, p.y, p.z]}>
          <boxGeometry args={[p.size, p.size, p.size]} />
          <meshBasicMaterial color="#4a4a4a" transparent opacity={1} />
        </mesh>
      ))}
    </group>
  );
};

// --- Specialized Allied Components ---
import { useSphere } from '@react-three/cannon';

const AlliedSlime = ({ position, enemies, onDie, explosionEvent }: any) => {
  const [ref, api] = useSphere(() => ({ mass: 1, position, args: [0.6] }));
  const [health, setHealth] = useState(100);
  const pos = useRef([0,0,0]);

  // Check explosion damage
  useEffect(() => {
    if (explosionEvent) {
      // Allies only take damage from non-player team explosions (or no team which might be boss)
      if (explosionEvent.team === 'player') return;

      const dx = pos.current[0] - explosionEvent.pos[0];
      const dy = pos.current[1] - explosionEvent.pos[1];
      const dz = pos.current[2] - explosionEvent.pos[2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      
      if (dist < explosionEvent.radius) {
        const damage = (1 - dist / explosionEvent.radius) * 50 * (explosionEvent.damageMultiplier || 1);
        setHealth(prev => prev - damage);
      }
    }
  }, [explosionEvent]);
  
  // 고유 오프셋: 플레이어나 적을 추적할 때 겹치지 않게 함
  const offset = useRef({
    x: (Math.random() - 0.5) * 6,
    z: (Math.random() - 0.5) * 6,
    speed: 0.8 + Math.random() * 0.4
  });

  useEffect(() => api.position.subscribe(p => pos.current = p), [api.position]);

  useFrame((state, delta) => {
    if ((window as any).isTimeStopped) { api.velocity.set(0,0,0); return; }
    if (health <= 0) { onDie(); return; }

    let target = null;
    let minDist = 30;
    
    // Find nearest enemy
    enemies.forEach((e: any) => {
      const d = new THREE.Vector3(...e.position).distanceTo(new THREE.Vector3(...pos.current));
      if (d < minDist) {
        minDist = d;
        target = e.position;
      }
    });

    if (target) {
      // 적 추적 시에도 오프셋을 적용하여 적 주변으로 골고루 퍼지게 함
      const dir = new THREE.Vector3(
        (target[0] + offset.current.x * 0.5) - pos.current[0], 
        0, 
        (target[2] + offset.current.z * 0.5) - pos.current[2]
      ).normalize();
      
      const jump = Math.sin(state.clock.elapsedTime * 5) * 2; // 통통 튀는 효과
      api.velocity.set(dir.x * 5 * offset.current.speed, jump - 5, dir.z * 5 * offset.current.speed);
      
      if (minDist < 2 && state.clock.elapsedTime % 1 < 0.05) {
        window.dispatchEvent(new CustomEvent('bombExplode', { 
          detail: { pos: pos.current, radius: 3, damageMultiplier: 8, team: 'player' } 
        }));
      }
    } else {
      const pPos = state.camera.position;
      // 플레이어 주변의 고유한 목표 지점 계산
      const targetPos = new THREE.Vector3(
        pPos.x + offset.current.x,
        0,
        pPos.z + offset.current.z
      );
      
      const distToTarget = targetPos.distanceTo(new THREE.Vector3(pos.current[0], 0, pos.current[2]));
      
      if (distToTarget > 1) {
         const d = targetPos.sub(new THREE.Vector3(pos.current[0], 0, pos.current[2])).normalize();
         const jump = Math.sin(state.clock.elapsedTime * 3) * 1.5;
         api.velocity.set(d.x * 4 * offset.current.speed, jump - 5, d.z * 4 * offset.current.speed);
      } else {
         api.velocity.set(0, -5, 0);
      }
    }
  });

  return (
    <group ref={ref as any}>
      <mesh>
        <sphereGeometry args={[0.6, 16, 16]} />
        <meshStandardMaterial color="#3b82f6" transparent opacity={0.8} />
      </mesh>
      <mesh position={[0, 0.7, 0]}>
        <planeGeometry args={[0.8, 0.08]} />
        <meshBasicMaterial color="#3b82f6" />
      </mesh>
    </group>
  );
};

const AlliedSkeleton = ({ position, enemies, onDie, explosionEvent }: any) => {
  const [ref, api] = useSphere(() => ({ mass: 1, position, args: [0.6] }));
  const [health, setHealth] = useState(150);
  const pos = useRef([0,0,0]);

  // Check explosion damage
  useEffect(() => {
    if (explosionEvent) {
      if (explosionEvent.team === 'player') return;

      const dx = pos.current[0] - explosionEvent.pos[0];
      const dy = pos.current[1] - explosionEvent.pos[1];
      const dz = pos.current[2] - explosionEvent.pos[2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      
      if (dist < explosionEvent.radius) {
        const damage = (1 - dist / explosionEvent.radius) * 80 * (explosionEvent.damageMultiplier || 1);
        setHealth(prev => prev - damage);
      }
    }
  }, [explosionEvent]);
  
  const offset = useRef({
    x: (Math.random() - 0.5) * 8,
    z: (Math.random() - 0.5) * 8,
    speed: 1.0 + Math.random() * 0.5
  });

  useEffect(() => api.position.subscribe(p => pos.current = p), [api.position]);

  useFrame((state, delta) => {
    if ((window as any).isTimeStopped) { api.velocity.set(0,0,0); return; }
    if (health <= 0) { onDie(); return; }

    let target = null;
    let minDist = 40;
    
    enemies.forEach((e: any) => {
      const d = new THREE.Vector3(...e.position).distanceTo(new THREE.Vector3(...pos.current));
      if (d < minDist) {
        minDist = d;
        target = e.position;
      }
    });

    if (target) {
      const dir = new THREE.Vector3(
        (target[0] + offset.current.x * 0.3) - pos.current[0], 
        0, 
        (target[2] + offset.current.z * 0.3) - pos.current[2]
      ).normalize();
      
      api.velocity.set(dir.x * 7 * offset.current.speed, -5, dir.z * 7 * offset.current.speed);
      
      if (minDist < 2 && state.clock.elapsedTime % 0.8 < 0.05) {
        window.dispatchEvent(new CustomEvent('bombExplode', { 
          detail: { pos: pos.current, radius: 4, damageMultiplier: 12, team: 'player' } 
        }));
      }
    } else {
      const pPos = state.camera.position;
      const targetPos = new THREE.Vector3(
        pPos.x + offset.current.x,
        0,
        pPos.z + offset.current.z
      );
      
      const distToTarget = targetPos.distanceTo(new THREE.Vector3(pos.current[0], 0, pos.current[2]));
      
      if (distToTarget > 2) {
         const d = targetPos.sub(new THREE.Vector3(pos.current[0], 0, pos.current[2])).normalize();
         api.velocity.set(d.x * 6 * offset.current.speed, -5, d.z * 6 * offset.current.speed);
      } else {
         api.velocity.set(0, -5, 0);
      }
    }
  });

  return (
    <group ref={ref as any}>
      <mesh>
        <boxGeometry args={[0.5, 1.2, 0.3]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh position={[0, 0.8, 0]}>
        <boxGeometry args={[0.4, 0.4, 0.4]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      <pointLight color="#3b82f6" intensity={2} distance={5} />
    </group>
  );
};

const TransfiguredMutant = ({ position, enemies, onDie, explosionEvent }: any) => {
  const [ref, api] = useSphere(() => ({ mass: 1, position, args: [0.8] }));
  const [health, setHealth] = useState(250);
  const pos = useRef([0,0,0]);
  const timer = useRef(0);

  // Check explosion damage
  useEffect(() => {
    if (explosionEvent) {
      if (explosionEvent.team === 'player') return;

      const dx = pos.current[0] - explosionEvent.pos[0];
      const dy = pos.current[1] - explosionEvent.pos[1];
      const dz = pos.current[2] - explosionEvent.pos[2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      
      if (dist < explosionEvent.radius) {
        const damage = (1 - dist / explosionEvent.radius) * 80 * (explosionEvent.damageMultiplier || 1);
        setHealth(prev => prev - damage);
      }
    }
  }, [explosionEvent]);
  
  const offset = useRef({
    x: (Math.random() - 0.5) * 8,
    z: (Math.random() - 0.5) * 8,
    speed: 1.5 + Math.random() * 0.5
  });

  useEffect(() => api.position.subscribe(p => pos.current = p), [api.position]);

  useFrame((state, delta) => {
    if ((window as any).isTimeStopped) { api.velocity.set(0,0,0); return; }
    if (health <= 0) { onDie(); return; }
    timer.current += delta;

    let target = null;
    let minDist = 30;
    const pPos = state.camera.position;

    // Find nearest enemy
    enemies.forEach((e: any) => {
      const dist = new THREE.Vector3(...e.position).distanceTo(new THREE.Vector3(...pos.current));
      if (dist < minDist) {
        minDist = dist;
        target = e.position;
      }
    });

    if (target) {
      const dir = new THREE.Vector3(
        (target[0] + offset.current.x * 0.3) - pos.current[0], 
        0, 
        (target[2] + offset.current.z * 0.3) - pos.current[2]
      ).normalize();
      
      // 기괴하게 꿈틀거리며 질주하는 움직임
      const jiggleX = Math.sin(timer.current * 15) * 0.5;
      const jump = Math.sin(state.clock.elapsedTime * 8) * 1.5;
      api.velocity.set(dir.x * 6 * offset.current.speed + jiggleX, jump - 5, dir.z * 6 * offset.current.speed);
      
      const distToEnemy = new THREE.Vector3(...target).distanceTo(new THREE.Vector3(...pos.current));
      
      if (distToEnemy < 2.5 && state.clock.elapsedTime % 0.5 < 0.05) {
        window.dispatchEvent(new CustomEvent('bombExplode', { 
          // 녹이고 구속시키는 폭발
          detail: { pos: target, radius: 4, damageMultiplier: 12, team: 'player', color: '#8b5cf6', isBinding: true } 
        }));
        window.dispatchEvent(new CustomEvent('playSound', { detail: { type: 'magic' } }));
      }
    } else {
      const targetPos = new THREE.Vector3(pPos.x + offset.current.x, 0, pPos.z + offset.current.z);
      const distToTarget = targetPos.distanceTo(new THREE.Vector3(pos.current[0], 0, pos.current[2]));
      
      if (distToTarget > 1.5) {
         const d = targetPos.sub(new THREE.Vector3(pos.current[0], 0, pos.current[2])).normalize();
         api.velocity.set(d.x * 8 * offset.current.speed, -5, d.z * 8 * offset.current.speed);
      } else {
         api.velocity.set(0, -5, 0);
      }
    }
  });

  return (
    <group ref={ref as any}>
      {/* 엉망으로 섞인 기괴한 형상 */}
      <mesh position={[0, -0.2, 0]} rotation={[Math.random(), Math.random(), Math.random()]}>
        <dodecahedronGeometry args={[0.7]} />
        <meshStandardMaterial color="#8b5cf6" roughness={0.3} metalness={0.2} emissive="#581c87" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0.4, 0.4, 0.3]} rotation={[0, 0, Math.random()]}>
        <boxGeometry args={[0.4, 0.8, 0.4]} />
        <meshStandardMaterial color="#6d28d9" />
      </mesh>
      <mesh position={[-0.4, 0.5, -0.2]} rotation={[Math.random(), 0, 0]}>
        <sphereGeometry args={[0.3]} />
        <meshStandardMaterial color="#4c1d95" />
      </mesh>
      <pointLight color="#7c3aed" intensity={3} distance={6} />
    </group>
  );
};

const TransfiguredBoss = ({ position, enemies, onDie, explosionEvent, type }: any) => {
  const [ref, api] = useSphere(() => ({ mass: 10, position, args: [1.2] }));
  const [health, setHealth] = useState(1500); // reduced from boss max hp
  const pos = useRef([0,0,0]);
  const timer = useRef(0);

  useEffect(() => {
    if (explosionEvent) {
      if (explosionEvent.team === 'player') return;

      const dx = pos.current[0] - explosionEvent.pos[0];
      const dy = pos.current[1] - explosionEvent.pos[1];
      const dz = pos.current[2] - explosionEvent.pos[2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      
      if (dist < explosionEvent.radius) {
        const damage = (1 - dist / explosionEvent.radius) * 80 * (explosionEvent.damageMultiplier || 1);
        setHealth(prev => prev - damage);
      }
    }
  }, [explosionEvent]);
  
  const offset = useRef({
    x: (Math.random() - 0.5) * 8,
    z: (Math.random() - 0.5) * 8,
    speed: 1.5 + Math.random() * 0.5
  });

  useEffect(() => api.position.subscribe(p => pos.current = p), [api.position]);

  useFrame((state, delta) => {
    if ((window as any).isTimeStopped) { api.velocity.set(0,0,0); return; }
    if (health <= 0) { onDie(); return; }
    timer.current += delta;

    let target = null;
    let minDist = 30;
    const pPos = state.camera.position;

    enemies.forEach((e: any) => {
      const dist = new THREE.Vector3(...e.position).distanceTo(new THREE.Vector3(...pos.current));
      if (dist < minDist) {
        minDist = dist;
        target = e.position;
      }
    });

    if (target) {
      const dir = new THREE.Vector3(
        (target[0] + offset.current.x * 0.3) - pos.current[0], 
        0, 
        (target[2] + offset.current.z * 0.3) - pos.current[2]
      ).normalize();
      
      const jiggleX = Math.sin(timer.current * 10) * 0.2;
      const jump = Math.sin(state.clock.elapsedTime * 6) * 1.5;
      api.velocity.set(dir.x * 6 * offset.current.speed + jiggleX, jump - 5, dir.z * 6 * offset.current.speed);
      
      const distToEnemy = new THREE.Vector3(...target).distanceTo(new THREE.Vector3(...pos.current));
      
      if (distToEnemy < 3.5 && state.clock.elapsedTime % 0.8 < 0.05) {
        window.dispatchEvent(new CustomEvent('bombExplode', { 
          detail: { pos: target, radius: 5, damageMultiplier: 15, team: 'player', color: '#8b5cf6', isBinding: true } 
        }));
        window.dispatchEvent(new CustomEvent('playSound', { detail: { type: 'magic' } }));
      }
    } else {
      const targetPos = new THREE.Vector3(pPos.x + offset.current.x, 0, pPos.z + offset.current.z);
      const distToTarget = targetPos.distanceTo(new THREE.Vector3(pos.current[0], 0, pos.current[2]));
      
      if (distToTarget > 2.5) {
         const d = targetPos.sub(new THREE.Vector3(pos.current[0], 0, pos.current[2])).normalize();
         api.velocity.set(d.x * 7 * offset.current.speed, -5, d.z * 7 * offset.current.speed);
      } else {
         api.velocity.set(0, -5, 0);
      }
    }
  });

  return (
    <group ref={ref as any}>
      {type === 'demon' && (
        <group>
          <mesh position={[0, -0.2, 0]} rotation={[0, 0, 0]}>
            <boxGeometry args={[1.5, 2, 1.5]} />
            <meshStandardMaterial color="#b91c1c" emissive="#991b1b" emissiveIntensity={0.5} />
          </mesh>
          <mesh position={[-0.5, 1.2, 0]} rotation={[0, 0, 0.5]}>
            <coneGeometry args={[0.2, 0.8]} />
            <meshStandardMaterial color="#111" />
          </mesh>
          <mesh position={[0.5, 1.2, 0]} rotation={[0, 0, -0.5]}>
            <coneGeometry args={[0.2, 0.8]} />
            <meshStandardMaterial color="#111" />
          </mesh>
        </group>
      )}
      {type === 'slime' && (
        <group>
          <mesh>
            <sphereGeometry args={[1.2, 16, 16]} />
            <meshStandardMaterial color="#3b82f6" transparent opacity={0.6} emissive="#1d4ed8" emissiveIntensity={0.5} />
          </mesh>
          <mesh position={[0, 1.3, 0]}>
            <coneGeometry args={[0.6, 1]} />
            <meshStandardMaterial color="#fbbf24" />
          </mesh>
        </group>
      )}
      {type === 'skeleton' && (
        <group>
          <mesh>
            <boxGeometry args={[1, 2.4, 0.6]} />
            <meshStandardMaterial color="#222" emissive="#111" emissiveIntensity={0.5} />
          </mesh>
          <mesh position={[0, 1.3, 0]}>
            <planeGeometry args={[1.2, 0.15]} />
            <meshBasicMaterial color="#3b82f6" />
          </mesh>
        </group>
      )}
      <pointLight color="#7c3aed" intensity={3} distance={8} />
    </group>
  );
};

const AlliedAI = ({ position, enemies, onDie, explosionEvent, playerPos, playerRot }: any) => {
  const [ref, api] = useSphere(() => ({ mass: 1, position, args: [0.6], type: 'Dynamic', fixedRotation: true }));
  const innerRef = useRef<THREE.Group>(null);
  const pos = useRef<[number, number, number]>(position);
  const [danceType, setDanceType] = useState(0);
  const [blackFlashes, setBlackFlashes] = useState<{id: number, pos: [number, number, number]}[]>([]);
  const [chatMessage, setChatMessage] = useState("");
  
  // AI Behavior state
  const nextActionTime = useRef(0);
  const aiStrategy = useRef("STAY_CLOSE");
  const lastAiSync = useRef(0);

  useEffect(() => {
    const unsub = api.position.subscribe(p => pos.current = p as any);
    return () => unsub();
  }, [api.position]);

  useFrame((state, delta) => {
    const now = state.clock.getElapsedTime();

    // Query Logic (Local Fallback)
    if (now - lastAiSync.current > 5.0) {
      lastAiSync.current = now;
      let isBossAlive = enemies.some((e: any) => e.type === 'boss');
      let mindist = Infinity;
      enemies.forEach((e: any) => {
        const d = Math.hypot(pos.current[0] - e.position[0], pos.current[2] - e.position[2]);
        if (d < mindist) mindist = d;
      });

      // Simple Local AI Logic substituting Gemini
      const strategies = ['AGGRESSIVE', 'STAY_CLOSE', 'EVADE'];
      let chosenStrategy = 'AGGRESSIVE';
      let customMessage = "";
      
      if (isBossAlive) {
          chosenStrategy = 'EVADE';
          customMessage = "보스다! 조심해!";
      } else if (mindist < 3) {
          chosenStrategy = 'AGGRESSIVE';
          customMessage = "해치워버리겠어!";
      } else if (enemies.length === 0) {
          chosenStrategy = 'STAY_CLOSE';
          customMessage = "전투 종료. 플레이어 곁을 지킬게.";
      } else {
          chosenStrategy = 'AGGRESSIVE';
          customMessage = "적을 향해 돌격!!";
      }

      setChatMessage(customMessage);
      setTimeout(() => setChatMessage(""), 3000);
      aiStrategy.current = chosenStrategy as any;
      setDanceType(0);
    }

    let targetEnemy: any = null;
    let mindist = Infinity;
    
    // Find closest enemy
    enemies.forEach((e: any) => {
      const dx = pos.current[0] - e.position[0];
      const dz = pos.current[2] - e.position[2];
      const d = Math.sqrt(dx*dx + dz*dz);
      if (d < mindist) {
        mindist = d;
        targetEnemy = e;
      }
    });

    if (aiStrategy.current === 'AGGRESSIVE' && targetEnemy) {
      const tx = targetEnemy.position[0];
      const tz = targetEnemy.position[2];
      
      const dx = tx - pos.current[0];
      const dz = tz - pos.current[2];
      const dist = Math.sqrt(dx*dx + dz*dz);

      // Move towards enemy
      const speed = 6;
      if (dist > 1.5) {
        api.velocity.set((dx/dist)*speed, 0, (dz/dist)*speed);
        if (innerRef.current) innerRef.current.rotation.set(0, Math.atan2(dx, dz), 0);
      } else {
        api.velocity.set(0, 0, 0);
        if (innerRef.current) innerRef.current.rotation.set(0, Math.atan2(dx, dz), 0);
        
        // Attack
        if (now > nextActionTime.current) {
          const isBlackFlash = Math.random() < 0.2; // 20% chance for black flash
          if (isBlackFlash) {
             setBlackFlashes(prev => [...prev.slice(-4), { id: Date.now(), pos: targetEnemy.position }]);
             setTimeout(() => {
                window.dispatchEvent(new CustomEvent('enemyKilled', { detail: { type: targetEnemy.type, isKing: targetEnemy.isKing, isAsh: true } }));
                window.dispatchEvent(new CustomEvent('bombExplode', { 
                  detail: { pos: targetEnemy.position, radius: 2, team: 'player', color: '#ff0000', damageMultiplier: 3 } 
                }));
             }, 200);
          } else {
             // Normal punch
             window.dispatchEvent(new CustomEvent('bombExplode', { 
                detail: { pos: targetEnemy.position, radius: 1, team: 'player', color: '#ffffff', damageMultiplier: 0.5 } 
             }));
          }
          nextActionTime.current = now + 1.0; // Attack cooldown
        }
      }
    } else if (aiStrategy.current !== 'STAY_CLOSE' && targetEnemy) {
       // Also attack if close when not aggressive
       const dx = targetEnemy.position[0] - pos.current[0];
       const dz = targetEnemy.position[2] - pos.current[2];
       const dist = Math.sqrt(dx*dx + dz*dz);
       if (dist <= 2.5 && now > nextActionTime.current) {
          window.dispatchEvent(new CustomEvent('bombExplode', { 
             detail: { pos: targetEnemy.position, radius: 1, team: 'player', color: '#ffffff', damageMultiplier: 0.5 } 
          }));
          nextActionTime.current = now + 1.0;
       }
       if (aiStrategy.current === 'STAY_CLOSE') {
          // Fallthrough to tracking player
       }
    }
    
    if (aiStrategy.current === 'STAY_CLOSE' || !targetEnemy || aiStrategy.current === 'DANCE') {
      // No enemies: Follow behind player
      // Camera looks down -Z intuitively in Three.js standard, so behind is +Z in local camera space
      // Let's just use camera rotation Y to find behind offset
      const px = playerPos[0] + Math.sin(playerRot[1] || 0) * 2;
      const pz = playerPos[2] + Math.cos(playerRot[1] || 0) * 2;
      const dx = px - pos.current[0];
      const dz = pz - pos.current[2];
      const dist = Math.sqrt(dx*dx + dz*dz);
      
      if (dist > 30) {
        // AI teleport if getting too far
        api.position.set(px, playerPos[1] + 1, pz);
      } else if (dist > 2.0 && aiStrategy.current !== 'DANCE') {
        const speed = 7.5;
        api.velocity.set((dx/dist)*speed, 0, (dz/dist)*speed);
        if (innerRef.current) innerRef.current.rotation.set(0, Math.atan2(dx, dz), 0);
      } else {
        api.velocity.set(0, 0, 0); 
        if (aiStrategy.current !== 'DANCE' && now > nextActionTime.current) {
           nextActionTime.current = now + 4 + Math.random() * 4;
        }
        // Rotate to look at player when idle
        const dxFace = playerPos[0] - pos.current[0];
        const dzFace = playerPos[2] - pos.current[2];
        if (innerRef.current) innerRef.current.rotation.set(0, Math.atan2(dxFace, dzFace), 0);
      }
    }
  });

  return (
    <group ref={ref as any}>
      <group ref={innerRef}>
        <RobloxCharacter danceType={danceType} position={[0,-0.4,0]} rotation={[0,0,0]} scale={0.65} />
      </group>
      {chatMessage && (
        <Html position={[0, 2.0, 0]} center zIndexRange={[100, 0]}>
          <div className="bg-white text-black px-3 py-2 rounded-2xl shadow-xl font-bold border-2 border-gray-200" style={{ minWidth: '100px', textAlign: 'center', pointerEvents: 'none' }}>
            <div className="text-sm">{chatMessage}</div>
            <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-3 h-3 bg-white border-r-2 border-b-2 border-gray-200"></div>
          </div>
        </Html>
      )}
      {blackFlashes.map(bf => (
         <CrackleEffect key={bf.id} position={bf.pos} color="#ff0000" onFinish={() => setBlackFlashes(p => p.filter(x => x.id !== bf.id))} />
      ))}
    </group>
  );
};
