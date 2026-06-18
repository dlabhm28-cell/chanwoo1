import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

export const RobloxCharacter = ({ danceType = 0, position, rotation, visible = true, isLocalPlayer = false, scale = [1, 1, 1], playerId }: { danceType?: number, position?: [number, number, number], rotation?: [number, number, number], visible?: boolean, isLocalPlayer?: boolean, scale?: [number, number, number] | number, playerId?: string }) => {
  const group = useRef<THREE.Group>(null);
  const [currentMessage, setCurrentMessage] = useState("");
  
  useEffect(() => {
    if (!playerId) return;
    const handleChat = (e: any) => {
      if (e.detail.playerId === playerId) {
        setCurrentMessage(e.detail.message);
        setTimeout(() => setCurrentMessage(""), 4000);
      }
    };
    window.addEventListener('chatMessage', handleChat);
    return () => window.removeEventListener('chatMessage', handleChat);
  }, [playerId]);

  useFrame((state) => {
    if (!group.current || !visible) return;
    
    if (isLocalPlayer && danceType === 0) {
      group.current.rotation.y = Math.PI + state.camera.rotation.y;
    }
    
    // Position and rotation are handled by parent mostly, but we handle the dancing animation here
    if (danceType === 1) {
      const t = state.clock.getElapsedTime();
      
      const leftArm = group.current.getObjectByName("leftArm");
      const rightArm = group.current.getObjectByName("rightArm");
      const leftLeg = group.current.getObjectByName("leftLeg");
      const rightLeg = group.current.getObjectByName("rightLeg");
      const torso = group.current.getObjectByName("torso");
      
      if (leftArm && rightArm && leftLeg && rightLeg && torso) {
        // Bobbing
        torso.position.y = Math.sin(t * 10) * 0.1;
        
        // Arm swinging
        leftArm.rotation.x = Math.sin(t * 5) * Math.PI / 2;
        leftArm.rotation.z = Math.sin(t * 5) * 0.5;
        
        rightArm.rotation.x = Math.sin(t * 5 + Math.PI) * Math.PI / 2;
        rightArm.rotation.z = Math.sin(t * 5 + Math.PI) * -0.5;
        
        // Leg stomping
        leftLeg.rotation.x = Math.sin(t * 5 + Math.PI) * 0.2;
        rightLeg.rotation.x = Math.sin(t * 5) * 0.2;
      }
    } else if (danceType === 2) {
      const t = state.clock.getElapsedTime();
      
      const leftArm = group.current.getObjectByName("leftArm");
      const rightArm = group.current.getObjectByName("rightArm");
      const leftLeg = group.current.getObjectByName("leftLeg");
      const rightLeg = group.current.getObjectByName("rightLeg");
      const torso = group.current.getObjectByName("torso");
      
      if (leftArm && rightArm && leftLeg && rightLeg && torso) {
        // Jumping Jacks style
        torso.position.y = Math.abs(Math.sin(t * 8)) * 0.3;
        
        leftArm.rotation.x = 0;
        leftArm.rotation.z = Math.abs(Math.sin(t * 8)) * Math.PI;
        
        rightArm.rotation.x = 0;
        rightArm.rotation.z = -Math.abs(Math.sin(t * 8)) * Math.PI;
        
        leftLeg.rotation.x = 0;
        leftLeg.rotation.z = Math.abs(Math.sin(t * 8)) * 0.3;
        
        rightLeg.rotation.x = 0;
        rightLeg.rotation.z = -Math.abs(Math.sin(t * 8)) * 0.3;
      }
    } else if (danceType === 3) {
      const t = state.clock.getElapsedTime();
      
      const leftArm = group.current.getObjectByName("leftArm");
      const rightArm = group.current.getObjectByName("rightArm");
      const leftLeg = group.current.getObjectByName("leftLeg");
      const rightLeg = group.current.getObjectByName("rightLeg");
      const torso = group.current.getObjectByName("torso");
      
      if (leftArm && rightArm && leftLeg && rightLeg && torso) {
        // Spin and point dance
        torso.position.y = Math.sin(t * 4) * 0.05 + 0.1;
        torso.rotation.y = t * 4;
        
        leftArm.rotation.x = Math.PI / 2;
        leftArm.rotation.z = Math.sin(t * 8) * 0.5;
        
        rightArm.rotation.x = -Math.PI / 4;
        rightArm.rotation.z = -Math.sin(t * 8) * 0.5 - 0.5;
        
        leftLeg.rotation.x = Math.sin(t * 4) * 0.3;
        leftLeg.rotation.z = 0;
        
        rightLeg.rotation.x = Math.sin(t * 4 + Math.PI) * 0.3;
        rightLeg.rotation.z = 0;
      }
    } else if (danceType === 4) {
      const t = state.clock.getElapsedTime();
      
      const leftArm = group.current.getObjectByName("leftArm");
      const rightArm = group.current.getObjectByName("rightArm");
      const leftLeg = group.current.getObjectByName("leftLeg");
      const rightLeg = group.current.getObjectByName("rightLeg");
      const torso = group.current.getObjectByName("torso");
      
      if (leftArm && rightArm && leftLeg && rightLeg && torso) {
        // Gangnam Style: Hopping + Lasso / Reins
        const hopLevel = Math.abs(Math.sin(t * 12));
        torso.position.y = hopLevel * 0.2;
        
        // Lasso arm (right)
        rightArm.rotation.x = Math.PI; // point up
        rightArm.rotation.z = Math.sin(t * 15) * 0.5 - 0.2; // lasso spin
        
        // Reins arm (left)
        leftArm.rotation.x = -Math.PI / 2; // point forward
        leftArm.rotation.z = 0.5; // bent inward
        
        // Leg hop
        leftLeg.rotation.x = Math.sin(t * 12) > 0 ? -0.4 : 0.2;
        rightLeg.rotation.x = Math.sin(t * 12) > 0 ? 0.2 : -0.4;
      }
    } else if (danceType === 5) {
      const t = state.clock.getElapsedTime();
      
      const leftArm = group.current.getObjectByName("leftArm");
      const rightArm = group.current.getObjectByName("rightArm");
      const leftLeg = group.current.getObjectByName("leftLeg");
      const rightLeg = group.current.getObjectByName("rightLeg");
      const torso = group.current.getObjectByName("torso");
      
      if (leftArm && rightArm && leftLeg && rightLeg && torso) {
        // Laughing: Shoulders bobbing up and down, leaning back slightly
        torso.position.y = Math.sin(t * 20) * 0.05 + 0.05;
        torso.rotation.x = -0.2 + Math.sin(t * 10) * 0.05; // Lean back a bit
        
        // Arms clutching stomach
        leftArm.rotation.z = 0.3;
        leftArm.rotation.x = 0.5;
        
        rightArm.rotation.z = -0.3;
        rightArm.rotation.x = 0.5;
        
        // Legs slightly bent
        leftLeg.rotation.x = 0;
        rightLeg.rotation.x = 0;
      }
    } else if (danceType === 6) {
      const leftArm = group.current.getObjectByName("leftArm");
      const rightArm = group.current.getObjectByName("rightArm");
      const leftLeg = group.current.getObjectByName("leftLeg");
      const rightLeg = group.current.getObjectByName("rightLeg");
      const torso = group.current.getObjectByName("torso");
      
      if (leftArm && rightArm && leftLeg && rightLeg && torso) {
        // Squatting
        torso.position.y = -0.4;
        torso.rotation.x = 0.2;
        
        leftArm.rotation.z = 0.2;
        leftArm.rotation.x = -0.5;
        
        rightArm.rotation.z = -0.2;
        rightArm.rotation.x = -0.5;
        
        leftLeg.rotation.x = -0.8;
        rightLeg.rotation.x = -0.8;
      }
    } else {
      // Reset animations or apply walking cycle
      const leftArm = group.current.getObjectByName("leftArm");
      const rightArm = group.current.getObjectByName("rightArm");
      const leftLeg = group.current.getObjectByName("leftLeg");
      const rightLeg = group.current.getObjectByName("rightLeg");
      const torso = group.current.getObjectByName("torso");
      
      const t = state.clock.getElapsedTime();
      
      // Calculate movement speed (very simple heuristic)
      const currentPos = new THREE.Vector3();
      group.current.getWorldPosition(currentPos);
      if (!group.current.userData.lastPos) group.current.userData.lastPos = currentPos.clone();
      const dist = currentPos.distanceTo(group.current.userData.lastPos);
      group.current.userData.lastPos.copy(currentPos);
      
      if (leftArm && rightArm && leftLeg && rightLeg && torso) {
        torso.position.y = 0;
        torso.rotation.x = 0;
        
        if (dist > 0.01) {
            // Walking
            const speed = 15;
            leftArm.rotation.set(Math.sin(t * speed) * 0.5, 0, 0);
            rightArm.rotation.set(-Math.sin(t * speed) * 0.5, 0, 0);
            leftLeg.rotation.set(-Math.sin(t * speed) * 0.5, 0, 0);
            rightLeg.rotation.set(Math.sin(t * speed) * 0.5, 0, 0);
        } else {
            // Idle
            leftArm.rotation.set(0, 0, 0);
            rightArm.rotation.set(0, 0, 0);
            leftLeg.rotation.set(0, 0, 0);
            rightLeg.rotation.set(0, 0, 0);
        }
      }
    }
  });

  // Classic Noob Colors
  const headColor = "#f1c232"; // Yellow
  const torsoColor = "#0b5394"; // Blue
  const legColor = "#8fce00"; // Greenish-Yellow
  
  return (
    <group ref={group} position={position || [0, 0, 0]} rotation={rotation || [0, 0, 0]} visible={visible} scale={scale}>
      {currentMessage && (
        <Html position={[0, 2.0, 0]} center zIndexRange={[100, 0]}>
          <div className="bg-white text-black px-3 py-2 rounded-2xl shadow-xl font-bold border-2 border-gray-200" style={{ minWidth: '100px', textAlign: 'center', pointerEvents: 'none' }}>
            <div className="text-sm">{currentMessage}</div>
            <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-3 h-3 bg-white border-r-2 border-b-2 border-gray-200"></div>
          </div>
        </Html>
      )}

      {danceType === 6 && (
        <Html position={[0, -0.6, -0.4]} center>
          <div className="text-4xl">💩</div>
        </Html>
      )}
      
      {/* Torso */}
      <mesh name="torso" position={[0, 0.5, 0]}>
        <boxGeometry args={[0.8, 1, 0.4]} />
        <meshStandardMaterial color={torsoColor} />
      </mesh>
      
      {/* Head */}
      <mesh position={[0, 1.25, 0]}>
        <boxGeometry args={[0.6, 0.6, 0.6]} />
        <meshStandardMaterial color={headColor} />
      </mesh>
      
      {/* Left Arm */}
      <group position={[-0.6, 0.9, 0]} name="leftArm">
        <mesh position={[0, -0.4, 0]}>
          <boxGeometry args={[0.35, 1, 0.35]} />
          <meshStandardMaterial color={headColor} />
        </mesh>
      </group>
      
      {/* Right Arm */}
      <group position={[0.6, 0.9, 0]} name="rightArm">
        <mesh position={[0, -0.4, 0]}>
          <boxGeometry args={[0.35, 1, 0.35]} />
          <meshStandardMaterial color={headColor} />
        </mesh>
      </group>
      
      {/* Left Leg */}
      <group position={[-0.2, 0, 0]} name="leftLeg">
        <mesh position={[0, -0.5, 0]}>
          <boxGeometry args={[0.38, 1, 0.38]} />
          <meshStandardMaterial color={legColor} />
        </mesh>
      </group>
      
      {/* Right Leg */}
      <group position={[0.2, 0, 0]} name="rightLeg">
        <mesh position={[0, -0.5, 0]}>
          <boxGeometry args={[0.38, 1, 0.38]} />
          <meshStandardMaterial color={legColor} />
        </mesh>
      </group>
    </group>
  );
};
