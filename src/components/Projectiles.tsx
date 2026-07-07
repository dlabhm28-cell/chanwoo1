import { useFrame, useThree } from '@react-three/fiber';
import { useSphere } from '@react-three/cannon';
import { useRef, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';

export const PetLaser = ({ startPos, endPos, color, onFinish }: { startPos: [number, number, number], endPos: [number, number, number], color: string, onFinish: () => void }) => {
  const ref = useRef<THREE.Mesh>(null);
  const [opacity, setOpacity] = useState(1);
  const length = useMemo(() => new THREE.Vector3(...startPos).distanceTo(new THREE.Vector3(...endPos)), [startPos, endPos]);
  const midPoint = useMemo(() => new THREE.Vector3(...startPos).lerp(new THREE.Vector3(...endPos), 0.5), [startPos, endPos]);

  useEffect(() => {
    if (ref.current) {
      ref.current.position.copy(midPoint);
      // Wait, cylinder is aligned along Y axis by default. We need it to point to endPos
      // lookAt points the Z-axis, so we rotate the mesh to align Y axis to Z axis.
      ref.current.lookAt(new THREE.Vector3(...endPos));
      ref.current.rotateX(Math.PI / 2);
    }
  }, [midPoint, endPos]);

  useFrame((state, delta) => {
    if ((window as any).isTimeStopped) return;
    setOpacity(prev => Math.max(0, prev - delta * 5));
    if (opacity <= 0) onFinish();
  });

  return (
    <mesh ref={ref}>
      <cylinderGeometry args={[0.05, 0.05, length, 8]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} />
      <pointLight color={color} intensity={5 * opacity} distance={5} />
    </mesh>
  );
};

export const EnergyBlast = ({ position, direction, onFinish, isAwakened = false }: {
  position: [number, number, number], 
  direction: [number, number, number],
  onFinish: () => void,
  isAwakened?: boolean
}) => {
  const [ref, api] = useSphere(() => ({
    mass: 0.1,
    args: [0.3],
    position,
    onCollide: () => {}
  }));

  const startTime = useRef(Date.now());
  const velocity = 60; // Increased speed
  const wasStopped = useRef(false);

  useEffect(() => {
    api.velocity.set(direction[0] * velocity, direction[1] * velocity, direction[2] * velocity);
  }, [api, direction]);

  useFrame((state, delta) => {
    if ((window as any).isTimeStopped) {
      api.velocity.set(0, 0, 0);
      wasStopped.current = true;
      return;
    }

    if (wasStopped.current) {
      api.velocity.set(direction[0] * velocity, direction[1] * velocity, direction[2] * velocity);
      wasStopped.current = false;
    }

    if (Date.now() - startTime.current > 2000) onFinish();
  });

  const baseColor = isAwakened ? "#a855f7" : "#00ffff"; // Purple if awakened
  return (
    <mesh ref={ref as any}>
      <sphereGeometry args={[0.3, 8, 8]} />
      <meshStandardMaterial 
        color={baseColor} 
        emissive={baseColor} 
        emissiveIntensity={10} 
        transparent 
        opacity={0.9}
      />
      <mesh scale={[1, 1, 3]} rotation={[Math.PI / 2, 0, 0]}>
        <sphereGeometry args={[0.2, 4, 4]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={5} transparent opacity={0.5} />
      </mesh>
    </mesh>
  );
};



export const WindEffect = ({ position, onFinish, isAwakened = false }: { position: [number, number, number], onFinish: () => void, isAwakened?: boolean }) => {
  const ref = useRef<THREE.Group>(null);
  const [opacity, setOpacity] = useState(1);
  const [isYinYang] = useState(() => Math.random() < 0.1);

  useFrame((state, delta) => {
    if ((window as any).isTimeStopped) return;
    if (ref.current) {
      ref.current.scale.addScalar(delta * 10);
      ref.current.rotation.y += delta * 4;
      if (isYinYang) {
        ref.current.rotation.x += delta * 2;
        // Periodic "pulses" of damage for Yin-Yang
        if (state.clock.elapsedTime % 0.5 < 0.1) {
          const event = new CustomEvent('yinYangExplode', { 
            detail: { pos: position, radius: 4 } 
          });
          window.dispatchEvent(event);
        }
      }
      setOpacity(prev => Math.max(0, prev - delta * 2));
    }
    if (opacity <= 0) onFinish();
  });

  return (
    <group ref={ref} position={position}>
      {!isYinYang ? (
        <>
          {/* Dense Blue/White Core Sphere */}
          <mesh>
            <sphereGeometry args={[0.5, 32, 32]} />
            <meshStandardMaterial 
              color="#0ea5e9" 
              transparent 
              opacity={opacity * 0.8} 
              emissive="#38bdf8" 
              emissiveIntensity={2} 
            />
          </mesh>
          <mesh scale={0.7}>
            <sphereGeometry args={[0.5, 32, 32]} />
            <meshStandardMaterial 
              color="#ffffff" 
              transparent 
              opacity={opacity * 0.6} 
              emissive="#ffffff" 
              emissiveIntensity={5} 
            />
          </mesh>
          
          {/* Outer Atmosphere */}
          <mesh scale={1.2}>
            <sphereGeometry args={[0.5, 16, 16]} />
            <meshStandardMaterial 
              color="#bae6fd" 
              transparent 
              opacity={opacity * 0.3} 
              wireframe
            />
          </mesh>
        </>
      ) : (
        <group>
          {/* Yin-Yang Style Wind Burst */}
          {/* Black Side (Yin) */}
          <group position={[0.2, 0, 0]}>
            <mesh>
              <sphereGeometry args={[0.4, 32, 32]} />
              <meshStandardMaterial color="#000000" transparent opacity={opacity} />
            </mesh>
            <mesh position={[0, 0, 0.41]}>
              <sphereGeometry args={[0.1, 16, 16]} />
              <meshStandardMaterial color="#ffffff" transparent opacity={opacity} emissive="#ffffff" />
            </mesh>
          </group>
          {/* White Side (Yang) */}
          <group position={[-0.2, 0, 0]}>
            <mesh>
              <sphereGeometry args={[0.4, 32, 32]} />
              <meshStandardMaterial color="#ffffff" transparent opacity={opacity} emissive="#ffffff" emissiveIntensity={1} />
            </mesh>
            <mesh position={[0, 0, 0.41]}>
              <sphereGeometry args={[0.1, 16, 16]} />
              <meshStandardMaterial color="#000000" transparent opacity={opacity} />
            </mesh>
          </group>
          {/* Rotating Ring */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.6, 0.05, 16, 32]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={opacity * 0.5} emissive="#ffffff" />
          </mesh>
        </group>
      )}
    </group>
  );
};



export const Explosion = ({ position, onFinish, isAwakened = false }: { position: [number, number, number], onFinish: () => void, isAwakened?: boolean }) => {
  const ref = useRef<THREE.Mesh>(null);
  const [scale, setScale] = useState(0.1);
  const [opacity, setOpacity] = useState(1);

  useFrame((state, delta) => {
    if ((window as any).isTimeStopped) return;
    setScale(prev => prev + delta * 30);
    setOpacity(prev => Math.max(0, prev - delta * 2));
    if (opacity <= 0) onFinish();
  });

  return (
    <mesh ref={ref} position={position} scale={scale}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshStandardMaterial 
        color="#ff8800" 
        emissive="#ff4400" 
        emissiveIntensity={10} 
        transparent 
        opacity={opacity * 0.8}
      />
      <pointLight color="#ff4400" intensity={energyIntensity(opacity)} distance={20} />
    </mesh>
  );
};

const energyIntensity = (opacity: number) => opacity * 50;

export const Dagger = ({ position, direction, onFinish, isAwakened = false }: { 
  position: [number, number, number], 
  direction: [number, number, number],
  onFinish: (hitPos: [number, number, number]) => void,
  isAwakened?: boolean
}) => {
  const currentPos = useRef(position);
  const [ref, api] = useSphere(() => ({
    mass: 0.8,
    args: [0.15],
    position,
    onCollide: (e) => {
      onFinish(currentPos.current);
    }
  }));

  useEffect(() => {
    const unsub = api.position.subscribe(p => currentPos.current = p);
    return () => unsub();
  }, [api.position]);

  const startTime = useRef(Date.now());
  const velocity = 70;
  const wasStopped = useRef(false);

  useEffect(() => {
    api.velocity.set(direction[0] * velocity, direction[1] * velocity, direction[2] * velocity);
  }, [api, direction]);

  // Orientation logic: Align with velocity direction
  const rotationRef = useRef<[number, number, number]>([0, 0, 0]);
  useEffect(() => {
    const dirVec = new THREE.Vector3(...direction).normalize();
    const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dirVec);
    const euler = new THREE.Euler().setFromQuaternion(quaternion);
    rotationRef.current = [euler.x, euler.y, euler.z];
  }, [direction]);

  useFrame((state, delta) => {
    if ((window as any).isTimeStopped) {
      api.velocity.set(0, 0, 0);
      wasStopped.current = true;
      return;
    }

    if (wasStopped.current) {
      api.velocity.set(direction[0] * velocity, direction[1] * velocity, direction[2] * velocity);
      wasStopped.current = false;
    }

    if (Date.now() - startTime.current > 2000) onFinish(currentPos.current);
  });

  const baseColor = isAwakened ? "#c084fc" : "#cbd5e1";
  const darkColor = isAwakened ? "#581c87" : "#94a3b8";

  return (
    <mesh ref={ref as any} rotation={rotationRef.current}>
      {isAwakened && (
        <pointLight color="#a855f7" intensity={5} distance={10} />
      )}
      <group rotation={[0, 0, 0]}>
        {/* Blade - Kunai Style */}
        <group position={[0, 0.25, 0]}>
          {/* Tip */}
          <mesh position={[0, 0.25, 0]}>
            <coneGeometry args={[0.12, 0.45, 4]} />
            <meshStandardMaterial color={baseColor} emissive={isAwakened ? "#7e22ce" : "#000000"} metalness={1} roughness={0.3} />
          </mesh>
          {/* Central spine */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.04, 0.5, 0.04]} />
            <meshStandardMaterial color={darkColor} metalness={1} roughness={0.4} />
          </mesh>
          {/* Outer cutting edges with cutout look */}
          <mesh position={[0.1, 0, 0]}>
            <boxGeometry args={[0.06, 0.4, 0.02]} />
            <meshStandardMaterial color={baseColor} emissive={isAwakened ? "#7e22ce" : "#000000"} metalness={1} roughness={0.2} />
          </mesh>
          <mesh position={[-0.1, 0, 0]}>
            <boxGeometry args={[0.06, 0.4, 0.02]} />
            <meshStandardMaterial color={baseColor} emissive={isAwakened ? "#7e22ce" : "#000000"} metalness={1} roughness={0.2} />
          </mesh>
          {/* Connection base */}
          <mesh position={[0, -0.2, 0]}>
            <boxGeometry args={[0.26, 0.08, 0.03]} />
            <meshStandardMaterial color="#475569" metalness={1} />
          </mesh>
        </group>

        {/* Ring Guard (Centered and properly oriented) */}
        <mesh position={[0, -0.12, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.1, 0.03, 16, 32]} />
          <meshStandardMaterial color="#334155" metalness={1} roughness={0.5} />
        </mesh>

        {/* Handle with detailed wraps */}
        <group position={[0, -0.35, 0]}>
          <mesh>
            <cylinderGeometry args={[0.05, 0.05, 0.4, 16]} />
            <meshStandardMaterial color="#2d1a0a" roughness={1} />
          </mesh>
          {/* Detailed Wraps - Fixed rotation for non-flipped look */}
          {[-0.15, -0.05, 0.05, 0.15].map((y, i) => (
            <mesh key={i} position={[0, y, 0]} rotation={[-0.4, 0, -0.2]}>
              <torusGeometry args={[0.055, 0.015, 8, 20]} />
              <meshStandardMaterial color="#1a0a05" roughness={0.8} />
            </mesh>
          ))}
        </group>
      </group>
    </mesh>
  );
};

