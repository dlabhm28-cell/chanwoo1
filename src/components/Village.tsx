import { useBox, usePlane } from '@react-three/cannon';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

const playBlipSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch (e) {
    console.error(e);
  }
};

export const VillageLevel = () => {
  // Ground
  const [groundRef] = usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, 0, 0],
    type: 'Static',
  }));

  // Shop Building
  const [shopRef] = useBox(() => ({
    args: [10, 5, 8],
    position: [15, 2.5, -15],
    type: 'Static'
  }));

  // Invisible walls for village boundaries
  const [wall1] = useBox(() => ({ args: [100, 20, 1], position: [0, 10, -50], type: 'Static' }));
  const [wall2] = useBox(() => ({ args: [100, 20, 1], position: [0, 10, 50], type: 'Static' }));
  const [wall3] = useBox(() => ({ args: [1, 20, 100], position: [-50, 10, 0], type: 'Static' }));
  const [wall4] = useBox(() => ({ args: [1, 20, 100], position: [50, 10, 0], type: 'Static' }));

  return (
    <group>
      <mesh ref={groundRef as any} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#3a8c3d" roughness={0.8} />
      </mesh>

      {/* boundary walls visual (optional, making invisible here) */}
      <mesh ref={wall1 as any} visible={false}><boxGeometry args={[100,20,1]}/></mesh>
      <mesh ref={wall2 as any} visible={false}><boxGeometry args={[100,20,1]}/></mesh>
      <mesh ref={wall3 as any} visible={false}><boxGeometry args={[1,20,100]}/></mesh>
      <mesh ref={wall4 as any} visible={false}><boxGeometry args={[1,20,100]}/></mesh>

      {/* Shop Building Visual */}
      <mesh ref={shopRef as any} castShadow receiveShadow>
        <boxGeometry args={[10, 5, 8]} />
        <meshStandardMaterial color="#8b5a2b" />
        
        {/* Shop Sign */}
        <Text
          position={[0, 3.5, 4.1]}
          fontSize={1.5}
          color="#ffcc00"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.05}
          outlineColor="#000"
        >
          장비 상점
        </Text>

        <Text
          position={[0, 2, 4.1]}
          fontSize={0.6}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          가까이 가서 'E'를 눌러 오픈
        </Text>

        {/* Counter */}
        <mesh position={[0, -1, 4.5]} castShadow receiveShadow>
          <boxGeometry args={[8, 2, 1]} />
          <meshStandardMaterial color="#5c3a21" />
        </mesh>
      </mesh>

      {/* Town Square elements */}
      <group position={[0, 0, 0]}>
        <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[8, 32]} />
          <meshStandardMaterial color="#6a6a6a" />
        </mesh>
        
        <mesh position={[0, 2, 0]} castShadow>
          <cylinderGeometry args={[1, 1, 4, 8]} />
          <meshStandardMaterial color="#ccc" />
        </mesh>
      </group>

      {/* Some trees */}
      {[-20, 20].map((x) => 
        <group key={x}>
        {[-20, 20].map((z) => (
          <group position={[x, 0, z]} key={`${x}-${z}`}>
            <mesh position={[0, 2, 0]} castShadow>
              <cylinderGeometry args={[0.5, 0.5, 4]} />
              <meshStandardMaterial color="#5c3a21" />
            </mesh>
            <mesh position={[0, 5, 0]} castShadow>
              <sphereGeometry args={[2.5, 16, 16]} />
              <meshStandardMaterial color="#2d5a27" />
            </mesh>
          </group>
        ))}
        </group>
      )}
    </group>
  );
};
