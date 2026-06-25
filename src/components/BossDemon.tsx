import { useState, useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useSphere } from '@react-three/cannon';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'motion/react';
import { Line } from '@react-three/drei';
import { FreezeFrame2D, VoidSymbols } from './Projectiles';

export const BossDemon = ({ position, onDie, isSpiritBombActive, explosionEvent }: any) => {
  const [phase, setPhase] = useState(1);
  const [transforming, setTransforming] = useState(false);
  const maxHealth = phase === 1 ? 5000 : 8000;
  const [health, setHealth] = useState(5000);
  const transformTimer = useRef(0);
  const [ref, api] = useSphere(() => ({ mass: 1000, position, args: [4] }));
  const pos = useRef([0, 0, 0]);
  const spawnTime = useRef(Date.now());
  const lastSkillTime = useRef(0);
  const lastApocLaserTime = useRef(0);
  const isApocalypseMode = useRef(false);

  useEffect(() => api.position.subscribe(p => pos.current = p), [api.position]);

  useEffect(() => {
    // Send health as percentage and raw total
    window.dispatchEvent(new CustomEvent('bossUpdateHp', { detail: { hp: health, maxHp: maxHealth, phase } }));
    if (health <= 0) {
      if (phase === 1 && !transforming) {
        setTransforming(true);
        setPhase(2);
        setHealth(8000);
        window.dispatchEvent(new CustomEvent('bossPhase2Cinematic', { detail: { pos: pos.current } }));
        window.dispatchEvent(new CustomEvent('showSystemMessage', { detail: { text: "보스의 몸이 찢어지며 스쿠나로 오의를 각성합니다... 조심!", color: "#ff0000" } }));
      } else if (phase === 2 && !transforming) {
        window.dispatchEvent(new CustomEvent('apocalypseTrigger', { detail: { active: false } }));
        onDie();
      }
    }
  }, [health, onDie, phase, transforming, maxHealth]);

  const stunTimer = useRef(0);
  const [isFramed, setIsFramed] = useState(false);
  const voidTimer = useRef(0);
  const [isVoided, setIsVoided] = useState(false);
  const [onFire, setOnFire] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);

  useEffect(() => {
    if (explosionEvent) {
      if (explosionEvent.team === 'enemy') return;
      const dx = pos.current[0] - explosionEvent.pos[0];
      const dy = pos.current[1] - explosionEvent.pos[1];
      const dz = pos.current[2] - explosionEvent.pos[2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < explosionEvent.radius) {
        if ((explosionEvent as any).isFrameFreeze) {
          setIsFramed(true);
        } else if ((explosionEvent as any).isCellBreakdown) {
          if (stunTimer.current <= 0 && voidTimer.current <= 0 && !isFramed) {
             setHealth(prev => Math.max(0, prev - 150));
             window.dispatchEvent(new CustomEvent('shatterDied', { detail: { pos: pos.current } }));
          }
        } else if ((explosionEvent as any).isUnlimitedVoidDamage) {
          const damage = 5 * (Math.random() + 0.5);
          setHealth(prev => Math.max(0, prev - damage));
          voidTimer.current = 15;
          setIsVoided(true);
        } else {
          const damage = (1 - dist / explosionEvent.radius) * 150 * (explosionEvent.damageMultiplier || 1);
          setHealth(prev => Math.max(0, prev - damage));

          if ((explosionEvent as any).trait === 'fire' && Math.random() < 0.5) {
             setOnFire(true);
          }
          if ((explosionEvent as any).trait === 'ice' && Math.random() < 0.3) {
             setIsFrozen(true);
             stunTimer.current = 180;
          }

          if ((explosionEvent as any).launchForce && !isFramed) {
            api.velocity.set(0, (explosionEvent as any).launchForce, 0);
            stunTimer.current = 60;
          }
          if ((explosionEvent as any).isBinding) {
             stunTimer.current = 80;
             api.velocity.set(0, -5, 0);
          }
        }
      }
    }
  }, [explosionEvent, isFramed]);

  const bossVisRef = useRef<THREE.Group>(null);
  const [beams, setBeams] = useState<{ id: number; target: [number, number, number] }[]>([]);
  const [skyEyes, setSkyEyes] = useState<{ id: number; pos: [number, number, number] }[]>([]);

  useFrame((state, delta) => {
    if (onFire) {
       if (state.clock.elapsedTime % 0.5 < 0.016) {
           setHealth(prev => prev - 15);
       }
    }

    if (transforming) {
      api.velocity.set(0, 0, 0);
      transformTimer.current += delta;
      
      if (bossVisRef.current) {
        // Shaking effect during transformation
        bossVisRef.current.position.set((Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5);
      }
      
      if (transformTimer.current > 4) {
        setTransforming(false);
        transformTimer.current = 0;
        if (bossVisRef.current) {
          bossVisRef.current.position.set(0, 0, 0);
        }
      }
      return;
    }

    if ((window as any).isTimeStopped || voidTimer.current > 0) {
      if (voidTimer.current > 0) {
        voidTimer.current--;
        if (voidTimer.current <= 0) setIsVoided(false);
      }
      api.velocity.set(0, 0, 0); 
      return; 
    }
    
    const pPos = state.camera.position;
    const distToPlayer = new THREE.Vector3(pPos.x, 0, pPos.z).distanceTo(new THREE.Vector3(pos.current[0], 0, pos.current[2]));

    // Check if dead
    if (health <= 0) {
      if (isFramed) {
        window.dispatchEvent(new CustomEvent('shatterDied', { detail: { pos: pos.current } }));
      }
      return; 
    }

    if (stunTimer.current > 0 || isFramed) {
      if (stunTimer.current > 0) stunTimer.current--;
      
      if (isFramed) {
        api.velocity.set(0, -5, 0);
        if (bossVisRef.current) {
          bossVisRef.current.scale.set(1, 1, 0.02);
          const dir = new THREE.Vector3(pPos.x - pos.current[0], 0, pPos.z - pos.current[2]);
          const angle = Math.atan2(dir.x, dir.z);
          bossVisRef.current.rotation.y = angle;
        }
      }
    } else {
      // Slow follow
      const dir = new THREE.Vector3(pPos.x - pos.current[0], 0, pPos.z - pos.current[2]).normalize();
      if (distToPlayer > 10) {
        api.velocity.set(dir.x * (phase === 2 ? 5 : 2.5), -10, dir.z * (phase === 2 ? 5 : 2.5));
      } else {
        api.velocity.set(0, -10, 0);
      }
      if (bossVisRef.current) {
        bossVisRef.current.scale.set(1, 1, 1);
        bossVisRef.current.rotation.y = Math.atan2(dir.x, dir.z);
      }
    }

    const now = state.clock.elapsedTime;
    
    // Apocalypse Trigger (after 15 seconds of spawn)
    if (!isApocalypseMode.current && (Date.now() - spawnTime.current) > 15000) {
      isApocalypseMode.current = true;
      window.dispatchEvent(new CustomEvent('apocalypseTrigger', { detail: { active: true } }));
      window.dispatchEvent(new CustomEvent('showSystemMessage', { detail: { text: "진홍빛 묵시록이 시작된다...", color: "#ff0000" } }));
      
      const newEyes = [];
      for (let i = 0; i < 2; i++) {
        const angle = (i / 2) * Math.PI * 2;
        newEyes.push({
          id: i,
          pos: [pos.current[0] + Math.cos(angle) * 15, 30, pos.current[2] + Math.sin(angle) * 15] as [number, number, number]
        });
      }
      setSkyEyes(newEyes);
    }

    // Skill Selection
    if (now - lastSkillTime.current > (phase === 2 ? 3 : (isApocalypseMode.current ? 4 : 6)) && distToPlayer < 60) {
      if (phase === 1) {
        const skillIdx = Math.floor(Math.random() * 2);
        if (skillIdx === 0) {
           // Heat Beam
           const beamId = Date.now();
           const targetPos: [number, number, number] = [pPos.x, pPos.y, pPos.z];
           setBeams(prev => [...prev.slice(-2), { id: beamId, target: targetPos }]);
           setTimeout(() => setBeams(prev => prev.filter(b => b.id !== beamId)), 800);
           
           window.dispatchEvent(new CustomEvent('bombExplode', { 
             detail: { pos: targetPos, radius: 5, damageMultiplier: 4, team: 'enemy' } 
           }));
        } else {
           // Hammer Slam
           window.dispatchEvent(new CustomEvent('showSystemMessage', { detail: { text: "대지 강타!!", color: "#ff4400" } }));
           setTimeout(() => {
             window.dispatchEvent(new CustomEvent('bombExplode', { 
               detail: { pos: [pos.current[0], 0, pos.current[2]], radius: 15, damageMultiplier: 8, team: 'enemy' } 
             }));
           }, 800);
        }
      } else if (phase === 2) {
        const skillIdx = Math.floor(Math.random() * 3);
        if (skillIdx === 0) {
          window.dispatchEvent(new CustomEvent('showSystemMessage', { detail: { text: "조심! (참격)", color: "#ff0044" } }));
          setTimeout(() => {
             window.dispatchEvent(new CustomEvent('enemySlash', { detail: { pos: pos.current, target: [pPos.x, pPos.y, pPos.z] } }));
             window.dispatchEvent(new CustomEvent('playSound', { detail: { type: 'laser' } }));
          }, 800);
        } else if (skillIdx === 1) {
          window.dispatchEvent(new CustomEvent('showSystemMessage', { detail: { text: "조심! (푸가)", color: "#ff8800" } }));
          setTimeout(() => {
             window.dispatchEvent(new CustomEvent('enemyFuga', { detail: { pos: pos.current, target: [pPos.x, pPos.y, pPos.z] } }));
             window.dispatchEvent(new CustomEvent('playSound', { detail: { type: 'laser' } }));
          }, 800);
        } else {
          window.dispatchEvent(new CustomEvent('showSystemMessage', { detail: { text: "조심! (영역전개: 복마어주자)", color: "#aa0000", isDomain: true } }));
          setTimeout(() => {
             window.dispatchEvent(new CustomEvent('enemyDomain', { detail: { pos: pos.current } }));
             window.dispatchEvent(new CustomEvent('playSound', { detail: { type: 'bassDrop' } }));
          }, 1500);
        }
      }
      lastSkillTime.current = now;
    }

    // Apocalypse Lasers logic
    if (isApocalypseMode.current && now - lastApocLaserTime.current > 3.5) {
       lastApocLaserTime.current = now;
       const laserPos: [number, number, number] = [pPos.x + (Math.random()-0.5)*10, 0, pPos.z + (Math.random()-0.5)*10];
       window.dispatchEvent(new CustomEvent('bombExplode', { 
         detail: { pos: laserPos, radius: 5, damageMultiplier: 4, team: 'enemy' } 
       }));
    }
  });

  return (
    <group ref={ref as any}>
      {isVoided && (
        <group position={[0, 8, 0]}>
          <VoidSymbols />
        </group>
      )}

      <group ref={bossVisRef}>
        {isFramed && (
          <group position={[0, 2, 0]}>
            <FreezeFrame2D width={6.5} height={10.5} zDepth={1.25} />
          </group>
        )}

        <BossSpawnVisuals />

        {phase === 1 && !transforming && <BossPhase1Visual isFramed={isFramed} />}
        {transforming && <BossTransformationVisual isFramed={isFramed} />}
        {phase === 2 && !transforming && <BossSukunaVisual isFramed={isFramed} />}

        {onFire && (
          <mesh position={[0, 4, 0]}>
             <sphereGeometry args={[4, 16, 16]} />
             <meshBasicMaterial color="#ff5500" transparent opacity={0.6} blending={THREE.AdditiveBlending} />
          </mesh>
        )}
        {isFrozen && (
          <mesh position={[0, 4, 0]}>
             <boxGeometry args={[8, 8, 8]} />
             <meshStandardMaterial color="#88ccff" transparent opacity={0.5} roughness={0} metalness={0.8} />
          </mesh>
        )}

        {/* Beam Visuals */}
        {beams.map(b => (
          <BeamVisual key={b.id} from={[0, 6, 2]} to={[b.target[0]-pos.current[0], b.target[1]-pos.current[1], b.target[2]-pos.current[2]]} />
        ))}
      </group>

      {/* Sky Eyes */}
      {skyEyes.map(eye => (
        <SkyEye key={eye.id} position={[eye.pos[0] - pos.current[0], eye.pos[1] - pos.current[1], eye.pos[2] - pos.current[2]]} />
      ))}
    </group>
  );
};