export const Bomb = ({ position, direction, onExplode, isAwakened = false }: { 
  position: [number, number, number], 
  direction: [number, number, number],
  onExplode: (pos: [number, number, number]) => void,
  isAwakened?: boolean
}) => {
  const hasExploded = useRef(false);
  const currentPos = useRef(position);
  const [ref, api] = useSphere(() => ({
    mass: 50, // Increased mass (was 20)
    args: [0.4],
    position,
    onCollide: (e) => {
      // Explode on collision if it hasn't exploded yet
      if (!hasExploded.current) {
        hasExploded.current = true;
        onExplode(currentPos.current);
      }
    }
  }));

  const wasStopped = useRef(false);

  useFrame((state, delta) => {
    if ((window as any).isTimeStopped) {
      api.velocity.set(0, 0, 0);
      wasStopped.current = true;
      return;
    }

    if (wasStopped.current) {
      const lobVelocity = 1.2; 
      const upwardForce = 0.7; 
      api.velocity.set(
        direction[0] * lobVelocity, 
        upwardForce + (direction[1] * lobVelocity * 0.4), 
        direction[2] * lobVelocity
      );
      wasStopped.current = false;
    }
    
    // Simulate 25x gravity by applying a downward force
    // Default gravity is -9.81. To make it -245.25 (25x), we need additional downward acceleration of -235.44.
    api.applyForce([0, -11772, 0], [0, 0, 0]);
  });

  useEffect(() => {
    const unsub = api.position.subscribe(p => currentPos.current = p);
    
    // Balanced lob force - Reduced by 10x
    const lobVelocity = 1.2; 
    const upwardForce = 0.7; 
    api.velocity.set(
      direction[0] * lobVelocity, 
      upwardForce + (direction[1] * lobVelocity * 0.4), 
      direction[2] * lobVelocity
    );
    
    // Explode after 2 seconds if no collision
    const timer = setTimeout(() => {
      if (!hasExploded.current) {
        hasExploded.current = true;
        onExplode(currentPos.current);
      }
    }, 2000);

    return () => {
      unsub();
      clearTimeout(timer);
    };
  }, [api, direction, onExplode]);

  const bodyColor = isAwakened ? "#2e1065" : "#121212";
  const glowColor = isAwakened ? "#d8b4fe" : "#ff0000";
  const fuseColor = isAwakened ? "#a855f7" : "#ffaa00";

  return (
    <mesh ref={ref as any}>
      <sphereGeometry args={[0.4, 24, 24]} />
      <meshStandardMaterial 
        color={bodyColor} 
        metalness={0.8}
        roughness={0.2}
        emissive={glowColor} 
        emissiveIntensity={Math.sin(Date.now() * 0.1) * 3 + 4} 
      />
      {/* Fuse detail */}
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.15, 8]} />
        <meshStandardMaterial color="#444" />
      </mesh>
      <mesh position={[0, 0.55, 0]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color={fuseColor} emissive={fuseColor} emissiveIntensity={10} />
      </mesh>
    </mesh>
  );
};


export const SpiritBombVisual = ({ position, intStat = 0 }: { position: [number, number, number], intStat?: number }) => {
  const ref = useRef<THREE.Mesh>(null);
  const baseScale = 10 * (1 + intStat * 0.05);
  
  useFrame((state, delta) => {
    if ((window as any).isTimeStopped) return;
    if (ref.current) {
      ref.current.rotation.y += 0.05;
      ref.current.rotation.z += 0.02;
      const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.5 + 1;
      ref.current.scale.set(pulse, pulse, pulse);
    }
  });

  return (
    <mesh ref={ref} position={position} scale={baseScale}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial 
        color="#3b82f6" 
        emissive="#3b82f6" 
        emissiveIntensity={20} 
        transparent 
        opacity={0.7} 
      />
      <pointLight color="#3b82f6" intensity={100} distance={50 * (1 + intStat * 0.1)} />
    </mesh>
  );
};

export const WindStorm = ({ position, onFinish, isAwakened = false }: { position: [number, number, number], onFinish: () => void, isAwakened?: boolean }) => {
  const ref = useRef<THREE.Group>(null);
  const [opacity, setOpacity] = useState(1);
  const [scale, setScale] = useState(1);

  useFrame((state, delta) => {
    if ((window as any).isTimeStopped) return;
    if (ref.current) {
      setScale(prev => prev + delta * 20);
      ref.current.rotation.y += delta * 15;
      setOpacity(prev => Math.max(0, prev - delta));
      
      // Damage pulses
      if (state.clock.elapsedTime % 0.2 < 0.05) {
        window.dispatchEvent(new CustomEvent('bombExplode', { 
          detail: { pos: position, radius: scale * 0.8, team: 'player' } 
        }));
      }
    }
    if (opacity <= 0) onFinish();
  });

  return (
    <group ref={ref} position={position}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, i * 0.5, 0]} rotation={[0, (i * Math.PI) / 3, 0]}>
          <torusGeometry args={[scale * 0.5, 0.1, 8, 32]} />
          <meshStandardMaterial color="#0ea5e9" transparent opacity={opacity * 0.5} emissive="#38bdf8" />
        </mesh>
      ))}
      <mesh scale={scale}>
        <sphereGeometry args={[0.5, 8, 8]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={opacity * 0.2} wireframe />
      </mesh>
    </group>
  );
};

export const GiantKatana = ({ position, rotation, onFinish, isAwakened = false }: { 
  position: [number, number, number], 
  rotation: number,
  onFinish: () => void,
  isAwakened?: boolean
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const [progress, setProgress] = useState(0);

  useFrame((state, delta) => {
    if ((window as any).isTimeStopped) return;
    setProgress(prev => Math.min(1, prev + delta * 2)); // Slightly slower swing for weight
    if (groupRef.current) {
      // Swing motion
      groupRef.current.rotation.y = rotation + (progress - 0.5) * Math.PI * 1.5;
      
      // Damage everything in the sweep
      // We emit multiple explosion points along the massive blade
      if (progress > 0.1 && progress < 0.9) {
        [0, -150, -300, -450].forEach((zOffset) => {
          const sweepPos = new THREE.Vector3(0, 0, zOffset);
          sweepPos.applyQuaternion(groupRef.current!.quaternion);
          sweepPos.add(new THREE.Vector3(...position));
          
          window.dispatchEvent(new CustomEvent('bombExplode', { 
            detail: { pos: [sweepPos.x, sweepPos.y, sweepPos.z], radius: 150, damageMultiplier: isAwakened ? 200 : 40 } // Increased radius and added 40x damage multiplier
          }));
        });
      }
    }
    if (progress >= 1) onFinish();
  });

  const baseColor = isAwakened ? "#e879f9" : "#ffffff";
  const glowColor = isAwakened ? "#7e22ce" : "#00ffff";
  const lightColor = isAwakened ? "#a855f7" : "#00ffff";

  return (
    <group ref={groupRef} position={position}>
      <group position={[0, 0, -250]}>
        {/* Massive Blade - 50x scale expansion */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[4, 15, 500]} />
          <meshStandardMaterial 
            color={baseColor} 
            emissive={glowColor} 
            emissiveIntensity={40 * (1 - progress)} 
            transparent 
            opacity={0.9 * (1 - progress)} 
          />
        </mesh>
        {/* Trailing effect */}
        <mesh position={[0, 0, 0]} rotation={[0, 0.05, 0]}>
          <boxGeometry args={[5, 18, 510]} />
          <meshStandardMaterial 
            color={glowColor} 
            transparent 
            opacity={0.4 * (1 - progress)} 
          />
        </mesh>
        {/* Glow Sphere at base */}
        <mesh position={[0, 0, 250]}>
          <sphereGeometry args={[10, 16, 16]} />
          <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={50} />
        </mesh>
      </group>
      <pointLight color={lightColor} intensity={400 * (1 - progress)} distance={400} />
    </group>
  );
};

export const LightningStrike = ({ position, isPowerful, isUltimate, isRainbow, forceColor, onFinish, isAwakened = false }: { 
  position: [number, number, number], 
  isPowerful?: boolean,
  isUltimate?: boolean,
  isRainbow?: boolean,
  forceColor?: string,
  onFinish: () => void,
  isAwakened?: boolean
}) => {
  const [opacity, setOpacity] = useState(1);
  const ref = useRef<THREE.Group>(null);
  const rainbowColor = useMemo(() => new THREE.Color(), []);

  useFrame((state, delta) => {
    setOpacity(prev => Math.max(0, prev - (isUltimate ? delta * 0.8 : (isPowerful ? delta * 1.5 : delta * 4))));
    
    if ((isRainbow || forceColor) && ref.current) {
      if (isRainbow) {
        const hue = (state.clock.elapsedTime * 2) % 1;
        rainbowColor.setHSL(hue, 1, 0.5);
      } else if (forceColor) {
        rainbowColor.set(forceColor);
      }
      
      // Find meshes and lines to update their color
      ref.current.traverse((child) => {
        if ((child as any).material) {
          (child as any).material.color.copy(rainbowColor);
          if ((child as any).material.emissive) (child as any).material.emissive.copy(rainbowColor);
        }
      });
    }

    if (opacity <= 0) onFinish();
  });

  const points = useMemo(() => {
    const pts = [];
    let curX = 0;
    let curZ = 0;
    const height = isUltimate ? 50 : 30;
    const segments = isUltimate ? 20 : (isPowerful ? 15 : 10);
    const spread = isUltimate ? 4 : (isPowerful ? 2.5 : 1.5);
    
    for (let i = segments; i >= 0; i--) {
      const y = (i / segments) * height;
      pts.push(new THREE.Vector3(curX + (Math.random() - 0.5) * spread, y, curZ + (Math.random() - 0.5) * spread));
      curX += (Math.random() - 0.5) * spread;
      curZ += (Math.random() - 0.5) * spread;
    }
    return pts;
  }, [isPowerful, isUltimate]);

  const lineGeometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);
  const defaultColor = useMemo(() => isUltimate ? "#ffffff" : (isPowerful ? "#facc15" : "#4ade80"), [isPowerful, isUltimate]);
  const lineMaterial = useMemo(() => new THREE.LineBasicMaterial({
    color: defaultColor,
    transparent: true,
    opacity: opacity,
  }), [defaultColor, opacity]);

  const line = useMemo(() => new THREE.Line(lineGeometry, lineMaterial), [lineGeometry, lineMaterial]);

  return (
    <group position={position} ref={ref}>
      <primitive object={line} />
      {/* Glow effect */}
      <mesh position={[0, isUltimate ? 25 : 15, 0]}>
        <cylinderGeometry args={[isUltimate ? 2 : (isPowerful ? 1 : 0.2), isUltimate ? 4 : (isPowerful ? 2 : 0.4), isUltimate ? 50 : 30, 8]} />
        <meshStandardMaterial 
          color={defaultColor} 
          emissive={defaultColor} 
          emissiveIntensity={isUltimate ? 50 * opacity : (isPowerful ? 30 * opacity : 10 * opacity)} 
          transparent opacity={opacity * 0.4} 
        />
      </mesh>
      {/* Impact point */}
      <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.1, isUltimate ? 15 : (isPowerful ? 8 : 2), 32]} />
        <meshStandardMaterial color={defaultColor} transparent opacity={opacity * 0.7} />
      </mesh>
      <pointLight 
        color={defaultColor} 
        intensity={isUltimate ? 300 * opacity : (isPowerful ? 100 * opacity : 20 * opacity)} 
        distance={isUltimate ? 100 : (isPowerful ? 40 : 15)} 
      />
    </group>
  );
};

export const SniperBullet = ({ position, direction, onFinish, isAwakened = false }: { 
  position: [number, number, number], 
  direction: [number, number, number],
  onFinish: (hitPos: [number, number, number], hitSomething: boolean, isFinal: boolean) => void,
  isAwakened?: boolean
}) => {
  const currentPos = useRef(position);
  const isDead = useRef(false);
  const ricochetsRemaining = useRef(3); // Bullet can bounce 3 times
  const velocity = useRef(400);
  const [target, setTarget] = useState<[number, number, number] | null>(null);

  const [ref, api] = useSphere(() => ({
    mass: 0.1,
    args: [0.05],
    position,
    userData: { type: 'bullet' },
    onCollide: (e) => {
      if (isDead.current) return;
      
      const slimes = (window as any).slimes as Map<string, [number, number, number]>;
      let nextTarget: [number, number, number] | null = null;

      if (ricochetsRemaining.current > 0 && slimes && slimes.size > 0) {
        let minDoc = Infinity;
        slimes.forEach((p) => {
          const d = Math.sqrt(
            Math.pow(p[0] - currentPos.current[0], 2) +
            Math.pow(p[1] - currentPos.current[1], 2) +
            Math.pow(p[2] - currentPos.current[2], 2)
          );
          if (d > 0.5 && d < minDoc) {
            minDoc = d;
            nextTarget = p;
          }
        });
      }

      const isFinal = !nextTarget;
      onFinish(currentPos.current, true, isFinal);

      if (nextTarget) {
        ricochetsRemaining.current--;
        setTarget(nextTarget);
        velocity.current = 350;
        return;
      }
      
      isDead.current = true;
    }
  }));

  useEffect(() => {
    const unsub = api.position.subscribe(p => currentPos.current = p);
    return () => unsub();
  }, [api.position]);

  const startTime = useRef(Date.now());
  const wasStopped = useRef(false);

  useEffect(() => {
    if (!target) {
      api.velocity.set(direction[0] * velocity.current, direction[1] * velocity.current, direction[2] * velocity.current);
    }
  }, [api, direction, target]);

  useFrame((state, delta) => {
    if ((window as any).isTimeStopped) {
      api.velocity.set(0, 0, 0);
      wasStopped.current = true;
      return;
    }

    if (wasStopped.current) {
      if (target) {
        const dir = new THREE.Vector3(
          target[0] - currentPos.current[0],
          target[1] - currentPos.current[1],
          target[2] - currentPos.current[2]
        ).normalize();
        api.velocity.set(dir.x * velocity.current, dir.y * velocity.current, dir.z * velocity.current);
      } else {
        api.velocity.set(direction[0] * velocity.current, direction[1] * velocity.current, direction[2] * velocity.current);
      }
      wasStopped.current = false;
    }
    
    if (isDead.current) return;

    if (target) {
      const dir = new THREE.Vector3(
        target[0] - currentPos.current[0],
        target[1] - currentPos.current[1],
        target[2] - currentPos.current[2]
      ).normalize();
      
      api.velocity.set(dir.x * velocity.current, dir.y * velocity.current, dir.z * velocity.current);
    }

    if (Date.now() - startTime.current > 2000) {
       isDead.current = true;
       onFinish(currentPos.current, false, true);
    }
  });

  const dirVec = useMemo(() => new THREE.Vector3(...direction).normalize(), [direction]);
  const initialQuaternion = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dirVec), [dirVec]);

  const coreColor = isAwakened ? "#e879f9" : "#ff3333";
  const glowColor = isAwakened ? "#a855f7" : "#ff0000";
  const trailColor = isAwakened ? "#7e22ce" : "#ff4444";

  return (
    <group ref={ref as any}>
      <mesh quaternion={initialQuaternion}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color={coreColor} emissive={glowColor} emissiveIntensity={100} />
      </mesh>
      <mesh quaternion={initialQuaternion} position={[0, -1.5, 0]}>
        <cylinderGeometry args={[0.005, 0.02, 3, 4]} />
        <meshBasicMaterial color={trailColor} transparent opacity={0.8} />
      </mesh>
    </group>
  );
};

