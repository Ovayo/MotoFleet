
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
  
  const [newLog, setNewLog] = useState<Omit<MaintenanceRecord, 'id'>>({
    bikeId: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    cost: 0,
    serviceType: 'routine',
    warrantyMonths: 0,
    performedBy: 'Workshop Main'
  });

  const getServiceStatus = (bikeId: string) => {
    const records = maintenance.filter(m => m.bikeId === bikeId && m.serviceType === 'routine');
    if (records.length === 0) return { status: 'due', lastDate: 'Never' };
    
    const latest = records.reduce((a, b) => new Date(a.date) > new Date(b.date) ? a : b);
    const monthsSince = (new Date().getTime() - new Date(latest.date).getTime()) / (1000 * 60 * 60 * 24 * 30);
    
    if (monthsSince > 3) return { status: 'overdue', lastDate: new Date(latest.date).toLocaleDateString() };
    if (monthsSince > 2.5) return { status: 'due', lastDate: new Date(latest.date).toLocaleDateString() };
    return { status: 'good', lastDate: new Date(latest.date).toLocaleDateString() };
  };

  const activeWarranties = useMemo(() => {
    return maintenance.filter(m => {
      if (!m.warrantyMonths) return false;
      const expiryDate = new Date(m.date);
      expiryDate.setMonth(expiryDate.getMonth() + m.warrantyMonths);
      return expiryDate > new Date();
    });
  }, [maintenance]);

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
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Quick Stats */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-amber-100">
           <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Fleet Health</p>
           <h3 className="text-2xl font-black text-gray-800">{bikes.filter(b => b.status === 'active').length} / {bikes.length}</h3>
           <p className="text-xs text-gray-400">Roadworthy Vehicles</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100">
           <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">In Workshop</p>
           <h3 className="text-2xl font-black text-gray-800">{bikes.filter(b => b.status === 'maintenance').length}</h3>
           <p className="text-xs text-gray-400">Current Repairs</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100">
           <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Active Guarantees</p>
           <h3 className="text-2xl font-black text-gray-800">{activeWarranties.length}</h3>
           <p className="text-xs text-gray-400">Covered Parts/Service</p>
        </div>
        <button 
          onClick={() => setShowLogForm(true)}
          className="bg-amber-600 text-white rounded-2xl font-black text-lg flex items-center justify-center shadow-lg shadow-amber-100 hover:bg-amber-700 transition-all"
        >
          + Log Job
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Bike List */}
        <div className="xl:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex justify-between items-center">
             <h3 className="font-black text-gray-800 uppercase text-sm tracking-wider">Fleet Inspection List</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">Vehicle</th>
                  <th className="px-6 py-4">Service Status</th>
                  <th className="px-6 py-4">Current State</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {bikes.map(bike => {
                  const service = getServiceStatus(bike.id);
                  return (
                    <tr key={bike.id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-black text-gray-800 text-sm">{bike.licenseNumber}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">{bike.makeModel}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <span className={`w-2 h-2 rounded-full ${
                            service.status === 'overdue' ? 'bg-red-500' : 
                            service.status === 'due' ? 'bg-amber-500' : 'bg-green-500'
                          }`}></span>
                          <span className="text-xs font-bold text-gray-600 capitalize">{service.status} (Last: {service.lastDate})</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          bike.status === 'active' ? 'bg-green-100 text-green-700' : 
                          bike.status === 'maintenance' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {bike.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => setSelectedBikeId(bike.id)}
                          className="text-amber-600 text-xs font-bold hover:underline"
                        >
                          View History
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar History/Details */}
        <div className="space-y-6">
          {selectedBike ? (
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 animate-in slide-in-from-right-4 duration-300">
               <div className="flex justify-between items-start mb-6">
                 <div>
                   <h3 className="text-xl font-black text-gray-800">{selectedBike.licenseNumber}</h3>
                   <p className="text-xs text-gray-400 font-bold">{selectedBike.makeModel}</p>
                 </div>
                 <button onClick={() => setSelectedBikeId(null)} className="text-gray-300 hover:text-gray-600">&times;</button>
               </div>

               <div className="space-y-4">
                 <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-2">Recent Workshop Logs</h4>
                 {maintenance.filter(m => m.bikeId === selectedBikeId).length === 0 ? (
                   <p className="text-xs text-gray-400 italic text-center py-8">No maintenance history found.</p>
                 ) : (
                   maintenance
                    .filter(m => m.bikeId === selectedBikeId)
                    .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 5)
                    .map(m => (
                      <div key={m.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex justify-between items-start">
                        <div>
                          <p className="text-xs font-bold text-gray-800">{m.description}</p>
                          <p className="text-[10px] text-gray-400 uppercase font-bold">{m.date} • {m.serviceType}</p>
                          {m.warrantyMonths ? (
                            <span className="inline-block mt-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[9px] font-black rounded uppercase">
                              🛡️ {m.warrantyMonths}m Guarantee
                            </span>
                          ) : null}
                        </div>
                        <span className="text-xs font-black text-gray-400">R{m.cost}</span>
                      </div>
                    ))
                 )}
               </div>
               
               <div className="mt-8">
                 <button 
                  onClick={() => {
                    setNewLog({...newLog, bikeId: selectedBikeId});
                    setShowLogForm(true);
                  }}
                  className="w-full py-3 bg-amber-50 text-amber-700 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-amber-100 transition-colors"
                 >
                   Log New Job For This Bike
                 </button>
               </div>
            </div>
          ) : (
            <div className="bg-amber-50 p-8 rounded-3xl border border-dashed border-amber-200 text-center flex flex-col items-center justify-center min-h-[300px]">
              <div className="text-4xl mb-4">🔧</div>
              <p className="text-amber-800 font-black text-sm uppercase">Select a bike</p>
              <p className="text-amber-600 text-xs mt-2">To view technical specifications and historical records.</p>
            </div>
          )}
        </div>
      </div>

      {/* Log Job Modal */}
      {showLogForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleLogSubmit} className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Log Workshop Job</h3>
              <button type="button" onClick={() => setShowLogForm(false)} className="text-gray-300 hover:text-gray-600 text-2xl">&times;</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Select Vehicle</label>
                <select 
                  required
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                  value={newLog.bikeId}
                  onChange={e => setNewLog({...newLog, bikeId: e.target.value})}
                >
                  <option value="">Choose a bike...</option>
                  {bikes.map(b => <option key={b.id} value={b.id}>{b.licenseNumber} - {b.makeModel}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Job Type</label>
                  <select 
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                    value={newLog.serviceType}
                    onChange={e => setNewLog({...newLog, serviceType: e.target.value as any})}
                  >
                    <option value="routine">Routine Service</option>
                    <option value="repair">Mechanical Repair</option>
                    <option value="tyres">Tyres</option>
                    <option value="parts">Part Replacement</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Guarantee (Months)</label>
                  <input 
                    type="number"
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                    value={newLog.warrantyMonths}
                    onChange={e => setNewLog({...newLog, warrantyMonths: Number(e.target.value)})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Job Description</label>
                <textarea 
                  required
                  placeholder="Details of the work performed..."
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-amber-500 h-24 resize-none"
                  value={newLog.description}
                  onChange={e => setNewLog({...newLog, description: e.target.value})}
                ></textarea>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Cost (R)</label>
                <input 
                  type="number"
                  required
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                  value={newLog.cost}
                  onChange={e => setNewLog({...newLog, cost: Number(e.target.value)})}
                />
              </div>
            </div>

            <button type="submit" className="w-full bg-amber-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-amber-100 hover:bg-amber-700 transition-all">
              Save to Workshop Records
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default MechanicPortal;
