import { usePlane } from '@react-three/cannon';
import { MeshReflectorMaterial, Grid } from '@react-three/drei';

export const Ground = () => {
  const [ref] = usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, 0, 0],
  }));

  return (
    <group>
      <mesh ref={ref as any} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial 
          color="#3d2b1f" 
          roughness={0.6}
          metalness={0.1}
        />
      </mesh>
      {/* Wooden plank grid effect */}
      <Grid 
        infiniteGrid 
        fadeDistance={50} 
        fadeStrength={2} 
        cellSize={2} 
        sectionSize={2} 
        sectionColor="#2a1b12" 
        cellColor="#4d3b2e" 
      />
    </group>
  );
};


