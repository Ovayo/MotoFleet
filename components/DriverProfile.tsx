
import React, { useMemo, useRef, useState } from 'react';
import { Driver, Payment, Bike, MaintenanceRecord, Workshop, TrafficFine } from '../types';

interface DriverProfileProps {
  driver: Driver;
  onUpdateDriver: (updatedDriver: Driver) => void;
  payments: Payment[];
  fines: TrafficFine[];
  onAddFine: (fine: Omit<TrafficFine, 'id'>) => void;
  bike?: Bike;
  maintenance: MaintenanceRecord[];
  onAddMaintenance: (record: Omit<MaintenanceRecord, 'id'>) => void;
  workshops: Workshop[];
  weeklyTarget: number;
  isAdminViewing?: boolean;
}

const DriverProfile: React.FC<DriverProfileProps> = ({ 
  driver, 
  onUpdateDriver, 
  payments = [], 
  fines = [],
  onAddFine,
  bike, 
  maintenance = [], 
  onAddMaintenance,
  workshops = [],
  weeklyTarget,
  isAdminViewing = false
}) => {
  const [activeTab, setActiveTab] = useState<'portfolio' | 'service'>('portfolio');
  const [showLogForm, setShowLogForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stats = useMemo(() => {
    const driverPayments = payments.filter(p => p.driverId === driver.id);
    const totalPaid = driverPayments.reduce((acc, p) => acc + p.amount, 0);
    const bikeMaintenance = bike ? maintenance.filter(m => m.bikeId === bike.id) : [];
    
    // Simplified standing
    const standing = totalPaid - (650 * 4); // Target check
    
    return { totalPaid, standing, bikeMaintenance };
  }, [payments, driver.id, bike, maintenance]);

  return (
    <div className="space-y-10 pb-10">
      {/* Premium Profile Header */}
      <div className="bg-white/80 backdrop-blur-3xl rounded-[4rem] p-10 border border-white/60 shadow-sm relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 blur-3xl rounded-full translate-x-20 -translate-y-20"></div>
         
         <div className="flex flex-col md:flex-row items-center gap-10">
            <div 
              className="relative w-32 h-32 md:w-40 md:h-40 rounded-[3.5rem] bg-gray-900 border-4 border-white shadow-2xl flex items-center justify-center text-5xl font-black text-white cursor-pointer overflow-hidden group/avatar"
              onClick={() => fileInputRef.current?.click()}
            >
               {driver.profilePictureUrl ? (
                 <img src={driver.profilePictureUrl} className="w-full h-full object-cover group-hover/avatar:scale-110 transition-transform duration-500" />
               ) : (
                 driver.name[0].toUpperCase()
               )}
               <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {}} />
            </div>
            
            <div className="text-center md:text-left flex-1">
               <h2 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tighter uppercase leading-none mb-4">{driver.name}</h2>
               <div className="flex flex-wrap justify-center md:justify-start gap-3">
                  <span className="text-[10px] font-black text-green-600 bg-green-50/50 px-4 py-1.5 rounded-full uppercase tracking-widest border border-green-100/50">OPERATIONAL Pilot</span>
                  <span className="text-[10px] font-black text-blue-600 bg-blue-50/50 px-4 py-1.5 rounded-full uppercase tracking-widest border border-blue-100/50">{driver.city} Hub</span>
               </div>
            </div>

            <div className="flex flex-col gap-4 w-full md:w-auto">
               <div className="bg-gray-900 p-8 rounded-[2.5rem] text-center text-white shadow-2xl">
                  <p className="text-[9px] font-black uppercase text-gray-500 tracking-[0.3em] mb-2">Account Status</p>
                  <p className={`text-3xl font-black ${stats.standing >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    R{Math.abs(stats.standing).toLocaleString()} {stats.standing >= 0 ? 'Surplus' : 'Deficit'}
                  </p>
               </div>
            </div>
         </div>
      </div>

      {/* Nav & Action Strip */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
         <div className="flex bg-gray-200/50 backdrop-blur-md p-1.5 rounded-[2rem] border border-white/40 shadow-inner">
            {(['portfolio', 'service'] as const).map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-10 py-4 rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === tab ? 'bg-white text-gray-900 shadow-xl scale-105' : 'text-gray-500 hover:text-gray-800'}`}
              >
                {tab}
              </button>
            ))}
         </div>
         <button 
           onClick={() => window.open('https://wa.me/27682170330', '_blank')}
           className="bg-green-600 text-white px-10 py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl shadow-green-100 hover:scale-105 active:scale-95 transition-all flex items-center space-x-4"
         >
           <span>💬</span>
           <span>HQ Dispatch Support</span>
         </button>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-10 duration-700">
         {activeTab === 'portfolio' ? (
           <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
              <div className="xl:col-span-2 space-y-10">
                 <div className="bg-white/80 backdrop-blur-3xl rounded-[3.5rem] border border-white/60 shadow-sm overflow-hidden">
                    <div className="p-10 border-b border-gray-50 flex items-center justify-between">
                       <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.3em]">Settlement Registry</h3>
                       <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Last 5 Transactions</span>
                    </div>
                    <div className="divide-y divide-gray-50">
                       {payments.filter(p => p.driverId === driver.id).slice(0, 5).map(p => (
                         <div key={p.id} className="p-8 flex items-center justify-between hover:bg-gray-50/50 transition-colors group">
                            <div className="flex items-center space-x-6">
                               <div className="w-14 h-14 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform">💸</div>
                               <div>
                                  <p className="text-[11px] font-black text-gray-900 uppercase tracking-tight">{p.type} DEPOSIT</p>
                                  <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">{new Date(p.date).toLocaleDateString('en-GB')}</p>
                               </div>
                            </div>
                            <p className="text-2xl font-black text-gray-900 tracking-tighter">R{p.amount.toLocaleString()}</p>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>
              <div className="space-y-10">
                 <div className="bg-gray-900 p-10 rounded-[3.5rem] shadow-2xl text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-10">Active Hardware</p>
                    {bike ? (
                      <div className="space-y-6">
                         <div className="flex items-center space-x-6">
                            <div className="w-16 h-16 rounded-[1.5rem] bg-white/10 flex items-center justify-center text-3xl">🏍️</div>
                            <div>
                               <p className="text-xl font-black uppercase leading-tight tracking-tighter">{bike.licenseNumber}</p>
                               <p className="text-[10px] text-gray-500 font-bold uppercase">{bike.makeModel}</p>
                            </div>
                         </div>
                         <div className="pt-6 border-t border-white/5">
                            <div className="flex justify-between items-center mb-2">
                               <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Health Index</span>
                               <span className="text-[10px] font-black">94%</span>
                            </div>
                            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden shadow-inner">
                               <div className="bg-blue-500 h-full w-[94%] shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                            </div>
                         </div>
                      </div>
                    ) : (
                      <p className="text-gray-500 font-black uppercase tracking-widest text-[10px]">No hardware assigned to node</p>
                    )}
                 </div>
              </div>
           </div>
         ) : (
           <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
              <div className="xl:col-span-2 bg-white/80 backdrop-blur-3xl rounded-[3.5rem] border border-white/60 shadow-sm overflow-hidden">
                 <div className="p-10 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.3em]">Maintenance Audit</h3>
                    <button 
                      onClick={() => setShowLogForm(true)}
                      className="bg-amber-500 text-white px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-xl shadow-amber-100 hover:scale-105 transition-all"
                    >
                      Report Technical Issue
                    </button>
                 </div>
                 <div className="divide-y divide-gray-50">
                    {stats.bikeMaintenance.length === 0 ? (
                      <div className="py-32 text-center opacity-40">
                         <p className="text-[10px] font-black uppercase tracking-[0.3em]">No mechanical events logged</p>
                      </div>
                    ) : (
                      stats.bikeMaintenance.map(m => (
                        <div key={m.id} className="p-8 flex items-center justify-between hover:bg-gray-50/50 transition-colors group">
                           <div className="flex items-center space-x-6">
                              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-2xl shadow-sm border border-amber-100/50 group-hover:scale-110 transition-transform">🔧</div>
                              <div>
                                 <p className="text-[11px] font-black text-gray-900 uppercase tracking-tight">{m.description}</p>
                                 <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">{new Date(m.date).toLocaleDateString()}</p>
                              </div>
                           </div>
                           <p className="text-lg font-black text-gray-900">R{m.cost.toLocaleString()}</p>
                        </div>
                      ))
                    )}
                 </div>
              </div>
              <div className="space-y-10">
                 <div className="bg-white/70 backdrop-blur-3xl p-10 rounded-[3.5rem] border border-white/60 shadow-sm">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-8">Authorized Partners</h4>
                    <div className="space-y-6">
                       {workshops.filter(w => w.city === driver.city).slice(0, 3).map(w => (
                         <div key={w.id} className="flex items-center justify-between group/ws cursor-pointer">
                            <div className="flex items-center space-x-4">
                               <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-xl group-hover/ws:bg-amber-500 group-hover/ws:text-white transition-all shadow-inner">🏪</div>
                               <div>
                                  <p className="text-sm font-black uppercase tracking-tighter text-gray-900">{w.name}</p>
                                  <p className="text-[9px] text-gray-400 uppercase font-bold">{w.location}</p>
                               </div>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>
           </div>
         )}
      </div>

      {/* Glassy Form Modal */}
      {showLogForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-2xl z-[150] flex items-center justify-center p-4">
           <form onSubmit={(e) => { e.preventDefault(); setShowLogForm(false); }} className="bg-white/95 backdrop-blur-3xl rounded-[4rem] w-full max-w-xl p-12 space-y-10 animate-in zoom-in duration-300">
              <div className="flex justify-between items-center border-b border-gray-100 pb-8">
                 <div>
                    <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tighter leading-none">Technical Report</h3>
                    <p className="text-[10px] text-amber-500 font-black uppercase tracking-[0.3em] mt-3">Field Maintenance Log</p>
                 </div>
                 <button type="button" onClick={() => setShowLogForm(false)} className="text-gray-300 hover:text-gray-900 text-6xl leading-none">&times;</button>
              </div>
              <div className="space-y-6">
                 <input placeholder="DESCRIPTION OF EVENT" className="w-full bg-gray-50/50 border-none rounded-[1.5rem] p-6 text-sm font-bold outline-none shadow-inner" />
                 <input type="number" placeholder="ESTIMATED COST (R)" className="w-full bg-gray-50/50 border-none rounded-[1.5rem] p-6 text-sm font-bold outline-none shadow-inner" />
              </div>
              <button className="w-full bg-gray-900 text-white py-6 rounded-[2.5rem] font-black uppercase text-[11px] tracking-[0.4em] shadow-2xl hover:bg-black transition-all">Submit Field Log</button>
           </form>
        </div>
      )}
    </div>
  );
};

export default DriverProfile;
