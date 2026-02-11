
import React, { useState, useEffect } from 'react';
import { Bike } from '../types';

interface TrackingPortalProps {
  bikes: Bike[];
}

const TrackingPortal: React.FC<TrackingPortalProps> = ({ bikes }) => {
  const [selectedBikeId, setSelectedBikeId] = useState<string | null>(null);
  const selectedBike = bikes.find(b => b.id === selectedBikeId);

  // Filter bikes that have trackers
  const trackableBikes = bikes.filter(b => b.tracker);

  return (
    <div className="h-[calc(100vh-160px)] flex flex-col space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800">MotoTrack Live</h2>
          <p className="text-xs text-gray-400 font-medium flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></span>
            Real-time GPS Monitoring (South Africa)
          </p>
        </div>
        <div className="flex space-x-2">
           <div className="bg-white px-3 py-1.5 rounded-lg border border-gray-100 flex items-center space-x-2">
              <span className="text-green-500 font-bold text-xs">{trackableBikes.filter(b => b.tracker?.status === 'moving').length} Moving</span>
           </div>
           <div className="bg-white px-3 py-1.5 rounded-lg border border-gray-100 flex items-center space-x-2">
              <span className="text-gray-400 font-bold text-xs">{trackableBikes.filter(b => b.tracker?.status === 'parked').length} Parked</span>
           </div>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Map Simulation Area */}
        <div className="flex-1 bg-gray-900 rounded-3xl relative overflow-hidden border border-gray-800 shadow-2xl">
          {/* Grid Background */}
          <div className="absolute inset-0 opacity-20 pointer-events-none" 
               style={{ 
                 backgroundImage: 'radial-gradient(#3B82F6 0.5px, transparent 0.5px)', 
                 backgroundSize: '30px 30px' 
               }}></div>
          
          {/* Simulated Map Content */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             <div className="text-gray-700 text-[100px] font-black opacity-10 uppercase tracking-tighter">South Africa</div>
          </div>

          {/* Bike Markers */}
          {trackableBikes.map(bike => {
            if (!bike.tracker) return null;
            // Simplified positioning for mock
            const left = ((bike.tracker.lng + 180) % 360) / 360 * 1000 % 100;
            const top = (90 - bike.tracker.lat) / 180 * 1000 % 100;

            return (
              <button
                key={bike.id}
                onClick={() => setSelectedBikeId(bike.id)}
                className={`absolute w-8 h-8 rounded-full border-2 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 hover:scale-125 z-10 flex items-center justify-center ${
                  selectedBikeId === bike.id ? 'border-white scale-125 ring-4 ring-blue-500/30' : 'border-blue-500/50'
                } ${
                  bike.tracker.status === 'moving' ? 'bg-blue-600' : 
                  bike.tracker.status === 'ignited' ? 'bg-amber-500' : 'bg-gray-700'
                }`}
                style={{ left: `${left}%`, top: `${top}%` }}
              >
                <span className="text-white text-xs">🏍️</span>
                {bike.tracker.status === 'moving' && (
                  <span className="absolute -inset-1 rounded-full border border-blue-400 animate-ping opacity-50"></span>
                )}
              </button>
            );
          })}

          {/* Map Controls */}
          <div className="absolute bottom-6 left-6 space-y-2">
             <button className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl text-white font-bold hover:bg-white/20 transition-all">+</button>
             <button className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl text-white font-bold hover:bg-white/20 transition-all">-</button>
          </div>
        </div>

        {/* Sidebar Info Panel */}
        <div className="w-80 bg-white rounded-3xl border border-gray-100 p-6 shadow-sm overflow-y-auto">
          {selectedBike && selectedBike.tracker ? (
            <div className="space-y-6 animate-in slide-in-from-right-4">
               <div className="pb-4 border-b border-gray-50">
                 <h3 className="text-xl font-black text-gray-800 leading-tight">{selectedBike.licenseNumber}</h3>
                 <p className="text-xs text-gray-400 font-bold uppercase">{selectedBike.makeModel}</p>
                 <div className="mt-3 flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                      selectedBike.tracker.status === 'moving' ? 'bg-blue-100 text-blue-700' : 
                      selectedBike.tracker.status === 'parked' ? 'bg-gray-100 text-gray-500' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {selectedBike.tracker.status}
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold">• Last update 4s ago</span>
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-2xl">
                     <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Battery</p>
                     <p className={`text-sm font-black ${selectedBike.tracker.battery < 20 ? 'text-red-500' : 'text-gray-800'}`}>{selectedBike.tracker.battery}%</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-2xl">
                     <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Signal</p>
                     <p className="text-sm font-black text-gray-800 capitalize">{selectedBike.tracker.signalStrength}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-2xl">
                     <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Speed</p>
                     <p className="text-sm font-black text-gray-800">{selectedBike.tracker.speed || 0} km/h</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-2xl">
                     <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Ignition</p>
                     <p className="text-sm font-black text-gray-800">{selectedBike.tracker.status === 'ignited' || selectedBike.tracker.status === 'moving' ? 'ON' : 'OFF'}</p>
                  </div>
               </div>

               <div className="space-y-3">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-1">Asset Metadata</p>
                 <div className="flex justify-between text-xs">
                    <span className="text-gray-400">IMEI</span>
                    <span className="font-mono font-bold text-gray-700">{selectedBike.tracker.imei}</span>
                 </div>
                 <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Latitude</span>
                    <span className="font-mono font-bold text-gray-700">{selectedBike.tracker.lat}</span>
                 </div>
                 <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Longitude</span>
                    <span className="font-mono font-bold text-gray-700">{selectedBike.tracker.lng}</span>
                 </div>
               </div>

               <div className="pt-4 flex flex-col space-y-2">
                  <button className="w-full py-3 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-red-100 hover:bg-red-700 transition-all">
                    🚨 Immobilize Engine
                  </button>
                  <button className="w-full py-3 bg-gray-100 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all">
                    📍 Open in Google Maps
                  </button>
               </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
               <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-2xl mb-4">📍</div>
               <h4 className="text-sm font-black text-gray-800 uppercase mb-1">Select a Vehicle</h4>
               <p className="text-xs text-gray-400">Click a marker on the map to view telemetry and control options.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrackingPortal;