const BeamVisual = ({ from, to }: any) => {
  return (
    <Line
      points={[from, to]}
      color="#ff4400"
      lineWidth={5}
    />
  );
};

const BossSpawnVisuals = () => {
  const timer = useRef(0);
  const circleRef = useRef<THREE.Group>(null);
  const flashRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.InstancedMesh>(null);

  useFrame((state, delta) => {
    timer.current += delta;
    if (circleRef.current) {
      circleRef.current.rotation.z += delta * 2;
      const s = Math.min(timer.current * 4, 1);
      circleRef.current.scale.setScalar(s);
    }
    if (flashRef.current) {
       const s = timer.current * 80; 
       flashRef.current.scale.setScalar(s);
       const mat = flashRef.current.material as THREE.MeshBasicMaterial;
       mat.opacity = Math.max(0, 1 - timer.current * 1.5);
    }
  });

  if (timer.current > 3.5) return null;

  return (
    <group position={[0, -3.9, 0]}>
      {/* Magic Circle on Ground */}
      <group ref={circleRef} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh>
          <ringGeometry args={[6, 6.2, 32]} />
          <meshBasicMaterial color="#ff0000" side={THREE.DoubleSide} transparent opacity={0.8} />
        </mesh>
        <mesh>
          <ringGeometry args={[4.5, 4.6, 8]} />
          <meshBasicMaterial color="#ff2200" side={THREE.DoubleSide} transparent opacity={0.6} wireframe />
        </mesh>
        <mesh rotation={[0, 0, Math.PI/4]}>
          <ringGeometry args={[4.5, 4.6, 4]} />
          <meshBasicMaterial color="#ff0000" side={THREE.DoubleSide} transparent opacity={0.9} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI/8]}>
          <ringGeometry args={[2, 4.5, 3]} />
          <meshBasicMaterial color="#aa0000" side={THREE.DoubleSide} transparent opacity={0.4} wireframe />
        </mesh>
      </group>
      
      {/* Red Burst Flash */}
      <mesh ref={flashRef} position={[0, 4, 0]}>
         <sphereGeometry args={[1, 32, 32]} />
         <meshBasicMaterial color="#ff0000" transparent opacity={1} side={THREE.BackSide} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
};

