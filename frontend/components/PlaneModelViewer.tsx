"use client";

import React, { Suspense, useRef, useEffect, useState } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OBJLoader, FBXLoader } from "three-stdlib";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";

// Mapeo dinámico de qué avión usa qué extensión
const FILE_TYPES: Record<number, "obj" | "fbx"> = {
  1: "fbx",
  2: "fbx",
  3: "fbx",
  4: "fbx",
};

function AutoScaledModel({ url, isFbx }: { url: string; isFbx: boolean }) {
  const meshRef = useRef<THREE.Group>(null);

  // Dependiendo del boolean, mandamos a elegir un Loader diferente
  const object = useLoader(isFbx ? FBXLoader : OBJLoader, url) as THREE.Object3D;

  const cloned = React.useMemo(() => {
    // Es crítico clonar para no intervenir el caché de React Three Fiber
    const clone = object.clone(true);

    // 1. Calcular el tamaño físico matemático del avión sin importar de donde provenga
    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    // 2. Mover los vértices al [0,0,0] exactos en caso de que esté descentrado nativamente en Blender
    clone.position.x = -center.x;
    clone.position.y = -center.y;
    clone.position.z = -center.z;

    // 3. Rehabilitar el material original de la textura exportada
    if (isFbx) {
      clone.traverse((child: any) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          // Asegurarnos de que si tiene textura, React actualice sus colores base
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(m => { m.needsUpdate = true; });
            } else {
              child.material.needsUpdate = true;
            }
          }
        }
      });
    }

    // 4. Crear un grupo base que lo envolverá todo
    const group = new THREE.Group();
    group.add(clone);

    // 5. Escalar el avión automáticamente para que todo mida siempre exactamente 12 unidades
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) {
      const targetScale = 12 / maxDim;
      group.scale.set(targetScale, targetScale, targetScale);
    }

    return group;
  }, [object, isFbx]);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.4;
    }
  });

  return <primitive ref={meshRef} object={cloned} />;
}

export default function PlaneModelViewer({ airplaneId }: { airplaneId: number }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!airplaneId || !isClient) return null;

  // Lógica de URL: Mapear el ID del avión a uno de los 4 modelos base
  let modelId = airplaneId;
  if (airplaneId >= 1 && airplaneId <= 6) modelId = 1;
  else if (airplaneId >= 7 && airplaneId <= 24) modelId = 2;
  else if (airplaneId >= 25 && airplaneId <= 35) modelId = 3;
  else if (airplaneId >= 36) modelId = 4;

  const ext = FILE_TYPES[modelId] || "obj";
  const url = `/models/${modelId}.${ext}`;

  return (
    <div className="w-full h-[300px] bg-gradient-to-b from-blue-900/10 to-transparent rounded-3xl border border-white/5 relative overflow-hidden group">
      <div className="absolute top-4 left-6 z-10">
        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 opacity-50">Vista Previa 3D</h4>
      </div>

      <Canvas shadows dpr={[1, 2]}>
        {/* La cámara enfocada directo al medio [0,0,25] y sin Stage interrumpiendo */}
        <PerspectiveCamera makeDefault position={[0, 0, 25]} fov={45} />

        <ambientLight intensity={1.5} />
        <directionalLight position={[10, 20, 10]} intensity={2.5} castShadow />
        <spotLight position={[-10, -10, -10]} intensity={1} />

        <Suspense fallback={null}>
          <AutoScaledModel url={url} isFbx={ext === "fbx"} />
        </Suspense>

        <OrbitControls
          enableZoom={true}
          enablePan={true}
          minDistance={5}
          maxDistance={50}
        />
      </Canvas>

      <div className="absolute bottom-4 right-6 flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase pointer-events-none group-hover:opacity-0 transition-opacity">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /> Interactivo
      </div>
    </div>
  );
}
