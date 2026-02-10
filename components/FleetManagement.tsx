
import React, { useState, useMemo } from 'react';
import { Bike, Driver, MaintenanceRecord } from '../types';

interface FleetManagementProps {
  bikes: Bike[];
  setBikes: React.Dispatch<React.SetStateAction<Bike[]>>;
  drivers: Driver[];
  maintenance: MaintenanceRecord[];
}

const FleetManagement: React.FC<FleetManagementProps> = ({ bikes, setBikes, drivers, maintenance }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [historyBikeId, setHistoryBikeId] = useState<string | null>(null);
  const [selectedBikeIds, setSelectedBikeIds] = useState<Set<string>>(new Set());
  const [vinError, setVinError] = useState<string | null>(null);
  const [newBike, setNewBike] = useState<Omit<Bike, 'id' | 'status'>>({
    makeModel: '',
    licenseNumber: '',
    vin: '',
    year: '',
    dealer: '',
    price: '',
    city: '',
    notes: ''
  });

  const toggleStatus = (id: string) => {
    setBikes(prev => prev.map(bike => {
      if (bike.id === id) {
        const nextStatus: Bike['status'] = bike.status === 'active' ? 'maintenance' : (bike.status === 'maintenance' ? 'idle' : 'active');
        return { ...bike, status: nextStatus };
      }
      return bike;
    }));
  };

  const handleAssignDriver = (bikeId: string, driverId: string) => {
    setBikes(prev => prev.map(bike => {
      if (bike.id === bikeId) {
        return { ...bike, assignedDriverId: driverId === "none" ? undefined : driverId };
      }
      return bike;
    }));
  };

  const handleAddBike = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedVin = newBike.vin.trim().toLowerCase();
    if (normalizedVin !== 'n/a' && normalizedVin !== '') {
      const vinExists = bikes.some(b => b.vin.trim().toLowerCase() === normalizedVin);
      if (vinExists) {
        setVinError("This VIN is already registered in the system.");
        return;
      }
    }

    const bike: Bike = {
      ...newBike,
      id: `b-${Date.now()}`,
      status: 'idle'
    };
    setBikes(prev => [...prev, bike]);
    setShowAddForm(false);
    setVinError(null);
    setNewBike({ makeModel: '', licenseNumber: '', vin: '', year: '', dealer: '', price: '', city: '', notes: '' });
  };

  const getMaintenanceSummary = (bikeId: string) => {
    const records = maintenance.filter(m => m.bikeId === bikeId);
    if (records.length === 0) return { last: 'Never', next: 'Immediate', hasWarranty: false };
    
    const latest = records.reduce((a, b) => new Date(a.date) > new Date(b.date) ? a : b);
    const nextDue = new Date(latest.date);
    nextDue.setMonth(nextDue.getMonth() + 3); // 3-month cycle

    const hasWarranty = records.some(m => {
      if (!m.warrantyMonths) return false;
      const expiry = new Date(m.date);
      expiry.setMonth(expiry.getMonth() + m.warrantyMonths);
      return expiry > new Date();
    });

    return { 
      last: new Date(latest.date).toLocaleDateString(), 
      next: nextDue.toLocaleDateString(),
      isOverdue: nextDue < new Date(),
      hasWarranty 
    };
  };

  const bikeHistoryStats = useMemo(() => {
    if (!historyBikeId) return null;
    const bikeMaintenance = maintenance.filter(m => m.bikeId === historyBikeId);
    const total = bikeMaintenance.reduce((acc, m) => acc + m.cost, 0);
    const fuel = bikeMaintenance.filter(m => m.serviceType === 'fuel').reduce((acc, m) => acc + m.cost, 0);
    const repairs = bikeMaintenance.filter(m => m.serviceType === 'repair').reduce((acc, m) => acc + m.cost, 0);
    const parts = bikeMaintenance.filter(m => m.serviceType === 'parts').reduce((acc, m) => acc + m.cost, 0);
    return { total, fuel, repairs, parts, count: bikeMaintenance.length };
  }, [historyBikeId, maintenance]);

  const handleSelectAll = () => {
    if (selectedBikeIds.size === bikes.length) setSelectedBikeIds(new Set());
    else setSelectedBikeIds(new Set(bikes.map(b => b.id)));
  };

  const handleBulkStatusChange = (status: Bike['status']) => {
    setBikes(prev => prev.map(bike => selectedBikeIds.has(bike.id) ? { ...bike, status } : bike));
    setSelectedBikeIds(new Set());
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Motorcycle Fleet</h2>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
        >
          {showAddForm ? 'Cancel' : '+ Log New Bike'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddBike} className="bg-white p-6 rounded-xl shadow-md border border-blue-100 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Make / Model</label>
              <input required className="w-full border-gray-200 rounded-lg p-2 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none" value={newBike.makeModel} onChange={e => setNewBike({...newBike, makeModel: e.target.value})} placeholder="e.g. Hero ECO 150" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">License Plate</label>
              <input required className="w-full border-gray-200 rounded-lg p-2 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none" value={newBike.licenseNumber} onChange={e => setNewBike({...newBike, licenseNumber: e.target.value})} placeholder="ABC 123 GP" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">VIN Number</label>
              <input 
                required 
                className={`w-full border-gray-200 rounded-lg p-2 bg-gray-50 focus:ring-2 outline-none transition-all ${vinError ? 'ring-2 ring-red-500 border-red-500 bg-red-50' : 'focus:ring-blue-500'}`} 
                value={newBike.vin} 
                onChange={e => { setNewBike({...newBike, vin: e.target.value}); setVinError(null); }} 
                placeholder="Chassis No." 
              />
              {vinError && <p className="text-[10px] text-red-500 font-bold mt-1 uppercase tracking-tighter">{vinError}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Year</label>
              <input required className="w-full border-gray-200 rounded-lg p-2 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none" value={newBike.year} onChange={e => setNewBike({...newBike, year: e.target.value})} placeholder="2024" />
            </div>
            <div className="lg:col-span-4 flex justify-end mt-2">
              <button type="submit" className="bg-blue-600 text-white px-8 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors">Add Bike to Fleet</button>
            </div>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 w-10">
                <input 
                  type="checkbox" 
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                  checked={selectedBikeIds.size === bikes.length && bikes.length > 0}
                  onChange={handleSelectAll}
                />
              </th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Bike Details</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Driver Assignment</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Maintenance & Guarantees</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Records</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {bikes.map((bike) => {
              const mSummary = getMaintenanceSummary(bike.id);
              return (
                <tr key={bike.id} className={`transition-colors ${selectedBikeIds.has(bike.id) ? 'bg-blue-50/50' : 'hover:bg-gray-50'}`}>
                  <td className="px-6 py-4">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                      checked={selectedBikeIds.has(bike.id)}
                      onChange={() => {
                        const newSelection = new Set(selectedBikeIds);
                        if (newSelection.has(bike.id)) newSelection.delete(bike.id);
                        else newSelection.add(bike.id);
                        setSelectedBikeIds(newSelection);
                      }}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-800">{bike.makeModel}</div>
                    <div className="text-xs text-gray-500 font-mono">{bike.licenseNumber}</div>
                  </td>
                  <td className="px-6 py-4">
                    <select 
                      className="bg-gray-50 border border-gray-200 text-gray-700 text-xs rounded-lg block w-full p-1.5"
                      value={bike.assignedDriverId || "none"}
                      onChange={(e) => handleAssignDriver(bike.id, e.target.value)}
                    >
                      <option value="none">Unassigned</option>
                      {drivers.map(driver => <option key={driver.id} value={driver.id}>{driver.name}</option>)}
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="text-xs text-gray-600 flex items-center space-x-1">
                        <span className="font-bold">Last:</span>
                        <span>{mSummary.last}</span>
                        {mSummary.hasWarranty && <span className="ml-1 text-[10px] bg-blue-100 text-blue-700 px-1 rounded font-black" title="Active Warranty">🛡️</span>}
                      </div>
                      <div className={`text-[10px] font-bold uppercase tracking-tight ${mSummary.isOverdue ? 'text-red-500' : 'text-gray-400'}`}>
                        Next Due: {mSummary.next}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => toggleStatus(bike.id)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        bike.status === 'active' ? 'bg-green-100 text-green-700' :
                        bike.status === 'maintenance' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {bike.status}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setHistoryBikeId(bike.id)}
                      className="text-blue-600 hover:text-blue-800 font-bold text-xs flex items-center justify-end space-x-1"
                    >
                      <span>📜 View History</span>
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {historyBikeId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Maintenance Lifecycle</h3>
                <p className="text-sm text-gray-500">{bikes.find(b => b.id === historyBikeId)?.licenseNumber} - {bikes.find(b => b.id === historyBikeId)?.makeModel}</p>
              </div>
              <button onClick={() => setHistoryBikeId(null)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {bikeHistoryStats && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Total Spent</p>
                    <p className="text-lg font-black text-gray-800">R{bikeHistoryStats.total}</p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                    <p className="text-[10px] font-bold text-blue-400 uppercase">Repair Count</p>
                    <p className="text-lg font-black text-blue-600">{bikeHistoryStats.count}</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-xl border border-green-100">
                    <p className="text-[10px] font-bold text-green-400 uppercase">Status</p>
                    <p className="text-lg font-black text-green-600">Roadworthy</p>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Historical Logs & Guarantees</h4>
                {maintenance.filter(m => m.bikeId === historyBikeId).length === 0 ? (
                  <div className="text-center py-12 text-gray-400 italic">No technical logs recorded.</div>
                ) : (
                  maintenance
                    .filter(m => m.bikeId === historyBikeId)
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map(record => {
                      const isGuaranteed = record.warrantyMonths && (new Date(new Date(record.date).setMonth(new Date(record.date).getMonth() + record.warrantyMonths)) > new Date());
                      return (
                        <div key={record.id} className="flex justify-between items-start p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
                          <div className="flex items-start space-x-3">
                            <span className="text-xl">{record.serviceType === 'fuel' ? '⛽' : record.serviceType === 'parts' ? '📦' : '🔧'}</span>
                            <div>
                              <p className="font-bold text-gray-800 text-sm">{record.description}</p>
                              <p className="text-[10px] text-gray-500 uppercase font-medium">{new Date(record.date).toLocaleDateString()} • {record.serviceType}</p>
                              {record.warrantyMonths && (
                                <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${isGuaranteed ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'}`}>
                                  {isGuaranteed ? `🛡️ Active ${record.warrantyMonths}m Guarantee` : `Expired ${record.warrantyMonths}m Guarantee`}
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="font-black text-gray-800">R{record.cost}</p>
                        </div>
                      )
                    })
                )}
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 text-right">
              <button onClick={() => setHistoryBikeId(null)} className="bg-gray-800 text-white px-6 py-2 rounded-lg font-bold hover:bg-black transition-colors">Close Log</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FleetManagement;
