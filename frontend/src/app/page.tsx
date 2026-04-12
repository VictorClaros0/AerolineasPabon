import { Plane, Users, CalendarSync, Activity } from "lucide-react";

export default function Dashboard() {
  const stats = [
    { label: "Vuelos Activos", value: "124", icon: Plane, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Pasajeros Hoy", value: "8,234", icon: Users, color: "text-purple-400", bg: "bg-purple-500/10" },
    { label: "Sincronización BD", value: "Activa (3 Nodos)", icon: CalendarSync, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Rutas Óptimas", value: "34 Nuevas", icon: Activity, color: "text-pink-400", bg: "bg-pink-500/10" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
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
        <div className="lg:col-span-2 glass-panel p-6 h-96 flex flex-col">
          <h3 className="text-xl font-bold mb-4 font-heading">Actividad Reciente</h3>
          <div className="flex-1 rounded-xl bg-gradient-to-br from-blue-900/10 to-purple-900/10 border border-white/5 flex items-center justify-center">
            <p className="text-gray-500">Gráfico de actividad de vuelos (Placeholder)</p>
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
    </div>
  );
}
