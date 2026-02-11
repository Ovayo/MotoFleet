
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
    <div className="flex flex-col lg:h-[calc(100vh-160px)] space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-gray-800">MotoTrack Live</h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase flex items-center">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse mr-2"></span>
            Cloud Monitoring Active
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
           <div className="flex-1 sm:flex-none bg-white px-3 py-2 rounded-xl border border-gray-50 text-center">
              <span className="text-blue-500 font-black text-[10px] uppercase">{trackableBikes.filter(b => b.tracker?.status === 'moving').length} Moving</span>
           </div>
           <div className="flex-1 sm:flex-none bg-white px-3 py-2 rounded-xl border border-gray-50 text-center">
              <span className="text-gray-400 font-black text-[10px] uppercase">{trackableBikes.filter(b => b.tracker?.status === 'parked').length} Parked</span>
           </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 md:gap-6 overflow-hidden">
        {/* Responsive Map Simulated Area */}
        <div className="h-[40vh] lg:h-full lg:flex-1 bg-gray-900 rounded-2xl md:rounded-[2.5rem] relative overflow-hidden border border-gray-800 shadow-xl">
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#3B82F6 0.5px, transparent 0.5px)', backgroundSize: '30px 30px' }}></div>
          
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             <div className="text-gray-800 text-[10vw] font-black opacity-5 uppercase">South Africa</div>
          </div>

          {trackableBikes.map(bike => {
            if (!bike.tracker) return null;
            const left = ((bike.tracker.lng + 180) % 360) / 360 * 1000 % 100;
            const top = (90 - bike.tracker.lat) / 180 * 1000 % 100;

            return (
              <button
                key={bike.id}
                onClick={() => setSelectedBikeId(bike.id)}
                className={`absolute w-7 h-7 md:w-9 md:h-9 rounded-full border-2 transform -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-125 z-10 flex items-center justify-center ${
                  selectedBikeId === bike.id ? 'border-white scale-125 ring-4 ring-blue-500/20 z-20' : 'border-blue-500/40'
                } ${
                  bike.tracker.status === 'moving' ? 'bg-blue-600' : 
                  bike.tracker.status === 'ignited' ? 'bg-amber-500' : 'bg-gray-700'
                }`}
                style={{ left: `${left}%`, top: `${top}%` }}
              >
                <span className="text-sm">🏍️</span>
                {bike.tracker.status === 'moving' && (
                  <span className="absolute -inset-1 rounded-full border border-blue-400 animate-ping opacity-30"></span>
                )}
              </button>
            );
          })}
        </div>

        {/* Responsive Sidebar Info Panel */}
        <div className="lg:w-80 bg-white rounded-2xl md:rounded-[2.5rem] border border-gray-100 p-6 md:p-8 shadow-sm lg:overflow-y-auto">
          {selectedBike && selectedBike.tracker ? (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 lg:slide-in-from-right-4">
               <div className="pb-4 border-b border-gray-50 flex justify-between items-start">
                 <div>
                   <h3 className="text-xl font-black text-gray-800 leading-tight uppercase tracking-tight">{selectedBike.licenseNumber}</h3>
                   <p className="text-[10px] text-gray-400 font-bold uppercase">{selectedBike.makeModel}</p>
                 </div>
                 <button onClick={() => setSelectedBikeId(null)} className="lg:hidden text-2xl text-gray-300 hover:text-gray-600 transition-colors">&times;</button>
               </div>

               <div className="grid grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
                  {[
                    { label: 'Battery', val: `${selectedBike.tracker.battery}%`, color: selectedBike.tracker.battery < 20 ? 'red' : 'gray' },
                    { label: 'Signal', val: selectedBike.tracker.signalStrength, color: 'gray' },
                    { label: 'Speed', val: `${selectedBike.tracker.speed || 0} km/h`, color: 'gray' },
                    { label: 'Ignition', val: (selectedBike.tracker.status === 'ignited' || selectedBike.tracker.status === 'moving' ? 'ON' : 'OFF'), color: 'gray' }
                  ].map((item, i) => (
                    <div key={i} className="p-3 bg-gray-50 rounded-xl">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{item.label}</p>
                      <p className={`text-xs font-black uppercase text-${item.color}-600`}>{item.val}</p>
                    </div>
                  ))}
               </div>

               <div className="space-y-2 pt-2">
                  <button className="w-full py-4 bg-red-600 text-white rounded-xl md:rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-red-100">
                    🚨 Immobilize Engine
                  </button>
                  <button className="w-full py-4 bg-gray-100 text-gray-600 rounded-xl md:rounded-2xl font-black text-[10px] uppercase tracking-widest">
                    Google Maps Link
                  </button>
               </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-10 lg:h-full">
               <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-2xl mb-4 shadow-sm">📍</div>
               <h4 className="text-[11px] font-black text-gray-800 uppercase mb-1">Select Asset</h4>
               <p className="text-[10px] text-gray-400 font-bold uppercase px-6">Click a marker on the map to interact</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrackingPortal;
