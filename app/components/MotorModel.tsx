"use client";

import { useGLTF, Center } from "@react-three/drei";
import { ThreeEvent } from "@react-three/fiber";

interface MotorModelProps {
  onClick: (e: ThreeEvent<MouseEvent>) => void;
  onPointerMissed: (e: MouseEvent) => void;
}

export function MotorModel({ onClick, onPointerMissed }: MotorModelProps) {
  const { scene } = useGLTF("/motor.glb");

  return (
    <group onPointerMissed={onPointerMissed}>
      <Center>
        <primitive
          object={scene}
          onClick={(e: ThreeEvent<MouseEvent>) => {
            e.stopPropagation();
            onClick(e);
          }}
        // Add a slight cast shadow if we want, though usually primitive is enough
        />
      </Center>
    </group>
  );
}

useGLTF.preload("/motor.glb");
