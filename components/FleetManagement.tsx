
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
    
    // Validate Unique VIN
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

  const getLastMaintenance = (bikeId: string) => {
    const records = maintenance.filter(m => m.bikeId === bikeId);
    if (records.length === 0) return 'Never';
    const latest = records.reduce((a, b) => new Date(a.date) > new Date(b.date) ? a : b);
    return new Date(latest.date).toLocaleDateString();
  };

  const bikeHistoryStats = useMemo(() => {
    if (!historyBikeId) return null;
    const bikeMaintenance = maintenance.filter(m => m.bikeId === historyBikeId);
    const total = bikeMaintenance.reduce((acc, m) => acc + m.cost, 0);
    const fuel = bikeMaintenance.filter(m => m.serviceType === 'fuel').reduce((acc, m) => acc + m.cost, 0);
    const repairs = bikeMaintenance.filter(m => m.serviceType === 'repair').reduce((acc, m) => acc + m.cost, 0);
    const parts = bikeMaintenance.filter(m => m.serviceType === 'parts').reduce((acc, m) => acc + m.cost, 0);
    const other = total - fuel - repairs - parts;
    return { total, fuel, repairs, parts, other, count: bikeMaintenance.length };
  }, [historyBikeId, maintenance]);

  // Bulk Action Helpers
  const handleSelectBike = (id: string) => {
    const newSelection = new Set(selectedBikeIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedBikeIds(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedBikeIds.size === bikes.length) {
      setSelectedBikeIds(new Set());
    } else {
      setSelectedBikeIds(new Set(bikes.map(b => b.id)));
    }
  };

  const handleBulkStatusChange = (status: Bike['status']) => {
    setBikes(prev => prev.map(bike => 
      selectedBikeIds.has(bike.id) ? { ...bike, status } : bike
    ));
    setSelectedBikeIds(new Set());
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Motorcycle Fleet</h2>
        <button 
          onClick={() => {
            setShowAddForm(!showAddForm);
            setVinError(null);
          }}
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
                onChange={e => {
                  setNewBike({...newBike, vin: e.target.value});
                  setVinError(null);
                }} 
                placeholder="Chassis No." 
              />
              {vinError && <p className="text-[10px] text-red-500 font-bold mt-1 uppercase tracking-tighter">{vinError}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Year</label>
              <input required className="w-full border-gray-200 rounded-lg p-2 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none" value={newBike.year} onChange={e => setNewBike({...newBike, year: e.target.value})} placeholder="2024" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Dealer</label>
              <input required className="w-full border-gray-200 rounded-lg p-2 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none" value={newBike.dealer} onChange={e => setNewBike({...newBike, dealer: e.target.value})} placeholder="Fireitup" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Purchase Price</label>
              <input required className="w-full border-gray-200 rounded-lg p-2 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none" value={newBike.price} onChange={e => setNewBike({...newBike, price: e.target.value})} placeholder="R26,000" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">City</label>
              <input required className="w-full border-gray-200 rounded-lg p-2 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none" value={newBike.city} onChange={e => setNewBike({...newBike, city: e.target.value})} placeholder="JHB" />
            </div>
            <div className="md:col-span-1">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Internal Notes</label>
              <input className="w-full border-gray-200 rounded-lg p-2 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none" value={newBike.notes || ''} onChange={e => setNewBike({...newBike, notes: e.target.value})} placeholder="Special instructions..." />
            </div>
            <div className="lg:col-span-4 flex justify-end mt-2">
              <button type="submit" className="bg-blue-600 text-white px-8 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors">Add Bike to Fleet</button>
            </div>
          </div>
        </form>
      )}

      {/* Bulk Actions Toolbar */}
      {selectedBikeIds.size > 0 && (
        <div className="bg-blue-600 text-white p-4 rounded-xl shadow-lg flex items-center justify-between animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center space-x-4">
            <span className="font-bold">{selectedBikeIds.size} Bikes Selected</span>
            <div className="h-6 w-px bg-blue-400"></div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => handleBulkStatusChange('active')}
                className="px-3 py-1 bg-white text-blue-600 rounded-md text-sm font-bold hover:bg-blue-50 transition-colors"
              >
                Mark Active
              </button>
              <button 
                onClick={() => handleBulkStatusChange('maintenance')}
                className="px-3 py-1 bg-blue-800 text-white rounded-md text-sm font-bold hover:bg-blue-900 transition-colors"
              >
                Mark Maintenance
              </button>
              <button 
                onClick={() => handleBulkStatusChange('idle')}
                className="px-3 py-1 bg-blue-800 text-white rounded-md text-sm font-bold hover:bg-blue-900 transition-colors"
              >
                Mark Idle
              </button>
            </div>
          </div>
          <button 
            onClick={() => setSelectedBikeIds(new Set())}
            className="text-sm font-medium hover:underline"
          >
            Deselect All
          </button>
        </div>
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
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Registration</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Driver Assignment</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Last Service</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {bikes.map((bike) => (
              <tr 
                key={bike.id} 
                className={`transition-colors ${selectedBikeIds.has(bike.id) ? 'bg-blue-50/50' : 'hover:bg-gray-50'}`}
              >
                <td className="px-6 py-4">
                  <input 
                    type="checkbox" 
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                    checked={selectedBikeIds.has(bike.id)}
                    onChange={() => handleSelectBike(bike.id)}
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-800">{bike.makeModel}</div>
                  <div className="text-xs text-gray-500">Year: {bike.year} | {bike.city}</div>
                  {bike.notes && (
                    <div className="mt-1 text-[10px] text-blue-500 font-medium italic truncate max-w-[150px]" title={bike.notes}>
                      Note: {bike.notes}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-mono text-gray-600">{bike.licenseNumber}</div>
                  <div className="text-[10px] text-gray-400">VIN: {bike.vin}</div>
                </td>
                <td className="px-6 py-4">
                  <select 
                    className="bg-gray-50 border border-gray-200 text-gray-700 text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-1.5"
                    value={bike.assignedDriverId || "none"}
                    onChange={(e) => handleAssignDriver(bike.id, e.target.value)}
                  >
                    <option value="none">Unassigned</option>
                    {drivers.map(driver => (
                      <option key={driver.id} value={driver.id}>{driver.name}</option>
                    ))}
                  </select>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {getLastMaintenance(bike.id)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1.5 items-start">
                    <button 
                      onClick={() => toggleStatus(bike.id)}
                      className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                        bike.status === 'active' ? 'bg-green-100 text-green-700' :
                        bike.status === 'maintenance' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {bike.status.toUpperCase()}
                    </button>
                    {bike.assignedDriverId && (
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold uppercase whitespace-nowrap border border-blue-100">
                        👤 {drivers.find(d => d.id === bike.assignedDriverId)?.name.split(' ')[0]}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-right space-x-3">
                  <button 
                    onClick={() => setHistoryBikeId(bike.id)}
                    className="text-gray-400 hover:text-blue-600 transition-colors"
                    title="View Maintenance History"
                  >
                    📜 History
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Maintenance History Modal Overlay */}
      {historyBikeId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Vehicle Expense History</h3>
                <p className="text-sm text-gray-500">{bikes.find(b => b.id === historyBikeId)?.licenseNumber} - {bikes.find(b => b.id === historyBikeId)?.makeModel}</p>
              </div>
              <button onClick={() => setHistoryBikeId(null)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {bikeHistoryStats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-red-50 p-3 rounded-xl border border-red-100">
                    <p className="text-[10px] font-bold text-red-400 uppercase">Repairs</p>
                    <p className="text-lg font-black text-red-600">R{bikeHistoryStats.repairs}</p>
                  </div>
                  <div className="bg-orange-50 p-3 rounded-xl border border-orange-100">
                    <p className="text-[10px] font-bold text-orange-400 uppercase">Fuel</p>
                    <p className="text-lg font-black text-orange-600">R{bikeHistoryStats.fuel}</p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                    <p className="text-[10px] font-bold text-blue-400 uppercase">Parts</p>
                    <p className="text-lg font-black text-blue-600">R{bikeHistoryStats.parts}</p>
                  </div>
                  <div className="bg-gray-100 p-3 rounded-xl border border-gray-200">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Total</p>
                    <p className="text-lg font-black text-gray-800">R{bikeHistoryStats.total}</p>
                  </div>
                </div>
              )}

              {maintenance.filter(m => m.bikeId === historyBikeId).length === 0 ? (
                <div className="text-center py-12 text-gray-400 italic">No records found for this bike.</div>
              ) : (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Recent Logs</h4>
                  {maintenance
                    .filter(m => m.bikeId === historyBikeId)
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map(record => (
                      <div key={record.id} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="flex items-start space-x-3">
                           <div className="mt-1">
                             {record.serviceType === 'fuel' ? '⛽' : record.serviceType === 'parts' ? '📦' : '🔧'}
                           </div>
                           <div>
                            <p className="font-bold text-gray-800 text-sm">{record.description}</p>
                            <p className="text-[10px] text-gray-500 uppercase">{new Date(record.date).toLocaleDateString()} • {record.serviceType}</p>
                           </div>
                        </div>
                        <p className="font-bold text-blue-600">R{record.cost}</p>
                      </div>
                    ))}
                </div>
              )}
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 text-right">
              <button 
                onClick={() => setHistoryBikeId(null)}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-bold hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FleetManagement;
