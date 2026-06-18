import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Float } from '@react-three/drei';

interface PetProps {
  playerPos: [number, number, number];
  type: 'dragon' | 'slime' | 'robot';
}

export const Pet = ({ playerPos, type }: PetProps) => {
  const meshRef = useRef<THREE.Group>(null);
  const [lastAttack, setLastAttack] = useState(0);

  const color = type === 'dragon' ? '#ef4444' : (type === 'slime' ? '#4ade80' : '#3b82f6');

  useFrame((state) => {
    if (!meshRef.current) return;

    // Smoothly follow player with an offset
    const target = new THREE.Vector3(playerPos[0] - 2, playerPos[1] + 1.5, playerPos[2] + 2);
    meshRef.current.position.lerp(target, 0.05);
    
    // Look at where player is looking or just rotate slowly
    meshRef.current.rotation.y += 0.01;

    // Automatic attack logic
    const now = state.clock.elapsedTime;
    if (now - lastAttack > 3) {
      window.dispatchEvent(new CustomEvent('petAttack', { 
        detail: { pos: [meshRef.current.position.x, meshRef.current.position.y, meshRef.current.position.z], color } 
      }));
      setLastAttack(now);
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <group ref={meshRef}>
        {/* Simple Pet Body */}
        <mesh>
          <sphereGeometry args={[0.4, 16, 16]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
        </mesh>
        {/* Glow effect */}
        <pointLight color={color} intensity={2} distance={5} />
        
        {/* "Eyes" or detail */}
        <mesh position={[0.2, 0.1, 0.3]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color="white" />
        </mesh>
        <mesh position={[-0.2, 0.1, 0.3]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color="white" />
        </mesh>
      </group>
    </Float>
  );
};
