import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useEffect } from 'react';
import * as THREE from 'three';

export const Phase2CinematicCamera = ({ targetPos, onFinish }: { targetPos: [number, number, number], onFinish: () => void }) => {
  const { camera } = useThree();
  const timer = useRef(0);
  const startPos = useRef(new THREE.Vector3());
  const startRot = useRef(new THREE.Quaternion());
  const cameraTarget = useRef(new THREE.Vector3(...targetPos));
  const initiated = useRef(false);

  useEffect(() => {
    startPos.current.copy(camera.position);
    startRot.current.copy(camera.quaternion);
    initiated.current = true;
    (window as any).isCinematic = true;
    (window as any).isTimeStopped = true;

    return () => {
      (window as any).isCinematic = false;
      (window as any).isTimeStopped = false;
    };
  }, [camera]);

  useFrame((state, delta) => {
    if (!initiated.current) return;
    timer.current += delta;
    
    // Total duration: 4.5s
    const p = Math.min(timer.current / 4.5, 1);
    
    // Orbit around Sukuna: radius decreases from 6 to 4, angle rotates 120 degrees
    const radius = 6 - (p * 2);
    const angleOffset = Math.PI / 4; 
    const currentAngle = angleOffset - p * (Math.PI * 0.66); // Rotate visually backward
    
    const offset1 = new THREE.Vector3(
       Math.cos(currentAngle) * radius,
       2.5,
       Math.sin(currentAngle) * radius
    );
    const endPos = cameraTarget.current.clone().add(offset1);
    
    const dummy = new THREE.Object3D();
    dummy.position.copy(endPos);
    dummy.lookAt(cameraTarget.current.clone().add(new THREE.Vector3(0, 2, 0))); // look at chest splitting
    const endRot = dummy.quaternion;

    const smoothStep = p === 1 ? 1 : Math.sin((p * Math.PI) / 2); 
    
    let shakeOffset = new THREE.Vector3();
    // Shake heavily from 2s to 3s
    if (timer.current > 2 && timer.current < 3) {
      const shakeIntensity = (3 - timer.current) * 0.5;
      shakeOffset.set(
        (Math.random() - 0.5) * shakeIntensity,
        (Math.random() - 0.5) * shakeIntensity,
        (Math.random() - 0.5) * shakeIntensity
      );
    }
    // Shake initially
    if (timer.current < 0.5) {
      shakeOffset.set((Math.random() - 0.5), (Math.random() - 0.5), (Math.random() - 0.5)).multiplyScalar(0.5);
    }

    camera.position.lerpVectors(startPos.current, endPos, smoothStep).add(shakeOffset);
    camera.quaternion.slerpQuaternions(startRot.current, endRot, smoothStep);

    if (timer.current > 4.5) {
      onFinish();
    }
  });

  return null;
};

export const CinematicCamera = ({ targetPos, onFinish }: { targetPos: [number, number, number], onFinish: () => void }) => {
  const { camera } = useThree();
  const timer = useRef(0);
  const startPos = useRef(new THREE.Vector3());
  const startRot = useRef(new THREE.Quaternion());
  const cameraTarget = useRef(new THREE.Vector3(...targetPos));
  const initiated = useRef(false);

  useEffect(() => {
    startPos.current.copy(camera.position);
    startRot.current.copy(camera.quaternion);
    initiated.current = true;
    (window as any).isCinematic = true;
    (window as any).isTimeStopped = true;

    return () => {
      (window as any).isCinematic = false;
      (window as any).isTimeStopped = false;
    };
  }, [camera]);

  useFrame((state, delta) => {
    if (!initiated.current) return;
    timer.current += delta;
    
    // Total duration: 3.5s
    const p = Math.min(timer.current / 3.5, 1);
    
    // Orbit around the boss: radius 8, starting from some angle, rotating 60 degrees.
    const radius = 8;
    const angleOffset = Math.PI / 2; // Initial angle
    const currentAngle = angleOffset + p * Math.PI / 2; // Rotate by 90 degrees over 3.5s
    
    const offset = new THREE.Vector3(
       Math.cos(currentAngle) * radius,
       1.5,
       Math.sin(currentAngle) * radius
    );
    
    const endPos = cameraTarget.current.clone().add(offset);
    
    // Look directly up towards the majestic horned head
    const dummy = new THREE.Object3D();
    dummy.position.copy(endPos);
    dummy.lookAt(cameraTarget.current.clone().add(new THREE.Vector3(0, 4.5, 0))); // look at boss HEAD
    const endRot = dummy.quaternion;

    const smoothStep = p === 1 ? 1 : Math.sin((p * Math.PI) / 2); // Ease out
    
    // Add some camera shake for the "두둥!" effect during the first 0.5s
    let shakeOffset = new THREE.Vector3();
    if (timer.current < 0.5) {
      const shakeIntensity = (0.5 - timer.current) * 2;
      shakeOffset.set(
        (Math.random() - 0.5) * shakeIntensity,
        (Math.random() - 0.5) * shakeIntensity,
        (Math.random() - 0.5) * shakeIntensity
      );
    }

    camera.position.lerpVectors(startPos.current, endPos, smoothStep).add(shakeOffset);
    camera.quaternion.slerpQuaternions(startRot.current, endRot, smoothStep);

    if (timer.current > 3.5) {
      onFinish();
    }
  });

  return null;
};
