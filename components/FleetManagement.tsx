
import React, { useState, useMemo } from 'react';
import { Bike, Driver, MaintenanceRecord, Payment } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
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
  const [assigningBikeId, setAssigningBikeId] = useState<string | null>(null);
  const [editingBike, setEditingBike] = useState<Bike | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('All');

  const [newBike, setNewBike] = useState<Omit<Bike, 'id' | 'status'>>({
    makeModel: '',
    licenseNumber: '',
    vin: '',
    year: '',
    dealer: '',
    price: '',
    city: 'JHB',
    notes: '',
    licenseDiskExpiry: ''
  });

  const cities = useMemo(() => {
    const uniqueCities = Array.from(new Set(bikes.map(b => b.city).filter(Boolean)));
    return ['All', ...uniqueCities];
  }, [bikes]);

  const filteredBikes = useMemo(() => {
    return bikes.filter(bike => {
      const matchesSearch = 
        bike.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bike.makeModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bike.vin.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCity = cityFilter === 'All' || bike.city === cityFilter;
      
      return matchesSearch && matchesCity;
    });
  }, [bikes, searchTerm, cityFilter]);

  const getServiceStatus = (bikeId: string) => {
    const records = maintenance.filter(m => m.bikeId === bikeId && (m.serviceType === 'routine' || m.serviceType === 'oil'));
    if (records.length === 0) return { status: 'overdue', days: 'Never' };
    
    const latest = records.reduce((a, b) => new Date(a.date) > new Date(b.date) ? a : b);
    const diff = Math.floor((new Date().getTime() - new Date(latest.date).getTime()) / (1000 * 60 * 60 * 24));
    
    if (diff > 90) return { status: 'overdue', days: `${diff}d ago` };
    if (diff > 75) return { status: 'due', days: `${diff}d ago` };
    return { status: 'good', days: `${diff}d ago` };
  };

  const getDiskStatus = (expiry?: string) => {
    if (!expiry) return { status: 'unknown', days: 0 };
    const exp = new Date(expiry);
    const now = new Date();
    const diff = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diff < 0) return { status: 'expired', days: diff };
    if (diff < 30) return { status: 'warning', days: diff };
    return { status: 'valid', days: diff };
  };

  const updateBikeStatus = (id: string, newStatus: Bike['status']) => {
    setBikes(prev => prev.map(bike => bike.id === id ? { ...bike, status: newStatus } : bike));
  };

  const handleAssignDriver = (bikeId: string, driverId: string) => {
    setBikes(prev => prev.map(bike => {
      if (bike.id === bikeId) {
        return { ...bike, assignedDriverId: driverId === "none" ? undefined : driverId };
      }
      return bike;
    }));
    setAssigningBikeId(null);
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
    setNewBike({ makeModel: '', licenseNumber: '', vin: '', year: '', dealer: '', price: '', city: 'JHB', notes: '', licenseDiskExpiry: '' });
  };

  const handleUpdateBike = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBike) return;
    setBikes(prev => prev.map(b => b.id === editingBike.id ? editingBike : b));
    setEditingBike(null);
  };

  const handleDeleteBike = (id: string) => {
    if (window.confirm("Are you sure you want to remove this bike from the fleet? This action cannot be undone.")) {
      setBikes(prev => prev.filter(b => b.id !== id));
    }
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

  const historyChartData = useMemo(() => {
    if (!historyBikeId) return [];
    const bikeRecords = maintenance
      .filter(m => m.bikeId === historyBikeId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const monthlyData: Record<string, number> = {};
    bikeRecords.forEach(record => {
      const date = new Date(record.date);
      const monthYear = date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
      monthlyData[monthYear] = (monthlyData[monthYear] || 0) + record.cost;
    });

    return Object.entries(monthlyData).map(([month, cost]) => ({ month, cost }));
  }, [historyBikeId, maintenance]);

  const selectedBikeForHistory = bikes.find(b => b.id === historyBikeId);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Motorcycle Fleet</h2>
          <p className="text-xs text-gray-400 font-medium italic">Manage bike status, compliance, and expenses</p>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 text-white px-5 py-2 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100 font-bold uppercase text-[10px] tracking-widest"
        >
          {showAddForm ? 'Cancel' : '+ New Vehicle'}
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input 
            type="text" 
            placeholder="Search license plate, model or VIN..." 
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-blue-500/20 text-sm transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none"
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
        >
          {cities.map(city => <option key={city} value={city}>{city === 'All' ? 'All Cities' : city}</option>)}
        </select>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddBike} className="bg-white p-8 rounded-3xl shadow-xl border border-blue-100 animate-in fade-in zoom-in duration-300">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Make & Model</label>
              <input required className="w-full border-gray-100 rounded-xl p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={newBike.makeModel} onChange={e => setNewBike({...newBike, makeModel: e.target.value})} placeholder="e.g. Hero ECO 150" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">License Plate</label>
              <input required className="w-full border-gray-100 rounded-xl p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={newBike.licenseNumber} onChange={e => setNewBike({...newBike, licenseNumber: e.target.value})} placeholder="e.g. LG4 9WY GP" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Disk Expiry</label>
              <input type="date" required className="w-full border-gray-100 rounded-xl p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={newBike.licenseDiskExpiry} onChange={e => setNewBike({...newBike, licenseDiskExpiry: e.target.value})} />
            </div>
            <button type="submit" className="lg:col-span-3 bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">Register Asset to Fleet</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Vehicle</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Assigned Driver</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">License Disk</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Health</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredBikes.map((bike) => {
              const assignedDriver = drivers.find(d => d.id === bike.assignedDriverId);
              const diskInfo = getDiskStatus(bike.licenseDiskExpiry);
              const serviceInfo = getServiceStatus(bike.id);
              const isAssigning = assigningBikeId === bike.id;
              
              return (
                <tr key={bike.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    <div>
                      <div className="font-bold text-gray-800 flex items-center space-x-2">
                        <span>{bike.licenseNumber}</span>
                        {bike.enatisVerified && <span className="text-blue-500 text-[10px]" title="eNaTIS Verified">✅</span>}
                      </div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">{bike.makeModel} • <span className="text-blue-500/70">{bike.city}</span></div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    {isAssigning ? (
                      <select 
                        autoFocus
                        className="text-xs border border-gray-200 rounded-lg p-1 bg-white focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                        value={bike.assignedDriverId || "none"}
                        onChange={(e) => handleAssignDriver(bike.id, e.target.value)}
                        onBlur={() => setAssigningBikeId(null)}
                      >
                        <option value="none">Unassign Driver</option>
                        {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    ) : (
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center justify-between group/assign w-full max-w-[140px]">
                          <span className={`text-sm font-bold ${assignedDriver ? 'text-gray-700' : 'text-gray-400 italic'}`}>
                            {assignedDriver ? assignedDriver.name : "Unassigned"}
                          </span>
                          <button 
                            onClick={() => setAssigningBikeId(bike.id)}
                            className="opacity-0 group-hover/assign:opacity-100 text-blue-500 text-[9px] font-black uppercase tracking-widest"
                          >
                            {assignedDriver ? "Change" : "Assign"}
                          </button>
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    <select
                      value={bike.status}
                      onChange={(e) => updateBikeStatus(bike.id, e.target.value as Bike['status'])}
                      className={`text-[10px] font-black uppercase rounded-lg px-2 py-1 outline-none transition-all shadow-sm ${
                        bike.status === 'active' ? 'bg-green-100 text-green-700' :
                        bike.status === 'maintenance' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      <option value="active">Active</option>
                      <option value="maintenance">In Workshop</option>
                      <option value="idle">Idle</option>
                    </select>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <div className="text-xs font-bold text-gray-800">
                        {bike.licenseDiskExpiry ? new Date(bike.licenseDiskExpiry).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'No Expiry'}
                      </div>
                      <div className={`text-[9px] font-black px-1.5 py-0.5 rounded inline-block uppercase tracking-widest w-fit mt-1 shadow-sm ${
                        diskInfo.status === 'valid' ? 'bg-green-100 text-green-700' :
                        diskInfo.status === 'warning' ? 'bg-amber-100 text-amber-700 animate-pulse' :
                        diskInfo.status === 'expired' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {diskInfo.status === 'expired' ? `🛑 Expired` : 
                         diskInfo.status === 'warning' ? `⚠️ ${diskInfo.days}d Left` : 
                         diskInfo.status === 'valid' ? '✅ Valid' : 'Unknown'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="flex flex-col items-center">
                       <span className={`w-3 h-3 rounded-full mb-1 ${
                         serviceInfo.status === 'overdue' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
                         serviceInfo.status === 'due' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' :
                         'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'
                       }`}></span>
                       <span className="text-[9px] font-black uppercase text-gray-400 tracking-tighter">{serviceInfo.days}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setHistoryBikeId(bike.id)} className="hover:bg-indigo-50 p-1.5 rounded-lg text-lg" title="Full History & Expenses">📜</button>
                      <button onClick={() => setEditingBike(bike)} className="hover:bg-blue-50 p-1.5 rounded-lg text-lg" title="Edit Vehicle">✏️</button>
                      <button onClick={() => handleDeleteBike(bike.id)} className="hover:bg-red-50 p-1.5 rounded-lg text-lg" title="Delete Asset">🗑️</button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filteredBikes.length === 0 && (
          <div className="p-16 text-center text-gray-400 italic font-medium">No motorcycles found matching that criteria.</div>
        )}
      </div>

      {/* Edit Bike Modal */}
      {editingBike && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleUpdateBike} className="bg-white rounded-[2rem] shadow-2xl max-w-lg w-full p-8 space-y-6 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Update Asset Details</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{editingBike.licenseNumber}</p>
              </div>
              <button type="button" onClick={() => setEditingBike(null)} className="text-gray-400 hover:text-gray-600 text-3xl leading-none">&times;</button>
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div className="col-span-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1 px-1">Make / Model</label>
                <input required className="w-full border-gray-100 rounded-2xl p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={editingBike.makeModel} onChange={e => setEditingBike({...editingBike, makeModel: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1 px-1">License Plate</label>
                <input required className="w-full border-gray-100 rounded-2xl p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={editingBike.licenseNumber} onChange={e => setEditingBike({...editingBike, licenseNumber: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1 px-1">City</label>
                <select className="w-full border-gray-100 rounded-2xl p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={editingBike.city} onChange={e => setEditingBike({...editingBike, city: e.target.value})}>
                  <option value="JHB">Johannesburg</option>
                  <option value="CTN">Cape Town</option>
                  <option value="EL">East London</option>
                  <option value="DUR">Durban</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1 px-1">License Disk Expiry</label>
                <input type="date" required className="w-full border-gray-100 rounded-2xl p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={editingBike.licenseDiskExpiry} onChange={e => setEditingBike({...editingBike, licenseDiskExpiry: e.target.value})} />
              </div>
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95">Save Asset Configuration</button>
          </form>
        </div>
      )}

      {/* History & Expense Analysis Modal */}
      {historyBikeId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom-4">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Maintenance History: {selectedBikeForHistory?.licenseNumber}</h3>
                <p className="text-xs text-blue-500 font-black uppercase tracking-widest mt-1">{selectedBikeForHistory?.makeModel} Detailed Log</p>
              </div>
              <button onClick={() => setHistoryBikeId(null)} className="text-gray-400 hover:text-gray-600 text-4xl leading-none">&times;</button>
            </div>
            <div className="p-8 overflow-y-auto flex-1 space-y-10">
              {/* Expense Analysis Chart Section */}
              <div className="bg-gray-50 p-8 rounded-[2rem] border border-gray-100 relative overflow-hidden">
                <div className="absolute top-[-20px] left-[-20px] text-8xl opacity-[0.03] pointer-events-none">💰</div>
                <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-6">Expense Analysis Over Time</h4>
                <div className="h-64 w-full">
                  {historyChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={historyChartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af', fontWeight: 'bold'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af', fontWeight: 'bold'}} tickFormatter={(v) => `R${v}`} />
                        <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="cost" fill="#3B82F6" radius={[6, 6, 0, 0]} name="Total Expense" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm font-medium">
                        <span className="text-4xl mb-2">📊</span>
                        No expense records found to visualize.
                      </div>}
                </div>
              </div>

              {/* Expense Items List */}
              <div className="space-y-4">
                <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-3 flex justify-between items-center">
                   <span>Repair & Part Expenses</span>
                   <span className="text-gray-300">Newest First</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {maintenance.filter(m => m.bikeId === historyBikeId).length === 0 ? (
                    <div className="col-span-2 text-center py-12 text-gray-400 italic">No historical records available for this motorcycle.</div>
                  ) : (
                    maintenance
                      .filter(m => m.bikeId === historyBikeId)
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map(record => (
                        <div key={record.id} className="flex justify-between items-center p-5 bg-white rounded-2xl border border-gray-100 hover:border-blue-200 transition-all shadow-sm hover:shadow-md">
                          <div className="flex items-center space-x-4">
                            <div className={`p-3 rounded-xl text-xl ${
                              record.serviceType === 'repair' ? 'bg-red-50 text-red-600' :
                              record.serviceType === 'fuel' ? 'bg-orange-50 text-orange-600' :
                              record.serviceType === 'routine' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'
                            }`}>
                              {record.serviceType === 'fuel' ? '⛽' : record.serviceType === 'parts' ? '📦' : record.serviceType === 'tyres' ? '🛞' : record.serviceType === 'oil' ? '🛢️' : '🔧'}
                            </div>
                            <div>
                              <p className="font-bold text-gray-800 text-sm">{record.description}</p>
                              <p className="text-[10px] text-gray-400 font-black uppercase mt-0.5">{new Date(record.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} • {record.serviceType}</p>
                            </div>
                          </div>
                          <p className="font-black text-gray-800 text-lg">R{record.cost.toLocaleString()}</p>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
            <div className="p-8 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
              <div className="bg-white px-5 py-3 rounded-2xl border border-gray-200 shadow-sm">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Asset Lifetime Maintenance</p>
                <p className="text-xl font-black text-gray-800">R{maintenance.filter(m => m.bikeId === historyBikeId).reduce((acc, m) => acc + m.cost, 0).toLocaleString()}</p>
              </div>
              <button onClick={() => setHistoryBikeId(null)} className="bg-gray-800 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95">Close History</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FleetManagement;