export const SlashEffect = ({ position, rotation, opacity }: { 
  position: [number, number, number], 
  rotation: [number, number, number], 
  opacity: number 
}) => {
  const [scale, setScale] = useState(0.1);
  const [life, setLife] = useState(1);
  
  useFrame((state, delta) => {
    if ((window as any).isTimeStopped) return;
    setScale(prev => prev + delta * 20);
    setLife(prev => Math.max(0, prev - delta * 5));
  });

  if (life <= 0) return null;

  return (
    <mesh position={position} rotation={rotation} scale={scale}>
      <torusGeometry args={[1.5, 0.05, 4, 16, Math.PI]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={opacity * life * 0.8} />
    </mesh>
  );
};

export const GroundFire = ({ position }: { position: [number, number, number] }) => {
  const [life, setLife] = useState(2.5);
  
  useFrame((state, delta) => {
    if ((window as any).isTimeStopped) return;
    setLife(prev => Math.max(0, prev - delta));
  });

  if (life <= 0) return null;

  return (
    <group position={position}>
      {[...Array(2)].map((_, i) => (
        <mesh key={i} position={[(Math.random()-0.5)*0.8, Math.random()*0.4, (Math.random()-0.5)*0.8]}>
          <boxGeometry args={[0.4, 0.4, 0.4]} />
          <meshBasicMaterial color={i % 2 === 0 ? "#ff4400" : "#ff0000"} transparent opacity={life * 0.4} />
        </mesh>
      ))}
    </group>
  );
};

export const FireArrow = ({ position, direction, team = 'player', isAwakened = false }: { position: [number, number, number], direction: [number, number, number], team?: 'player' | 'enemy', isAwakened?: boolean }) => {
  const meshRef = useRef<THREE.Group>(null);
  const [life, setLife] = useState(4);
  const [isLaunched, setIsLaunched] = useState(false);
  const [fires, setFires] = useState<{ id: number; pos: [number, number, number] }[]>([]);
  const startTime = useRef(Date.now());
  const velocity = useMemo(() => new THREE.Vector3(...direction).multiplyScalar(45), [direction]);

  useFrame((state, delta) => {
    if ((window as any).isTimeStopped) return;
    const elapsed = (Date.now() - startTime.current) / 1000;

    if (elapsed < 2) {
      if (meshRef.current) {
        meshRef.current.scale.setScalar(1 + Math.sin(elapsed * 25) * 0.15 + elapsed * 0.6);
        meshRef.current.position.set(
          position[0] + (Math.random() - 0.5) * 0.1,
          position[1] + (Math.random() - 0.5) * 0.1,
          position[2] + (Math.random() - 0.5) * 0.1
        );
      }
      return;
    }

    if (!isLaunched) setIsLaunched(true);

    if (meshRef.current) {
      meshRef.current.position.x += velocity.x * delta;
      meshRef.current.position.y += velocity.y * delta;
      meshRef.current.position.z += velocity.z * delta;
      
      const target = meshRef.current.position.clone().add(velocity);
      meshRef.current.lookAt(target);

      // Spawning ground fires less frequently
      if (state.clock.elapsedTime % 0.2 < 0.05) {
        const firePos: [number, number, number] = [meshRef.current.position.x, 0.05, meshRef.current.position.z];
        setFires(prev => [...prev.slice(-10), { id: Math.random(), pos: firePos }]);
        
        const event = new CustomEvent('bombExplode', { 
          detail: { pos: firePos, radius: 6, damageMultiplier: 4, team } 
        });
        window.dispatchEvent(event);
      }
    }
    setLife(prev => prev - delta);
  });

  if (life <= 0) return null;

  const coreColor = isAwakened ? "#a855f7" : "#ffcc00";
  const glowColor = isAwakened ? "#e879f9" : "#ffffff";
  const lightColor = isAwakened ? "#581c87" : "#ff4400";

  return (
    <group>
      <group ref={meshRef} position={position}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.8, 4.0, 8]} />
          <meshBasicMaterial color={coreColor} />
        </mesh>
        <mesh>
          <sphereGeometry args={[1.2, 16, 16]} />
          <meshBasicMaterial color={glowColor} transparent opacity={0.6} />
        </mesh>
        {/* Fewer but larger trail voxels for better performance */}
        {[...Array(8)].map((_, i) => (
          <mesh key={i} position={[0, 0, -0.6 - i * 1.5]}>
            <boxGeometry args={[1.2 - i*0.1, 1.2 - i*0.1, 1.2 - i*0.1]} />
            <meshBasicMaterial color={i < 3 ? glowColor : i < 5 ? coreColor : lightColor} transparent opacity={0.9 - i*0.1} />
          </mesh>
        ))}
        <pointLight color={lightColor} intensity={200} distance={60} />
      </group>
      
      {fires.map(f => (
        <GroundFire key={f.id} position={f.pos} />
      ))}
    </group>
  );
};

export const FloatingSkull = ({ index, opacity }: { index: number, opacity: number }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      const angle = (index * Math.PI / 3);
      const x = Math.cos(angle) * 15;
      const z = Math.sin(angle) * 15;
      const y = 3 + Math.sin(state.clock.elapsedTime * 2 + index) * 3;
      meshRef.current.position.set(x, y, z);
      meshRef.current.rotation.y += 0.01;
      meshRef.current.rotation.x += 0.005;
    }
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1.2, 1.2, 1.2]} />
      <meshStandardMaterial color="#fff" transparent opacity={opacity * 0.9} emissive="#ff3300" />
    </mesh>
  );
};

export const DomainExpansion = ({ position, rotation, onFinish, isAwakened = false }: { 
  position: [number, number, number], 
  rotation: number, 
  onFinish: () => void,
  isAwakened?: boolean
}) => {
  const [opacity, setOpacity] = useState(0);
  const startTime = useRef(Date.now());
  const [slashes, setSlashes] = useState<{ id: number; pos: [number, number, number]; rot: [number, number, number] }[]>([]);

  useFrame((state, delta) => {
    if ((window as any).isTimeStopped) return;
    const elapsed = (Date.now() - startTime.current) / 1000;
    
    if (elapsed < 1.5) {
      setOpacity(elapsed / 1.5);
    } else if (elapsed > 11.5) {
      setOpacity(Math.max(0, (13 - elapsed) / 1.5));
    } else {
      setOpacity(1);
    }

    if (elapsed > 13) {
      onFinish();
      return;
    }

    // High intensity slashes in a smaller 20m radius
    if (elapsed > 1.2 && elapsed < 12.8) {
      if (state.clock.elapsedTime % 0.03 < 0.015) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * 18;
        const x = Math.cos(angle) * dist;
        const z = Math.sin(angle) * dist;
        
        const slashPos: [number, number, number] = [
          position[0] + x, 
          0.2 + Math.random() * 5, 
          position[2] + z
        ];
        
        setSlashes(prev => [...prev.slice(-40), { 
          id: Math.random(), 
          pos: slashPos, 
          rot: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI] 
        }]);

        let damageMult = 25;
        if (isAwakened) {
            damageMult = 125;
        }

        const event = new CustomEvent('bombExplode', { 
          detail: { pos: slashPos, radius: 10, damageMultiplier: damageMult, team: 'player' } 
        });
        window.dispatchEvent(event);
      }
    }
  });

  const VoxelBlock = ({ p, s, c, e, r }: { p: [number, number, number], s: [number, number, number], c: string, e?: string, r?: [number, number, number] }) => (
    <mesh position={p} rotation={r || [0, 0, 0]}>
      <boxGeometry args={s} />
      <meshStandardMaterial 
        color={c} 
        transparent 
        opacity={opacity} 
        emissive={e || c} 
        emissiveIntensity={e ? 0.7 : 0.05} 
      />
    </mesh>
  );

  const themeRed = isAwakened ? "#4c1d95" : "#200000";
  const themeRedEmissive = isAwakened ? "#7e22ce" : "#400";
  const themeBlood = isAwakened ? "#3b0764" : "#300";
  const slashColor = isAwakened ? "#d8b4fe" : "#ffffff";
  const lightColor = isAwakened ? "#8b5cf6" : "#ff0000";

  return (
    <group position={position}>
      {/* High-Density Voxel Shrine (Malevolent Shrine) - Ultra Detail Mode */}
      <group position={[0, 0, 10]} rotation={[0, rotation + Math.PI, 0]} scale={1.3}>
        {/* Layered Foundation steps - Pixel grid pattern */}
        <group position={[0, 0, 0]}>
          <VoxelBlock p={[0, -0.4, 0]} s={[22, 0.4, 14]} c="#050505" />
          <VoxelBlock p={[0, 0, 0]} s={[20, 0.4, 12]} c="#0f0f0f" />
          <VoxelBlock p={[0, 0.4, 0]} s={[18, 0.4, 10]} c="#1a1a1a" />
        </group>
        
        {/* Intricate Rib-like Archways - Smaller dots */}
        {[...Array(8)].map((_, i) => (
          <group key={i}>
            <VoxelBlock p={[8, 1 + i*1.2, 2 - i*0.3]} s={[0.3, 0.3, 3]} c="#222" r={[0, 0.5, 0.1]} />
            <VoxelBlock p={[-8, 1 + i*1.2, 2 - i*0.3]} s={[0.3, 0.3, 3]} c="#222" r={[0, -0.5, -0.1]} />
            <VoxelBlock p={[0, 8 + i*0.3, 3 - i*0.5]} s={[12 - i, 0.2, 0.2]} c={themeBlood} e={themeRedEmissive} />
          </group>
        ))}

        {/* Tormented "Pixel" Trees from the image */}
        <group position={[10, 0, -2]} rotation={[0, -0.4, 0]}>
           {[...Array(20)].map((_, i) => (
             <VoxelBlock key={i} p={[Math.sin(i*0.6)*0.4, i * 0.4, (i%3)*0.1]} s={[0.2, 0.4, 0.2]} c="#111" />
           ))}
           <VoxelBlock p={[1, 6, 0]} s={[2, 0.2, 0.2]} c="#111" r={[0, 0, 0.5]} />
           <VoxelBlock p={[-1, 7, 0]} s={[2, 0.2, 0.2]} c="#111" r={[0, 0, -0.5]} />
        </group>
        <group position={[-10, 0, -2]} rotation={[0, 0.4, 0]}>
           {[...Array(20)].map((_, i) => (
             <VoxelBlock key={i} p={[Math.sin(i*0.6)*-0.4, i * 0.4, (i%3)*0.1]} s={[0.2, 0.4, 0.2]} c="#111" />
           ))}
           <VoxelBlock p={[-1, 6, 0]} s={[2, 0.2, 0.2]} c="#111" r={[0, 0, -0.5]} />
           <VoxelBlock p={[1, 7, 0]} s={[2, 0.2, 0.2]} c="#111" r={[0, 0, 0.5]} />
        </group>

        {/* Main Pillar/Shrine Body */}
        <group position={[0, 4.5, 1]}>
          <VoxelBlock p={[0, 0, 0]} s={[12, 10, 3]} c={themeRed} e={themeRedEmissive} />
          <VoxelBlock p={[0, 0, 1.2]} s={[10, 8, 1]} c="#000" />
          
          {/* Dense Voxel Teeth Grid */}
          {[...Array(24)].map((_, i) => (
            <group key={i}>
              <VoxelBlock p={[-4.8 + i*0.42, 3.4, 2.1]} s={[0.15, 1.2, 0.15]} c="#ffffee" e="#fff" />
              <VoxelBlock p={[-4.8 + i*0.42, -3.4, 2.1]} s={[0.15, 1.2, 0.15]} c="#ffffee" e="#fff" />
            </group>
          ))}
          <VoxelBlock p={[5.5, 0, 2.1]} s={[0.2, 6, 0.2]} c="#fff" />
          <VoxelBlock p={[-5.5, 0, 2.1]} s={[0.2, 6, 0.2]} c="#fff" />
          
          <pointLight position={[0, 0, 1.5]} color={lightColor} intensity={opacity * 80} distance={20} />
        </group>

        {/* Multi-layered Horned Roof (Matching Image) */}
        <group position={[0, 10, 0]}>
          <VoxelBlock p={[0, 0, 0]} s={[18, 0.6, 9]} c="#05051a" />
          <VoxelBlock p={[0, 0.6, 0]} s={[15, 0.4, 7]} c="#0a0a2a" />
          
          {/* Main Curved Spikes (Horns) */}
          {[...Array(30)].map((_, i) => {
            const sideX = 7.5 + i * 0.4;
            const sideY = Math.pow(i * 0.15, 2.2);
            return (
              <group key={i}>
                <VoxelBlock p={[sideX, sideY, 0]} s={[0.3, 0.3, 8]} c="#1a1a3e" e="#224" />
                <VoxelBlock p={[-sideX, sideY, 0]} s={[0.3, 0.3, 8]} c="#1a1a3e" e="#224" />
                {/* Extra spikes pointing up */}
                {i % 5 === 0 && (
                  <>
                    <VoxelBlock p={[sideX, sideY + 1, 2]} s={[0.2, 2, 0.2]} c="#1a1a3e" />
                    <VoxelBlock p={[-sideX, sideY + 1, 2]} s={[0.2, 2, 0.2]} c="#1a1a3e" />
                  </>
                )}
              </group>
            );
          })}
          
          {/* Roof Spire Central Piece */}
          <VoxelBlock p={[0, 1.5, 3]} s={[1, 3, 1]} c="#222" e="#400" />
        </group>

        {/* Dense Floating Remains */}
        {[...Array(12)].map((_, i) => (
          <FloatingSkull key={i} index={i} opacity={opacity} />
        ))}
      </group>

      {/* Domain Barrier Constriction (Smaller & Detailed) */}
      <group rotation={[Math.PI / 2, 0, 0]}>
        {/* Inner Glow Ring */}
        <mesh>
          <ringGeometry args={[17.5, 17.8, 128]} />
          <meshBasicMaterial color="#ff0000" transparent opacity={opacity * 0.4} />
        </mesh>
        {/* Main Boundary Ring */}
        <mesh>
          <ringGeometry args={[18, 18.5, 128]} />
          <meshBasicMaterial color="#ff0000" transparent opacity={opacity * 0.9} />
        </mesh>
        {/* Outer Particle Ring */}
        <mesh>
          <ringGeometry args={[19, 19.1, 64]} />
          <meshBasicMaterial color="#600000" transparent opacity={opacity * 0.3} />
        </mesh>
      </group>
      
      {/* Reflective Dark Blood Pond */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[20, 64]} />
        <meshStandardMaterial 
          color="#100000" 
          transparent 
          opacity={opacity * 0.8} 
          roughness={0} 
          metalness={1} 
          emissive="#200000"
          emissiveIntensity={0.4}
        />
      </mesh>

      <pointLight position={[0, 8, 0]} color="#ff0000" intensity={opacity * 150} distance={60} />
      <ambientLight intensity={opacity * 0.2} />

      {/* Domain Slashes */}
      {slashes.map(s => (
        <SlashEffect key={s.id} position={s.pos} rotation={s.rot} opacity={opacity} />
      ))}
    </group>
  );
};

