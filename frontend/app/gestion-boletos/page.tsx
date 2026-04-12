"use client";

import { useEffect, useState } from "react";
import { Ticket, Search, Loader2, ArrowRight, User, CheckCircle, XCircle, CreditCard, ChevronDown, Plane } from "lucide-react";

export default function GestionBoletos() {
  const [boletos, setBoletos] = useState([]);
  const [vuelos, setVuelos] = useState([]);
  const [ciudades, setCiudades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBoleto, setSelectedBoleto] = useState<any>(null);
  const [updating, setUpdating] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = async () => {
    try {
      const countryData = JSON.parse(localStorage.getItem("airres-country") || "{}");
      const countryHeaders = {
        "X-User-Country": countryData.name || "Estados Unidos",
        "X-Region": countryData.region || "America"
      };
      
      const [cRes, vRes, bRes] = await Promise.all([
        fetch("http://localhost:8080/api/ciudades", { headers: countryHeaders }),
        fetch("http://localhost:8080/api/vuelos", { headers: countryHeaders }),
        fetch("http://localhost:8080/api/boletos", { headers: countryHeaders })
      ]);

      if (cRes.ok) setCiudades(await cRes.json());
      if (vRes.ok) setVuelos(await vRes.json());
      if (bRes.ok) setBoletos(await bRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const changeTicketState = async (boletoId: number, newState: string) => {
    if (!confirm(`¿Estás seguro que deseas cambiar el estado a ${newState}?`)) return;
    setUpdating(true);
    try {
      const countryData = JSON.parse(localStorage.getItem("airres-country") || "{}");
      const countryHeaders = {
        "X-User-Country": countryData.name || "Estados Unidos",
        "X-Region": countryData.region || "America",
        "Content-Type": "application/json"
      };

      const res = await fetch(`http://localhost:8080/api/boletos/${boletoId}/estado`, {
        method: "PATCH",
        headers: countryHeaders,
        body: JSON.stringify({ estado: newState })
      });

      if (res.ok) {
        await fetchData(); // Refresh data
        if (selectedBoleto?.id_boleto === boletoId) {
            setSelectedBoleto({ ...selectedBoleto, estado: newState });
        }
      } else {
        const d = await res.json();
        alert(d.error || "Hubo un error actualizando el estado");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdating(false);
    }
  };

  const getFlightDetails = (idVuelo: number) => {
    const v: any = vuelos.find((v: any) => v.id === idVuelo);
    if (!v) return null;
    const org = ciudades.find((c: any) => c.id === v.id_origen) as any;
    const dst = ciudades.find((c: any) => c.id === v.id_destino) as any;
    return { flight: v, org, dst };
  };

  const filterBoletos = () => {
    if (!searchTerm) return boletos;
    return boletos.filter((b: any) => 
      b.nombre_pasajero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.email_pasajero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.pasaporte?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const statusColors = (estado: string) => {
    switch (estado) {
      case "RESERVED": return "bg-yellow-500/20 text-yellow-500 border-yellow-500/50";
      case "SALED": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/50";
      case "ANNULLED": return "bg-red-500/20 text-red-500 border-red-500/50";
      default: return "bg-gray-500/20 text-gray-500 border-gray-500/50";
    }
  };

  if (loading) {
    return <div className="h-[600px] flex items-center justify-center"><Loader2 className="w-12 h-12 text-blue-500 animate-spin" /></div>;
  }

  const filtered = filterBoletos();

  return (
    <div className="animate-in fade-in slide-in-from-bottom-5 duration-500 max-w-7xl mx-auto pb-20">
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 flex items-center gap-3">
            <Ticket className="text-blue-400 w-10 h-10" /> Gestión de Boletos
          </h2>
          <p className="text-gray-400 mt-2 text-lg">Administración de ventas, reservas y cancelaciones.</p>
        </div>
        
        <div className="relative min-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Buscar pasajero, email o pasaporte..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder:text-gray-600 focus:border-blue-500 outline-none transition"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LIST SECTION */}
        <div className="lg:col-span-2 glass-panel p-6 h-[650px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
             <h3 className="font-bold text-xl uppercase tracking-wider text-gray-300">Todos los Boletos ({filtered.length})</h3>
             <button onClick={() => fetchData()} className="text-sm text-blue-400 hover:text-blue-300">Refrescar</button>
          </div>
          
          <div className="overflow-y-auto flex-1 pr-2 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
             {filtered.length === 0 ? (
               <div className="h-full flex items-center justify-center text-gray-500 italic border-dashed border-2 border-white/5 rounded-2xl">
                  No se encontraron boletos.
               </div>
             ) : (
               filtered.map((b: any) => {
                 const details = getFlightDetails(b.id_vuelo);
                 return (
                   <div 
                     key={b.id_boleto}
                     onClick={() => setSelectedBoleto(b)}
                     className={`p-4 rounded-2xl bg-white/5 border cursor-pointer hover:border-blue-500/50 hover:bg-white/10 transition-all ${selectedBoleto?.id_boleto === b.id_boleto ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.15)]' : 'border-white/10'}`}
                   >
                     <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center">
                              <User className="text-gray-400 w-5 h-5" />
                           </div>
                           <div>
                              <p className="font-bold text-white text-lg">{b.nombre_pasajero}</p>
                              <p className="text-xs text-gray-400">{b.email_pasajero}</p>
                           </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColors(b.estado)}`}>
                           {b.estado}
                        </span>
                     </div>
                     <div className="flex items-center gap-6 text-sm">
                        <div>
                           <p className="text-[10px] text-gray-500 font-bold uppercase uppercase">Boleto ID</p>
                           <p className="font-mono text-gray-300">#{b.id_boleto}</p>
                        </div>
                        {details && (
                          <div className="flex items-center gap-2">
                             <div className="text-gray-400 font-medium">{details.org?.codigo}</div>
                             <ArrowRight className="w-3 h-3 text-gray-600" />
                             <div className="text-gray-400 font-medium">{details.dst?.codigo}</div>
                          </div>
                        )}
                        <div>
                           <p className="text-[10px] text-gray-500 font-bold uppercase uppercase">Costo</p>
                           <p className="font-bold text-green-400">${b.costo}</p>
                        </div>
                     </div>
                   </div>
                 );
               })
             )}
          </div>
        </div>

        {/* DETAILS SECTION */}
        <div className="lg:col-span-1 glass-panel p-6 h-[650px] sticky top-32 overflow-y-auto">
           {selectedBoleto ? (
             <div className="animate-in zoom-in duration-300 fade-in">
               <h3 className="font-bold text-xl uppercase tracking-wider text-white mb-6 border-b border-white/10 pb-4">Detalle del Boleto</h3>
               
               <div className="space-y-6">
                 <div>
                   <label className="text-[10px] uppercase text-gray-500 font-bold tracking-widest block mb-1">Nombre</label>
                   <p className="text-lg font-bold">{selectedBoleto.nombre_pasajero}</p>
                 </div>
                 
                 <div>
                   <label className="text-[10px] uppercase text-gray-500 font-bold tracking-widest block mb-1">Datos de Contacto e Identificación</label>
                   <p className="text-sm text-gray-300">Email: {selectedBoleto.email_pasajero}</p>
                   <p className="text-sm text-gray-300">Pasaporte: {selectedBoleto.pasaporte}</p>
                 </div>

                 <div className="h-px w-full bg-white/10 my-4" />

                 {getFlightDetails(selectedBoleto.id_vuelo) && (
                   <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-4">
                     <p className="text-[10px] uppercase text-blue-400 font-bold tracking-widest block">Información del Vuelo</p>
                     
                     <div className="flex items-center justify-between">
                        <div>
                           <p className="text-2xl font-bold">{getFlightDetails(selectedBoleto.id_vuelo)?.org?.codigo}</p>
                           <p className="text-xs text-gray-400 line-clamp-1 max-w-[80px]">{getFlightDetails(selectedBoleto.id_vuelo)?.org?.pais}</p>
                        </div>
                        <div className="flex-1 px-4 flex flex-col items-center">
                           <p className="text-[10px] text-gray-500">{selectedBoleto.tiempo_de_viaje} hrs</p>
                           <div className="w-full h-px bg-white/20 relative my-2">
                             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-1">
                               <Plane className="w-3 h-3 text-blue-400" />
                             </div>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-2xl font-bold">{getFlightDetails(selectedBoleto.id_vuelo)?.dst?.codigo}</p>
                           <p className="text-xs text-gray-400 line-clamp-1 max-w-[80px]">{getFlightDetails(selectedBoleto.id_vuelo)?.dst?.pais}</p>
                        </div>
                     </div>

                     <div className="flex justify-between pt-2">
                        <div>
                           <p className="text-[10px] text-gray-500">Asiento</p>
                           {/* Not showing exact seat text because id_asiento is integer and code is not here easily unless fetched */}
                           <p className="font-bold text-white">#{selectedBoleto.id_asiento}</p>
                        </div>
                        <div className="text-right">
                           <p className="text-[10px] text-gray-500">Precio Pagado</p>
                           <p className="font-bold text-green-400">${selectedBoleto.costo}</p>
                        </div>
                     </div>
                   </div>
                 )}

                 <div className="pt-6 border-t border-white/10 mt-6">
                    <p className="text-[10px] uppercase text-gray-500 font-bold tracking-widest block mb-4">Acciones de Estado</p>
                    <div className="flex flex-col gap-3">
                       <button 
                         onClick={() => changeTicketState(selectedBoleto.id_boleto, "RESERVED")}
                         disabled={updating || selectedBoleto.estado === "RESERVED"}
                         className={`py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition border ${selectedBoleto.estado === "RESERVED" ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50 cursor-not-allowed hidden' : 'bg-transparent border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10'}`}
                       >
                         {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronDown className="w-4 h-4" />} Mover a Reserva
                       </button>

                       <button 
                         onClick={() => changeTicketState(selectedBoleto.id_boleto, "SALED")}
                         disabled={updating || selectedBoleto.estado === "SALED"}
                         className={`py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-lg ${selectedBoleto.estado === "SALED" ? 'bg-emerald-600/50 text-white cursor-not-allowed border-emerald-500/50 hidden' : 'bg-emerald-600 hover:bg-emerald-500 text-white border-transparent'}`}
                       >
                         {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />} Confirmar Compra
                       </button>

                       <button 
                         onClick={() => changeTicketState(selectedBoleto.id_boleto, "ANNULLED")}
                         disabled={updating || selectedBoleto.estado === "ANNULLED"}
                         className={`py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition border ${selectedBoleto.estado === "ANNULLED" ? 'bg-red-500/20 text-red-500 border-red-500/50 cursor-not-allowed hidden' : 'bg-transparent border-red-500/50 text-red-500 hover:bg-red-500/10'}`}
                       >
                         {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />} Anular Boleto
                       </button>
                    </div>
                 </div>
               </div>
             </div>
           ) : (
             <div className="h-full flex flex-col justify-center items-center text-center opacity-50 border-2 border-dashed border-white/10 rounded-2xl p-6">
                <Ticket className="w-16 h-16 text-gray-600 mb-4" />
                <h4 className="text-xl font-bold mb-2">Ningún Boleto Seleccionado</h4>
                <p className="text-gray-400 text-sm">Haz clic en un boleto de la lista de la izquierda para ver los detalles y actualizar su estado.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
