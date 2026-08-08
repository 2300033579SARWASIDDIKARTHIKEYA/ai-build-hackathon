import React, { useState } from 'react';
import { Layers, Sparkles, RefreshCw } from 'lucide-react';

export const VectorSpaceVisualizer: React.FC = () => {
  const [activeCluster, setActiveCluster] = useState<'all' | 'fashion' | 'tech' | 'lifestyle'>('all');

  const vectorPoints = [
    { id: '1', x: 25, y: 30, category: 'fashion', label: 'Minimalist Leather Jacket' },
    { id: '2', x: 30, y: 22, category: 'fashion', label: 'Selvedge Japanese Denim' },
    { id: '3', x: 22, y: 38, category: 'fashion', label: 'Leather Chelsea Boots' },
    { id: '4', x: 75, y: 70, category: 'tech', label: 'Spatial ANC Headphones' },
    { id: '5', x: 80, y: 78, category: 'tech', label: 'RGB Mechanical Keyboard' },
    { id: '6', x: 70, y: 82, category: 'tech', label: 'Wireless Precision Mouse' },
    { id: '7', x: 45, y: 60, category: 'lifestyle', label: 'Titanium Sunglasses' },
    { id: '8', x: 52, y: 55, category: 'lifestyle', label: 'Automatic Chronograph Watch' },
  ];

  const filteredPoints = vectorPoints.filter(p => activeCluster === 'all' || p.category === activeCluster);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">512-Dimensional Multimodal Vector Space Projection</h3>
            <p className="text-xs text-slate-400">FAISS nearest-neighbor semantic vector cluster representation</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
          {(['all', 'fashion', 'tech', 'lifestyle'] as const).map(cls => (
            <button
              key={cls}
              onClick={() => setActiveCluster(cls)}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold capitalize transition-all ${
                activeCluster === cls 
                  ? 'bg-cyan-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {cls}
            </button>
          ))}
        </div>
      </div>

      {/* Vector Plane Simulation Canvas */}
      <div className="relative h-64 w-full bg-slate-950 rounded-xl border border-slate-800/80 overflow-hidden flex items-center justify-center">
        {/* Grid Lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:24px_24px]" />
        
        {/* Cluster Orbits */}
        <div className="absolute left-1/4 top-1/3 w-40 h-40 rounded-full border border-blue-500/20 bg-blue-500/5 blur-xl pointer-events-none" />
        <div className="absolute right-1/4 bottom-1/4 w-44 h-44 rounded-full border border-purple-500/20 bg-purple-500/5 blur-xl pointer-events-none" />

        {/* Dots */}
        {filteredPoints.map((pt) => {
          const colorClass = pt.category === 'fashion' ? 'bg-amber-400 shadow-amber-400/50' : pt.category === 'tech' ? 'bg-blue-400 shadow-blue-400/50' : 'bg-emerald-400 shadow-emerald-400/50';
          return (
            <div
              key={pt.id}
              style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
            >
              <div className={`w-3.5 h-3.5 rounded-full ${colorClass} shadow-lg animate-pulse`} />
              
              {/* Tooltip */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-white text-[10px] font-semibold whitespace-nowrap shadow-xl z-20 pointer-events-none">
                {pt.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