export const CrackleEffect = ({ position, color, onFinish }: { position: [number, number, number], color: string, onFinish: () => void }) => {
  const [opacity, setOpacity] = useState(1);
  const ref = useRef<THREE.Group>(null);
  
  useFrame((state, delta) => {
    setOpacity(prev => Math.max(0, prev - delta * 1.5));
    if (ref.current) {
      ref.current.scale.x += delta * 1.5;
      ref.current.scale.y += delta * 1.5;
      ref.current.scale.z += delta * 1.5;
    }
    if (opacity <= 0) onFinish();
  });

  const curves = useMemo(() => {
    const arr: THREE.CatmullRomCurve3[] = [];
    for (let j = 0; j < 25; j++) {
      const pts = [];
      const dir = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
      let cur = new THREE.Vector3();
      pts.push(cur.clone());
      for (let i = 0; i < 6; i++) {
        const step = dir.clone().multiplyScalar(0.5 + Math.random() * 0.5);
        const noise = new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).multiplyScalar(0.8);
        cur.add(step).add(noise);
        pts.push(cur.clone());
      }
      arr.push(new THREE.CatmullRomCurve3(pts));
    }
    return arr;
  }, []);

  const particles = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 40; i++) {
      const pos = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(Math.random() * 3);
      const scale = 0.05 + Math.random() * 0.15;
      arr.push({ pos, scale });
    }
    return arr;
  }, []);

  const isBlackFlash = color === 'blackflash';
  const coreColor = isBlackFlash ? "#000000" : color;
  const auraColor = isBlackFlash ? "#ff0033" : color;

  return (
    <group position={position} ref={ref}>
      {curves.map((curve, idx) => (
        <group key={idx}>
          {isBlackFlash && (
            <mesh>
              <tubeGeometry args={[curve, 10, 0.4 + Math.random() * 0.2, 8, false]} />
              <meshBasicMaterial color={auraColor} transparent opacity={opacity * 0.8} blending={THREE.AdditiveBlending} />
            </mesh>
          )}
          <mesh>
            <tubeGeometry args={[curve, 10, 0.2 + Math.random() * 0.15, 8, false]} />
            <meshBasicMaterial color={coreColor} transparent opacity={opacity} />
          </mesh>
        </group>
      ))}

      {particles.map((p, idx) => (
        <group key={'p'+idx} position={p.pos}>
          {isBlackFlash && (
            <mesh scale={[p.scale * 3, p.scale * 3, p.scale * 3]}>
              <sphereGeometry args={[1, 8, 8]} />
              <meshBasicMaterial color={auraColor} transparent opacity={opacity * 0.8} blending={THREE.AdditiveBlending} />
            </mesh>
          )}
          <mesh scale={[p.scale * 1.5, p.scale * 1.5, p.scale * 1.5]}>
            <sphereGeometry args={[1, 8, 8]} />
            <meshBasicMaterial color={coreColor} transparent opacity={opacity} />
          </mesh>
        </group>
      ))}
      <pointLight color={auraColor} intensity={20 * opacity} distance={12} />
    </group>
  );
};

