"use client";

import { Line, Html } from "@react-three/drei";
import * as THREE from "three";

export type Unit = "mm" | "cm" | "in";

interface MeasurementLineProps {
  p1: THREE.Vector3;
  p2: THREE.Vector3 | null;
  unit: Unit;
  pointerPos: THREE.Vector3 | null;
  isActive?: boolean;
}

const unitMultipliers = {
  mm: 1000,
  cm: 100,
  in: 39.3701,
};

const unitLabels = {
  mm: "mm",
  cm: "cm",
  in: "\"",
};

export function MeasurementLine({ p1, p2, unit, pointerPos, isActive }: MeasurementLineProps) {
  // If p2 is null, we draw a line to the pointer if available and isActive
  const endPoint = p2 || (isActive && pointerPos ? pointerPos : null);

  if (!endPoint && !p2) {
    // Only 1 point, no pointer pos available
    return (
      <mesh position={p1}>
        <sphereGeometry args={[0.02, 16, 16]} />
        <meshBasicMaterial color="#ef4444" depthTest={false} />
      </mesh>
    );
  }

  const validEndPoint = endPoint as THREE.Vector3;
  const distance = p1.distanceTo(validEndPoint);
  const displayVal = (distance * unitMultipliers[unit]).toFixed(2);
  const midpoint = new THREE.Vector3().addVectors(p1, validEndPoint).multiplyScalar(0.5);

  return (
    <group>
      {/* Starting point marker */}
      <mesh position={p1}>
        <sphereGeometry args={[0.02, 16, 16]} />
        <meshBasicMaterial color="#ef4444" depthTest={false} />
      </mesh>
      
      {/* Ending point marker */}
      {p2 && (
        <mesh position={p2}>
          <sphereGeometry args={[0.02, 16, 16]} />
          <meshBasicMaterial color="#ef4444" depthTest={false} />
        </mesh>
      )}

      {/* The Line */}
      <Line
        points={[p1, validEndPoint]}
        color="#ef4444"
        lineWidth={3}
        dashed={!p2} // Dashed while actively drawing
        dashScale={p2 ? 1 : 50}
        depthTest={false}
      />

      {/* HTML Label */}
      <Html position={midpoint} center zIndexRange={[100, 0]}>
        <div className="bg-white/90 dark:bg-zinc-800/90 text-zinc-900 dark:text-zinc-100 px-2 py-1 rounded text-xs font-mono shadow-sm border border-zinc-200 dark:border-zinc-700 pointer-events-none whitespace-nowrap">
          {displayVal} {unitLabels[unit]}
        </div>
      </Html>
    </group>
  );
}
