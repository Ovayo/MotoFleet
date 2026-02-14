
import React, { useState, useRef, useMemo } from 'react';
import { Bike, Driver, TrafficFine } from '../types';

interface TrafficFinesProps {
  bikes: Bike[];
  drivers: Driver[];
  fines: TrafficFine[];
  onAddFine: (fine: Omit<TrafficFine, 'id'>) => void;
  onUpdateStatus: (id: string, status: TrafficFine['status']) => void;
}

const TrafficFines: React.FC<TrafficFinesProps> = ({ bikes, drivers, fines, onAddFine, onUpdateStatus }) => {
  const [showForm, setShowForm] = useState(false);
  const [viewingAttachment, setViewingAttachment] = useState<string | null>(null);

  const stats = useMemo(() => {
    const total = fines.reduce((acc, f) => acc + f.amount, 0);
    const unpaid = fines.filter(f => f.status === 'unpaid').reduce((acc, f) => acc + f.amount, 0);
    return { total, unpaid };
  }, [fines]);

  return (
    <div className="space-y-10 pb-10">
      {/* Fiscal Liability Blade */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/70 backdrop-blur-2xl p-10 rounded-[3.5rem] border border-white/60 shadow-sm">
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2">Aggregate Liability</p>
           <h3 className="text-4xl font-black text-gray-900 tracking-tighter">R{stats.total.toLocaleString()}</h3>
        </div>
        <div className="bg-red-500 p-10 rounded-[3.5rem] shadow-2xl text-white">
           <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em] mb-2">Outstanding Exposure</p>
           <h3 className="text-4xl font-black tracking-tighter">R{stats.unpaid.toLocaleString()}</h3>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="bg-gray-900 text-white rounded-[3.5rem] p-10 font-black uppercase text-[10px] tracking-[0.25em] shadow-2xl shadow-gray-200 hover:scale-[1.02] transition-all flex flex-col items-center justify-center space-y-3"
        >
          <span className="text-3xl">🚓</span>
          <span>Log Traffic Notice</span>
        </button>
      </div>

      <div className="bg-white/80 backdrop-blur-3xl rounded-[4rem] border border-white/60 shadow-sm overflow-hidden">
         <div className="p-10 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.3em]">Compliance Audit Trail</h3>
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{fines.length} Recorded Notices</span>
         </div>
         <div className="divide-y divide-gray-50">
            {fines.length === 0 ? (
              <div className="py-32 text-center opacity-40">
                 <p className="text-[10px] font-black uppercase tracking-[0.3em]">Compliance 100% — Zero Notices Logged</p>
              </div>
            ) : (
              fines.map(fine => {
                const driver = drivers.find(d => d.id === fine.driverId);
                const bike = bikes.find(b => b.id === fine.bikeId);
                
                return (
                  <div key={fine.id} className="p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 hover:bg-gray-50/50 transition-all duration-500 group">
                     <div className="flex items-center space-x-8 flex-1">
                        <div className="w-16 h-16 rounded-[1.5rem] bg-gray-100 flex items-center justify-center text-3xl grayscale group-hover:grayscale-0 transition-all">⚖️</div>
                        <div className="min-w-0">
                           <h4 className="text-2xl font-black text-gray-900 uppercase leading-none tracking-tighter mb-2 truncate">
                              {fine.noticeNumber} — R{fine.amount}
                           </h4>
                           <div className="flex flex-wrap items-center gap-3">
                              <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-50/50 px-3 py-1 rounded-full border border-blue-100/50">
                                 {driver?.name || 'Unknown Pilot'}
                              </span>
                              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{bike?.licenseNumber}</span>
                           </div>
                        </div>
                     </div>

                     <div className="flex items-center space-x-6 shrink-0">
                        {fine.attachmentUrl && (
                          <button onClick={() => setViewingAttachment(fine.attachmentUrl!)} className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:bg-blue-600 hover:text-white transition-all">📄</button>
                        )}
                        <select 
                          value={fine.status}
                          onChange={(e) => onUpdateStatus(fine.id, e.target.value as any)}
                          className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none shadow-inner border-none appearance-none cursor-pointer ${
                            fine.status === 'unpaid' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                          }`}
                        >
                           <option value="unpaid">Unpaid</option>
                           <option value="paid">Settled</option>
                        </select>
                     </div>
                  </div>
                );
              })
            )}
         </div>
      </div>

      {/* Premium Glassy Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-2xl z-[150] flex items-center justify-center p-4">
           <form className="bg-white/95 backdrop-blur-3xl rounded-[4rem] w-full max-w-2xl p-12 space-y-10 animate-in zoom-in duration-300">
              <div className="flex justify-between items-center border-b border-gray-100 pb-8">
                 <div>
                    <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tighter leading-none">Register Notice</h3>
                    <p className="text-[10px] text-red-500 font-black uppercase tracking-[0.3em] mt-3">Legal Liability Link</p>
                 </div>
                 <button type="button" onClick={() => setShowForm(false)} className="text-gray-300 hover:text-gray-900 text-6xl leading-none">&times;</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <input placeholder="NOTICE NUMBER" className="w-full bg-gray-50/50 border-none rounded-[1.5rem] p-6 text-sm font-bold outline-none shadow-inner" />
                 <input type="number" placeholder="AMOUNT (R)" className="w-full bg-gray-50/50 border-none rounded-[1.5rem] p-6 text-sm font-bold outline-none shadow-inner" />
                 <select className="w-full bg-gray-50/50 border-none rounded-[1.5rem] p-6 text-sm font-bold outline-none shadow-inner md:col-span-2">
                    {drivers.map(d => <option key={d.id}>{d.name}</option>)}
                 </select>
              </div>
              <button className="w-full bg-red-600 text-white py-6 rounded-[2.5rem] font-black uppercase text-[11px] tracking-[0.4em] shadow-2xl hover:bg-red-700 transition-all">Authorize Notice Log</button>
           </form>
        </div>
      )}
    </div>
  );
};

export default TrafficFines;
