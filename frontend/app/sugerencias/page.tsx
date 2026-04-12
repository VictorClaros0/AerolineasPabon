"use client";

import { useState } from "react";
import { ArrowRight, Search, Activity, Check } from "lucide-react";

export default function DijkstraSugerencias() {
  const [origen, setOrigen] = useState("");
  const [destino, setDestino] = useState("");
  const [clase, setClase] = useState("regular");
  const [criterio, setCriterio] = useState("tiempo"); // tiempo o costo
  
  const [resultado, setResultado] = useState<null | any>(null);

  const simulateDijkstra = () => {
    // Aquí implementaremos el llamado a la API real:
    // fetch(`/api/sugerencias/${criterio}?origen=${origen}&destino=${destino}&clase=${clase}`)
    setResultado({
      ruta: ["ATL", "DXB", "TYO"],
      costo: criterio === "costo" ? 1200 : null,
      tiempo: criterio === "tiempo" ? 17 : null,
      vuelos: [
        { id: 1, salida: "ATL", llegada: "DXB", time: 14, idAvion: 12 },
        { id: 2, salida: "DXB", llegada: "TYO", time: 10, idAvion: 18 }
      ]
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-5 fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 mb-2">Sugeridor de Rutas Inteligente</h2>
        <p className="text-gray-400">Implementación de Algoritmo Dijkstra para encontrar la ruta óptima minimizando costo de pasaje o tiempo de vuelo.</p>
      </div>

      <div className="glass-panel p-6 flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-4">
          <div>
            <label className="text-sm font-semibold text-gray-400">Aeropuerto Origen</label>
            <select value={origen} onChange={e=>setOrigen(e.target.value)} className="mt-1 w-full glass-card p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-white">
              <option value="">Seleccione Origen...</option>
              <option value="ATL">ATL - Atlanta</option>
              <option value="PEK">PEK - Beijing</option>
              <option value="TYO">TYO - Tokyo</option>
              <option value="LON">LON - London</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-400">Aeropuerto Destino</label>
            <select value={destino} onChange={e=>setDestino(e.target.value)} className="mt-1 w-full glass-card p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-white">
              <option value="">Seleccione Destino...</option>
              <option value="TYO">TYO - Tokyo</option>
              <option value="ATL">ATL - Atlanta</option>
              <option value="DXB">DXB - Dubai</option>
              <option value="SIN">SIN - Singapur</option>
            </select>
          </div>
        </div>

        <div className="flex-1 space-y-4">
           <div>
            <label className="text-sm font-semibold text-gray-400">Asiento Deseado</label>
            <div className="mt-1 flex bg-white/5 rounded-xl p-1 border border-white/5">
              <button 
                onClick={()=>setClase("regular")} 
                className={`flex-1 p-2 rounded-lg text-sm font-medium transition-colors ${clase === 'regular' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
              >
                Regular
              </button>
              <button 
                onClick={()=>setClase("vip")} 
                className={`flex-1 p-2 rounded-lg text-sm font-medium transition-colors ${clase === 'vip' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
              >
                Primera Clase
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-400">Criterio de Optimización (Dijkstra)</label>
            <div className="mt-1 flex bg-white/5 rounded-xl p-1 border border-white/5">
              <button 
                onClick={()=>setCriterio("tiempo")} 
                className={`flex-1 p-2 rounded-lg text-sm font-medium transition-colors ${criterio === 'tiempo' ? 'bg-emerald-600/80 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
              >
                Menor Tiempo
              </button>
              <button 
                onClick={()=>setCriterio("costo")} 
                className={`flex-1 p-2 rounded-lg text-sm font-medium transition-colors ${criterio === 'costo' ? 'bg-orange-600/80 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
              >
                Menor Costo
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <button 
          onClick={simulateDijkstra}
          disabled={!origen || !destino}
          className="btn-primary w-full max-w-sm flex justify-center gap-2 items-center text-lg shadow-[0_0_20px_rgba(59,130,246,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Search className="w-5 h-5" />
          Procesar Grafo y Buscar Ruta
        </button>
      </div>

      {resultado && (
        <div className="glass-panel p-8 animate-in zoom-in-95 duration-500 overflow-hidden relative border-t-2 border-t-blue-500">
           <div className="absolute top-0 right-0 p-34 opacity-5 pointer-events-none">
             <Activity className="w-64 h-64" />
           </div>
           
           <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
             <Check className="text-emerald-400 w-8 h-8 p-1 bg-emerald-400/20 rounded-full" />
             Ruta Óptima Desarrollada
           </h3>

           <div className="flex items-center justify-between mb-8 relative">
              {/* Ruta generada visual */}
              <div className="absolute top-1/2 left-0 w-full h-1 bg-gradient-to-r from-blue-500/20 via-blue-500 to-purple-500/20 -translate-y-1/2 z-0" />
              
              {resultado.ruta.map((nodo: string, i: number) => (
                <div key={i} className="relative z-10 flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-[#0f111a] border-4 border-blue-500 flex items-center justify-center font-bold text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.6)]">
                    {nodo}
                  </div>
                  <span className="text-sm font-medium text-gray-300">{i === 0 ? "Origen" : i === resultado.ruta.length -1 ? "Destino" : "Escala"}</span>
                </div>
              ))}
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div className="glass-card p-4 rounded-xl flex items-center justify-between">
                <span className="text-gray-400 font-semibold uppercase text-xs">Costo Total</span>
                <span className="text-2xl font-bold text-white">${resultado.costo || '2150'}</span>
              </div>
              <div className="glass-card p-4 rounded-xl flex items-center justify-between">
                <span className="text-gray-400 font-semibold uppercase text-xs">Tiempo Total</span>
                <span className="text-2xl font-bold text-white">{resultado.tiempo || '18'} Hrs</span>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
