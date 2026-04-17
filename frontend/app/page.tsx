"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Plane, Users, CalendarSync, Activity, DollarSign, Map, Search, PieChart, CheckCircle, Clock, Mic } from "lucide-react";
import FlightMap from "@/components/FlightMap";
import SplitFlap from "@/components/SplitFlap";

const parseTimezoneOffset = (utcString: string) => {
  if (!utcString) return -4 * 3600000;
  const match = utcString.match(/UTC([+-]\d+)(?::(\d+))?/);
  if (match) {
    const offsetHours = parseInt(match[1], 10);
    const offsetMinutes = match[2] ? parseInt(match[2], 10) : 0;
    return (offsetHours * 3600000) + (offsetHours < 0 ? -offsetMinutes * 60000 : offsetMinutes * 60000);
  }
  return -4 * 3600000;
};

export default function Dashboard() {
  const [currentTime, setCurrentTime] = useState<string>("--:--:--");
  const [recentFlights, setRecentFlights] = useState<any[]>(Array(10).fill({
    time: "--:--", destination: "---", flight: "---", gate: "--", remark: "Cargando...", color: "text-gray-500"
  }));
  const lastSyncCountRef = useRef<number>(0);

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [passengerSearch, setPassengerSearch] = useState("");

  const stats = [
    { label: "Vuelos Activos", value: "124", icon: Plane, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Pasajeros Hoy", value: "8,234", icon: Users, color: "text-purple-400", bg: "bg-purple-500/10" },
    { label: "Sincronización BD", value: "Activa (3 Nodos)", icon: CalendarSync, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Rutas Óptimas", value: "34 Nuevas", icon: Activity, color: "text-pink-400", bg: "bg-pink-500/10" },
  ];

  useEffect(() => {
    const updateTime = () => {
      const countryData = JSON.parse(localStorage.getItem("airres-country") || "{}");
      const utcString = countryData.utc || "UTC-4";
      const now = new Date();
      const utcTimeMs = now.getTime() + (now.getTimezoneOffset() * 60000);
      const targetTime = new Date(utcTimeMs + parseTimezoneOffset(utcString));
      
      const timeFormatted = targetTime.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
      setCurrentTime(`${timeFormatted} ${utcString}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchVuelos = async () => {
      try {
        const countryData = JSON.parse(localStorage.getItem("airres-country") || "{}");
        const countryHeaders = {
          "X-User-Country": countryData.name || "Estados Unidos",
          "X-Region": countryData.region || "America",
        };

        const [cRes, vRes] = await Promise.all([
          fetch("http://localhost:8080/api/ciudades", { headers: countryHeaders }),
          fetch("http://localhost:8080/api/vuelos", { headers: countryHeaders }),
        ]);

        if (cRes.ok && vRes.ok) {
          const ciudades = await cRes.json();
          let vuelos = await vRes.json();
          
          const countryData = JSON.parse(localStorage.getItem("airres-country") || "{}");
          const utcString = countryData.utc || "UTC-4";
          const offsetMs = parseTimezoneOffset(utcString);

          const formatFlights = vuelos.slice(0, 10).map((v: any) => {
            const destCiudad = ciudades.find((c: any) => c.id === v.id_destino);
            const destinationName = destCiudad ? (destCiudad.codigo + " " + destCiudad.pais).substring(0, 15).toUpperCase() : "UNKNOWN";

            const epochUtcMs = v.salida_programada * 1000;
            const targetTime = new Date(epochUtcMs + offsetMs);
            const h = targetTime.getUTCHours().toString().padStart(2, '0');
            const m = targetTime.getUTCMinutes().toString().padStart(2, '0');
            const timeStr = `${h}:${m}`;
            
            let remark = "ON TIME";
            let color = "text-yellow-400 [text-shadow:0_0_8px_#facc15]";
            switch (v.id_estado_vuelo) {
              case 1: remark = "ON TIME"; break;
              case 2: remark = "BOARDING"; color = "text-green-500 [text-shadow:0_0_8px_#22c55e]"; break;
              case 3: remark = "DEPARTED"; color = "text-yellow-400 [text-shadow:0_0_8px_#facc15]"; break;
              case 4: remark = "IN FLIGHT"; color = "text-yellow-400 [text-shadow:0_0_8px_#facc15]"; break;
              case 5: remark = "LANDED"; color = "text-green-500 [text-shadow:0_0_8px_#22c55e]"; break;
              case 6: remark = "ARRIVED"; color = "text-green-500 [text-shadow:0_0_8px_#22c55e]"; break;
              default: remark = "DELAYED"; color = "text-red-500 [text-shadow:0_0_8px_#ef4444]"; break;
            }

            return {
              time: timeStr,
              destination: destinationName,
              flight: "AP " + v.id,
              gate: v.id_puerta < 10 ? "0" + v.id_puerta : v.id_puerta.toString(),
              remark: remark,
              color: color,
            };
          });

          while (formatFlights.length < 10) {
            formatFlights.push({ time: "--:--", destination: "---", flight: "---", gate: "--", remark: "---", color: "text-gray-600" });
          }

          setRecentFlights(formatFlights);
        }
      } catch (err) {
        console.error("Error fetching flights:", err);
      }
    };
    
    fetchVuelos();
    const flightInterval = setInterval(fetchVuelos, 60000);
    return () => clearInterval(flightInterval);
  }, []);

  const fetchDashboard = useCallback(async () => {
    try {
      setDashboardLoading(true);
      const countryData = JSON.parse(localStorage.getItem("airres-country") || "{}");
      const headers = {
        "X-User-Country": countryData.name || "Estados Unidos",
        "X-Region": countryData.region || "America"
      };

      const res = await fetch("http://localhost:8080/api/dashboard", { headers });
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);

        const currentCount = (data.inventario?.vuelos_scheduled ?? 0) +
          (data.inventario?.vuelos_in_flight ?? 0) +
          (data.inventario?.vuelos_landed ?? 0);

        if (lastSyncCountRef.current !== 0 && currentCount !== lastSyncCountRef.current) {
          // @ts-ignore
          if (window.electronAPI) {
            // @ts-ignore
            window.electronAPI.showNotification("Sincronización Multi-Master", "Réplica completada. Datos de matriz actualizados.");
          }
        }
        lastSyncCountRef.current = currentCount;
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    const inv = setInterval(fetchDashboard, 30000);
    return () => clearInterval(inv);
  }, [fetchDashboard]);

  let finanzas, inventario, geografia, flota, pasajeros, totalAsientos=0, libresPct=0, resPct=0, venPct=0, filteredPasajeros=[];
  if (dashboardData) {
    ({ finanzas, inventario, geografia, flota, pasajeros } = dashboardData);
    totalAsientos = inventario?.asientos_libres + inventario?.asientos_reservados + inventario?.asientos_vendidos || 1;
    libresPct = (inventario?.asientos_libres / totalAsientos) * 100;
    resPct = (inventario?.asientos_reservados / totalAsientos) * 100;
    venPct = (inventario?.asientos_vendidos / totalAsientos) * 100;

    filteredPasajeros = pasajeros?.filter((p: any) => 
      p.nombre.toLowerCase().includes(passengerSearch.toLowerCase()) || 
      p.pasaporte.toLowerCase().includes(passengerSearch.toLowerCase())
    ).slice(0, 10) || [];
  }

  // Filtrado de vuelos por la misma búsqueda de pasajeros/ciudades (Voice Command)
  const displayFlights = passengerSearch 
    ? recentFlights.filter(f => f.destination.toLowerCase().includes(passengerSearch.toLowerCase()))
    : recentFlights;

  const startVoiceSearch = () => {
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-ES';
      recognition.start();
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        const formatted = transcript.replace(/[.,]/g, '').trim();
        setPassengerSearch(formatted);
        
        // Simulación de interacción de torre de control para la inmersión Pro
        // @ts-ignore
        if (window.electronAPI) {
          // @ts-ignore
          window.electronAPI.showNotification("Comando de Voz", `Filtrando datos por: '${formatted}'`);
        }
      };
    } else {
      alert("Tu navegador no soporta comandos de voz.");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700 pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 font-heading">
            Centro de Mando Global
          </h2>
          <p className="text-gray-400 mt-2 font-mono">Tiempo de Sistema: {currentTime}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="glass-card p-6 flex flex-col justify-between group hover:-translate-y-1 transition-transform">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${stat.bg}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-bold font-heading mb-1">{stat.value}</h3>
                <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Dashboard Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-panel p-6 flex flex-col overflow-hidden">
          <div className="flex items-center gap-3 mb-6 bg-black/40 p-3 rounded-lg border border-white/5">
            <Plane className="w-8 h-8 text-yellow-400" />
            <h3 className="text-3xl font-bold text-white tracking-widest uppercase">Departures</h3>
            <div className="ml-auto flex gap-4 text-yellow-400 font-mono text-2xl tracking-widest [text-shadow:0_0_8px_#facc15] hidden sm:flex">
              <span>Current Time</span>
              <span>{currentTime}</span>
            </div>
          </div>
          
          <div className="flex-1 bg-black rounded-xl p-6 border-8 border-gray-900 shadow-2xl overflow-x-auto">
            <div className="min-w-[700px]">
              <div className="grid grid-cols-12 gap-4 text-white font-bold mb-4 uppercase text-sm md:text-base tracking-[0.2em] border-b-2 border-gray-800 pb-4 px-2">
                <div className="col-span-2">Time</div>
                <div className="col-span-3">Destination</div>
                <div className="col-span-2">Flight</div>
                <div className="col-span-2 text-center">Gate</div>
                <div className="col-span-3">Remarks</div>
              </div>
              <div className="flex flex-col gap-2 font-mono text-sm uppercase tracking-[0.15em] font-bold">
                {displayFlights.slice(0, 10).map((flight, i) => (
                  <div key={i} className="grid grid-cols-12 gap-4 py-2 px-2 items-center bg-[#0a0a0a] border-y border-gray-900/80 rounded-sm hover:bg-gray-900/50 transition group">
                    <div className="col-span-2 text-yellow-400 [text-shadow:0_0_8px_#facc15]">
                      <SplitFlap text={flight.time} length={5} colorClass="text-yellow-400" />
                    </div>
                    <div className="col-span-3 text-yellow-400 [text-shadow:0_0_8px_#facc15] truncate flex items-center group-hover:text-blue-400 transition-colors">
                      <SplitFlap text={flight.destination} length={12} colorClass="text-yellow-400" />
                    </div>
                    <div className="col-span-2 text-yellow-400 [text-shadow:0_0_8px_#facc15]">
                      <SplitFlap text={flight.flight.replace('AP ', 'AP')} length={6} colorClass="text-white" />
                    </div>
                    <div className="col-span-2 text-yellow-400 [text-shadow:0_0_8px_#facc15] text-center flex justify-center">
                      <SplitFlap text={flight.gate} length={2} align="center" colorClass="text-white" />
                    </div>
                    <div className={`col-span-3 ${flight.color} truncate`}>
                      <SplitFlap text={flight.remark} length={9} align="center" colorClass={flight.color} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold mb-4 font-heading">Estado de Nodos</h3>
            <div className="space-y-4">
              {['América (PostgreSQL)', 'Europa/Asia (PostgreSQL)', 'Backup (MongoDB)'].map((node, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                    <span className="text-sm font-medium">{node}</span>
                  </div>
                  <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md">100% Sync</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* New Analytics Sections from Dashboard Data */}
      {dashboardLoading || !dashboardData ? (
        <div className="flex items-center justify-center min-h-[40vh] border border-white/5 rounded-2xl bg-black/20 mt-8">
          <div className="animate-spin text-blue-500"><Plane className="w-12 h-12" /></div>
          <span className="ml-4 text-xl text-gray-400 font-bold">Cargando Analíticas...</span>
        </div>
      ) : (
        <div className="space-y-8 mt-8">
          {/* 1. Indicadores de Ventas y Rentabilidad & Estados de Inventario */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 glass-card p-6 bg-gradient-to-br from-black/60 to-blue-900/10 border border-blue-500/20 hover:border-blue-500/40 transition-colors">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-green-500/10 rounded-xl"><DollarSign className="w-6 h-6 text-green-400" /></div>
                <h3 className="text-xl font-bold text-white font-heading">Ingresos Totales</h3>
              </div>
              <div className="mb-8">
                <p className="text-4xl font-bold text-green-400 [text-shadow:0_0_15px_#4ade80]">
                  Bs. {finanzas.total_ventas.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500 mt-1">Recaudación Global en Plataforma</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-yellow-400 font-bold uppercase tracking-wider">Primera Clase (VIP)</span>
                    <span className="text-white">Bs. {finanzas.ventas_vip.toLocaleString()}</span>
                  </div>
                  <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-400 shadow-[0_0_8px_#facc15]" style={{ width: `${(finanzas.ventas_vip / (finanzas.total_ventas || 1)) * 100}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-blue-400 font-bold uppercase tracking-wider">Clase Turista</span>
                    <span className="text-white">Bs. {finanzas.ventas_regular.toLocaleString()}</span>
                  </div>
                  <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-400 shadow-[0_0_8px_#60a5fa]" style={{ width: `${(finanzas.ventas_regular / (finanzas.total_ventas || 1)) * 100}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 glass-card p-6 border border-purple-500/20 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-purple-500/10 rounded-xl"><PieChart className="w-6 h-6 text-purple-400" /></div>
                  <h3 className="text-xl font-bold text-white font-heading">Estado de Asientos</h3>
                </div>
                <div className="flex items-center gap-6">
                  <div className="relative w-32 h-32 rounded-full flex items-center justify-center border-8 border-gray-800" style={{ 
                    background: `conic-gradient(#10b981 0% ${venPct}%, #f59e0b ${venPct}% ${venPct+resPct}%, #3b82f6 ${venPct+resPct}% 100%)` 
                  }}>
                    <div className="absolute w-24 h-24 bg-[#0a0a0a] rounded-full flex items-center justify-center">
                      <span className="text-xl font-bold text-white">{totalAsientos}</span>
                    </div>
                  </div>
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_5px_#10b981]"></div><span className="text-sm text-gray-300">Vendidos</span></div>
                      <span className="font-bold text-white">{inventario.asientos_vendidos}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2"><div className="w-3 h-3 bg-yellow-500 rounded-full shadow-[0_0_5px_#f59e0b]"></div><span className="text-sm text-gray-300">Reservados</span></div>
                      <span className="font-bold text-white">{inventario.asientos_reservados}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_5px_#3b82f6]"></div><span className="text-sm text-gray-300">Libres</span></div>
                      <span className="font-bold text-white">{inventario.asientos_libres}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-orange-500/10 rounded-xl"><Activity className="w-6 h-6 text-orange-400" /></div>
                  <h3 className="text-xl font-bold text-white font-heading">Métricas de Vuelos</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-xl border border-white/10 hover:bg-white/10 transition">
                    <span className="text-2xl font-bold text-blue-400">{inventario.vuelos_scheduled}</span>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mt-1">Scheduled</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl border border-white/10 hover:bg-white/10 transition">
                    <span className="text-2xl font-bold text-yellow-400">{inventario.vuelos_in_flight}</span>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mt-1">In Flight</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl border border-white/10 hover:bg-white/10 transition">
                    <span className="text-2xl font-bold text-emerald-400">{inventario.vuelos_landed + inventario.vuelos_arrived}</span>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mt-1">Completed</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl border border-white/10 hover:bg-white/10 transition">
                    <span className="text-2xl font-bold text-red-500">{inventario.vuelos_delayed}</span>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mt-1">Delayed</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 glass-card p-6 border border-pink-500/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-pink-500/10 rounded-xl"><Map className="w-6 h-6 text-pink-400" /></div>
                <h3 className="text-xl font-bold text-white font-heading">Geografía y Demanda</h3>
              </div>
              
              <div className="mb-6">
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Ubicación de Compra (APIs)</h4>
                <div className="space-y-3">
                  {geografia.compras_por_pais?.slice(0,4).map((p: any, i: number) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <span className="text-gray-300 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-pink-400"></span>
                        {p.pais}
                      </span>
                      <span className="font-bold text-pink-400">{p.cantidad.toLocaleString()} reqs</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Rutas más Solicitadas</h4>
                <div className="space-y-3">
                  {geografia.top_rutas?.map((r: any, i: number) => (
                    <div key={i} className="bg-white/5 p-3 rounded-lg border border-white/10 flex justify-between items-center">
                      <span className="font-mono text-white text-sm">{r.origen} → {r.destino}</span>
                      <span className="text-xs bg-pink-500/20 text-pink-300 px-2 py-1 rounded-md">{r.cantidad} vuelos</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 glass-card p-6 border border-emerald-500/20 flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-emerald-500/10 rounded-xl"><Plane className="w-6 h-6 text-emerald-400" /></div>
                <h3 className="text-xl font-bold text-white font-heading">Rastreador de Flota Activa ({flota?.length || 0})</h3>
              </div>
              
              <div className="flex-1 overflow-auto rounded-xl border border-gray-800 bg-black/40 min-h-[250px] max-h-[350px]">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-400 uppercase bg-white/5 sticky top-0 z-10 backdrop-blur-md">
                    <tr>
                      <th className="px-4 py-3">Aeronave</th>
                      <th className="px-4 py-3">Modelo</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3">Última Ubicación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {flota?.map((f: any) => (
                      <tr key={f.avion_id} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 font-semibold text-white">{f.nombre}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{f.fabricante}</td>
                        <td className="px-4 py-3">
                          {f.estado === "EN VUELO" ? (
                            <span className="px-2 py-1 text-[10px] uppercase font-bold tracking-wider rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center w-max gap-1">
                              <Plane className="w-3 h-3" /> En Vuelo
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-[10px] uppercase font-bold tracking-wider rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center w-max gap-1">
                              <CheckCircle className="w-3 h-3" /> Estacionado
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-emerald-400">{f.ubicacion}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="glass-card p-8 border border-white/10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-blue-500/10 rounded-xl"><Users className="w-6 h-6 text-blue-400" /></div>
              <h3 className="text-2xl font-bold text-white font-heading">Buscador Rápido de Pasajeros</h3>
            </div>
            
            <div className="relative max-w-2xl">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="text"
                className="w-full bg-[#111] border-2 border-gray-800 rounded-xl py-4 pl-12 pr-12 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition shadow-[0_0_20px_rgba(0,0,0,0.5)]"
                placeholder="Busca por pasajero o destino de vuelo (ej. Madrid)..."
                value={passengerSearch}
                onChange={(e) => setPassengerSearch(e.target.value)}
              />
              <button 
                onClick={startVoiceSearch} 
                className="absolute inset-y-0 right-0 pr-4 flex items-center group cursor-pointer"
                title="Dictar por voz"
              >
                <div className="p-2 rounded-full bg-blue-500/10 group-hover:bg-blue-500/30 transition">
                  <Mic className="h-5 w-5 text-blue-400 group-hover:text-blue-300" />
                </div>
              </button>
              
              {passengerSearch && (
                <div className="absolute w-full mt-2 bg-[#1a1d2d] border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-20 animate-in slide-in-from-top-2">
                  {filteredPasajeros.length > 0 ? (
                    <ul className="divide-y divide-gray-800 max-h-60 overflow-y-auto">
                      {filteredPasajeros.map((p: any, i: number) => (
                        <li key={i} className="px-4 py-3 hover:bg-blue-600/20 cursor-pointer transition flex justify-between items-center group">
                          <span className="font-medium text-white">{p.nombre}</span>
                          <span className="text-xs bg-white/10 px-2 py-1 rounded text-gray-400 font-mono group-hover:text-white transition">Pass: {p.pasaporte}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      No se encontraron pasajeros que coincidan con la búsqueda.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Live Map Section */}
      <div className="mt-8">
        <h3 className="text-2xl font-bold font-heading mb-6">Mapa Mundial de Vuelos</h3>
        <FlightMap />
      </div>
    </div>
  );
}
