"use client";

import { useState, useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, Bounds } from "@react-three/drei";
import * as THREE from "three";
import { MotorModel } from "./MotorModel";
import { MeasurementLine, Unit } from "./MeasurementLine";
import { ThreeEvent } from "@react-three/fiber";

export type Measurement = {
  id: string;
  p1: THREE.Vector3;
  p2: THREE.Vector3 | null;
};

// A small functional component to track mouse position on the scene for the active line
function PointerTracker({ setPointerPos, active }: { setPointerPos: (v: THREE.Vector3 | null) => void, active: boolean }) {
  return (
    <mesh
      visible={false}
      onPointerMove={(e) => {
        if (active) setPointerPos(e.point);
      }}
      onPointerOut={() => {
        if (active) setPointerPos(null);
      }}
    >
      <sphereGeometry args={[100, 16, 16]} />
      <meshBasicMaterial side={THREE.BackSide} />
    </mesh>
  );
}

export function MeasurementApp() {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [unit, setUnit] = useState<Unit>("mm");
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [pointerPos, setPointerPos] = useState<THREE.Vector3 | null>(null);

  const activeMeasurementIndex = measurements.findIndex((m) => m.p2 === null);
  const hasActiveMeasurement = activeMeasurementIndex !== -1;

  const handleModelClick = (e: ThreeEvent<MouseEvent>) => {
    if (!isMeasuring) return;

    const point = e.point.clone();

    if (hasActiveMeasurement) {
      // Picked the second point
      setMeasurements((prev) => {
        const newArr = [...prev];
        newArr[activeMeasurementIndex] = { ...newArr[activeMeasurementIndex], p2: point };
        return newArr;
      });
      // automatically start next measurement? No, let's keep it discrete matching the example,
      // but the prompt says "Resets or continues measurement after selection". 
      // If we want it to be like Google Maps sequence, we'd start a new one seamlessly.
      // Let's NOT start a new one seamlessly so they can choose to add discrete ones.
      // Or actually, if we want Google Maps style, let's start a new one from the last point!
      // But the user liked the "3dmeasurement.surge.sh" style which has discrete measurements.
      // Let's just finish this measurement and let them start a new one.
    } else {
      // Picked the first point
      setMeasurements((prev) => [
        ...prev,
        { id: Math.random().toString(36).substring(7), p1: point, p2: null },
      ]);
    }
  };

  const clearMeasurements = () => {
    setMeasurements([]);
  };

  const removeMeasurement = (id: string) => {
    setMeasurements((prev) => prev.filter((m) => m.id !== id));
  };

  // Format distance
  const getDistanceText = (m: Measurement) => {
    if (!m.p2) return "P1 selected...";
    const dist = m.p1.distanceTo(m.p2);
    const unitMultipliers = { mm: 1000, cm: 100, in: 39.3701 };
    const unitLabels = { mm: "mm", cm: "cm", in: "\"" };
    return `${(dist * unitMultipliers[unit]).toFixed(2)} ${unitLabels[unit]}`;
  };

  return (
    <div className="relative w-full h-screen flex flex-col sm:flex-row bg-zinc-50 dark:bg-zinc-900">

      {/* UI Overlay */}
      <div className="absolute top-0 right-0 p-4 z-10 w-full sm:w-80 flex flex-col gap-4 max-h-screen pointer-events-none">

        <div className="bg-white/80 dark:bg-black/80 backdrop-blur-md p-4 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 pointer-events-auto flex flex-col gap-4">
          <h1 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">3D Measurements</h1>

          <div className="flex gap-2">
            <button
              onClick={() => setIsMeasuring(!isMeasuring)}
              className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors ${isMeasuring ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
            >
              {isMeasuring ? 'Stop Measuring' : 'Measure Distance'}
            </button>
            <button
              onClick={clearMeasurements}
              className="py-2 px-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-medium rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
            >
              Clear
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Unit</label>
            <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
              {(["mm", "cm", "in"] as Unit[]).map((u) => (
                <button
                  key={u}
                  onClick={() => setUnit(u)}
                  className={`flex-1 py-1 text-sm font-medium rounded-md capitalize transition-all ${unit === u ? 'bg-white dark:bg-zinc-600 shadow-sm text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <h2 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Measurements</h2>
            {measurements.length === 0 ? (
              <p className="text-sm text-zinc-400 dark:text-zinc-500 italic">No measurements yet. Click 'Measure Distance' to begin.</p>
            ) : (
              <div className="flex flex-col gap-2 max-h-[40vh] overflow-y-auto pr-1 custom-scrollbar">
                {measurements.map((m, i) => (
                  <div key={m.id} className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700 p-2 rounded-lg">
                    <span className="text-sm font-mono text-zinc-700 dark:text-zinc-300">
                      <span className="text-xs text-zinc-400 dark:text-zinc-500 mr-2">#{i + 1}</span>
                      {getDistanceText(m)}
                    </span>
                    <button
                      onClick={() => removeMeasurement(m.id)}
                      className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 3D Canvas */}
      <div className="flex-1 w-full h-full cursor-crosshair">
        <Canvas camera={{ position: [2, 1.5, 2], fov: 45 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow />
          <directionalLight position={[-10, 10, -5]} intensity={0.5} />
          <Environment preset="city" />

          {/* Controls */}
          <OrbitControls
            makeDefault
            enabled={!hasActiveMeasurement} // Optional: disable orbit while drawing second point to avoid mistake
            minPolarAngle={0}
            maxPolarAngle={Math.PI}
          />

          {/* Model */}
          <Bounds fit clip observe margin={1.2}>
            <MotorModel
              onClick={handleModelClick}
              onPointerMissed={() => {
                if (hasActiveMeasurement) {
                  // cancel current measurement attempt if miss
                  setMeasurements(prev => prev.filter((_, i) => i !== activeMeasurementIndex))
                }
              }}
            />
          </Bounds>

          {/* Measurements */}
          {measurements.map((m, i) => (
            <MeasurementLine
              key={m.id}
              p1={m.p1}
              p2={m.p2}
              unit={unit}
              isActive={i === activeMeasurementIndex}
              pointerPos={pointerPos}
            />
          ))}

          {/* Hover tracker for drawing dashed line to pointer */}
          <PointerTracker
            setPointerPos={setPointerPos}
            active={isMeasuring && hasActiveMeasurement}
          />

          <ContactShadows resolution={1024} scale={10} blur={2} opacity={0.5} far={10} color="#000000" />
        </Canvas>
      </div>
    </div>
  );
}
