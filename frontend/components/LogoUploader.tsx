"use client";

import { useState } from "react";
import { UploadCloud, Check } from "lucide-react";

export default function LogoUploader() {
  const [dragActive, setDragActive] = useState(false);
  const [uploaded, setUploaded] = useState<string | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files[0]);
    }
  };

  const handleFiles = (file: File) => {
    // In a real application, send this file to the Go backend via FormData
    const url = URL.createObjectURL(file);
    setUploaded(url);
    // Simulation:
    setTimeout(() => {
      // alert("Logo guardado exitosamente");
    }, 500);
  };

  return (
    <div className="glass-panel p-8 max-w-2xl mx-auto w-full mt-10">
      <h3 className="text-2xl font-bold font-heading mb-2">Personaliza tu Aerolínea</h3>
      <p className="text-gray-400 mb-6 text-sm">Sube aquí el logotipo corporativo para visualizarlo en los recibos y el portal principal.</p>
      
      <form
        className={`relative w-full h-64 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all ${
          dragActive ? "border-blue-500 bg-blue-500/10" : "border-gray-600 hover:border-gray-500 bg-white/5"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept="image/*"
          onChange={handleChange}
        />
        
        {uploaded ? (
          <div className="flex flex-col items-center animate-in zoom-in duration-300">
            <div className="w-24 h-24 rounded-2xl overflow-hidden mb-4 shadow-[0_0_20px_rgba(59,130,246,0.3)] bg-white/10 p-2 border border-white/10">
                <img src={uploaded} alt="Logo de Aerolínea" className="w-full h-full object-contain" />
            </div>
            <div className="flex items-center gap-2 text-emerald-400 font-medium">
              <Check className="w-5 h-5" />
              Logo Asignado
            </div>
          </div>
        ) : (
          <label htmlFor="file-upload" className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
            <div className="p-4 bg-blue-500/10 text-blue-400 rounded-full mb-4">
              <UploadCloud className="w-8 h-8" />
            </div>
            <p className="font-medium text-lg">Arrastra tu logo aquí</p>
            <p className="text-sm text-gray-400 mt-2">Formatos: PNG, JPG, SVG</p>
            
            <div className="mt-6 px-6 py-2 bg-white/10 rounded-full font-medium hover:bg-white/20 transition-colors">
              Explorar archivos
            </div>
          </label>
        )}
      </form>
    </div>
  );
}
