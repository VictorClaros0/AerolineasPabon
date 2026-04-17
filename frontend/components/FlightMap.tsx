"use client";

import React, { useEffect, useState } from "react";
import { ComposableMap, Geographies, Geography, Line, ZoomableGroup, Marker } from "react-simple-maps";

const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";

interface Ciudad {
  id: number;
  codigo: string;
  pais: string;
  region: string;
}

interface Vuelo {
  id: number;
  id_origen: number;
  id_destino: number;
  id_estado_vuelo: number;
}

const coordenadasCiudades: Record<number, [number, number]> = {
  1: [-84.4277, 33.6407], // ATL
  2: [116.584, 40.0801], // PEK
  3: [55.3644, 25.2532], // DXB
  4: [139.779, 35.5522], // TYO
  5: [-0.4542, 51.4700], // LON
  6: [-118.4085, 33.9416], // LAX
  7: [2.5479, 49.0097], // PAR
  8: [8.5705, 50.0333], // FRA
  9: [28.8146, 40.9769], // IST
  10: [103.994, 1.3644], // SIN
  11: [-3.5679, 40.4900], // MAD
  12: [4.7638, 52.3086], // AMS
  13: [-97.0403, 32.8998], // DFW
  14: [113.298, 23.3924], // CAN
  15: [-46.4730, -23.4355], // SAO
};

const getColorByState = (stateId: number) => {
  switch (stateId) {
    case 1: return "#facc15"; // SCHEDULED (yellow)
    case 2: return "#38bdf8"; // BOARDING (light blue)
    case 3: return "#a78bfa"; // DEPARTED (purple)
    case 4: return "#4ade80"; // IN_FLIGHT (green)
    case 5: return "#fb923c"; // LANDED (orange)
    case 6: return "#9ca3af"; // ARRIVED (gray)
    default: return "#4ade80";
  }
};

const PLANE_SVG = "M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z";

export default function FlightMap() {
  const [vuelos, setVuelos] = useState<Vuelo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVuelos = async () => {
      try {
        // Only fetch a small sample and filter IN_FLIGHT on the client
        const response = await fetch("http://localhost:8080/api/vuelos?limit=500");
        if (response.ok) {
          const data: Vuelo[] = await response.json();
          // Only keep flights currently IN_FLIGHT (estado 4) or DEPARTED (3)
          setVuelos(data.filter(v => v.id_estado_vuelo === 4 || v.id_estado_vuelo === 3));
        }
      } catch (error) {
        console.error("Error fetching flights:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVuelos();
    const interval = setInterval(fetchVuelos, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="w-full h-96 rounded-xl bg-gradient-to-br from-blue-900/10 to-purple-900/10 border border-white/5 flex items-center justify-center">
        <p className="text-gray-400">Cargando mapa en vivo...</p>
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl border border-white/10 bg-black/40 overflow-hidden relative" style={{ height: "500px" }}>
      <div className="absolute top-4 left-4 z-10 bg-black/60 p-3 rounded-lg border border-emerald-500/30 backdrop-blur-md shadow-[0_0_15px_rgba(16,185,129,0.2)]">
        <h4 className="text-sm font-bold text-emerald-400 font-heading mb-2 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> 
          Radar Activo
        </h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#facc15]" /> <span className="text-gray-300">Programado</span></div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#4ade80]" /> <span className="text-gray-300">En Vuelo</span></div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#a78bfa]" /> <span className="text-gray-300">Salida</span></div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#fb923c]" /> <span className="text-gray-300">Aterrizado</span></div>
        </div>
      </div>

      {/* Radar Sweep Effect */}
      <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] -ml-[400px] -mt-[400px] rounded-full pointer-events-none opacity-[0.15] z-0 select-none animate-[border-beam-spin_4s_linear_infinite]"
        style={{
          background: 'conic-gradient(from 0deg, transparent 0 340deg, #4ade80 360deg)',
        }}
      />
      {/* Radar Grid Lines */}
      <div className="absolute top-1/2 left-1/2 w-[200px] h-[200px] -ml-[100px] -mt-[100px] rounded-full border border-emerald-500/10 pointer-events-none z-0" />
      <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] -ml-[200px] -mt-[200px] rounded-full border border-emerald-500/10 pointer-events-none z-0" />
      <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] -ml-[300px] -mt-[300px] rounded-full border border-emerald-500/10 pointer-events-none z-0" />

      <ComposableMap
        projectionConfig={{ scale: 140 }}
        width={800}
        height={400}
        style={{ width: "100%", height: "100%" }}
      >
        <ZoomableGroup zoom={1} center={[0, 20]} minZoom={1} maxZoom={4}>
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#1e3a8a" // dark blue background for map
                  stroke="#172554" // darker stroke
                  strokeWidth={0.5}
                  style={{
                    default: { outline: "none" },
                    hover: { fill: "#1d4ed8", outline: "none" },
                    pressed: { outline: "none" },
                  }}
                />
              ))
            }
          </Geographies>

          {/* Only draw IN_FLIGHT and DEPARTED planes */}
          {vuelos.map((vuelo, i) => {
            const originCoord = coordenadasCiudades[vuelo.id_origen];
            const destCoord = coordenadasCiudades[vuelo.id_destino];
            
            if (!originCoord || !destCoord || vuelo.id_origen === vuelo.id_destino) return null;

            const color = getColorByState(vuelo.id_estado_vuelo);

            const dx = destCoord[0] - originCoord[0];
            const dy = destCoord[1] - originCoord[1];
            const distance = Math.sqrt(dx * dx + dy * dy);
            const animDur = Math.max(10, distance * 0.4);
            const animBegin = (i % 5) * 0.8;

            return (
              <g key={vuelo.id}>
                {/* Glowing route line */}
                <Line
                  from={originCoord}
                  to={destCoord}
                  stroke={color}
                  strokeWidth={2}
                  strokeLinecap="round"
                  style={{ opacity: 0.6, filter: `drop-shadow(0px 0px 3px ${color})` }}
                  strokeDasharray="3 5"
                  id={`route-${vuelo.id}`}
                >
                  <animate 
                    attributeName="stroke-dashoffset" 
                    values="100;0" 
                    dur={`${animDur.toFixed(1)}s`} 
                    repeatCount="indefinite" 
                  />
                </Line>

                {/* Animated airplane icon */}
                <g fill={color} style={{ filter: `drop-shadow(0 0 4px ${color})` }}>
                  <path d={PLANE_SVG} transform="translate(-12, -12) scale(0.65) rotate(90)" />
                  <animateMotion
                    dur={`${animDur.toFixed(1)}s`}
                    repeatCount="indefinite"
                    rotate="auto"
                    begin={`${animBegin}s`}
                  >
                    <mpath href={`#route-${vuelo.id}`} />
                  </animateMotion>
                </g>

                {/* Airport dots */}
                <Marker coordinates={originCoord}>
                  <circle r={2.5} fill="#ffffff" opacity={0.7} />
                </Marker>
                <Marker coordinates={destCoord}>
                  <circle r={2.5} fill="#ffffff" opacity={0.7} />
                </Marker>
              </g>
            );
          })}
        </ZoomableGroup>
      </ComposableMap>
    </div>
  );
}