const SkyEye = ({ position }: any) => {
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[3, 16, 16]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0, 0, 2.5]}>
        <sphereGeometry args={[1.5, 16, 16]} />
        <meshBasicMaterial color="#ff0000" />
      </mesh>
      <mesh position={[0, 0, 3.8]}>
        <sphereGeometry args={[0.6, 16, 16]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      <pointLight intensity={30} color="#ff0000" distance={100} />
    </group>
  );
};

const BossTransformationVisual = ({ isFramed }: { isFramed: boolean }) => {
  const timer = useRef(0);
  const leftHalf = useRef<THREE.Group>(null);
  const rightHalf = useRef<THREE.Group>(null);
  const sukuna = useRef<THREE.Group>(null);
  const flash = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    timer.current += delta;
    if (timer.current < 2) {
      if (leftHalf.current && rightHalf.current) {
        leftHalf.current.position.x = (Math.random() - 0.5) * 0.3;
        rightHalf.current.position.x = (Math.random() - 0.5) * 0.3;
      }
    } else if (timer.current <= 4) {
      const p = (timer.current - 2) / 2; // 0 to 1
      if (leftHalf.current && rightHalf.current) {
        leftHalf.current.position.x = -p * 10;
        leftHalf.current.rotation.z = p * Math.PI / 4;
        
        rightHalf.current.position.x = p * 10;
        rightHalf.current.rotation.z = -p * Math.PI / 4;
      }
      if (sukuna.current) {
        sukuna.current.scale.setScalar(Math.min(1, p * 2));
      }
      if (flash.current) {
        const fMat = flash.current.material as THREE.MeshBasicMaterial;
        fMat.opacity = Math.max(0, 1 - p * 2);
        flash.current.scale.setScalar(p * 50);
      }
    }
  });

  return (
    <group>
      {/* Left Half (Offset and scaled to represent left side) */}
      <group ref={leftHalf}>
        <group scale={[0.5, 1, 1]} position={[-0.5, 0, 0]}>
          {/* Main central parts scaled and shifted */}
          <mesh position={[0, -1, 0]}>
            <cylinderGeometry args={[2, 1, 6, 8]} />
            <meshStandardMaterial color={isFramed ? "#aaaaaa" : "#1a0005"} transparent opacity={isFramed ? 0.2 : 1} roughness={isFramed ? 0 : 0.8} metalness={isFramed ? 0.8 : 0.2} />
          </mesh>
          <mesh position={[0, 0.5, 1.2]}>
            <boxGeometry args={[3, 3, 2]} />
            <meshStandardMaterial color={isFramed ? "#aaaaaa" : "#300000"} />
          </mesh>
          <mesh position={[0, 4, 0]}>
            <boxGeometry args={[2.5, 2.5, 2.5]} />
            <meshStandardMaterial color={isFramed ? "#aaaaaa" : "#110000"} />
          </mesh>
        </group>
        {/* Left Shoulder, Horn, Eye (Full scale, just shifted to left) */}
        <mesh position={[-3, 1.5, 0]} rotation={[0, 0, 0.3]}>
            <cylinderGeometry args={[0, 1.5, 3, 6]} />
            <meshStandardMaterial color={isFramed ? "#aaaaaa" : "#2a0000"} />
        </mesh>
        <mesh position={[-1.2, 5.5, 0]} rotation={[-0.2, 0, -0.5]}>
          <coneGeometry args={[0.3, 2.5, 4]} />
          <meshStandardMaterial color={isFramed ? "#aaaaaa" : "#ff0000"} />
        </mesh>
        <mesh position={[-0.7, 4.3, 1.3]}>
          <sphereGeometry args={[0.25, 8, 8]} />
          <meshBasicMaterial color="#ff0000" />
        </mesh>
      </group>

      {/* Right Half */}
      <group ref={rightHalf}>
        <group scale={[0.5, 1, 1]} position={[0.5, 0, 0]}>
          <mesh position={[0, -1, 0]}>
            <cylinderGeometry args={[2, 1, 6, 8]} />
            <meshStandardMaterial color={isFramed ? "#aaaaaa" : "#1a0005"} transparent opacity={isFramed ? 0.2 : 1} roughness={isFramed ? 0 : 0.8} metalness={isFramed ? 0.8 : 0.2} />
          </mesh>
          <mesh position={[0, 0.5, 1.2]}>
            <boxGeometry args={[3, 3, 2]} />
            <meshStandardMaterial color={isFramed ? "#aaaaaa" : "#300000"} />
          </mesh>
          <mesh position={[0, 4, 0]}>
            <boxGeometry args={[2.5, 2.5, 2.5]} />
            <meshStandardMaterial color={isFramed ? "#aaaaaa" : "#110000"} />
          </mesh>
        </group>
        {/* Right Shoulder, Horn, Eye */}
        <mesh position={[3, 1.5, 0]} rotation={[0, 0, -0.3]}>
            <cylinderGeometry args={[0, 1.5, 3, 6]} />
            <meshStandardMaterial color={isFramed ? "#aaaaaa" : "#2a0000"} />
        </mesh>
        <mesh position={[1.2, 5.5, 0]} rotation={[-0.2, 0, 0.5]}>
          <coneGeometry args={[0.3, 2.5, 4]} />
          <meshStandardMaterial color={isFramed ? "#aaaaaa" : "#ff0000"} />
        </mesh>
        <mesh position={[0.7, 4.3, 1.3]}>
          <sphereGeometry args={[0.25, 8, 8]} />
          <meshBasicMaterial color="#ff0000" />
        </mesh>
      </group>

      {/* Sukuna appearing from within */}
      <group ref={sukuna} scale={0}>
        <BossSukunaVisual isFramed={false} />
      </group>

      {/* Burst Flash */}
      <mesh ref={flash} position={[0, 3, 0]} scale={0}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color="#ff0000" transparent opacity={0} side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
};

