import { useSphere } from '@react-three/cannon';
import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { FreezeFrame2D, VoidSymbols } from './Projectiles';

export const Slime = ({ position, onDie, isSpiritBombActive, isKing = false, explosionEvent, isImprisoned = false }: { 
  position: [number, number, number], 
  onDie: () => void,
  isSpiritBombActive: boolean,
  isKing?: boolean,
  explosionEvent?: { pos: [number, number, number], radius: number, team?: string, damageMultiplier?: number } | null,
  isImprisoned?: boolean
}) => {
  const maxHealth = isKing ? 1000 : 100;
  const scale = isKing ? 3 : 1;
  const [health, setHealth] = useState(maxHealth);
  const [isStunned, setIsStunned] = useState(false);
  const [isFramed, setIsFramed] = useState(false);
  const voidTimer = useRef(0);
  const [isVoided, setIsVoided] = useState(false);
  const [onFire, setOnFire] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  
  const [ref, api] = useSphere(() => ({
    mass: isKing ? 50 : 1,
    position,
    args: [0.6 * scale],
    onCollide: (e) => {
      const impact = e.contact.impactVelocity;
      if (impact > 5 && !isFramed) {
        setHealth(prev => prev - (impact * (isKing ? 2 : 5)));
      }
    }
  }));

  const slimeRef = useRef<THREE.Group>(null);
  const pos = useRef([0, 0, 0]);

  useEffect(() => {
    const id = Math.random().toString(36).substr(2, 9);
    const unsubscribe = api.position.subscribe(p => {
      pos.current = p;
      if (!(window as any).slimes) (window as any).slimes = new Map();
      (window as any).slimes.set(id, p);
    });
    return () => {
      unsubscribe();
      if ((window as any).slimes) (window as any).slimes.delete(id);
    };
  }, [api.position]);

  // Check explosion damage
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
            // Moving! applying cell breakdown damage & frame effect
            setHealth(prev => prev - 80);
            window.dispatchEvent(new CustomEvent('shatterDied', { detail: { pos: pos.current } }));
          }
        } else if ((explosionEvent as any).isUnlimitedVoidDamage) {
          const damage = 5 * (Math.random() + 0.5); // small damage
          setHealth(prev => prev - damage);
          voidTimer.current = 15;
          setIsVoided(true);
        } else {
          const damage = (1 - dist / explosionEvent.radius) * 300 * (explosionEvent.damageMultiplier || 1);
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

  // Broadcast boss health
  useEffect(() => {
    if (isKing) {
      const event = new CustomEvent('bossUpdateHp', { 
        detail: { hp: (health / maxHealth) * 100 } 
      });
      window.dispatchEvent(event);
    }
  }, [health, isKing, maxHealth]);

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
      if (isKing) {
        window.dispatchEvent(new CustomEvent('bossUpdateHp', { detail: { hp: 0 } }));
      }
      if (isFramed) {
        window.dispatchEvent(new CustomEvent('shatterDied', { detail: { pos: pos.current } }));
      }
      onDie();
      return;
    }

    if (stunTimer.current > 0 || isFramed) {
      if (stunTimer.current > 0) stunTimer.current--;
      setIsStunned(true);
      if (isFramed) api.velocity.set(0, -5, 0); // freeze but fall
    } else {
      setIsStunned(false);
      const playerPos = state.camera.position;
      if (playerPos) {
        const direction = new THREE.Vector3(playerPos.x - pos.current[0], 0, playerPos.z - pos.current[2]).normalize();
        const speed = isKing ? 1 : 2;
        api.velocity.set(direction.x * speed, -5, direction.z * speed);

        // Damage player if close
        const distToPlayer = playerPos.distanceTo(new THREE.Vector3(...pos.current));
        if (distToPlayer < (isKing ? 4 : 1.5)) {
          // Throttle damage slightly (once every 10 frames approx)
          if (state.clock.elapsedTime % 0.2 < 0.016) {
            window.dispatchEvent(new CustomEvent('playerDamage', { detail: { amount: isKing ? 2 : 1 } }));
          }
        }
      }
    }

    if (slimeRef.current) {
      if (!isFramed) {
        slimeRef.current.scale.y = scale + Math.sin(state.clock.elapsedTime * 10) * 0.2 * scale;
        slimeRef.current.scale.x = scale - Math.sin(state.clock.elapsedTime * 10) * 0.1 * scale;
        slimeRef.current.scale.z = scale - Math.sin(state.clock.elapsedTime * 10) * 0.1 * scale;
        slimeRef.current.rotation.set(0, 0, 0);
      } else {
        slimeRef.current.scale.set(scale, scale, 0.05); // Flatten depth
        const dir = state.camera.position.clone().sub(new THREE.Vector3(...pos.current));
        const angle = Math.atan2(dir.x, dir.z);
        slimeRef.current.rotation.set(0, angle, 0);
      }
    }
  });

  return (
    <group ref={ref as any}>
      <group ref={slimeRef}>
        {/* Health Bar Background */}
        <mesh position={[0, 1.2 * scale, 0]}>
          <planeGeometry args={[1.2 * scale, 0.15 * scale]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.5} />
        </mesh>
        
        {isStunned && !isFramed && (
          <group position={[0, 1.5 * scale, 0]}>
            {[0, 1, 2].map((i) => (
              <mesh key={i} position={[Math.sin(Date.now() / 200 + i * 2) * 0.5, 0, Math.cos(Date.now() / 200 + i * 2) * 0.5]}>
                <sphereGeometry args={[0.15]} />
                <meshBasicMaterial color="#facc15" />
              </mesh>
            ))}
          </group>
        )}

        {isVoided && (
          <group position={[0, scale * 3, 0]}>
            <VoidSymbols />
          </group>
        )}

        {isFramed && (
          <group position={[0, 0, 0]}>
            <FreezeFrame2D width={1.8 * scale} height={1.8 * scale} zDepth={0.25} />
          </group>
        )}

        {/* Health Bar Fill */}
        <mesh position={[-0.6 * scale + (health / (maxHealth * (1.2 / 0.6))) * 0, 1.2 * scale, 0.01]}>
          <planeGeometry args={[Math.max(0, (health / maxHealth) * 1.2 * scale), 0.15 * scale]} />
          <meshBasicMaterial color={isKing ? "#fbbf24" : "#22c55e"} />
        </mesh>

        <mesh castShadow>
          <sphereGeometry args={[0.6, 8, 8]} />
          <meshStandardMaterial 
            color={isFramed ? "#aaaaaa" : (isKing ? "#9333ea" : "#34d399")} 
            transparent 
            opacity={isFramed ? 0.2 : 0.8} 
            roughness={isFramed ? 0 : 0.1} 
            metalness={isFramed ? 0.9 : 0.2} 
          />
        </mesh>

        {onFire && (
          <mesh position={[0, 0, 0]}>
             <sphereGeometry args={[0.7, 8, 8]} />
             <meshBasicMaterial color="#ff5500" transparent opacity={0.6} blending={THREE.AdditiveBlending} />
          </mesh>
        )}
        {isFrozen && (
          <mesh position={[0, 0, 0]}>
             <boxGeometry args={[1.5, 1.5, 1.5]} />
             <meshStandardMaterial color="#88ccff" transparent opacity={0.5} roughness={0} metalness={0.8} />
          </mesh>
        )}
        
        <mesh position={[0.2, 0.2, 0.5]}>
          <boxGeometry args={[0.1, 0.1, 0.1]} />
          <meshStandardMaterial color="black" transparent opacity={isFramed ? 0.2 : 1} />
        </mesh>
        <mesh position={[-0.2, 0.2, 0.5]}>
          <boxGeometry args={[0.1, 0.1, 0.1]} />
          <meshStandardMaterial color="black" transparent opacity={isFramed ? 0.2 : 1} />
        </mesh>
      </group>
    </group>
  );
};

