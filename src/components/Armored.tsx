import { useBox } from '@react-three/cannon';
import { useFrame } from '@react-three/fiber';
import { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { getAudioContext } from '../audio';

export const Armored = ({ position, onDie, explosionEvent, playerPos, isImprisoned = false }: { 
  position: [number, number, number], 
  onDie: () => void,
  explosionEvent?: { pos: [number, number, number], radius: number, team?: string, damageMultiplier?: number } | null,
  playerPos: [number, number, number],
  isImprisoned?: boolean
}) => {
  const maxHealth = 300;
  const [health, setHealth] = useState(maxHealth);
  const [isDead, setIsDead] = useState(false);
  const [onFire, setOnFire] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  const stunTimer = useRef(0);
  
  const [ref, api] = useBox(() => ({
    mass: 10,
    position,
    args: [1.5, 1.5, 1.5],
    onCollide: (e) => {
      const impact = e.contact.impactVelocity;
      // High armor: divide impact by 2, and require at least 8 to register
      if (impact > 8) {
         setHealth(prev => prev - (impact / 2));
         playClankSound();
      }
    }
  }));

  const pos = useRef([0, 0, 0]);

  useEffect(() => {
    const unsubscribe = api.position.subscribe(p => pos.current = p);
    return () => unsubscribe();
  }, [api]);

  useEffect(() => {
    if (explosionEvent && explosionEvent.team !== 'enemy') {
      const dx = pos.current[0] - explosionEvent.pos[0];
      const dy = pos.current[1] - explosionEvent.pos[1];
      const dz = pos.current[2] - explosionEvent.pos[2];
      const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
      if (dist < explosionEvent.radius) {
         setHealth(prev => prev - 30 * (explosionEvent.damageMultiplier || 1));
         
         if ((explosionEvent as any).trait === 'fire' && Math.random() < 0.5) {
             setOnFire(true);
         }
         if ((explosionEvent as any).trait === 'ice' && Math.random() < 0.3) {
             setIsFrozen(true);
             stunTimer.current = 180;
         }
         if ((explosionEvent as any).trait === 'vampire' && explosionEvent.team === 'player') {
             window.dispatchEvent(new CustomEvent('playerHeal', { detail: { amount: 30 * (explosionEvent.damageMultiplier || 1) * 0.2 } }));
         }
         if ((explosionEvent as any).trait === 'lightning' && explosionEvent.team === 'player') {
             window.dispatchEvent(new CustomEvent('lightningHit'));
         }
      }
    }
  }, [explosionEvent]);

  useEffect(() => {
    if (health <= 0 && !isDead) {
      setIsDead(true);
      onDie();
    }
  }, [health]);

  const playClankSound = () => {
    const ctx = getAudioContext();
    if (ctx) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    }
  };

  useFrame((state) => {
    if ((window as any).isTimeStopped || isDead || isImprisoned) {
      api.velocity.set(0, 0, 0);
      return;
    }
    
    if (onFire) {
       if (state.clock.elapsedTime % 0.5 < 0.016) {
           setHealth(prev => prev - 5);
       }
    }

    if (stunTimer.current > 0) {
      stunTimer.current--;
      api.velocity.set(0, -5, 0);
      return;
    }
    
    // Move towards player slowly
    const dx = playerPos[0] - pos.current[0];
    const dz = playerPos[2] - pos.current[2];
    const dist = Math.sqrt(dx*dx + dz*dz);
    
    if (dist > 1.5) {
      const speed = 2.5; // Very slow
      api.velocity.set((dx/dist)*speed, pos.current[1] > 2 ? -2 : 0, (dz/dist)*speed);
    }
  });

  if (isDead) return null;

  const dmgRatio = 1 - (health / maxHealth);

  return (
    <mesh ref={ref as any} castShadow>
      <boxGeometry args={[1.5, 1.5, 1.5]} />
      {/* Visual damage using color lerp */}
      <meshStandardMaterial color={new THREE.Color().lerpColors(new THREE.Color('#444'), new THREE.Color('#882222'), dmgRatio)} roughness={0.7} metalness={0.8} />
      {/* Mini armor plates */}
      <mesh position={[0,0.76,0]}>
         <boxGeometry args={[1.2, 0.1, 1.2]} />
         <meshStandardMaterial color="#222" metalness={0.9} />
      </mesh>
      {onFire && (
        <mesh position={[0, 0, 0]}>
           <sphereGeometry args={[1.2, 8, 8]} />
           <meshBasicMaterial color="#ff5500" transparent opacity={0.6} blending={THREE.AdditiveBlending} />
        </mesh>
      )}
      {isFrozen && (
        <mesh position={[0, 0, 0]}>
           <boxGeometry args={[1.8, 1.8, 1.8]} />
           <meshStandardMaterial color="#88ccff" transparent opacity={0.5} roughness={0} metalness={0.8} />
        </mesh>
      )}
    </mesh>
  );
};