const BossPhase1Visual = ({ isFramed }: { isFramed: boolean }) => {
  return (
    <group>
      {/* Boss Body */}
      <mesh position={[0, -1, 0]}>
        <cylinderGeometry args={[2, 1, 6, 8]} />
        <meshStandardMaterial color={isFramed ? "#aaaaaa" : "#1a0005"} transparent opacity={isFramed ? 0.2 : 1} roughness={isFramed ? 0 : 0.8} metalness={isFramed ? 0.8 : 0.2} />
      </mesh>

      {/* Chest Armor / Core */}
      <mesh position={[0, 0.5, 1.2]}>
        <boxGeometry args={[3, 3, 2]} />
        <meshStandardMaterial color={isFramed ? "#aaaaaa" : "#300000"} transparent opacity={isFramed ? 0.2 : 1} />
      </mesh>
      
      {/* Glowing Core */}
      <mesh position={[0, 0.5, 2.25]}>
        <boxGeometry args={[1, 1, 0.2]} />
        <meshBasicMaterial color="#ff0000" />
      </mesh>

      {/* Shoulders */}
      <mesh position={[3, 1.5, 0]} rotation={[0, 0, -0.3]}>
          <cylinderGeometry args={[0, 1.5, 3, 6]} />
          <meshStandardMaterial color={isFramed ? "#aaaaaa" : "#2a0000"} />
      </mesh>
      <mesh position={[-3, 1.5, 0]} rotation={[0, 0, 0.3]}>
          <cylinderGeometry args={[0, 1.5, 3, 6]} />
          <meshStandardMaterial color={isFramed ? "#aaaaaa" : "#2a0000"} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 4, 0]}>
        <boxGeometry args={[2.5, 2.5, 2.5]} />
        <meshStandardMaterial color={isFramed ? "#aaaaaa" : "#110000"} transparent opacity={isFramed ? 0.2 : 1} />
      </mesh>
      
      {/* Jaw/Mouth Area */}
      <mesh position={[0, 3.2, 1.3]}>
        <boxGeometry args={[1.5, 0.8, 0.5]} />
        <meshStandardMaterial color={isFramed ? "#aaaaaa" : "#300000"} />
      </mesh>

      {/* Horns */}
      <mesh position={[1.2, 5.5, 0]} rotation={[-0.2, 0, 0.5]}>
        <coneGeometry args={[0.3, 2.5, 4]} />
        <meshStandardMaterial color={isFramed ? "#aaaaaa" : "#ff0000"} transparent opacity={isFramed ? 0.2 : 1} />
      </mesh>
      <mesh position={[-1.2, 5.5, 0]} rotation={[-0.2, 0, -0.5]}>
        <coneGeometry args={[0.3, 2.5, 4]} />
        <meshStandardMaterial color={isFramed ? "#aaaaaa" : "#ff0000"} transparent opacity={isFramed ? 0.2 : 1} />
      </mesh>

      {/* Eyes */}
      <mesh position={[0.7, 4.3, 1.3]}>
        <sphereGeometry args={[0.25, 8, 8]} />
        <meshBasicMaterial color="#ff0000" />
      </mesh>
      <mesh position={[-0.7, 4.3, 1.3]}>
        <sphereGeometry args={[0.25, 8, 8]} />
        <meshBasicMaterial color="#ff0000" />
      </mesh>
      <pointLight position={[0, 4.3, 1.5]} intensity={20} color="#ff0000" distance={20} />
    </group>
  );
};

