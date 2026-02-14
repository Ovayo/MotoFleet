
import React, { useState } from 'react';
import { Bike } from '../types';

interface TrackingPortalProps {
  bikes: Bike[];
}

const TrackingPortal: React.FC<TrackingPortalProps> = ({ bikes }) => {
  const [selectedBikeId, setSelectedBikeId] = useState<string | null>(null);
  const selectedBike = bikes.find(b => b.id === selectedBikeId);
  const trackableBikes = bikes.filter(b => b.tracker);

  return (
    <div className="flex flex-col lg:h-[calc(100vh-280px)] space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase leading-none">Telemetry Hub</h2>
          <p className="text-[11px] text-gray-400 font-black uppercase tracking-[0.3em] mt-3">Real-time Satellite Grid Active</p>
        </div>
        <div className="flex bg-white/70 backdrop-blur-xl p-2 rounded-2xl border border-white/60 shadow-sm">
           <div className="px-6 py-3 border-r border-gray-100 flex flex-col items-center">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Signal Strength</span>
              <span className="text-xs font-black text-blue-500 uppercase">98% Nominal</span>
           </div>
           <div className="px-6 py-3 flex flex-col items-center">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Grid Lock</span>
              <span className="text-xs font-black text-green-500 uppercase">{trackableBikes.length} Assets</span>
           </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-10 overflow-hidden min-h-[500px]">
        {/* premium Map Simulated Area */}
        <div className="h-full lg:flex-1 bg-gray-950 rounded-[4rem] relative overflow-hidden shadow-2xl border-4 border-gray-900 group">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#3B82F6 0.5px, transparent 0.5px)', backgroundSize: '40px 40px' }}></div>
          
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
             <div className="text-white text-[15vw] font-black uppercase tracking-tighter">GRID MAP</div>
          </div>

          {trackableBikes.map(bike => {
            const left = ((bike.tracker!.lng + 180) % 360) / 360 * 1000 % 100;
            const top = (90 - bike.tracker!.lat) / 180 * 1000 % 100;

            return (
              <button
                key={bike.id}
                onClick={() => setSelectedBikeId(bike.id)}
                className={`absolute w-10 h-10 rounded-3xl border-4 transform -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-125 z-10 flex items-center justify-center ${
                  selectedBikeId === bike.id ? 'border-white scale-125 ring-8 ring-blue-500/20 z-20' : 'border-blue-500/40'
                } ${
                  bike.tracker!.status === 'moving' ? 'bg-blue-600 shadow-[0_0_20px_rgba(59,130,246,0.8)]' : 'bg-gray-800'
                }`}
                style={{ left: `${left}%`, top: `${top}%` }}
              >
                <span className="text-lg">🏍️</span>
                {bike.tracker!.status === 'moving' && (
                  <span className="absolute -inset-2 rounded-3xl border-2 border-blue-400 animate-ping opacity-30"></span>
                )}
              </button>
            );
          })}

          {/* Map Controls */}
          <div className="absolute bottom-10 left-10 flex flex-col gap-3">
             <button className="w-12 h-12 bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl text-white hover:bg-white/20 transition-all font-black">+</button>
             <button className="w-12 h-12 bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl text-white hover:bg-white/20 transition-all font-black">-</button>
          </div>
        </div>

        {/* Info HUD */}
        <div className="lg:w-96 bg-white/80 backdrop-blur-3xl rounded-[4rem] border border-white/60 p-10 shadow-sm lg:overflow-y-auto relative no-scrollbar">
          {selectedBike ? (
            <div className="space-y-10 animate-in slide-in-from-right-10 duration-700">
               <div>
                  <h3 className="text-4xl font-black text-gray-900 tracking-tighter uppercase leading-none mb-3">{selectedBike.licenseNumber}</h3>
                  <p className="text-[11px] text-blue-500 font-black uppercase tracking-[0.3em]">{selectedBike.makeModel}</p>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  {[
                    { l: 'Velocity', v: `${selectedBike.tracker!.speed}km/h` },
                    { l: 'Battery', v: `${selectedBike.tracker!.battery}%` },
                    { l: 'Signal', v: 'Strong' },
                    { l: 'Ignition', v: 'Active' }
                  ].map((stat, i) => (
                    <div key={i} className="bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100/50 shadow-inner">
                       <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.l}</p>
                       <p className="text-lg font-black text-gray-900">{stat.v}</p>
                    </div>
                  ))}
               </div>

               <div className="space-y-4 pt-6">
                  <button className="w-full py-6 bg-red-600 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-[0.3em] shadow-2xl shadow-red-200 hover:scale-105 transition-all">
                    🚨 Immobilize Unit
                  </button>
                  <button className="w-full py-6 bg-gray-900 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-[0.3em] shadow-2xl transition-all">
                    Satellite Link
                  </button>
               </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center h-full space-y-8 opacity-40">
               <div className="w-24 h-24 bg-gray-50 rounded-[3rem] flex items-center justify-center text-5xl shadow-inner">📍</div>
               <div>
                  <h4 className="text-xs font-black text-gray-900 uppercase tracking-[0.3em] mb-2">Select Active node</h4>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-10">Click any operational unit on the satellite grid to link telemetry</p>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrackingPortal;
