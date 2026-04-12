"use client";

import React, { Suspense, useRef, useEffect, useState } from "react";
import { Canvas, useLoader, useFrame } from "@react-three/fiber";
import { OBJLoader } from "three-stdlib";
import { OrbitControls, Stage, PerspectiveCamera, Float } from "@react-three/drei";
import { Loader2 } from "lucide-react";

function Model({ id }: { id: number }) {
  const obj = useLoader(OBJLoader, `/models/${id}.obj`);
  const meshRef = useRef<any>();

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.2;
    }
  });

  return (
    <primitive 
      ref={meshRef}
      object={obj} 
      scale={0.05} 
      position={[0, 0, 0]}
    />
  );
}

export default function PlaneModelViewer({ airplaneId }: { airplaneId: number }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!airplaneId || !isClient) return null;

  return (
    <div className="w-full h-[300px] bg-gradient-to-b from-blue-900/10 to-transparent rounded-3xl border border-white/5 relative overflow-hidden group">
      <div className="absolute top-4 left-6 z-10">
         <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 opacity-50">Vista Previa 3D</h4>
      </div>
      
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 5, 20]} fov={35} />
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        
        <Suspense fallback={null}>
          <Stage environment="city" intensity={0.6} shadows={false}>
            <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
              <Model id={airplaneId} />
            </Float>
          </Stage>
        </Suspense>

        <OrbitControls 
          enableZoom={true} 
          enablePan={false}
          autoRotate={false}
          maxDistance={40}
          minDistance={10}
        />
      </Canvas>

      <div className="absolute bottom-4 right-6 flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase pointer-events-none group-hover:opacity-0 transition-opacity">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /> Interactivo
      </div>
    </div>
  );
}
