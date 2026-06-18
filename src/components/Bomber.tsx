import { useSphere } from '@react-three/cannon';
import { useFrame } from '@react-three/fiber';
import { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';

import { getAudioContext } from '../audio';

export const Bomber = ({ position, onDie, explosionEvent, playerPos }: { 
  position: [number, number, number], 
  onDie: () => void,
  explosionEvent?: { pos: [number, number, number], radius: number, team?: string, damageMultiplier?: number } | null,
  playerPos: [number, number, number]
}) => {
  const [health, setHealth] = useState(50);
  const [isDead, setIsDead] = useState(false);
  const [ref, api] = useSphere(() => ({
    mass: 1.5,
    position,
    args: [0.8],
    onCollide: (e) => {
      const impact = e.contact.impactVelocity;
      if (impact > 5) setHealth(prev => prev - impact * 5);
    }
  }));

  const pos = useRef([0, 0, 0]);
  const meshRef = useRef<THREE.Mesh>(null);
  const isExploding = useRef(false);

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
      triggerExplosion();
    }
  }, [health]);

  const triggerExplosion = () => {
    if (isExploding.current || isDead) return;
    isExploding.current = true;
    setIsDead(true);
    // Let's create an oscillator for an explosion sound just like requested "Web Audio API"
    const ctx = getAudioContext();
    if (ctx) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(100, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    }

    window.dispatchEvent(new CustomEvent('bombExplode', { 
      detail: { pos: pos.current, radius: 4, team: 'enemy', color: '#ff4400', damageMultiplier: 1.5 } 
    }));
    setTimeout(() => onDie(), 50);
  };

  useFrame((state) => {
    if ((window as any).isTimeStopped || isDead) return;
    
    // Move towards player
    const dx = playerPos[0] - pos.current[0];
    const dz = playerPos[2] - pos.current[2];
    const dist = Math.sqrt(dx*dx + dz*dz);
    
    if (dist < 3) {
      // Trigger detonate if close
      triggerExplosion();
    } else {
      const speed = 6;
      api.velocity.set((dx/dist)*speed, pos.current[1] > 2 ? -2 : 0, (dz/dist)*speed);
    }
    
    if (meshRef.current) {
       // Pulsate color based on time
       const s = Math.sin(state.clock.elapsedTime * 10);
       (meshRef.current.material as THREE.MeshStandardMaterial).color.setHSL(0.05, 1, 0.4 + s * 0.2);
       const scale = 1 + s * 0.1;
       meshRef.current.scale.setScalar(scale);
    }
  });

  if (isDead) return null;

  return (
    <mesh ref={ref as any} castShadow>
      <sphereGeometry args={[0.8, 16, 16]} />
      <meshStandardMaterial ref={meshRef as any} color="#ff3300" emissive="#aa1100" emissiveIntensity={0.5} roughness={0.4} />
      {/* spikes */}
      <mesh position={[0,0.8,0]}>
        <coneGeometry args={[0.2, 0.6, 4]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      <mesh position={[0,-0.8,0]} rotation={[Math.PI, 0, 0]}>
         <coneGeometry args={[0.2, 0.6, 4]} />
         <meshStandardMaterial color="#222" />
      </mesh>
    </mesh>
  );
};
