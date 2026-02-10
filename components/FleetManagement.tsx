
import React, { useState } from 'react';
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
  const [newBike, setNewBike] = useState<Omit<Bike, 'id' | 'status'>>({
    makeModel: '',
    licenseNumber: '',
    vin: '',
    year: '',
    dealer: '',
    price: '',
    city: ''
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
    const bike: Bike = {
      ...newBike,
      id: `b-${Date.now()}`,
      status: 'idle'
    };
    setBikes(prev => [...prev, bike]);
    setShowAddForm(false);
    setNewBike({ makeModel: '', licenseNumber: '', vin: '', year: '', dealer: '', price: '', city: '' });
  };

  const getLastMaintenance = (bikeId: string) => {
    const records = maintenance.filter(m => m.bikeId === bikeId);
    if (records.length === 0) return 'Never';
    const latest = records.reduce((a, b) => new Date(a.date) > new Date(b.date) ? a : b);
    return new Date(latest.date).toLocaleDateString();
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
              <input required className="w-full border-gray-200 rounded-lg p-2 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none" value={newBike.vin} onChange={e => setNewBike({...newBike, vin: e.target.value})} placeholder="Chassis No." />
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
            <div className="flex items-end">
              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors">Add Bike to Fleet</button>
            </div>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Bike Details</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Registration</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Driver</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Last Service</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {bikes.map((bike) => (
              <tr key={bike.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-800">{bike.makeModel}</div>
                  <div className="text-xs text-gray-500">Year: {bike.year} | {bike.city}</div>
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
                  <button 
                    onClick={() => toggleStatus(bike.id)}
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      bike.status === 'active' ? 'bg-green-100 text-green-700' :
                      bike.status === 'maintenance' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {bike.status.toUpperCase()}
                  </button>
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
                <h3 className="text-xl font-bold text-gray-800">Maintenance History</h3>
                <p className="text-sm text-gray-500">{bikes.find(b => b.id === historyBikeId)?.licenseNumber} - {bikes.find(b => b.id === historyBikeId)?.makeModel}</p>
              </div>
              <button onClick={() => setHistoryBikeId(null)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {maintenance.filter(m => m.bikeId === historyBikeId).length === 0 ? (
                <div className="text-center py-12 text-gray-400 italic">No records found for this bike.</div>
              ) : (
                <div className="space-y-4">
                  {maintenance
                    .filter(m => m.bikeId === historyBikeId)
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map(record => (
                      <div key={record.id} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div>
                          <p className="font-bold text-gray-800">{record.description}</p>
                          <p className="text-xs text-gray-500">{new Date(record.date).toLocaleDateString()} • {record.serviceType.toUpperCase()}</p>
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
