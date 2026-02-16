
import React, { useState, useEffect, useMemo } from 'react';
import { Bike, Driver } from '../types';

interface KineticSingularityProps {
  bikes: Bike[];
  drivers: Driver[];
}

const KineticSingularity: React.FC<KineticSingularityProps> = ({ bikes, drivers }) => {
  const [pulse, setPulse] = useState(0);
  const [activeNode, setActiveNode] = useState<number | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(p => (p + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const flowIntensity = useMemo(() => {
    return Math.floor(Math.random() * 20) + 80;
  }, [pulse]);

  return (
    <div className="min-h-[80vh] bg-gray-950 rounded-[4rem] border border-white/5 shadow-2xl relative overflow-hidden p-10 md:p-20 text-white">
      {/* Background Neural Field */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#4F46E5_0%,transparent_50%)]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white/5 rounded-full animate-ping-slow"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white/5 rounded-full animate-ping-slow [animation-delay:2s]"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-12">
        <div className="space-y-4">
          <div className="bg-indigo-600/20 text-indigo-400 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.4em] border border-indigo-500/30 inline-block animate-pulse">
            Neural Core Active
          </div>
          <h1 className="text-4xl md:text-7xl font-black tracking-tighter uppercase leading-none">
            Kinetic <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-400 to-purple-400">Singularity</span>
          </h1>
          <p className="text-gray-500 text-xs md:text-sm font-bold uppercase tracking-[0.3em] max-w-2xl mx-auto leading-relaxed">
            The transition from a managed fleet to a self-orchestrating urban organism. Management is legacy. Flow is destiny.
          </p>
        </div>

        {/* The Core Visualization */}
        <div className="relative w-80 h-80 md:w-[500px] md:h-[500px] flex items-center justify-center">
          {/* Central Oracle Node */}
          <div className="w-32 h-32 md:w-48 md:h-48 bg-white/5 backdrop-blur-3xl rounded-full border border-white/10 shadow-[0_0_100px_rgba(79,70,229,0.3)] flex items-center justify-center relative group">
            <div className="absolute inset-0 bg-indigo-600 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <span className="text-4xl md:text-6xl animate-float">👁️</span>
          </div>

          {/* Orbiting Momentum Nodes (Bikes) */}
          {bikes.slice(0, 7).map((bike, idx) => {
            const angle = (idx / 7) * Math.PI * 2 + (pulse / 50);
            const radius = 180 + Math.sin(pulse / 10 + idx) * 10;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            return (
              <div 
                key={bike.id}
                onMouseEnter={() => setActiveNode(idx)}
                onMouseLeave={() => setActiveNode(null)}
                className="absolute w-12 h-12 md:w-16 md:h-16 transition-all duration-300 cursor-pointer"
                style={{ transform: `translate(${x}px, ${y}px)` }}
              >
                <div className={`w-full h-full bg-black/40 backdrop-blur-xl border rounded-[1.2rem] flex items-center justify-center text-xl shadow-xl transition-all ${activeNode === idx ? 'border-indigo-400 scale-125' : 'border-white/10'}`}>
                  🏍️
                  {activeNode === idx && (
                    <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 whitespace-nowrap">
                      <p className="text-[8px] font-black uppercase text-indigo-300">{bike.licenseNumber}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Connection Lines (Simulated with simple SVG) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
            <circle cx="50%" cy="50%" r="180" fill="none" stroke="white" strokeWidth="0.5" strokeDasharray="10 20" />
          </svg>
        </div>

        {/* Prophetic Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
          <div className="bg-white/5 border border-white/5 p-8 rounded-[2.5rem] hover:bg-white/10 transition-all text-left group">
            <p className="text-indigo-400 text-[9px] font-black uppercase tracking-widest mb-4">Manifestation Rate</p>
            <h4 className="text-4xl font-black mb-2">99.2<span className="text-lg opacity-40">%</span></h4>
            <p className="text-gray-500 text-[10px] font-bold uppercase leading-relaxed">Predictive delivery success across JHB, CTN and EL nodes.</p>
          </div>
          <div className="bg-white/5 border border-white/5 p-8 rounded-[2.5rem] hover:bg-white/10 transition-all text-left">
            <p className="text-cyan-400 text-[9px] font-black uppercase tracking-widest mb-4">Neural Sync Depth</p>
            <h4 className="text-4xl font-black mb-2">{flowIntensity}<span className="text-lg opacity-40">Hz</span></h4>
            <p className="text-gray-500 text-[10px] font-bold uppercase leading-relaxed">Average driver-vessel harmony across active operational zones.</p>
          </div>
          <div className="bg-white/5 border border-white/5 p-8 rounded-[2.5rem] hover:bg-white/10 transition-all text-left">
            <p className="text-purple-400 text-[9px] font-black uppercase tracking-widest mb-4">Quantum Arrears</p>
            <h4 className="text-4xl font-black mb-2">0.00<span className="text-lg opacity-40">R</span></h4>
            <p className="text-gray-500 text-[10px] font-bold uppercase leading-relaxed">System-wide financial equilibrium achieved through autonomous self-taxing nodes.</p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes ping-slow {
          0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
          50% { opacity: 0.5; }
          100% { transform: translate(-50%, -50%) scale(1.2); opacity: 0; }
        }
        .animate-ping-slow {
          animation: ping-slow 4s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default KineticSingularity;
