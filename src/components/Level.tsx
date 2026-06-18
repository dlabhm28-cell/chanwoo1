import { useBox, useCylinder } from '@react-three/cannon';

const Crate = ({ position }: { position: [number, number, number] }) => {
  const [ref] = useBox(() => ({
    mass: 10,
    position,
    args: [1.5, 1.5, 1.5],
  }));

  return (
    <mesh ref={ref as any} castShadow receiveShadow>
      <boxGeometry args={[1.5, 1.5, 1.5]} />
      <meshStandardMaterial color="#5d4037" roughness={0.9} />
      {/* Decorative lines to make it look like a crate */}
      <mesh position={[0, 0, 0.76]}>
        <boxGeometry args={[1.4, 0.1, 0.02]} />
        <meshStandardMaterial color="#3e2723" />
      </mesh>
      <mesh position={[0, 0, -0.76]}>
        <boxGeometry args={[1.4, 0.1, 0.02]} />
        <meshStandardMaterial color="#3e2723" />
      </mesh>
    </mesh>
  );
};

const Pillar = ({ position }: { position: [number, number, number] }) => {
  const [ref] = useCylinder(() => ({
    mass: 0, // Static
    position,
    args: [0.5, 0.5, 4, 16],
  }));

  return (
    <mesh ref={ref as any} castShadow receiveShadow>
      <cylinderGeometry args={[0.5, 0.5, 4, 16]} />
      <meshStandardMaterial color="#8d6e63" roughness={0.7} />
    </mesh>
  );
};

export const Level = () => {
  return (
    <group>
      <Crate position={[5, 0.75, 5]} />
      <Crate position={[-7, 0.75, 3]} />
      <Crate position={[2, 0.75, -8]} />
      <Crate position={[5, 2.25, 5]} /> {/* Stacked crate */}
      
      <Pillar position={[10, 2, 10]} />
      <Pillar position={[-10, 2, -10]} />
      <Pillar position={[10, 2, -10]} />
      <Pillar position={[-10, 2, 10]} />
    </group>
  );
};
