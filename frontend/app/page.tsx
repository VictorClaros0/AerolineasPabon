"use client";

import { Plane, Users, CalendarSync, Activity } from "lucide-react";
import FlightMap from "@/components/FlightMap";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const stats = [
    { label: "Vuelos Activos", value: "124", icon: Plane, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Pasajeros Hoy", value: "8,234", icon: Users, color: "text-purple-400", bg: "bg-purple-500/10" },
    { label: "Sincronización BD", value: "Activa (3 Nodos)", icon: CalendarSync, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Rutas Óptimas", value: "34 Nuevas", icon: Activity, color: "text-pink-400", bg: "bg-pink-500/10" },
  ];

  const [currentTime, setCurrentTime] = useState<string>("--:--:--");
  const [recentFlights, setRecentFlights] = useState<any[]>(Array(10).fill({
    time: "--:--", destination: "---", flight: "---", gate: "--", remark: "Cargando...", color: "text-gray-500"
  }));

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
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

          const formatFlights = vuelos.slice(0, 10).map((v: any) => {
            const destCiudad = ciudades.find((c: any) => c.id === v.id_destino);
            const destinationName = destCiudad ? (destCiudad.codigo + " " + destCiudad.pais).substring(0, 15).toUpperCase() : "UNKNOWN";

            const date = new Date(v.salida_programada * 1000);
            const timeStr = date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
            
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

          // Rellenar hasta 10 si hay menos
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
    const flightInterval = setInterval(fetchVuelos, 60000); // Refrescar cada minuto
    return () => clearInterval(flightInterval);
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-12">
      <div>
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
          Panel General
        </h2>
        <p className="text-gray-400 mt-2">Visión general del estado de tus aerolíneas y vuelos.</p>
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
            <div className="ml-auto flex gap-4 text-yellow-400 font-mono text-2xl tracking-widest [text-shadow:0_0_8px_#facc15]">
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
              <div className="flex flex-col gap-2 font-mono text-sm md:text-base lg:text-lg uppercase tracking-[0.15em] font-bold">
                {recentFlights.map((flight, i) => (
                  <div key={i} className="grid grid-cols-12 gap-4 py-2 px-2 items-center bg-[#0a0a0a] border-y border-gray-900/80 rounded-sm">
                    <div className="col-span-2 text-yellow-400 [text-shadow:0_0_8px_#facc15]">{flight.time}</div>
                    <div className="col-span-3 text-yellow-400 [text-shadow:0_0_8px_#facc15] truncate">{flight.destination}</div>
                    <div className="col-span-2 text-yellow-400 [text-shadow:0_0_8px_#facc15]">{flight.flight}</div>
                    <div className="col-span-2 text-yellow-400 [text-shadow:0_0_8px_#facc15] text-center">{flight.gate}</div>
                    <div className={`col-span-3 ${flight.color} truncate`}>{flight.remark}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="glass-panel p-6">
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

      {/* Live Map Section */}
      <div className="mt-8">
        <h3 className="text-2xl font-bold font-heading mb-6">Mapa Mundial de Vuelos</h3>
        <FlightMap />
      </div>
    </div>
  );
}
