
import React, { useState, useMemo } from 'react';
import { Bike, Driver, MaintenanceRecord, Payment } from '../types';
import { 
  BarChart, Bar, ResponsiveContainer 
} from 'recharts';

interface FleetManagementProps {
  bikes: Bike[];
  setBikes: React.Dispatch<React.SetStateAction<Bike[]>>;
  drivers: Driver[];
  maintenance: MaintenanceRecord[];
  payments: Payment[];
  weeklyTarget: number;
}

const FleetManagement: React.FC<FleetManagementProps> = ({ bikes, setBikes, drivers, maintenance, payments, weeklyTarget }) => {
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

  const sendReminder = (driver: Driver) => {
    const currentWeek = 4;
    const driverPayments = payments.filter(p => p.driverId === driver.id);
    const totalPaid = driverPayments.reduce((acc, p) => acc + p.amount, 0);
    const expected = currentWeek * weeklyTarget;
    const balance = totalPaid - expected;
    
    let message = `Hello ${driver.name.split(' ')[0]}, this is MotoFleet. `;
    if (balance < 0) {
      message += `Your account is currently in arrears by R${Math.abs(balance)}. Please settle as soon as possible. Thank you!`;
    } else {
      message += `Just a friendly check-in! Your account is in great standing. Safe driving out there!`;
    }

    const encodedMsg = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${driver.contact.replace(/\s+/g, '')}?text=${encodedMsg}`;
    window.open(whatsappUrl, '_blank');
  };

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
    setNewBike({ makeModel: '', licenseNumber: '', vin: '', year: '', dealer: '', price: '', city: '', notes: '' });
  };

  const getMaintenanceSummary = (bikeId: string) => {
    const records = maintenance.filter(m => m.bikeId === bikeId);
    if (records.length === 0) return { last: 'Never', next: 'Immediate', hasWarranty: false };
    const latest = records.reduce((a, b) => new Date(a.date) > new Date(b.date) ? a : b);
    const nextDue = new Date(latest.date);
    nextDue.setMonth(nextDue.getMonth() + 3);
    return { 
      last: new Date(latest.date).toLocaleDateString(), 
      next: nextDue.toLocaleDateString(),
      isOverdue: nextDue < new Date()
    };
  };

  const getSparklineData = (bikeId: string) => {
    return maintenance
      .filter(m => m.bikeId === bikeId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-5)
      .map(m => ({ cost: m.cost }));
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
        <form onSubmit={handleAddBike} className="bg-white p-6 rounded-xl shadow-md border border-blue-100">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <input required className="border-gray-200 rounded-lg p-2 bg-gray-50" value={newBike.makeModel} onChange={e => setNewBike({...newBike, makeModel: e.target.value})} placeholder="Make / Model" />
            <input required className="border-gray-200 rounded-lg p-2 bg-gray-50" value={newBike.licenseNumber} onChange={e => setNewBike({...newBike, licenseNumber: e.target.value})} placeholder="License Plate" />
            <input required className="border-gray-200 rounded-lg p-2 bg-gray-50" value={newBike.vin} onChange={e => setNewBike({...newBike, vin: e.target.value})} placeholder="VIN" />
            <button type="submit" className="bg-blue-600 text-white rounded-lg font-bold">Add Bike</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Bike</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Assigned Driver</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Maintenance</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Records</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {bikes.map((bike) => {
              const mSummary = getMaintenanceSummary(bike.id);
              const assignedDriver = drivers.find(d => d.id === bike.assignedDriverId);
              const sparkData = getSparklineData(bike.id);
              
              return (
                <tr key={bike.id} className="hover:bg-gray-50 transition-colors">
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
                    <div className="text-xs text-gray-600">
                      <span className="font-bold">Last:</span> {mSummary.last}
                    </div>
                    <div className={`text-[10px] font-bold ${mSummary.isOverdue ? 'text-red-500' : 'text-gray-400'}`}>
                      Next: {mSummary.next}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => toggleStatus(bike.id)}
                        className={`inline-block w-max px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          bike.status === 'active' ? 'bg-green-100 text-green-700' :
                          bike.status === 'maintenance' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {bike.status}{assignedDriver ? ` - ${assignedDriver.name.split(' ')[0]}` : ''}
                      </button>
                      {assignedDriver && (
                        <button onClick={() => sendReminder(assignedDriver)} className="text-lg" title="Send Reminder">💬</button>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-4">
                      {sparkData.length > 0 && (
                        <div className="w-16 h-8 opacity-40 hover:opacity-100 transition-opacity">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={sparkData}>
                              <Bar dataKey="cost" fill="#3B82F6" radius={[1, 1, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                      <button 
                        onClick={() => setHistoryBikeId(bike.id)}
                        className="text-blue-600 hover:text-blue-800 font-bold text-xs"
                      >
                        📜 History
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {historyBikeId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold text-gray-800">History: {bikes.find(b => b.id === historyBikeId)?.licenseNumber}</h3>
              <button onClick={() => setHistoryBikeId(null)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-3">
                {maintenance.filter(m => m.bikeId === historyBikeId).map(record => (
                  <div key={record.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div>
                      <p className="font-bold text-gray-800 text-sm">{record.description}</p>
                      <p className="text-[10px] text-gray-500 uppercase">{new Date(record.date).toLocaleDateString()} • {record.serviceType}</p>
                    </div>
                    <p className="font-black text-gray-800">R{record.cost}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 text-right">
              <button onClick={() => setHistoryBikeId(null)} className="bg-gray-800 text-white px-6 py-2 rounded-lg font-bold">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FleetManagement;
