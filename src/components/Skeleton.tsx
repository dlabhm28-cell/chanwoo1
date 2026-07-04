import { useSphere } from '@react-three/cannon';
import { useFrame } from '@react-three/fiber';
import { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { FreezeFrame2D, VoidSymbols } from './Projectiles';

export const Skeleton = ({ position, onDie, isSpiritBombActive, explosionEvent, isImprisoned = false }: { 
  position: [number, number, number], 
  onDie: () => void,
  isSpiritBombActive: boolean,
  explosionEvent?: { pos: [number, number, number], radius: number, team?: string, damageMultiplier?: number } | null,
  isImprisoned?: boolean
}) => {
  const maxHealth = 60;
  const [health, setHealth] = useState(maxHealth);
  const [isStunned, setIsStunned] = useState(false);
  const [isFramed, setIsFramed] = useState(false);
  const voidTimer = useRef(0);
  const [isVoided, setIsVoided] = useState(false);
  const [onFire, setOnFire] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  const meshRef = useRef<THREE.Group>(null);
  const pos = useRef([0, 0, 0]);
  
  const [ref, api] = useSphere(() => ({
    mass: 1,
    position,
    args: [0.6],
    onCollide: (e) => {
      const impact = e.contact.impactVelocity;
      if (impact > 5 && !isFramed) {
        setHealth(prev => prev - impact * 10);
      }
    }
  }));

  useEffect(() => {
    const unsubscribe = api.position.subscribe(p => pos.current = p);
    return () => unsubscribe();
  }, [api.position]);

  const stunTimer = useRef(0);
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
            setHealth(prev => prev - 80);
            window.dispatchEvent(new CustomEvent('shatterDied', { detail: { pos: pos.current } }));
          }
        } else if ((explosionEvent as any).isUnlimitedVoidDamage) {
          const damage = 5 * (Math.random() + 0.5);
          setHealth(prev => prev - damage);
          voidTimer.current = 15;
          setIsVoided(true);
        } else {
          const damage = (1 - dist / explosionEvent.radius) * 400 * (explosionEvent.damageMultiplier || 1);
          setHealth(prev => prev - damage);

          if ((explosionEvent as any).trait === 'fire' && Math.random() < 0.5) {
             setOnFire(true);
          }
          if ((explosionEvent as any).trait === 'ice' && Math.random() < 0.3) {
             setIsFrozen(true);
             stunTimer.current = 180;
          }
          if ((explosionEvent as any).trait === 'vampire' && explosionEvent.team === 'player') {
             window.dispatchEvent(new CustomEvent('playerHeal', { detail: { amount: damage * 0.2 } }));
          }
          if ((explosionEvent as any).trait === 'lightning' && explosionEvent.team === 'player') {
             window.dispatchEvent(new CustomEvent('lightningHit'));
          }

          if ((explosionEvent as any).launchForce && !isFramed) {
            api.velocity.set(0, (explosionEvent as any).launchForce, 0);
            stunTimer.current = 60;
          }
          if ((explosionEvent as any).isBinding) {
             stunTimer.current = 120; // 2 seconds bind
             api.velocity.set(0, -5, 0); 
          }
        }
      }
    }
  }, [explosionEvent, isFramed]);

  useFrame((state) => {
    if (onFire) {
       if (state.clock.elapsedTime % 0.5 < 0.016) {
           setHealth(prev => prev - 5);
       }
    }
    if ((window as any).isTimeStopped || voidTimer.current > 0 || isImprisoned) {
      if (voidTimer.current > 0) {
        voidTimer.current--;
        if (voidTimer.current <= 0) setIsVoided(false);
      }
      api.velocity.set(0, 0, 0);
      return;
    }

    if (health <= 0 || isSpiritBombActive) {
      if (isFramed) {
        window.dispatchEvent(new CustomEvent('shatterDied', { detail: { pos: pos.current } }));
      }
      onDie();
      return;
    }

    if (stunTimer.current > 0 || isFramed) {
      if (stunTimer.current > 0) stunTimer.current--;
      setIsStunned(true);
      if (isFramed) {
        api.velocity.set(0, -5, 0);
        if (meshRef.current) {
          meshRef.current.scale.set(1, 1, 0.05);
          const dir = state.camera.position.clone().sub(new THREE.Vector3(...pos.current));
          const angle = Math.atan2(dir.x, dir.z);
          meshRef.current.rotation.y = angle;
        }
      }
    } else {
      setIsStunned(false);
      const playerPos = state.camera.position;
      const direction = new THREE.Vector3(playerPos.x - pos.current[0], 0, playerPos.z - pos.current[2]).normalize();
      const speed = 4; // Fast
      api.velocity.set(direction.x * speed, -5, direction.z * speed);

      if (meshRef.current) {
        meshRef.current.scale.set(1, 1, 1);
        meshRef.current.rotation.y = Math.atan2(direction.x, direction.z);
      }
    }
  });

  const VoxelPart = ({ p, s, c }: { p: [number, number, number], s: [number, number, number], c: string }) => (
    <mesh position={p}>
      <boxGeometry args={s} />
      <meshStandardMaterial color={isFramed ? "#aaaaaa" : c} transparent opacity={isFramed ? 0.2 : 1} roughness={isFramed ? 0 : 1} metalness={isFramed ? 0.9 : 0} />
    </mesh>
  );

  return (
    <group ref={ref as any}>
      {isStunned && !isFramed && (
        <group position={[0, 1.8, 0]}>
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[Math.sin(Date.now() / 200 + i * 2) * 0.5, 0, Math.cos(Date.now() / 200 + i * 2) * 0.5]}>
              <sphereGeometry args={[0.15]} />
              <meshBasicMaterial color="#facc15" />
            </mesh>
          ))}
        </group>
      )}

      {isFramed && (
        <group position={[0, 0.5, 0]}>
        </group>
      )}

      {isVoided && (
        <group position={[0, 2.5, 0]}>
          <VoidSymbols />
        </group>
      )}

      <group ref={meshRef}>
        {isFramed && (
          <group position={[0, 0.5, 0]}>
            <FreezeFrame2D width={1.8} height={1.8} zDepth={0.25} />
          </group>
        )}
        {onFire && (
          <mesh position={[0, 0.5, 0]}>
             <sphereGeometry args={[0.8, 8, 8]} />
             <meshBasicMaterial color="#ff5500" transparent opacity={0.6} blending={THREE.AdditiveBlending} />
          </mesh>
        )}
        {isFrozen && (
          <mesh position={[0, 0.5, 0]}>
             <boxGeometry args={[1.2, 1.8, 1.2]} />
             <meshStandardMaterial color="#88ccff" transparent opacity={0.5} roughness={0} metalness={0.8} />
          </mesh>
        )}
        <VoxelPart p={[0, 0.4, 0]} s={[0.4, 0.6, 0.2]} c="#e2e8f0" />
        <VoxelPart p={[0, 0.9, 0]} s={[0.5, 0.5, 0.5]} c="#f8fafc" />
        <VoxelPart p={[0.15, 1.0, 0.2]} s={[0.1, 0.1, 0.1]} c="#ef4444" />
        <VoxelPart p={[-0.15, 1.0, 0.2]} s={[0.1, 0.1, 0.1]} c="#ef4444" />
        <VoxelPart p={[0.3, 0.5, 0]} s={[0.1, 0.5, 0.1]} c="#cbd5e1" />
        <VoxelPart p={[-0.3, 0.5, 0]} s={[0.1, 0.5, 0.1]} c="#cbd5e1" />
        <VoxelPart p={[0.15, -0.2, 0]} s={[0.12, 0.6, 0.12]} c="#cbd5e1" />
        <VoxelPart p={[-0.15, -0.2, 0]} s={[0.12, 0.6, 0.12]} c="#cbd5e1" />
      </group>
      
      <group position={[0, 1.5, 0]}>
        <mesh>
          <planeGeometry args={[1, 0.1]} />
          <meshBasicMaterial color="#000" transparent opacity={0.5} />
        </mesh>
        <mesh position={[-(1 - health/maxHealth)/2, 0, 0.01]}>
          <planeGeometry args={[Math.max(0, health/maxHealth), 0.1]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
      </group>
    </group>
  );
};