export const RikaSummon = ({ position, rotation, onFinish }: { position: [number, number, number], rotation: number, onFinish: () => void }) => {
  const ref = useRef<THREE.Group>(null);
  const [phase, setPhase] = useState<'appear' | 'charge' | 'fire' | 'fade'>('appear');
  const timer = useRef(0);
  
  useFrame((state, delta) => {
    timer.current += delta;
    if (phase === 'appear') {
      if (timer.current > 0.5) { setPhase('charge'); timer.current = 0; }
    } else if (phase === 'charge') {
      if (timer.current > 0.5) { setPhase('fire'); timer.current = 0; }
    } else if (phase === 'fire') {
       // Continuous damage along the beam
       if (timer.current % 0.1 < delta) { // Faster damage tick
         if (ref.current) {
            for(let i=10; i<=90; i+=20) {
              window.dispatchEvent(new CustomEvent('bombExplode', { 
                detail: { pos: [position[0] + Math.sin(rotation) * i, position[1] + 5, position[2] + Math.cos(rotation) * i], radius: 25, team: 'player', damageMultiplier: 30.0, launchForce: 15 } 
              }));
            }
         }
       }
      if (timer.current > 1.5) { setPhase('fade'); timer.current = 0; }
    } else if (phase === 'fade') {
      if (timer.current > 0.5) { onFinish(); }
    }
  });

  // Voxel parts
  const bodyVoxels = useMemo(() => {
    const list = [];
    for(let y=0; y<6; y++) {
      for(let x=-2; x<=2; x++) {
        for(let z=-1; z<=1; z++) {
          if (Math.abs(x) + Math.abs(z) <= 3) {
             list.push([x*0.4, y*0.4 - 1, z*0.4]);
          }
        }
      }
    }
    return list;
  }, []);

  const headVoxels = useMemo(() => {
    const list = [];
    for(let y=0; y<4; y++) {
      for(let x=-2; x<=2; x++) {
        for(let z=-2; z<=2; z++) {
           if (y === 1 && z === 2 && x >= -1 && x <= 1) continue; // mouth hole
           list.push([x*0.3, y*0.3 + 2, z*0.3]);
        }
      }
    }
    return list;
  }, []);

  const armVoxels = useMemo(() => {
    const list = [];
    for(let y=-4; y<=1; y++) {
      list.push([-1.5, y*0.3, 0.5]);
      list.push([1.5, y*0.3, 0.5]);
    }
    return list;
  }, []);

  return (
    <group position={position} rotation={[0, rotation, 0]} ref={ref}>
      {/* The creature */}
      <group position={[0, 4, -2]} scale={phase === 'appear' ? Math.min(timer.current * 2, 1) : (phase === 'fade' ? Math.max(1 - timer.current * 2, 0) : 1)}>
        
        {/* Voxel Body */}
        {bodyVoxels.map((pos, i) => (
          <mesh key={`body-${i}`} position={[pos[0], pos[1], pos[2]]}>
            <boxGeometry args={[0.4, 0.4, 0.4]} />
            <meshStandardMaterial color="#eeeeee" roughness={1} />
          </mesh>
        ))}

        {/* Voxel Head */}
        {headVoxels.map((pos, i) => (
          <mesh key={`head-${i}`} position={[pos[0], pos[1] + 0.3, pos[2] + 0.5]}>
            <boxGeometry args={[0.3, 0.3, 0.3]} />
            <meshStandardMaterial color="#ffffff" roughness={1} />
          </mesh>
        ))}

        {/* Voxel Arms */}
        {armVoxels.map((pos, i) => (
          <mesh key={`arm-${i}`} position={[pos[0], pos[1], pos[2]]}>
            <boxGeometry args={[0.3, 0.3, 0.3]} />
            <meshStandardMaterial color="#cccccc" roughness={1} />
          </mesh>
        ))}
        
        {/* Charge effect */}
        {phase === 'charge' && (
          <group position={[0, 3, 2]} scale={timer.current * 2}>
            {Array.from({length: 20}).map((_, i) => (
              <mesh key={`charge-${i}`} position={[(Math.random()-0.5)*2, (Math.random()-0.5)*2, (Math.random()-0.5)*2]}>
                <boxGeometry args={[0.5, 0.5, 0.5]} />
                <meshBasicMaterial color="#ff00ff" transparent opacity={0.8} blending={THREE.AdditiveBlending} />
              </mesh>
            ))}
          </group>
        )}
        
        {/* Fire Laser */}
        {phase === 'fire' && (
          <group position={[0, 3, 2]}>
            {/* Core beam made of scaled box */}
            <mesh position={[0, 0, 50]}>
              <boxGeometry args={[10, 10, 100]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
            </mesh>
            {/* Voxel aura */}
            {Array.from({length: 80}).map((_, i) => (
              <mesh key={`beam-${i}`} position={[(Math.random()-0.5)*16, (Math.random()-0.5)*16, Math.random()*100]}>
                <boxGeometry args={[2 + Math.random(), 2 + Math.random(), 2 + Math.random()*5]} />
                <meshBasicMaterial color="#ff00aa" transparent opacity={0.6} blending={THREE.AdditiveBlending} />
              </mesh>
            ))}
            <pointLight color="#ff00ff" intensity={100} distance={100} />
          </group>
        )}
        
        {/* Voxel Tail */}
        {Array.from({length: 10}).map((_, i) => (
          <mesh key={`tail-${i}`} position={[Math.sin(i)*0.5, -2 - i*0.4, -1 - i*0.2]}>
            <boxGeometry args={[0.8 - i*0.05, 0.4, 0.8 - i*0.05]} />
            <meshStandardMaterial color="#222222" />
          </mesh>
        ))}
      </group>
    </group>
  );
};

export const Meteor = ({ position, rotation, onFinish }: { position: [number, number, number], rotation: number, onFinish: () => void }) => {
  const ref = useRef<THREE.Group>(null);
  const timer = useRef(0);
  const targetPos = new THREE.Vector3(position[0] + Math.sin(rotation) * 30, 0, position[2] + Math.cos(rotation) * 30);
  
  useFrame((state, delta) => {
    timer.current += delta;
    
    if (ref.current) {
      if (timer.current < 2) {
        // Falling down
        const progress = timer.current / 2;
        ref.current.position.set(
          targetPos.x,
          100 * (1 - progress),
          targetPos.z
        );
      } else if (timer.current >= 2 && timer.current < 2.1) {
        // Impact
        window.dispatchEvent(new CustomEvent('bombExplode', { 
          detail: { pos: [targetPos.x, targetPos.y, targetPos.z], radius: 40, team: 'player', damageMultiplier: 40.0, launchForce: 50 } 
        }));
        window.dispatchEvent(new CustomEvent('showSystemMessage', { detail: { text: "메테오 스트라이크!!", color: "#ff4400" } }));
        window.dispatchEvent(new CustomEvent('playSound', { detail: { type: 'dash' } })); // Can reuse dash or blackFlash
        timer.current = 2.1; // Ensure we only trigger once
      } else if (timer.current > 4) {
        onFinish();
      }
    }
  });

  return (
    <group ref={ref}>
      {timer.current < 2 && (
        <mesh>
          <sphereGeometry args={[8, 32, 32]} />
          <meshStandardMaterial color="#ff4400" emissive="#ff2200" emissiveIntensity={2} />
          <pointLight color="#ff4400" intensity={100} distance={100} />
          {/* Flame trail */}
          {Array.from({length: 20}).map((_, i) => (
            <mesh key={`trail-${i}`} position={[(Math.random()-0.5)*8, Math.random()*20, (Math.random()-0.5)*8]}>
              <boxGeometry args={[2, 2, 2]} />
              <meshBasicMaterial color={i%2===0?"#ff8800":"#ff2200"} transparent opacity={0.6} blending={THREE.AdditiveBlending} />
            </mesh>
          ))}
        </mesh>
      )}
      {timer.current >= 2 && timer.current < 4 && (
        <group position={[0,0,0]}>
          <mesh scale={[(timer.current-2)*30, (timer.current-2)*10, (timer.current-2)*30]}>
             <sphereGeometry args={[1, 32, 32]} />
             <meshBasicMaterial color="#ff0000" transparent opacity={Math.max(0, 1 - (timer.current-2)/2)} blending={THREE.AdditiveBlending} />
          </mesh>
          <mesh scale={[(timer.current-2)*50, 0.1, (timer.current-2)*50]}>
             <cylinderGeometry args={[1, 1, 1, 32]} />
             <meshBasicMaterial color="#ff8800" transparent opacity={Math.max(0, 1 - (timer.current-2)/2)} blending={THREE.AdditiveBlending} />
          </mesh>
        </group>
      )}
    </group>
  );
};

export const QuickSlash = ({ position, rotation, onFinish, team = 'player', isAwakened = false }: { position: [number, number, number], rotation: number, onFinish: () => void, team?: 'player' | 'enemy', isAwakened?: boolean }) => {

  const innerRef = useRef<THREE.Group>(null);
  const timer = useRef(0);
  const [slashes, setSlashes] = useState<{ id: number, angle: number, offset: [number, number, number], timeOffset: number }[]>([]);

  useEffect(() => {
    const newSlashes = [];
    for(let i=0; i<40; i++) {
       newSlashes.push({
          id: i,
          angle: (Math.random() - 0.5) * Math.PI,
          offset: [(Math.random() - 0.5) * 25, Math.random() * 8, (Math.random() - 0.5) * 10], // Wide spread
          timeOffset: Math.random() * 0.8 // Random spawn time
       });
    }
    setSlashes(newSlashes);
  }, []);
  
  useFrame((state, delta) => {
    const prevTimer = timer.current;
    timer.current += delta;
    
    const speed = 60; // Units per second forward
    
    if (innerRef.current) {
      innerRef.current.position.z += speed * delta;
    }
    
    const damageTicks = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8];
    for (const tick of damageTicks) {
      if (prevTimer < tick && timer.current >= tick) {
         if (innerRef.current) {
            const currentZ = innerRef.current.position.z;
            window.dispatchEvent(new CustomEvent('bombExplode', { 
              detail: { 
                pos: [position[0] + Math.sin(rotation) * currentZ, position[1] + 2, position[2] + Math.cos(rotation) * currentZ], 
                radius: 20, 
                team, 
                damageMultiplier: 20.0, 
                launchForce: 10 
              } 
            }));
            window.dispatchEvent(new CustomEvent('playSound', { detail: { type: 'dash' } }));
         }
      }
    }

    if (timer.current > 1.0) {
      onFinish();
    }
  });

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <group ref={innerRef}>
        {slashes.map(slash => {
           const t = timer.current - slash.timeOffset;
           const active = t > 0 && t < 0.15;
           if (!active) return null;
           
           return (
             <mesh key={slash.id} position={slash.offset} rotation={[Math.PI/2, 0, slash.angle]} scale={[1, 1, Math.sin(t / 0.15 * Math.PI) * 120]}>
               <cylinderGeometry args={[0.05, 0.05, 1]} />
               <meshBasicMaterial color={isAwakened ? "#a855f7" : "#aaffff"} transparent opacity={Math.sin(t / 0.15 * Math.PI)} blending={THREE.AdditiveBlending} />
             </mesh>
           )
        })}
        
        {/* Main flying crescent/wave */}
        <group position={[0, 2, 0]}>
          <mesh position={[0, 0, 0]} scale={[30, 0.5, 2]}>
             <boxGeometry args={[1, 1, 1]} />
             <meshBasicMaterial color={isAwakened ? "#3b0764" : "#00ffff"} transparent opacity={Math.max(0, 1 - timer.current)} blending={THREE.AdditiveBlending} />
          </mesh>
          <mesh position={[0, 0, -1]} scale={[25, 2, 1]}>
             <boxGeometry args={[1, 1, 1]} />
             <meshBasicMaterial color={isAwakened ? "#a855f7" : "#ffffff"} transparent opacity={Math.max(0, 1 - timer.current)} blending={THREE.AdditiveBlending} />
          </mesh>
        </group>
        
        {/* Particles trailing behind */}
        {Array.from({length: 40}).map((_, i) => (
          <mesh key={`spark-${i}`} position={[(Math.random()-0.5)*30, 1+(Math.random()-0.5)*8, -Math.random()*20]}>
            <boxGeometry args={[0.2, 0.1, 3]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={Math.max(0, 1 - timer.current)} />
          </mesh>
        ))}
        <pointLight color="#00ffff" intensity={40} distance={40} />
      </group>
    </group>
  );
};

export const Planet = ({ position, rotation, onFinish }: { position: [number, number, number], rotation: number, onFinish: () => void }) => {
  const ref = useRef<THREE.Group>(null);
  const timer = useRef(0);
  const targetPos = new THREE.Vector3(position[0] + Math.sin(rotation) * 40, 0, position[2] + Math.cos(rotation) * 40);
  
  useFrame((state, delta) => {
    timer.current += delta;
    
    if (ref.current) {
      if (timer.current < 3) {
        // Slow massive fall
        const progress = timer.current / 3;
        ref.current.position.set(
          targetPos.x,
          150 * (1 - Math.pow(progress, 2)), // Accelerate towards end
          targetPos.z
        );
        ref.current.rotation.y += delta * 0.5;
        ref.current.rotation.z += delta * 0.2;
      } else if (timer.current >= 3 && timer.current < 3.1) {
        // Epic Impact
        window.dispatchEvent(new CustomEvent('bombExplode', { 
          detail: { pos: [targetPos.x, targetPos.y, targetPos.z], radius: 100, team: 'player', damageMultiplier: 100.0, launchForce: 150 } 
        }));
        window.dispatchEvent(new CustomEvent('cameraShake', { detail: { intensity: 5.0, duration: 1.0 } }));
      } else if (timer.current > 4) {
        onFinish();
      }
    }
  });

  return (
    <group ref={ref} position={[position[0], 150, position[2]]}>
      {/* Massive Planet Core */}
      <mesh>
        <sphereGeometry args={[20, 64, 64]} />
        <meshStandardMaterial color="#facc15" emissive="#ca8a04" emissiveIntensity={0.5} wireframe={false} />
      </mesh>
      {/* Atmosphere / Gravity Ring */}
      <mesh rotation={[Math.PI/2.5, 0, 0]}>
        <torusGeometry args={[30, 2, 32, 100]} />
        <meshBasicMaterial color="#8800ff" transparent opacity={0.8} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh rotation={[Math.PI/2.5 + 0.5, 0.5, 0]}>
        <torusGeometry args={[35, 0.5, 16, 100]} />
        <meshBasicMaterial color="#ff00ff" transparent opacity={0.6} blending={THREE.AdditiveBlending} />
      </mesh>
      {/* Trailing energy */}
      <mesh position={[0, 30, 0]}>
        <cylinderGeometry args={[20, 5, 80, 32]} />
        <meshBasicMaterial color="#ca8a04" transparent opacity={0.3} blending={THREE.AdditiveBlending} />
      </mesh>
      <pointLight color="#facc15" intensity={100} distance={200} />
    </group>
  );
};

export const Blackhole = ({ position, onFinish }: { position: [number, number, number], onFinish: () => void }) => {
  const ref = useRef<THREE.Group>(null);
  const timer = useRef(0);
  const diskRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    timer.current += delta;
    if (timer.current > 5) {
      if (timer.current > 5.5) onFinish();
      return;
    }

    if (ref.current) {
      const scale = Math.min(1, timer.current * 2) * (1 - Math.max(0, (timer.current - 4) * 2));
      ref.current.scale.set(scale, scale, scale);

      if (diskRef.current) {
        diskRef.current.rotation.y += delta * 2;
        diskRef.current.rotation.x = Math.sin(timer.current) * 0.2;
      }
      
      if (particlesRef.current) {
        particlesRef.current.rotation.y -= delta;
      }

      // Damage and pull
      if (timer.current % 0.2 < delta) { // every ~0.2s
        window.dispatchEvent(new CustomEvent('bombExplode', { 
          detail: { pos: position, radius: 35, team: 'player', damageMultiplier: 3.0, launchForce: -30 } // negative launchForce pulls them in
        }));
      }
    }
  });

  return (
    <group ref={ref} position={position}>
      {/* Event Horizon */}
      <mesh>
        <sphereGeometry args={[4, 32, 32]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      
      {/* Accretion Disk */}
      <mesh ref={diskRef} rotation={[Math.PI / 4, 0, 0]}>
        <torusGeometry args={[6, 1, 16, 64]} />
        <meshBasicMaterial color="#8800ff" transparent opacity={0.6} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh rotation={[Math.PI / 4 + 0.1, 0.5, 0]}>
        <torusGeometry args={[7, 0.2, 16, 64]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.8} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* Orbiting particles */}
      <group ref={particlesRef}>
        {Array.from({length: 40}).map((_, i) => {
          const r = 8 + Math.random() * 10;
          const theta = Math.random() * Math.PI * 2;
          const y = (Math.random() - 0.5) * 4;
          return (
            <mesh key={`p-${i}`} position={[r * Math.cos(theta), y, r * Math.sin(theta)]}>
              <boxGeometry args={[0.2, 0.2, Math.random() * 2]} />
              <meshBasicMaterial color="#ff00ff" transparent opacity={0.5} blending={THREE.AdditiveBlending} />
            </mesh>
          )
        })}
      </group>

      {/* Lighting effect pulling everything inwards */}
      <pointLight color="#8800ff" intensity={200} distance={40} />
    </group>
  );
};

