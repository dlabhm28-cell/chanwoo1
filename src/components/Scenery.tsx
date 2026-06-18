import { useBox, usePlane } from '@react-three/cannon';
import { Grid } from '@react-three/drei';

export const CastleLevel = () => {
  const [ref] = usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, -0.01, 0],
  }));

  return (
    <group>
      <group ref={ref as any}></group>
      {/* Dark reddish background feel will be given by lights in the main app, but we can do some geometry here */}
      <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#1a0f0f" roughness={0.8} />
      </mesh>
      
      {/* Castle Pillars */}
      {[[-15, 15], [15, 15], [-15, -15], [15, -15], [0, -20], [-20, 0], [20, 0]].map((pos, i) => (
        <CastlePillar key={i} position={[pos[0], 5, pos[1]]} />
      ))}
    </group>
  );
};

const CastlePillar = ({ position }: { position: [number, number, number] }) => {
  const [ref] = useBox(() => ({ mass: 0, position, args: [3, 10, 3] }));
  return (
    <mesh ref={ref as any} castShadow receiveShadow>
      <boxGeometry args={[3, 10, 3]} />
      <meshStandardMaterial color="#2d1f1f" roughness={0.9} />
    </mesh>
  );
};

export const ShibuyaLevel = () => {
  const [ref] = usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, -0.01, 0],
  }));

  return (
    <group>
      <group ref={ref as any}></group>
      {/* Asphalt / Concrete ground */}
      <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#1f2229" roughness={0.7} />
      </mesh>
      
      {/* City grids to feel like a ruined station/street */}
      <Grid 
        infiniteGrid 
        fadeDistance={40} 
        fadeStrength={1.5} 
        cellSize={1} 
        sectionSize={4} 
        sectionColor="#444" 
        cellColor="#222" 
      />

      {/* Buildings / Debris */}
      {[[-10, 20], [10, 20], [-20, 5], [20, 5], [-15, -15], [15, -15]].map((pos, i) => (
        <Building key={i} position={[pos[0], Math.random() * 5 + 5, pos[1]]} />
      ))}
    </group>
  );
};

const Building = ({ position }: { position: [number, number, number] }) => {
  const height = position[1] * 2;
  const [ref] = useBox(() => ({ mass: 0, position, args: [6, height, 6] }));
  return (
    <mesh ref={ref as any} castShadow receiveShadow>
      <boxGeometry args={[6, height, 6]} />
      <meshStandardMaterial color="#333" roughness={0.9} metalness={0.2} />
      {/* Windows indication */}
      <Grid position={[0,0,3.01]} rotation={[Math.PI/2, 0, 0]} args={[6, height]} cellColor="#ffffaa" sectionColor="#000" fadeDistance={100} fadeStrength={0} />
    </mesh>
  );
};
