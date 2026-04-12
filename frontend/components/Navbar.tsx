"use client";

import { Plane, LayoutDashboard, Ticket, Map, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

export default function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/vuelos", label: "Vuelos", icon: Plane },
    { href: "/boletos", label: "Comprar Boleto", icon: Ticket },
    { href: "/gestion-boletos", label: "Gestión Boletos", icon: Ticket },
    { href: "/sugerencias", label: "Sugeridor de Rutas", icon: Map },
    { href: "/configuracion", label: "Configuración", icon: Settings },
  ];

  return (
    <nav className="w-64 glass-panel border-y-0 border-l-0 rounded-none h-full flex flex-col p-4 relative z-50">
      <div className="flex items-center gap-3 mb-10 px-2 mt-4 animate-float">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.5)]">
          <Plane className="text-white w-6 h-6" />
        </div>
        <span className="text-xl font-bold font-heading tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
          AirRes
        </span>
      </div>

      <div className="flex flex-col gap-2 flex-1 relative">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`relative px-4 py-3 rounded-xl flex items-center gap-3 transition-all duration-300 ${
                isActive ? "text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-xl"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <Icon className={`w-5 h-5 relative z-10 ${isActive ? "text-blue-400" : ""}`} />
              <span className="font-medium relative z-10">{link.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="mt-auto pt-8 flex items-center gap-3 px-2">
        <div className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center overflow-hidden">
           <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" alt="Admin" className="w-full h-full object-cover" />
        </div>
        <div>
          <p className="text-sm font-semibold">Admin Panel</p>
          <p className="text-xs text-gray-500">v1.0.0</p>
        </div>
      </div>
    </nav>
  );
}
