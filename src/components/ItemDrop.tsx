import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useSphere } from '@react-three/cannon';
import * as THREE from 'three';
import { motion } from 'motion/react';

export type ItemType = 'heal' | 'energy' | 'stat';

interface ItemDropProps {
  id: number;
  position: [number, number, number];
  type: ItemType;
  onPickUp: (id: number, type: ItemType) => void;
}

export const ItemDrop = ({ id, position, type, onPickUp }: ItemDropProps) => {
  const [ref, api] = useSphere(() => ({ 
    mass: 0.5, 
    position, 
    args: [0.4],
    collisionFilterGroup: 4, // Item group
  }));

  const pos = useRef([0, 0, 0]);
  useEffect(() => api.position.subscribe(p => pos.current = p), [api.position]);

  const color = type === 'heal' ? '#ef4444' : (type === 'energy' ? '#facc15' : '#8b5cf6');
  const [picked, setPicked] = useState(false);

  useFrame((state) => {
    if (picked) return;

    // Magnet effect towards player
    const pPos = state.camera.position;
    const dist = new THREE.Vector3(...pos.current).distanceTo(pPos);

    if (dist < 4) {
      const dir = new THREE.Vector3().subVectors(pPos, new THREE.Vector3(...pos.current)).normalize();
      api.velocity.set(dir.x * 12, dir.y * 12, dir.z * 12);
    }

    if (dist < 1.0) {
      setPicked(true);
      onPickUp(id, type);
    }
  });

  return (
    <group ref={ref as any}>
      <mesh>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
      </mesh>
      <pointLight color={color} intensity={5} distance={3} />
      
      {/* Floating particles or ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.5, 0.02, 16, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} />
      </mesh>
    </group>
  );
};
