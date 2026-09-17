import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import { Sound } from '../../utils/SoundEngine.js';
import { EYE_HEIGHT, WALK_SPEED, ROOM_W, ROOM_D } from '../../constants/scene.js';

/* ═══ PLAYER ═══ */
function Player({ focusedTarget, active }) {
  const { camera } = useThree();
  const [, get] = useKeyboardControls();
  const velocity = useRef(new THREE.Vector3());
  const bobTime = useRef(0);
  const lastStep = useRef(0);
  const focusPos = useRef(null), focusLook = useRef(null);
  const initialized = useRef(false);
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    camera.position.set(0, EYE_HEIGHT, 4.2);
    camera.lookAt(0, 1.95, -5); camera.updateProjectionMatrix();
  }, [camera]);
  useFrame((state, delta) => {
    if (!active) return;
    if (focusedTarget) {
      if (!focusPos.current) {
        focusPos.current = new THREE.Vector3(
          focusedTarget.position[0], focusedTarget.position[1] + 0.15,
          focusedTarget.position[2] + 3.2);
        focusLook.current = new THREE.Vector3(
          focusedTarget.position[0], focusedTarget.position[1],
          focusedTarget.position[2]);
      }
      camera.position.lerp(focusPos.current, Math.min(1, delta * 3.0));
      camera.lookAt(focusLook.current); return;
    }
    focusPos.current = null; focusLook.current = null;
    const { forward, backward, left, right } = get();
    const dir = new THREE.Vector3();
    if (forward) dir.z -= 1; if (backward) dir.z += 1;
    if (left) dir.x -= 1; if (right) dir.x += 1;
    const moving = dir.lengthSq() > 0;
    if (moving) {
      dir.normalize(); dir.applyQuaternion(camera.quaternion);
      dir.y = 0; dir.normalize();
    }
    velocity.current.lerp(dir.multiplyScalar(WALK_SPEED), 0.15);
    camera.position.add(velocity.current.clone().multiplyScalar(delta));
    const margin = 0.5;
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -ROOM_W / 2 + margin, ROOM_W / 2 - margin);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, -ROOM_D / 2 + margin, ROOM_D / 2 - margin);
    const speed = velocity.current.length();
    if (moving && speed > 0.2) {
      bobTime.current += delta * 11 * Math.min(1.6, speed / WALK_SPEED);
      const phase = Math.floor(bobTime.current / Math.PI);
      if (phase !== lastStep.current) {
        lastStep.current = phase;
        Sound.step();
      }
      camera.position.y = EYE_HEIGHT + Math.sin(bobTime.current) * 0.045;
      camera.position.x += Math.cos(bobTime.current * 0.5) * 0.022 * delta * 4;
    } else {
      bobTime.current = 0;
      lastStep.current = 0;
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, EYE_HEIGHT, 0.08);
    }
  });
  return null;
}

export { Player };