export const CockroachSwarm = ({ position, rotation, amount, onFinish }: { position: [number, number, number], rotation: number, amount: number, onFinish: () => void }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const timer = useRef(0);
  const duration = 10;
  const { camera } = useThree();
  
  const swarmCenter = useRef(new THREE.Vector3(...position));
  const dummy = new THREE.Object3D();

  // Base configuration for cockroaches
  const instances = useMemo(() => Array.from({ length: amount }).map(() => {
    return {
      radius: 0.5 + Math.random() * 8, // Tornado radius
      angle: Math.random() * Math.PI * 2,
      orbitSpeed: (5 + Math.random() * 10) * (Math.random() > 0.5 ? 1 : -1),
      forwardOffset: (Math.random() - 0.5) * 10, // Spread along the moving axis
      wobbleSpeed: 10 + Math.random() * 20,
      wobbleSize: 0.3 + Math.random() * 0.5
    };
  }), [amount]);

  useFrame((state, delta) => {
    timer.current += delta;
    if (timer.current > duration) {
      onFinish();
      return;
    }

    const camDir = new THREE.Vector3();
    camera.getWorldDirection(camDir);
    camDir.normalize();

    // Move swarm center
    const speed = 25;
    swarmCenter.current.add(camDir.clone().multiplyScalar(speed * delta));

    // Calculate orthogonal vectors to camDir for the tornado's rotation
    const up = new THREE.Vector3(0, 1, 0);
    let right = new THREE.Vector3().crossVectors(camDir, up).normalize();
    if (right.lengthSq() < 0.01) {
      right = new THREE.Vector3(1, 0, 0); // fallback if looking straight up/down
    }
    const localUp = new THREE.Vector3().crossVectors(right, camDir).normalize();

    if (meshRef.current) {
      instances.forEach((inst, i) => {
        inst.angle += inst.orbitSpeed * delta;
        const wobble = Math.sin(timer.current * inst.wobbleSpeed) * inst.wobbleSize;
        
        // Calculate position around the axis
        const xOffset = Math.cos(inst.angle + wobble) * inst.radius;
        const yOffset = Math.sin(inst.angle + wobble) * inst.radius;
        
        // Final position
        const posPos = swarmCenter.current.clone()
           .add(camDir.clone().multiplyScalar(inst.forwardOffset))
           .add(right.clone().multiplyScalar(xOffset))
           .add(localUp.clone().multiplyScalar(yOffset));

        dummy.position.copy(posPos);

        dummy.rotation.set(0, 0, 0);
        // Look roughly at where they are going (tangent + forward)
        const tangent = right.clone().multiplyScalar(-Math.sin(inst.angle)).add(localUp.clone().multiplyScalar(Math.cos(inst.angle)));
        dummy.lookAt(posPos.clone().add(camDir).add(tangent.multiplyScalar(0.5)));
        
        // Scale down at the end
        const baseScale = 2.5;
        const scale = timer.current > duration - 1 ? (duration - timer.current) * baseScale : baseScale;
        dummy.scale.set(scale, scale, scale);
        
        dummy.updateMatrix();
        meshRef.current!.setMatrixAt(i, dummy.matrix);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;

      // Damage volume at the swarm center
      if (timer.current % 0.2 < delta) {
        window.dispatchEvent(new CustomEvent('bombExplode', { 
          detail: { pos: [swarmCenter.current.x, swarmCenter.current.y, swarmCenter.current.z], radius: 15, team: 'player', damageMultiplier: 2.0 * (amount / 300), launchForce: 10 } 
        }));
      }
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, amount]} castShadow>
      <capsuleGeometry args={[0.2, 0.4, 4, 8]} />
      <meshStandardMaterial color="#2d1c15" roughness={0.9} />
    </instancedMesh>
  );
};

export const BadBreath = ({ position, rotation, onFinish }: { position: [number, number, number], rotation: number, onFinish: () => void }) => {
  const ref = useRef<THREE.Group>(null);
  const timer = useRef(0);
  const duration = 2.0;

  useFrame((state, delta) => {
    timer.current += delta;
    if (timer.current > duration) {
      // Final Explosion
      window.dispatchEvent(new CustomEvent('bombExplode', { 
        detail: { pos: [ref.current!.position.x, ref.current!.position.y, ref.current!.position.z], radius: 20, team: 'player', damageMultiplier: 15.0 } 
      }));
      onFinish();
      return;
    }

    if (ref.current) {
      // Move breath forward slowly
      ref.current.position.x += Math.sin(rotation) * 10 * delta;
      ref.current.position.z += Math.cos(rotation) * 10 * delta;
      
      ref.current.scale.setScalar(1 + timer.current * 3);

      // Stun/Damage tick
      if (timer.current % 0.2 < delta) {
        window.dispatchEvent(new CustomEvent('bombExplode', { 
          // Small launch force triggers Stun on Slime/Skeleton!
          detail: { pos: [ref.current.position.x, ref.current.position.y, ref.current.position.z], radius: 6 + timer.current * 2, team: 'player', damageMultiplier: 0.1, launchForce: 0.1 } 
        }));
      }
    }
  });

  return (
    <group ref={ref} position={position}>
      {/* Green Gas Cloud / Breath */}
      <mesh>
        <sphereGeometry args={[1.5, 16, 16]} />
        <meshStandardMaterial color="#22c55e" transparent opacity={0.6} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={i} position={[(Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2]}>
          <sphereGeometry args={[0.8 + Math.random()]} />
          <meshStandardMaterial color="#4ade80" transparent opacity={0.4} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      ))}
      <pointLight color="#22c55e" intensity={10} distance={20} />
    </group>
  );
};


export const UnitedStatesOfSmash = ({ position, rotation, onFinish }: { position: [number, number, number], rotation: number, onFinish: () => void }) => {
  const ref = useRef<THREE.Group>(null);
  const timer = useRef(0);
  
  useFrame((state, delta) => {
    timer.current += delta;
    
    if (ref.current) {
      if (timer.current < 1) {
        // Prepare/Charge up
        ref.current.scale.setScalar(timer.current * 2);
      } else if (timer.current >= 1 && timer.current < 1.1) {
        // SMASH!
        window.dispatchEvent(new CustomEvent('bombExplode', { 
          detail: { pos: [position[0], 0, position[2]], radius: 40, team: 'player', damageMultiplier: 200.0, launchForce: 250 } 
        }));
        window.dispatchEvent(new CustomEvent('cameraShake', { detail: { intensity: 10.0, duration: 1.5 } }));
        window.dispatchEvent(new CustomEvent('playSound', { detail: { type: 'bassDrop' } }));
      } else if (timer.current > 3) {
        onFinish();
      }
    }
  });

  return (
    <group ref={ref} position={position}>
      {/* Tiny twinkling stars / lights from the smash impact */}
      {Array.from({ length: 40 }).map((_, i) => (
        <mesh key={i} position={[(Math.random() - 0.5) * 30, Math.random() * 40, (Math.random() - 0.5) * 30]}>
          <sphereGeometry args={[0.3 + Math.random() * 0.8]} />
          <meshBasicMaterial color={Math.random() > 0.5 ? "#ffffff" : "#fef08a"} transparent opacity={0.5 + Math.random() * 0.5} />
        </mesh>
      ))}
      {/* Massive Tornado & Shockwave Effect */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[15, 2, 16, 100]} />
        <meshBasicMaterial color="#ef4444" transparent opacity={0.8} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[25, 1, 16, 100]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.5} />
      </mesh>
      <mesh position={[0, 20, 0]}>
        <cylinderGeometry args={[20, 0.1, 40, 32]} />
        <meshBasicMaterial color="#ef4444" transparent opacity={0.4} blending={THREE.AdditiveBlending} />
      </mesh>
      <pointLight color="#ef4444" intensity={200} distance={100} />
    </group>
  );
};


export const VoidSymbols = () => {
  const meshRef = useRef<THREE.Group>(null);
  
  const symbols = useMemo(() => {
    const chars = ['%', '*', '+', '=', '-', '1', '0', 'X', 'Y', 'Z'];
    return Array.from({ length: 15 }).map(() => ({
      char: chars[Math.floor(Math.random() * chars.length)],
      pos: [
        (Math.random() - 0.5) * 3,
        (Math.random() - 0.5) * 3 + 1.5,
        (Math.random() - 0.5) * 3
      ],
      speed: Math.random() * 2 + 1
    }));
  }, []);

  useFrame((state, delta) => {
    if (meshRef.current) {
       meshRef.current.rotation.y += delta * 0.5;
       meshRef.current.children.forEach((child, i) => {
         child.position.y += Math.sin(state.clock.elapsedTime * symbols[i].speed) * 0.02;
       });
    }
  });

  return (
    <group ref={meshRef}>
      {symbols.map((sym, i) => (
        <Text key={i} position={sym.pos as any} fontSize={0.5} color="#ffffff" outlineColor="#8822ff" outlineWidth={0.05}>
          {sym.char}
        </Text>
      ))}
    </group>
  );
};

const VoidLines = ({ radius, fadeOpacity }: { radius: number, fadeOpacity: number }) => {
  const linesRef = useRef<THREE.Group>(null);
  const lines = useMemo(() => {
    const colors = ['#ff0000', '#00ff00', '#0000ff'];
    return Array.from({ length: 30 }).map((_, i) => ({
      color: colors[i % 3],
      radius: Math.random() * radius * 0.8 + 10,
      thickness: Math.random() * 0.15 + 0.05,
      rotSpeed: (Math.random() - 0.5) * 2,
      rotation: [Math.PI / 2 + (Math.random() - 0.5) * 0.2, 0, 0] as [number, number, number],
      y: Math.random() * 20 + 10,
    }));
  }, [radius]);
  
  useFrame((state, delta) => {
    if (linesRef.current) {
      linesRef.current.children.forEach((child, i) => {
        child.rotation.z += lines[i].rotSpeed * delta;
      });
    }
  });

  return (
    <group ref={linesRef}>
      {lines.map((line, i) => (
        <mesh key={i} rotation={line.rotation} position={[0, line.y, 0]}>
          <torusGeometry args={[line.radius, line.thickness, 4, 64]} />
          <meshBasicMaterial color={line.color} transparent opacity={0.6 * fadeOpacity} blending={THREE.AdditiveBlending} />
        </mesh>
      ))}
    </group>
  );
};

const VoidSplatter = ({ radius, fadeOpacity }: { radius: number, fadeOpacity: number }) => {
  const count = 3000;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for(let i=0; i<count; i++) {
      const r = Math.random() * radius;
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(Math.random() * 2 - 1);
      pos[i*3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i*3+1] = Math.abs(r * Math.sin(phi) * Math.sin(theta));
      pos[i*3+2] = r * Math.cos(phi);
    }
    return pos;
  }, [radius]);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#ffffff" size={0.2} transparent opacity={0.8 * fadeOpacity} />
    </points>
  );
};

const VoidBlackhole = ({ fadeOpacity }: { fadeOpacity: number }) => {
  const haloRef1 = useRef<THREE.Mesh>(null);
  const haloRef2 = useRef<THREE.Mesh>(null);
  
  useFrame((state, delta) => {
    if (haloRef1.current) haloRef1.current.rotation.z -= delta * 1.5;
    if (haloRef2.current) haloRef2.current.rotation.z += delta * 1;
  });

  return (
    <group position={[0, 15, -15]} rotation={[Math.PI / 6, 0, 0]}>
      <mesh>
        <sphereGeometry args={[8, 32, 32]} />
        <meshBasicMaterial color="#000000" transparent opacity={fadeOpacity} />
      </mesh>
      <mesh ref={haloRef1}>
        <torusGeometry args={[9, 1.5, 16, 100]} />
        <meshBasicMaterial color="#ffffcc" transparent opacity={0.8 * fadeOpacity} blending={THREE.AdditiveBlending}/>
      </mesh>
      <mesh ref={haloRef2}>
        <torusGeometry args={[9.5, 3, 16, 100]} />
        <meshBasicMaterial color="#aaaaff" transparent opacity={0.3 * fadeOpacity} blending={THREE.AdditiveBlending}/>
      </mesh>
    </group>
  );
};

