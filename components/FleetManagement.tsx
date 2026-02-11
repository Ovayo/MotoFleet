
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
  const [isVerifying, setIsVerifying] = useState<string | null>(null);
  
  const [newBike, setNewBike] = useState<Omit<Bike, 'id' | 'status'>>({
    makeModel: '',
    licenseNumber: '',
    vin: '',
    year: '',
    dealer: '',
    price: '',
    city: '',
    notes: '',
    licenseDiskExpiry: ''
  });

  const verifyEnatis = (bikeId: string) => {
    setIsVerifying(bikeId);
    setTimeout(() => {
      setBikes(prev => prev.map(b => b.id === bikeId ? { ...b, enatisVerified: true } : b));
      setIsVerifying(null);
    }, 2000);
  };

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
      status: 'idle',
      enatisVerified: false
    };
    setBikes(prev => [...prev, bike]);
    setShowAddForm(false);
    setNewBike({ makeModel: '', licenseNumber: '', vin: '', year: '', dealer: '', price: '', city: '', notes: '', licenseDiskExpiry: '' });
  };

  const getMaintenanceSummary = (bikeId: string) => {
    const records = maintenance.filter(m => m.bikeId === bikeId);
    if (records.length === 0) return { last: 'Never', next: 'Immediate' };
    const latest = records.reduce((a, b) => new Date(a.date) > new Date(b.date) ? a : b);
    const nextDue = new Date(latest.date);
    nextDue.setMonth(nextDue.getMonth() + 3);
    return { 
      last: new Date(latest.date).toLocaleDateString(), 
      next: nextDue.toLocaleDateString(),
      isOverdue: nextDue < new Date()
    };
  };

  const getDiskStatus = (expiry?: string) => {
    if (!expiry) return 'unknown';
    const exp = new Date(expiry);
    const now = new Date();
    const diff = (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    if (diff < 0) return 'expired';
    if (diff < 30) return 'warning';
    return 'valid';
  };

  const getSparklineData = (bikeId: string) => {
    return maintenance
      .filter(m => m.bikeId === bikeId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-5)
      .map(m => ({ cost: m.cost }));
  };

  const getSignalIcon = (strength?: string) => {
    switch(strength) {
      case 'excellent': return <span className="text-green-500">📶</span>;
      case 'good': return <span className="text-blue-500 opacity-80">📶</span>;
      case 'poor': return <span className="text-amber-500 opacity-60">📶</span>;
      case 'offline': return <span className="text-red-500 opacity-40">📶</span>;
      default: return <span className="text-gray-300">📶</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Motorcycle Fleet</h2>
          <p className="text-xs text-gray-400 font-medium">Linked to eNaTIS & Live GPS Trackers</p>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
        >
          {showAddForm ? 'Cancel' : '+ Log New Bike'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddBike} className="bg-white p-6 rounded-xl shadow-md border border-blue-100 animate-in fade-in duration-300">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <input required className="border-gray-200 rounded-lg p-2 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none" value={newBike.makeModel} onChange={e => setNewBike({...newBike, makeModel: e.target.value})} placeholder="Make / Model" />
            <input required className="border-gray-200 rounded-lg p-2 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none" value={newBike.licenseNumber} onChange={e => setNewBike({...newBike, licenseNumber: e.target.value})} placeholder="License Plate" />
            <input required className="border-gray-200 rounded-lg p-2 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none" value={newBike.vin} onChange={e => setNewBike({...newBike, vin: e.target.value})} placeholder="VIN / Chassis" />
            <input type="date" required className="border-gray-200 rounded-lg p-2 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none" value={newBike.licenseDiskExpiry} onChange={e => setNewBike({...newBike, licenseDiskExpiry: e.target.value})} placeholder="Disk Expiry" title="License Disk Expiry" />
            <button type="submit" className="lg:col-span-4 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors">Add Bike & Link New Tracker</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Vehicle</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-center">Live GPS</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Disk Status</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">State</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Maint.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {bikes.map((bike) => {
              const mSummary = getMaintenanceSummary(bike.id);
              const assignedDriver = drivers.find(d => d.id === bike.assignedDriverId);
              const sparkData = getSparklineData(bike.id);
              const diskStatus = getDiskStatus(bike.licenseDiskExpiry);
              
              return (
                <tr key={bike.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-bold text-gray-800 flex items-center space-x-1">
                        <span>{bike.licenseNumber}</span>
                        {bike.enatisVerified && <span className="text-blue-500 text-[10px]" title="eNaTIS Verified">✅</span>}
                      </div>
                      <div className="text-[10px] text-gray-400 font-mono uppercase tracking-tighter">{bike.vin}</div>
                      <div className="text-xs text-gray-500">{bike.makeModel}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {bike.tracker ? (
                      <div className="flex flex-col items-center">
                        <div className="text-xl mb-0.5">{getSignalIcon(bike.tracker.signalStrength)}</div>
                        <div className="flex items-center space-x-1">
                           <span className={`w-1.5 h-1.5 rounded-full ${bike.tracker.status === 'moving' ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'}`}></span>
                           <span className="text-[8px] font-black uppercase text-gray-400">{bike.tracker.status}</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-[9px] font-bold text-gray-300 uppercase tracking-tighter">No Tracker</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className={`text-[10px] font-black px-2 py-1 rounded inline-block uppercase tracking-wider ${
                      diskStatus === 'valid' ? 'bg-green-50 text-green-600' :
                      diskStatus === 'warning' ? 'bg-amber-50 text-amber-600' :
                      diskStatus === 'expired' ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-400'
                    }`}>
                      {bike.licenseDiskExpiry ? new Date(bike.licenseDiskExpiry).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => toggleStatus(bike.id)}
                      className={`inline-block w-max px-2.5 py-1 rounded-full text-[10px] font-black uppercase transition-all ${
                        bike.status === 'active' ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                        bike.status === 'maintenance' ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                      }`}
                    >
                      {bike.status}{assignedDriver ? ` - ${assignedDriver.name.split(' ')[0]}` : ''}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setHistoryBikeId(bike.id)}
                      className="text-blue-600 hover:text-blue-800 font-bold text-xs"
                    >
                      📜 History
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
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold text-gray-800">History: {bikes.find(b => b.id === historyBikeId)?.licenseNumber}</h3>
              <button onClick={() => setHistoryBikeId(null)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-3">
                {maintenance.filter(m => m.bikeId === historyBikeId).map(record => (
                  <div key={record.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div>
                      <p className="font-bold text-gray-800 text-sm">{record.description}</p>
                      <p className="text-[10px] text-gray-400 uppercase font-medium">{new Date(record.date).toLocaleDateString()} • {record.serviceType}</p>
                    </div>
                    <p className="font-black text-gray-800">R{record.cost}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 text-right">
              <button onClick={() => setHistoryBikeId(null)} className="bg-gray-800 text-white px-8 py-2 rounded-xl font-bold">Close View</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FleetManagement;
