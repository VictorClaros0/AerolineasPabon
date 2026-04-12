import LogoUploader from "@/components/LogoUploader";
import { Settings } from "lucide-react";

export default function Configuracion() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-5 duration-500">
      <div className="mb-8">
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 flex items-center gap-3">
          <Settings className="w-8 h-8 text-blue-500" />
          Configuración Global
        </h2>
        <p className="text-gray-400 mt-2">Ajustes del sistema y personalización de marca para todos los nodos BD.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <LogoUploader />

         <div className="glass-panel p-8 mt-10 space-y-6">
            <h3 className="text-2xl font-bold font-heading">Preferencias del Sistema</h3>
            
            <div className="space-y-4">
               <div>
                 <label className="text-sm font-semibold text-gray-400">Nombre de la Aerolínea</label>
                 <input type="text" defaultValue="AirRes Global" className="mt-1 w-full glass-card p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-white border-white/10" />
               </div>
               
               <div>
                 <label className="text-sm font-semibold text-gray-400">Modo de Sincronización DB</label>
                 <select className="mt-1 w-full glass-card p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-white border-white/10">
                   <option value="realtime">En Tiempo Real (Recomendado)</option>
                   <option value="batch">Asíncrono (Diferido 5m)</option>
                 </select>
               </div>
            </div>

            <button className="btn-primary w-full mt-4">Guardar Preferencias</button>
         </div>
      </div>
    </div>
  );
}
