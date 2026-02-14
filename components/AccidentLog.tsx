
import React, { useState, useMemo } from 'react';
import { AccidentReport, Bike, Driver } from '../types';

interface AccidentLogProps {
  accidents: AccidentReport[];
  bikes: Bike[];
  drivers: Driver[];
  onUpdateStatus: (id: string, status: AccidentReport['status']) => void;
}

const AccidentLog: React.FC<AccidentLogProps> = ({ accidents, bikes, drivers, onUpdateStatus }) => {
  const [filter, setFilter] = useState<AccidentReport['status'] | 'all'>('all');
  const [viewingAttachment, setViewingAttachment] = useState<string | null>(null);

  const filteredAccidents = useMemo(() => {
    return filter === 'all' ? accidents : accidents.filter(a => a.status === filter);
  }, [accidents, filter]);

  return (
    <div className="space-y-8 pb-10 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Accident Registry</h2>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Operational Safety & Insurance Tracking</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-2xl shadow-inner">
          {(['all', 'reported', 'insurance-pending', 'resolved'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-white text-red-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              {f.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredAccidents.length === 0 ? (
          <div className="bg-white p-32 text-center rounded-[3rem] border border-dashed border-gray-100 flex flex-col items-center">
            <div className="text-5xl mb-6 opacity-30">🛡️</div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No Incident Reports Registered</p>
          </div>
        ) : (
          filteredAccidents.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(accident => {
            const bike = bikes.find(b => b.id === accident.bikeId);
            const driver = drivers.find(d => d.id === accident.driverId);
            return (
              <div key={accident.id} className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 flex flex-col md:flex-row gap-8 hover:shadow-xl transition-all group relative overflow-hidden">
                <div className={`absolute left-0 top-0 h-full w-2 ${accident.status === 'resolved' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                
                <div className="flex-1 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-black text-gray-800 text-lg uppercase leading-tight tracking-tight">
                        {bike?.licenseNumber || 'N/A'} — {accident.location}
                      </h4>
                      <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">
                        Driver: {driver?.name || 'Unknown'} • {new Date(accident.date).toLocaleDateString()}
                      </p>
                    </div>
                    <select 
                      value={accident.status} 
                      onChange={(e) => onUpdateStatus(accident.id, e.target.value as any)}
                      className={`text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border-none outline-none ${
                        accident.status === 'resolved' ? 'bg-green-50 text-green-600' : 
                        accident.status === 'reported' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                      }`}
                    >
                      <option value="reported">Reported</option>
                      <option value="insurance-pending">Insurance Pending</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>
                  
                  <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100/50">
                    <p className="text-xs font-bold text-gray-700 leading-relaxed italic">"{accident.description}"</p>
                  </div>

                  {accident.thirdPartyDetails && (
                    <div className="flex items-center space-x-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                       <span>⚠️ Third Party:</span>
                       <span className="text-gray-600">{accident.thirdPartyDetails}</span>
                    </div>
                  )}
                </div>

                <div className="w-full md:w-48 flex flex-col gap-3 shrink-0">
                  {accident.attachmentUrl && (
                    <button 
                      onClick={() => setViewingAttachment(accident.attachmentUrl!)}
                      className="flex-1 bg-blue-50 text-blue-600 rounded-2xl flex flex-col items-center justify-center p-4 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                    >
                      <span className="text-2xl mb-1">📸</span>
                      <span className="text-[8px] font-black uppercase tracking-widest">View Scene Photos</span>
                    </button>
                  )}
                  <button className="flex-1 bg-gray-50 text-gray-400 rounded-2xl flex flex-col items-center justify-center p-4 hover:bg-gray-900 hover:text-white transition-all shadow-sm">
                    <span className="text-2xl mb-1">📋</span>
                    <span className="text-[8px] font-black uppercase tracking-widest">Full Case Report</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {viewingAttachment && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-6">
           <div className="max-w-4xl w-full bg-white rounded-[3rem] overflow-hidden flex flex-col animate-in zoom-in duration-300">
             <div className="p-8 border-b border-gray-50 flex justify-between items-center">
               <h3 className="text-[10px] font-black text-gray-800 uppercase tracking-widest">Scene Evidence Viewer</h3>
               <button onClick={() => setViewingAttachment(null)} className="text-gray-400 hover:text-gray-900 text-5xl leading-none">&times;</button>
             </div>
             <div className="bg-gray-100 flex-1 flex items-center justify-center p-8 max-h-[70vh]">
               <img src={viewingAttachment} className="max-w-full max-h-full object-contain shadow-2xl rounded-2xl" />
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AccidentLog;
