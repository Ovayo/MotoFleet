
import React, { useState, useMemo } from 'react';
import { Bike, MaintenanceRecord } from '../types';

interface MechanicPortalProps {
  bikes: Bike[];
  setBikes: React.Dispatch<React.SetStateAction<Bike[]>>;
  maintenance: MaintenanceRecord[];
  onAddMaintenance: (record: Omit<MaintenanceRecord, 'id'>) => void;
}

const MechanicPortal: React.FC<MechanicPortalProps> = ({ bikes, setBikes, maintenance, onAddMaintenance }) => {
  const [selectedBikeId, setSelectedBikeId] = useState<string | null>(null);
  const [showLogForm, setShowLogForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'queue' | 'roadmap' | 'warranties'>('queue');
  
  const [newLog, setNewLog] = useState<Omit<MaintenanceRecord, 'id'>>({
    bikeId: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    cost: 0,
    serviceType: 'routine',
    warrantyMonths: 0,
    performedBy: 'In-House Workshop'
  });

  const getServiceStatus = (bikeId: string) => {
    const records = maintenance.filter(m => m.bikeId === bikeId && (m.serviceType === 'routine' || m.serviceType === 'oil'));
    if (records.length === 0) return { status: 'overdue', days: 999, lastDate: 'Never' };
    
    const latest = records.reduce((a, b) => new Date(a.date) > new Date(b.date) ? a : b);
    const diff = Math.floor((new Date().getTime() - new Date(latest.date).getTime()) / (1000 * 60 * 60 * 24));
    
    if (diff > 90) return { status: 'overdue', days: diff, lastDate: new Date(latest.date).toLocaleDateString() };
    if (diff > 75) return { status: 'due', days: diff, lastDate: new Date(latest.date).toLocaleDateString() };
    return { status: 'good', days: diff, lastDate: new Date(latest.date).toLocaleDateString() };
  };

  const activeWarranties = useMemo(() => {
    const now = new Date();
    return maintenance.filter(m => {
      if (!m.warrantyMonths) return false;
      const expiryDate = new Date(m.date);
      expiryDate.setMonth(expiryDate.getMonth() + m.warrantyMonths);
      return expiryDate > now;
    }).map(m => {
      const expiryDate = new Date(m.date);
      expiryDate.setMonth(expiryDate.getMonth() + m.warrantyMonths!);
      const remaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return { ...m, remainingDays: remaining };
    });
  }, [maintenance]);

  const workshopBikes = bikes.filter(b => b.status === 'maintenance');
  const roadmapBikes = [...bikes].sort((a, b) => getServiceStatus(b.id).days - getServiceStatus(a.id).days);

  const handleLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLog.bikeId) return;
    onAddMaintenance(newLog);
    setShowLogForm(false);
    setNewLog({ ...newLog, description: '', cost: 0, warrantyMonths: 0 });
  };

  const selectedBike = bikes.find(b => b.id === selectedBikeId);

  return (
    <div className="w-full space-y-6">
      {/* Mechanic Header Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-amber-100 flex items-center justify-between">
           <div>
             <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">In Workshop</p>
             <h3 className="text-3xl font-black text-gray-800">{workshopBikes.length}</h3>
           </div>
           <div className="text-3xl">🛠️</div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-red-100 flex items-center justify-between">
           <div>
             <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Service Overdue</p>
             <h3 className="text-3xl font-black text-gray-800">{bikes.filter(b => getServiceStatus(b.id).status === 'overdue').length}</h3>
           </div>
           <div className="text-3xl">🛑</div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-blue-100 flex items-center justify-between">
           <div>
             <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Active Warranties</p>
             <h3 className="text-3xl font-black text-gray-800">{activeWarranties.length}</h3>
           </div>
           <div className="text-3xl">🛡️</div>
        </div>
        <button 
          onClick={() => setShowLogForm(true)}
          className="bg-amber-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-amber-100 hover:bg-amber-700 transition-all flex flex-col items-center justify-center space-y-2 py-6"
        >
          <span className="text-2xl">➕</span>
          <span>Open Job Card</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-2 bg-gray-100 p-1.5 rounded-2xl w-fit">
        <button 
          onClick={() => setActiveTab('queue')}
          className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'queue' ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Workshop Queue
        </button>
        <button 
          onClick={() => setActiveTab('roadmap')}
          className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'roadmap' ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Service Roadmap
        </button>
        <button 
          onClick={() => setActiveTab('warranties')}
          className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'warranties' ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Guarantees
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="xl:col-span-2">
          {activeTab === 'queue' && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-left-4">
              <div className="p-6 border-b border-gray-50 bg-gray-50/30">
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Active Workshop Queue</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {workshopBikes.length === 0 ? (
                  <div className="p-20 text-center">
                    <div className="text-4xl mb-4">✨</div>
                    <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Workspace Clear</p>
                    <p className="text-xs text-gray-400 mt-1">All bikes are currently operational.</p>
                  </div>
                ) : (
                  workshopBikes.map(bike => (
                    <div key={bike.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between hover:bg-amber-50/20 transition-colors">
                      <div className="flex items-center space-x-4 mb-4 md:mb-0">
                         <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center text-xl font-black">
                            {bike.licenseNumber.substring(0,2)}
                         </div>
                         <div>
                            <h4 className="font-black text-gray-800 uppercase tracking-tight">{bike.licenseNumber}</h4>
                            <p className="text-[10px] text-gray-400 font-bold uppercase">{bike.makeModel}</p>
                         </div>
                      </div>
                      <div className="flex items-center space-x-3">
                         <button 
                          onClick={() => {
                            setNewLog({ ...newLog, bikeId: bike.id, serviceType: 'repair' });
                            setShowLogForm(true);
                          }}
                          className="px-4 py-2 bg-amber-50 text-amber-700 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-amber-100"
                         >
                           Log Repair
                         </button>
                         <button 
                          onClick={() => setSelectedBikeId(bike.id)}
                          className="px-4 py-2 text-gray-400 hover:text-gray-600 text-[9px] font-black uppercase tracking-widest"
                         >
                           View Logs
                         </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'roadmap' && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-left-4">
               <div className="p-6 border-b border-gray-50 bg-gray-50/30">
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Fleet Service Roadmap</h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {roadmapBikes.map(bike => {
                  const status = getServiceStatus(bike.id);
                  return (
                    <div key={bike.id} className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 flex flex-col justify-between">
                       <div className="flex justify-between items-start mb-4">
                          <div>
                             <h4 className="font-black text-gray-800 text-sm">{bike.licenseNumber}</h4>
                             <p className="text-[9px] text-gray-400 font-bold uppercase">{bike.makeModel}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                            status.status === 'overdue' ? 'bg-red-100 text-red-600' :
                            status.status === 'due' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'
                          }`}>
                            {status.status}
                          </span>
                       </div>
                       <div className="space-y-2">
                          <div className="flex justify-between text-[10px]">
                             <span className="text-gray-400 font-bold uppercase">Last Service</span>
                             <span className="text-gray-800 font-black">{status.lastDate}</span>
                          </div>
                          <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                             <div 
                              className={`h-full transition-all ${status.status === 'overdue' ? 'bg-red-500' : status.status === 'due' ? 'bg-amber-500' : 'bg-green-500'}`} 
                              style={{ width: `${Math.min(100, (status.days / 90) * 100)}%` }}
                             ></div>
                          </div>
                       </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {activeTab === 'warranties' && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-left-4">
               <div className="p-6 border-b border-gray-50 bg-gray-50/30">
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Active Mechanical Guarantees</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {activeWarranties.length === 0 ? (
                  <div className="p-20 text-center">
                    <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest italic opacity-50">No items currently under warranty.</p>
                  </div>
                ) : (
                  activeWarranties.map(w => {
                    const bike = bikes.find(b => b.id === w.bikeId);
                    return (
                      <div key={w.id} className="p-6 flex items-center justify-between hover:bg-blue-50/20 transition-colors">
                        <div className="flex items-center space-x-4">
                           <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl">🛡️</div>
                           <div>
                              <h4 className="font-black text-gray-800 text-sm uppercase leading-tight">{w.description}</h4>
                              <p className="text-[10px] text-gray-400 font-bold uppercase">{bike?.licenseNumber} • {w.performedBy}</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-blue-600 font-black text-lg leading-tight">{w.remainingDays} Days</p>
                           <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Left on coverage</p>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: Details & Recent Logs */}
        <div className="space-y-6">
           {selectedBike ? (
             <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 animate-in slide-in-from-right-4">
                <div className="flex justify-between items-start mb-8">
                   <div>
                      <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight">{selectedBike.licenseNumber}</h3>
                      <p className="text-xs text-blue-500 font-black uppercase tracking-widest">{selectedBike.makeModel}</p>
                   </div>
                   <button onClick={() => setSelectedBikeId(null)} className="text-gray-300 hover:text-gray-600 text-3xl leading-none">&times;</button>
                </div>

                <div className="space-y-6">
                   <div>
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-2 mb-4">Historical Workshop Logs</h4>
                      <div className="space-y-3">
                         {maintenance.filter(m => m.bikeId === selectedBikeId).length === 0 ? (
                           <p className="text-center py-10 text-gray-300 text-xs italic">No job cards found for this asset.</p>
                         ) : (
                           maintenance
                            .filter(m => m.bikeId === selectedBikeId)
                            .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .map(m => (
                              <div key={m.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                 <p className="text-xs font-black text-gray-800 uppercase leading-tight">{m.description}</p>
                                 <div className="flex justify-between items-center mt-2">
                                    <span className="text-[9px] font-bold text-gray-400 uppercase">{m.date} • {m.serviceType}</span>
                                    <span className="text-[10px] font-black text-gray-700">R{m.cost}</span>
                                 </div>
                                 {m.warrantyMonths ? (
                                   <div className="mt-2 text-[8px] font-black text-blue-500 bg-blue-100 px-1.5 py-0.5 rounded-full w-fit uppercase tracking-widest">
                                      {m.warrantyMonths}M Warranty Applied
                                   </div>
                                 ) : null}
                              </div>
                            ))
                         )}
                      </div>
                   </div>
                   <button 
                    onClick={() => {
                      setNewLog({...newLog, bikeId: selectedBikeId});
                      setShowLogForm(true);
                    }}
                    className="w-full py-4 bg-amber-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-amber-100 hover:bg-amber-700 transition-all active:scale-95"
                   >
                     Initiate New Job Card
                   </button>
                </div>
             </div>
           ) : (
             <div className="bg-amber-50/50 rounded-[2.5rem] border border-dashed border-amber-200 p-10 text-center flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-20 h-20 bg-white rounded-[2rem] shadow-xl shadow-amber-900/5 flex items-center justify-center text-4xl mb-6">⚙️</div>
                <h4 className="text-sm font-black text-amber-900 uppercase tracking-widest">Asset Diagnostics</h4>
                <p className="text-xs text-amber-700/60 mt-2 max-w-[200px] font-medium">Select a motorcycle from the queue or roadmap to view full service telemetry.</p>
             </div>
           )}
        </div>
      </div>

      {/* Modern Job Card Modal */}
      {showLogForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <form onSubmit={handleLogSubmit} className="bg-white rounded-[2.5rem] shadow-2xl max-w-xl w-full p-10 space-y-8 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Workshop Job Card</h3>
                <p className="text-[10px] text-amber-500 font-black uppercase tracking-widest mt-1">Mechanical Maintenance Logging</p>
              </div>
              <button type="button" onClick={() => setShowLogForm(false)} className="text-gray-300 hover:text-gray-600 text-4xl leading-none">&times;</button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Select Asset</label>
                  <select 
                    required
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500 transition-all appearance-none"
                    value={newLog.bikeId}
                    onChange={e => setNewLog({...newLog, bikeId: e.target.value})}
                  >
                    <option value="">Choose Motorcycle...</option>
                    {bikes.map(b => <option key={b.id} value={b.id}>{b.licenseNumber} - {b.makeModel}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Job Category</label>
                  <select 
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500 transition-all appearance-none"
                    value={newLog.serviceType}
                    onChange={e => setNewLog({...newLog, serviceType: e.target.value as any})}
                  >
                    <option value="routine">Routine Service</option>
                    <option value="repair">Major Repair</option>
                    <option value="tyres">Tyres & Wheels</option>
                    <option value="parts">Component Install</option>
                    <option value="oil">Oil & Lube</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Job Narrative</label>
                <textarea 
                  required
                  placeholder="Describe the fault and work performed..."
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500 h-24 resize-none transition-all"
                  value={newLog.description}
                  onChange={e => setNewLog({...newLog, description: e.target.value})}
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Cost (R)</label>
                  <input 
                    type="number"
                    required
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                    value={newLog.cost}
                    onChange={e => setNewLog({...newLog, cost: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Guarantee (Months)</label>
                  <input 
                    type="number"
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                    value={newLog.warrantyMonths}
                    onChange={e => setNewLog({...newLog, warrantyMonths: Number(e.target.value)})}
                  />
                </div>
              </div>
            </div>

            <button type="submit" className="w-full bg-amber-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-amber-100 hover:bg-amber-700 transition-all active:scale-95">
              Authorize & Finalize Job Card
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default MechanicPortal;
