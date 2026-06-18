import { useSphere } from '@react-three/cannon';
import { useFrame } from '@react-three/fiber';
import { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { getAudioContext } from '../audio';

export const Splitter = ({ position, onDie, explosionEvent, playerPos, isSmall = false }: { 
  position: [number, number, number], 
  onDie: () => void,
  explosionEvent?: { pos: [number, number, number], radius: number, team?: string, damageMultiplier?: number } | null,
  playerPos: [number, number, number],
  isSmall?: boolean
}) => {
  const maxHealth = isSmall ? 30 : 80;
  const scale = isSmall ? 0.4 : 0.8;
  const [health, setHealth] = useState(maxHealth);
  const [isDead, setIsDead] = useState(false);
  
  const [ref, api] = useSphere(() => ({
    mass: isSmall ? 0.5 : 2,
    position,
    args: [scale],
    onCollide: (e) => {
      const impact = e.contact.impactVelocity;
      if (impact > 5) {
         setHealth(prev => prev - impact * 5);
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
         setHealth(prev => prev - 50 * (explosionEvent.damageMultiplier || 1));
      }
    }
  }, [explosionEvent]);

  useEffect(() => {
    if (health <= 0 && !isDead) {
      setIsDead(true);
      playSplatSound();
      if (!isSmall) {
         // Notify spawner to split into two
         window.dispatchEvent(new CustomEvent('splitEnemy', { detail: { pos: pos.current } }));
      }
      onDie();
    }
  }, [health]);

  const playSplatSound = () => {
    const ctx = getAudioContext();
    if (ctx) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.8, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    }
  };

  useFrame((state) => {
    if ((window as any).isTimeStopped || isDead) return;
    
    // Move erratically towards player
    const dx = playerPos[0] - pos.current[0];
    const dz = playerPos[2] - pos.current[2];
    const dist = Math.sqrt(dx*dx + dz*dz);
    
    if (dist > 1) {
      const speed = isSmall ? 6 : 4;
      // Add some erratic horizontal movement
      const erratic = Math.sin(state.clock.elapsedTime * 5 + pos.current[0]) * 2;
      api.velocity.set((dx/dist)*speed + erratic, pos.current[1] > 2 ? -2 : 0, (dz/dist)*speed + erratic);
    }
  });

  if (isDead) return null;

  return (
    <mesh ref={ref as any} castShadow>
      <sphereGeometry args={[scale, 16, 16]} />
      {/* Morphing color effect */}
      <meshPhysicalMaterial color="#88ff00" emissive="#002200" roughness={0.1} transmission={0.5} thickness={0.5} />
      
      <mesh position={[scale * 0.5, scale * 0.3, scale * 0.5]}>
         <sphereGeometry args={[scale * 0.2, 8, 8]} />
         <meshStandardMaterial color="#000" />
      </mesh>
      <mesh position={[-scale * 0.5, scale * 0.3, scale * 0.5]}>
         <sphereGeometry args={[scale * 0.2, 8, 8]} />
         <meshStandardMaterial color="#000" />
      </mesh>
    </mesh>
  );
};