export const UnlimitedVoidEffect = ({ position, onFinish, isAwakened = false }: { position: [number, number, number], onFinish: () => void, isAwakened?: boolean }) => {
  const timer = useRef(0);
  const [radius, setRadius] = useState(0.1);
  const [fadeOpacity, setFadeOpacity] = useState(1);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('unlimitedVoidStart', {
      detail: { pos: position, radius: 40, duration: 5 * 60 } 
    }));
    window.dispatchEvent(new CustomEvent('playSound', { detail: { type: 'magic' } }));
    
    const explosionInterval = setInterval(() => {
      window.dispatchEvent(new CustomEvent('bombExplode', {
        detail: { pos: position, radius: 40, damageMultiplier: 0.1, team: 'player', isUnlimitedVoidDamage: true }
      }));
    }, 200);
    
    return () => clearInterval(explosionInterval);
  }, [position]);

  useFrame((state, delta) => {
    timer.current += delta;
    if (timer.current < 0.5) setRadius(radius + (40 - radius) * delta * 5);
    
    if (timer.current > 4.5 && timer.current <= 5.5) {
      setFadeOpacity(Math.max(0, 1 - (timer.current - 4.5)));
    } else if (timer.current > 5.5) {
      onFinish();
    }
  });

  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[radius, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#050011" transparent opacity={0.8 * fadeOpacity} roughness={0.2} side={THREE.DoubleSide} />
      </mesh>
      <mesh>
        <sphereGeometry args={[radius * 0.99, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#330088" transparent opacity={0.4 * fadeOpacity} wireframe side={THREE.DoubleSide} />
      </mesh>
      
      {radius > 5 && (
        <group scale={radius / 40}>
          <VoidLines radius={40} fadeOpacity={fadeOpacity} />
          <VoidSplatter radius={40} fadeOpacity={fadeOpacity} />
          <VoidBlackhole fadeOpacity={fadeOpacity} />
        </group>
      )}
    </group>
  );
};

export const FreezeFrame2D = ({ width, height, zDepth = 0.5 }: { width: number, height: number, zDepth?: number }) => (
  <group>
    {/* White Border (Backmost) */}
    <mesh position={[0, 0, -zDepth - 0.05]}>
      <planeGeometry args={[width + 0.2, height + 0.2]} />
      <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
    </mesh>
    
    {/* Dark Backdrop (Middle back) */}
    <mesh position={[0, 0, -zDepth]}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial color="#001133" />
    </mesh>

    {/* Glass Front (Frontmost) */}
    <mesh position={[0, 0, zDepth]}>
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial color="#88ccff" transparent opacity={0.3} roughness={0} metalness={0.8} />
    </mesh>
  </group>
);

export const ShatteredGlass = ({ position, onFinish }: { position: [number, number, number], onFinish: () => void }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const timer = useRef(0);
  const amount = 30;

  const instances = useMemo(() => Array.from({ length: amount }).map(() => ({
    velocity: new THREE.Vector3((Math.random() - 0.5) * 15, Math.random() * 15, (Math.random() - 0.5) * 15),
    rotationSpeed: new THREE.Vector3(Math.random() * 5, Math.random() * 5, Math.random() * 5),
    position: new THREE.Vector3(...position),
    rotation: new THREE.Euler(Math.random(), Math.random(), Math.random())
  })), [position]);

  const dummy = new THREE.Object3D();

  useFrame((state, delta) => {
    timer.current += delta;
    if (timer.current > 2.0) {
      onFinish();
      return;
    }
    if (meshRef.current) {
      instances.forEach((inst, i) => {
        inst.position.add(inst.velocity.clone().multiplyScalar(delta));
        inst.velocity.y -= 25 * delta; // gravity
        inst.rotation.x += inst.rotationSpeed.x * delta;
        inst.rotation.y += inst.rotationSpeed.y * delta;
        inst.rotation.z += inst.rotationSpeed.z * delta;

        dummy.position.copy(inst.position);
        dummy.rotation.copy(inst.rotation);
        
        const scale = Math.max(0, 1 - timer.current / 2.0);
        dummy.scale.set(scale, scale, scale);
        
        dummy.updateMatrix();
        meshRef.current!.setMatrixAt(i, dummy.matrix);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, amount]}>
      <octahedronGeometry args={[0.3]} />
      <meshStandardMaterial color="#88ccff" transparent opacity={0.6} roughness={0} metalness={0.9} />
    </instancedMesh>
  );
};


export const TimeCellMoonPalaceEffect = ({ position, onFinish, isAwakened = false }: { position: [number, number, number], onFinish: () => void, isAwakened?: boolean }) => {
  const groupRef = useRef<THREE.Group>(null);
  const [active, setActive] = useState(true);
  const timer = useRef(0);

  const { cells, tendrils } = useMemo(() => {
    // Fleshy cellular structures
    const cellsArr = [];
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const angle2 = Math.random() * Math.PI;
      const r = 8 + Math.random() * 4;
      cellsArr.push({
        pos: [
          Math.cos(angle) * Math.sin(angle2) * r,
          Math.cos(angle2) * r,
          Math.sin(angle) * Math.sin(angle2) * r
        ],
        scale: 1 + Math.random() * 2,
        delay: Math.random() * 2
      });
    }

    // Tendrils dropping down
    const tendrilsArr = [];
    for (let i = 0; i < 15; i++) {
      tendrilsArr.push({
        x: (Math.random() - 0.5) * 40,
        z: (Math.random() - 0.5) * 40,
        scale: 0.5 + Math.random() * 1.5,
        delay: Math.random() * 1.5
      });
    }

    return { cells: cellsArr, tendrils: tendrilsArr };
  }, []);

  useFrame((state, delta) => {
    if (!active) return;
    timer.current += delta;

    if (groupRef.current) {
      const p = Math.min(timer.current / 3, 1);
      groupRef.current.scale.setScalar(p);
    }

    // Emit cellular breakdown damage continuously every 0.1s
    if (timer.current % 0.1 < 0.05) {
      window.dispatchEvent(new CustomEvent('bombExplode', {
        detail: { pos: position, radius: 50, damageMultiplier: 0, team: 'player', isCellBreakdown: true }
      }));
    }

    if (timer.current > 12) {
      setActive(false);
      onFinish();
    }
  });

  if (!active) return null;

  return (
    <group ref={groupRef} position={[position[0], position[1] + 25, position[2]]}>
      {/* Dark Moon / Fleshy core */}
      <mesh>
        <sphereGeometry args={[10, 32, 32]} />
        <meshStandardMaterial color="#050505" emissive="#1f0a1c" emissiveIntensity={0.5} wireframe={timer.current > 8} />
      </mesh>
      
      {/* Cellular masses attached to core */}
      {cells.map((c, i) => (
        <mesh key={`cell-${i}`} position={c.pos as any} scale={c.scale}>
          <sphereGeometry args={[2, 16, 16]} />
          <meshStandardMaterial color="#2d0b2e" roughness={0.7} />
        </mesh>
      ))}

      {/* Tendrils hanging down to ground */}
      {tendrils.map((t, i) => (
        <mesh key={`tendril-${i}`} position={[t.x, -15, t.z]} scale={[t.scale, 1, t.scale]}>
          <cylinderGeometry args={[0.5, 2, 30, 8]} />
          <meshStandardMaterial color="#3b113d" roughness={0.8} />
        </mesh>
      ))}

      <pointLight color="#ff2a9d" intensity={5} distance={100} />
      {/* Domain Dark Void */}
      <mesh scale={80}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color="#020002" side={THREE.BackSide} transparent opacity={0.8} />
      </mesh>
    </group>
  );
};
export const SelfEmbodimentofPerfectionEffect = ({ position, rotation, onFinish, isAwakened = false }: { position: [number, number, number], rotation: number, onFinish: () => void, isAwakened?: boolean }) => {
  const groupRef = useRef<THREE.Group>(null);
  const flowerRef = useRef<THREE.Group>(null);
  const sphereRef = useRef<THREE.Mesh>(null);
  const [active, setActive] = useState(true);
  const timer = useRef(0);

  const { chains, flowerHands } = useMemo(() => {
    const arr: any[] = [];
    const numChains = 5;
    
    // 3차원 방향으로 손 뻗어나가게 하기
    const buildChain = (startPos: THREE.Vector3, startRotY: number, startRotX: number, depth: number, maxDepth: number, delay: number, currentScale: number) => {
      if (depth >= maxDepth) return;
      
      arr.push({
        pos: [startPos.x, startPos.y, startPos.z],
        rot: [startRotX, startRotY, 0], // X 회전 (위/아래 방향) 적용
        delay: delay,
        scale: currentScale,
      });
      
      const euler = new THREE.Euler(startRotX, startRotY, 0, 'YXZ');
      const forward = new THREE.Vector3(0, 1, 0).applyEuler(euler).normalize();
      
      const nextPos = new THREE.Vector3().copy(startPos).add(forward.clone().multiplyScalar(4.8 * currentScale));
      
      buildChain(nextPos, startRotY, startRotX, depth + 1, maxDepth, delay + 0.15, currentScale * 0.85);
      
      if (depth === 1 || depth === 3) {
        const branchScale = currentScale * 0.75;
        const rightYaw = startRotY - 0.45;
        const leftYaw = startRotY + 0.45;
        const pitchUpEuler = new THREE.Euler(startRotX + 0.4, startRotY, 0, 'YXZ');
        
        const rightEuler = new THREE.Euler(startRotX, rightYaw, 0, 'YXZ');
        const leftEuler = new THREE.Euler(startRotX, leftYaw, 0, 'YXZ');
        
        const rightForward = new THREE.Vector3(0, 1, 0).applyEuler(rightEuler).normalize();
        const leftForward = new THREE.Vector3(0, 1, 0).applyEuler(leftEuler).normalize();
        const upForward = new THREE.Vector3(0, 1, 0).applyEuler(pitchUpEuler).normalize();
        
        const rightBranch = new THREE.Vector3().copy(startPos).add(rightForward.multiplyScalar(4.8 * branchScale));
        const leftBranch = new THREE.Vector3().copy(startPos).add(leftForward.multiplyScalar(4.8 * branchScale));
        const upBranch = new THREE.Vector3().copy(startPos).add(upForward.multiplyScalar(4.8 * branchScale));
        
        buildChain(rightBranch, rightYaw, startRotX, depth + 1, maxDepth, delay + 0.25, branchScale);
        buildChain(leftBranch, leftYaw, startRotX, depth + 1, maxDepth, delay + 0.25, branchScale);
        if (depth === 3) buildChain(upBranch, startRotY, startRotX + 0.4, depth + 1, maxDepth, delay + 0.25, branchScale);
      }
    };
    
    // 바닥, 중간, 하늘 계층
    const heights = [-0.5, 7.5, 15.0];
    heights.forEach((h) => {
      for (let i = 0; i < numChains; i++) {
        const angle = (i / numChains) * Math.PI * 2;
        const startPos = new THREE.Vector3(position[0], position[1] + h, position[2]);
        buildChain(startPos, angle, -Math.PI / 2 + 0.1, 0, 5, 0, 1.0); 
      }
    });

    // 뒤쪽의 거대한 꽃 모양을 위한 손들 생성
    const fHands: any[] = [];
    const numPetals = 12; // 줄임
    for (let i = 0; i < numPetals; i++) {
      const angle = (i / numPetals) * Math.PI * 2;
      fHands.push({
        rotZ: angle,
        scale: 2.0,
        delay: 0.5 + (i % 2) * 0.2
      });
    }

    return { chains: arr, flowerHands: fHands };
  }, [position]);

  // 플레이어 등 뒤 위치 계산을 위한 로직
  const flowerPos = useMemo(() => {
    // 뒤로 15만큼 떨어진 위치 (위는 12)
    const backDir = new THREE.Vector3(0, 0, 1).applyEuler(new THREE.Euler(0, rotation, 0)).normalize();
    return new THREE.Vector3(position[0], position[1] + 12, position[2]).add(backDir.multiplyScalar(15));
  }, [position, rotation]);

  const flowerRotY = rotation;

  useFrame((state, delta) => {
    if (!active) return;
    timer.current += delta;
    
    if (groupRef.current) {
       groupRef.current.children.forEach((child, index) => {
          if (index < chains.length) {
             const h = chains[index];
             const progress = Math.min(Math.max((timer.current - h.delay) * 5, 0), 1);
             child.scale.setScalar(progress * h.scale);
             child.visible = progress > 0;
          }
       });
    }

    if (flowerRef.current) {
        // 꽃 회전
        flowerRef.current.rotation.z = timer.current * 0.5;
        flowerRef.current.children.forEach((child, index) => {
            if (index < flowerHands.length) {
                const fh = flowerHands[index];
                const progress = Math.min(Math.max((timer.current - fh.delay) * 3, 0), 1);
                child.scale.setScalar(progress * fh.scale);
                child.visible = progress > 0;
            }
        });
    }

    if (sphereRef.current) {
        const sphereScale = Math.min((timer.current / 1.5) * 45, 45); 
        sphereRef.current.scale.setScalar(sphereScale);
        const material = sphereRef.current.material as THREE.Material;
        if (material) {
            material.opacity = Math.max(0, 0.4 - timer.current * 0.08);
        }
    }
    
    if (timer.current >= 5.0) {
      window.dispatchEvent(new CustomEvent('bombExplode', { 
        detail: { pos: position, radius: 45, team: 'player', damageMultiplier: 15, launchForce: 10, color: '#9333ea' } 
      }));
      window.dispatchEvent(new CustomEvent('transfigureEnemies', {
        detail: { pos: position, radius: 45, chance: 0.3 }
      }));
      window.dispatchEvent(new CustomEvent('showSystemMessage', { detail: { text: "자폐원돈과 (Self-Embodiment of Perfection) !!", color: "#9333ea" } }));
      window.dispatchEvent(new CustomEvent('playSound', { detail: { type: 'magic' } }));
      setActive(false);
      onFinish();
    }
  });

  return (
    <group>
      <group ref={groupRef}>
        {active && chains.map((h, i) => (
          <group key={`chain-${i}`} position={new THREE.Vector3(...h.pos)} rotation={new THREE.Euler(h.rot[0], h.rot[1], h.rot[2], 'YXZ')} scale={0} visible={false}>
            {/* 손바닥 */}
            <mesh position={[0, +0.5, 0]}>
              <boxGeometry args={[1.5, 3, 0.5]} />
              <meshStandardMaterial color="#6b21a8" roughness={0.7} emissive="#581c87" emissiveIntensity={0.5} />
            </mesh>
            {/* 손가락 */}
            {[-0.6, -0.2, 0.2, 0.6].map((fx, fi) => (
               <mesh key={`f${fi}`} position={[fx, 3.0, 0.2]}>
                 <boxGeometry args={[0.3, 2, 0.3]} />
                 <meshStandardMaterial color="#7e22ce" roughness={0.7} />
               </mesh>
            ))}
            {/* 엄지 */}
            <mesh position={[-1.0, 1.0, 0.2]} rotation={[0, 0, -0.5]}>
              <boxGeometry args={[0.4, 1.5, 0.4]} />
              <meshStandardMaterial color="#7e22ce" roughness={0.7} />
            </mesh>
          </group>
        ))}
      </group>

      {/* 뒤쪽의 거대한 꽃 모양 (만다라) */}
      {active && (
        <group position={flowerPos} rotation={[0, flowerRotY, 0]}>
            <group ref={flowerRef}>
                {flowerHands.map((fh, i) => (
                    <group key={`flower-${i}`} rotation={[0, 0, fh.rotZ]} scale={0} visible={false}>
                        {/* 중심에서 바깥을 향해 손이 뻗은 형태 */}
                        <group position={[0, 5, 0]} rotation={[0, 0, 0]}>
                            {/* 손바닥 */}
                            <mesh position={[0, +0.5, 0]}>
                                <boxGeometry args={[1.5, 3, 0.5]} />
                                <meshStandardMaterial color="#9333ea" roughness={0.5} emissive="#581c87" emissiveIntensity={0.8} />
                            </mesh>
                            {/* 손가락 */}
                            {[-0.6, -0.2, 0.2, 0.6].map((fx, fi) => (
                                <mesh key={`ff${fi}`} position={[fx, 3.0, 0.2]}>
                                    <boxGeometry args={[0.3, 2, 0.3]} />
                                    <meshStandardMaterial color="#a855f7" roughness={0.5} />
                                </mesh>
                            ))}
                            {/* 엄지 */}
                            <mesh position={[-1.0, 1.0, 0.2]} rotation={[0, 0, -0.5]}>
                                <boxGeometry args={[0.4, 1.5, 0.4]} />
                                <meshStandardMaterial color="#a855f7" roughness={0.5} />
                            </mesh>
                        </group>
                    </group>
                ))}
            </group>
        </group>
      )}

      {active && (
        <mesh ref={sphereRef} position={[position[0], position[1] + 1, position[2]]}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshBasicMaterial color="#2e1065" transparent opacity={0.4} side={THREE.BackSide} />
        </mesh>
      )}
    </group>
  );
};

export const SpaceCleaveEffect = ({ position, rotation, onFinish, isAwakened = false }: { position: [number, number, number], rotation: number, onFinish: () => void, isAwakened?: boolean }) => {
  const groupRef = useRef<THREE.Group>(null);
  const timer = useRef(0);

  useFrame((state, delta) => {
    timer.current += delta;
    
    if (groupRef.current) {
      // Moves forward VERY fast
      groupRef.current.position.x += Math.sin(rotation) * delta * 80;
      groupRef.current.position.z += Math.cos(rotation) * delta * 80;
      
      const s = 1 + timer.current * 20; // scale up drastically
      groupRef.current.scale.set(s, 1, s);
    }
    
    // Massive continuous damage along path
    if (timer.current % 0.05 < 0.02) {
       window.dispatchEvent(new CustomEvent('bombExplode', {
         detail: { pos: [groupRef.current?.position.x, groupRef.current?.position.y, groupRef.current?.position.z], radius: 10, damageMultiplier: 10, team: 'player', launchForce: 15 } // Pure destruction
       }));
    }

    if (timer.current > 0.4) {
      onFinish();
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={[0, rotation, 0]}>
      {/* Central dimensional tear */}
      <mesh rotation={[-Math.PI / 4, 0, 0]} position={[0, 1.5, 0]}>
        <planeGeometry args={[10, 0.5]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.9} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
      </mesh>
      {/* Outer black edge */}
      <mesh rotation={[-Math.PI / 4, 0, 0]} position={[0, 1.5, -0.1]}>
        <planeGeometry args={[12, 1.5]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.9} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

export const HollowPurpleEffect = ({ position, direction, onFinish, isAwakened = false }: { position: [number, number, number], direction: [number, number, number], onFinish: () => void, isAwakened?: boolean }) => {
  const groupRef = useRef<THREE.Group>(null);
  const orbRef = useRef<THREE.Mesh>(null);
  const auraRef = useRef<THREE.Mesh>(null);
  const timer = useRef(0);
  const [phase, setPhase] = useState(0);

  const redOrb = useRef<THREE.Mesh>(null);
  const blueOrb = useRef<THREE.Mesh>(null);
  const corePos = useRef(new THREE.Vector3(...position).add(new THREE.Vector3(0, 2, 0))); // starting high
  
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('playSound', { detail: { type: 'laser' } }));
  }, []);

  useFrame((state, delta) => {
    timer.current += delta;

    if (timer.current < 1.5) {
      // Phase 0: Combine Red and Blue
      const t = timer.current / 1.5;
      if (redOrb.current && blueOrb.current) {
        // Red from right
        redOrb.current.position.set(3 - t * 3, 0, 0);
        // Blue from left
        blueOrb.current.position.set(-3 + t * 3, 0, 0);
      }
      if (timer.current % 0.1 < 0.05) {
         window.dispatchEvent(new CustomEvent('bombExplode', {
           detail: { pos: [corePos.current.x, corePos.current.y, corePos.current.z], radius: 15, damageMultiplier: 0.5, team: 'player', launchForce: 1 }
         }));
      }
    } else {
      if (phase === 0) {
         setPhase(1);
         window.dispatchEvent(new CustomEvent('playSound', { detail: { type: 'bassDrop' } }));
      }

      if (groupRef.current) {
        // Launch forward
        groupRef.current.position.x += direction[0] * delta * 50;
        groupRef.current.position.z += direction[2] * delta * 50;
        
        // Expand
        const s = Math.min((timer.current - 1.5) * 6 + 1, 15);
        if (orbRef.current) orbRef.current.scale.setScalar(s);
        if (auraRef.current) {
          auraRef.current.scale.setScalar(s * 1.2);
          auraRef.current.rotation.y += delta * 15;
          auraRef.current.rotation.z += delta * 10;
        }

        // Damage continuously
        if (timer.current % 0.05 < 0.02) {
           window.dispatchEvent(new CustomEvent('bombExplode', {
             detail: { pos: [groupRef.current.position.x, groupRef.current.position.y, groupRef.current.position.z], radius: Math.max(15, s*1.5), damageMultiplier: 15, team: 'player', isCellBreakdown: true } 
           }));
        }
      }
    }

    if (timer.current > 5.0) {
      onFinish();
    }
  });

  return (
    <group ref={groupRef} position={[corePos.current.x, corePos.current.y, corePos.current.z]}>
      {phase === 0 && (
        <>
          <mesh ref={redOrb}>
            <sphereGeometry args={[1.5, 32, 32]} />
            <meshBasicMaterial color="#ff0000" transparent opacity={0.8} blending={THREE.AdditiveBlending} />
          </mesh>
          <mesh ref={blueOrb}>
            <sphereGeometry args={[1.5, 32, 32]} />
            <meshBasicMaterial color="#0000ff" transparent opacity={0.8} blending={THREE.AdditiveBlending} />
          </mesh>
          <pointLight color="#ff0000" distance={20} intensity={5} />
          <pointLight color="#0000ff" distance={20} intensity={5} />
        </>
      )}

      {phase === 1 && (
        <>
          <mesh ref={orbRef}>
            <sphereGeometry args={[1, 32, 32]} />
            <meshBasicMaterial color="#a855f7" />
          </mesh>
          <mesh ref={auraRef}>
            <icosahedronGeometry args={[1, 1]} />
            <meshBasicMaterial color="#d8b4fe" wireframe transparent blending={THREE.AdditiveBlending} opacity={0.5} />
          </mesh>
          <pointLight color="#a855f7" distance={100} intensity={10} />
        </>
      )}
    </group>
  );
};

export const PumpkinPotatoEffect = ({ position, direction, onFinish }: { position: [number, number, number], direction: [number, number, number], onFinish: () => void }) => {
  const groupRef = useRef<THREE.Group>(null);
  const timer = useRef(0);

  useFrame((state, delta) => {
    timer.current += delta;
    if (groupRef.current) {
      groupRef.current.position.add(new THREE.Vector3(direction[0], direction[1], direction[2]).multiplyScalar(delta * 20));
      groupRef.current.rotation.x += delta * 10;
      groupRef.current.rotation.y += delta * 15;
    }
    
    if (timer.current > 0.5 && timer.current < 0.6) { // Just one explosion frame
        window.dispatchEvent(new CustomEvent('bombExplode', { detail: { pos: groupRef.current?.position.toArray() || position, radius: 10, damageMultiplier: 10, team: 'player' } }));
    }

    if (timer.current > 3) {
      onFinish();
    }
  });

  return (
    <group>
      <group position={position}>
        {[...Array(8)].map((_, i) => (
          <group key={i} position={[(Math.random() - 0.5) * 15, -1, (Math.random() - 0.5) * 15]}>
            <mesh position={[0, 2, 0]}>
               <cylinderGeometry args={[0.5, 0.8, 4]} />
               <meshStandardMaterial color="#8B4513" />
            </mesh>
            <mesh position={[0, 5, 0]}>
               <sphereGeometry args={[2.5]} />
               <meshStandardMaterial color="#22c55e" />
            </mesh>
          </group>
        ))}
      </group>
      <group ref={groupRef} position={[position[0], position[1] + 2, position[2]]}>
         <mesh>
           <capsuleGeometry args={[0.6, 1.2, 8, 8]} />
           <meshStandardMaterial color="#f59e0b" />
         </mesh>
         <pointLight color="#f59e0b" intensity={5} distance={10} />
      </group>
    </group>
  );
};

export const MeteorStrikeEffect = ({ position, onFinish }: { position: [number, number, number], onFinish: () => void }) => {
  const groupRef = useRef<THREE.Group>(null);
  const timer = useRef(0);
  const startPos = new THREE.Vector3(position[0], position[1] + 60, position[2]);
  const endPos = new THREE.Vector3(position[0], position[1], position[2]);

  useFrame((state, delta) => {
    timer.current += delta;
    const progress = Math.min(timer.current / 1.5, 1);
    
    if (groupRef.current) {
      groupRef.current.position.lerpVectors(startPos, endPos, progress * progress); // Accelerate
      groupRef.current.rotation.x += delta * 5;
      groupRef.current.rotation.y += delta * 5;
    }

    if (progress >= 1 && timer.current < 1.6) {
       window.dispatchEvent(new CustomEvent('bombExplode', { detail: { pos: endPos.toArray(), radius: 30, damageMultiplier: 50, team: 'player' } }));
    }

    if (timer.current > 2.5) {
      onFinish();
    }
  });

  return (
    <group ref={groupRef} position={startPos}>
      <mesh>
        <sphereGeometry args={[5, 16, 16]} />
        <meshStandardMaterial color="#ef4444" emissive="#b91c1c" emissiveIntensity={0.5} roughness={0.9} />
      </mesh>
      <mesh>
        <sphereGeometry args={[5.5, 16, 16]} />
        <meshBasicMaterial color="#fca5a5" wireframe transparent opacity={0.5} />
      </mesh>
      <pointLight color="#ef4444" intensity={20} distance={50} />
    </group>
  );
};

export const ShadowCloneEffect = ({ position, onFinish }: { position: [number, number, number], onFinish: () => void }) => {
  const timer = useRef(0);
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
     window.dispatchEvent(new CustomEvent('bombExplode', { detail: { pos: position, radius: 5, damageMultiplier: 2, team: 'player' } }));
  }, []);

  useFrame((state, delta) => {
    timer.current += delta;
    if (groupRef.current) {
        groupRef.current.position.x += Math.sin(timer.current * 10) * 0.1;
        groupRef.current.position.z += Math.cos(timer.current * 10) * 0.1;
    }
    if (timer.current > 5) onFinish();
  });

  return (
    <group ref={groupRef} position={position}>
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[1, 2, 1]} />
        <meshStandardMaterial color="#1f2937" emissive="#000000" transparent opacity={0.8} />
      </mesh>
      <mesh position={[0, 2.5, 0]}>
        <sphereGeometry args={[0.5]} />
        <meshStandardMaterial color="#1f2937" transparent opacity={0.8} />
      </mesh>
    </group>
  );
};

export const EarthquakeEffect = ({ position, onFinish }: { position: [number, number, number], onFinish: () => void }) => {
  const timer = useRef(0);

  useFrame((state, delta) => {
    timer.current += delta;
    if (Math.floor(timer.current * 10) % 2 === 0 && timer.current < 2) {
       window.dispatchEvent(new CustomEvent('bombExplode', { detail: { pos: [position[0] + (Math.random()-0.5)*20, position[1], position[2] + (Math.random()-0.5)*20], radius: 15, damageMultiplier: 5, team: 'player' } }));
    }
    if (timer.current > 3) onFinish();
  });

  return (
    <group position={position}>
      {[...Array(10)].map((_, i) => (
        <mesh key={i} position={[(Math.random() - 0.5) * 30, -0.5, (Math.random() - 0.5) * 30]} rotation={[(Math.random() - 0.5), (Math.random() - 0.5), (Math.random() - 0.5)]}>
          <boxGeometry args={[4, 1, 4]} />
          <meshStandardMaterial color="#4b5563" />
        </mesh>
      ))}
    </group>
  );
};