const BossSukunaVisual = ({ isFramed }: { isFramed: boolean }) => {
  return (
    <group>
      {/* Sukuna-esque Humanoid Body, smaller and more agile looking but still imposing */}
      
      {/* Torso - Kimono-like robes (white/light grey) */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[1.2, 1.2, 4, 8]} />
        <meshStandardMaterial color={isFramed ? "#aaaaaa" : "#d4d4d4"} transparent opacity={isFramed ? 0.2 : 1} roughness={1} />
      </mesh>
      
      {/* Belt/Sash (dark blue/black) */}
      <mesh position={[0, -0.5, 0]}>
        <cylinderGeometry args={[1.25, 1.25, 0.8, 8]} />
        <meshStandardMaterial color={isFramed ? "#aaaaaa" : "#1a1a1a"} transparent opacity={isFramed ? 0.2 : 1} roughness={1} />
      </mesh>

      {/* Tattooed Chest (exposed) */}
      <mesh position={[0, 1.8, 0.9]}>
        <boxGeometry args={[2, 1.5, 0.6]} />
        <meshStandardMaterial color={isFramed ? "#aaaaaa" : "#fca5a5"} transparent opacity={isFramed ? 0.2 : 1} />
      </mesh>
      {/* Tattoos on chest (black stripes) */}
      <mesh position={[0.5, 2, 1.25]}>
        <boxGeometry args={[0.2, 0.8, 0.1]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      <mesh position={[-0.5, 2, 1.25]}>
        <boxGeometry args={[0.2, 0.8, 0.1]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      {/* Head */}
      <mesh position={[0, 3.5, 0]}>
        <sphereGeometry args={[1.1, 16, 16]} />
        <meshStandardMaterial color={isFramed ? "#aaaaaa" : "#fca5a5"} transparent opacity={isFramed ? 0.2 : 1} />
      </mesh>
      
      {/* Hair (spiky pink/red) */}
      <mesh position={[0, 4.2, -0.2]}>
        <icosahedronGeometry args={[1.2, 0]} />
        <meshStandardMaterial color={isFramed ? "#aaaaaa" : "#fda4af"} transparent opacity={isFramed ? 0.2 : 1} roughness={0.9} />
      </mesh>

      {/* Extra eyes (4 eyes feature) */}
      {[-0.4, 0.4].map((x, i) => (
        <group key={`eyes-${i}`}>
          {/* Top eyes */}
          <mesh position={[x, 3.7, 1.05]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshBasicMaterial color="#ff0000" />
          </mesh>
          {/* Bottom eyes */}
          <mesh position={[x, 3.4, 1.08]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshBasicMaterial color="#ff0000" />
          </mesh>
        </group>
      ))}

      {/* 4 Arms Array */}
      <group position={[1.5, 1.5, 0]}>
        <mesh rotation={[0, 0, -0.5]}>
          <cylinderGeometry args={[0.3, 0.2, 3, 8]} />
          <meshStandardMaterial color={isFramed ? "#aaaaaa" : "#fca5a5"} transparent opacity={isFramed ? 0.2 : 1} />
        </mesh>
        <mesh position={[0.5, -0.5, 0]} rotation={[0.5, 0, -1]}>
          <cylinderGeometry args={[0.3, 0.2, 3, 8]} />
          <meshStandardMaterial color={isFramed ? "#aaaaaa" : "#fca5a5"} transparent opacity={isFramed ? 0.2 : 1} />
        </mesh>
      </group>

      <group position={[-1.5, 1.5, 0]}>
        <mesh rotation={[0, 0, 0.5]}>
          <cylinderGeometry args={[0.3, 0.2, 3, 8]} />
          <meshStandardMaterial color={isFramed ? "#aaaaaa" : "#fca5a5"} transparent opacity={isFramed ? 0.2 : 1} />
        </mesh>
        <mesh position={[-0.5, -0.5, 0]} rotation={[0.5, 0, 1]}>
          <cylinderGeometry args={[0.3, 0.2, 3, 8]} />
          <meshStandardMaterial color={isFramed ? "#aaaaaa" : "#fca5a5"} transparent opacity={isFramed ? 0.2 : 1} />
        </mesh>
      </group>

      <pointLight position={[0, 3.5, 1.5]} intensity={10} color="#ff0000" distance={15} />
    </group>
  );
};
