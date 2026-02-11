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
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'maintenance' | 'compliance'>('all');

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

  // Fleet Statistics Calculations
  const fleetStats = useMemo(() => {
    const total = bikes.length;
    const active = bikes.filter(b => b.status === 'active').length;
    const workshop = bikes.filter(b => b.status === 'maintenance').length;
    
    const now = new Date();
    const licenseWarnings = bikes.filter(b => {
      if (!b.licenseDiskExpiry) return true;
      const exp = new Date(b.licenseDiskExpiry);
      const diff = (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return diff < 30;
    }).length;

    const utilization = total > 0 ? Math.round((active / total) * 100) : 0;

    return { total, active, workshop, licenseWarnings, utilization };
  }, [bikes]);

  const filteredBikes = useMemo(() => {
    return bikes.filter(bike => {
      const matchesSearch = 
        bike.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bike.makeModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bike.vin.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesTab = true;
      if (activeTab === 'active') matchesTab = bike.status === 'active';
      if (activeTab === 'maintenance') matchesTab = bike.status === 'maintenance';
      if (activeTab === 'compliance') {
        const exp = bike.licenseDiskExpiry ? new Date(bike.licenseDiskExpiry) : null;
        const diff = exp ? (exp.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24) : -1;
        matchesTab = diff < 30 || !bike.enatisVerified;
      }
      
      return matchesSearch && matchesTab;
    });
  }, [bikes, searchTerm, activeTab]);

  const getServiceStatus = (bikeId: string) => {
    const records = maintenance.filter(m => m.bikeId === bikeId && (m.serviceType === 'routine' || m.serviceType === 'oil'));
    if (records.length === 0) return { status: 'overdue', days: 999, label: 'Never', progress: 0 };
    
    const latest = records.reduce((a, b) => new Date(a.date) > new Date(b.date) ? a : b);
    const diff = Math.floor((new Date().getTime() - new Date(latest.date).getTime()) / (1000 * 60 * 60 * 24));
    
    // Assume 90 days service interval
    const progress = Math.max(0, Math.min(100, 100 - (diff / 90) * 100));
    
    if (diff > 90) return { status: 'overdue', days: diff, label: `${diff}d`, progress };
    if (diff > 75) return { status: 'due', days: diff, label: `${diff}d`, progress };
    return { status: 'good', days: diff, label: `${diff}d`, progress };
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
    if (window.confirm("Confirm deletion of this asset from fleet?")) {
      setBikes(prev => prev.filter(b => b.id !== id));
    }
  };

  const sendWhatsApp = (driver?: Driver) => {
    if (!driver) return;
    const url = `https://wa.me/${driver.contact.replace(/\s+/g, '')}`;
    window.open(url, '_blank');
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
    <div className="space-y-8 pb-10">
      {/* Fleet Command Statistics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700"></div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 relative z-10">Fleet Strength</p>
          <div className="flex items-end space-x-2 relative z-10">
            <h3 className="text-4xl font-black text-gray-900">{fleetStats.total}</h3>
            <span className="text-[11px] font-bold text-gray-400 mb-2 uppercase">Assets</span>
          </div>
          <div className="text-[10px] text-blue-500 font-bold mt-2 relative z-10">● {fleetStats.active} Operations Running</div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-green-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700"></div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 relative z-10">Utilization Rate</p>
          <div className="flex items-end space-x-2 relative z-10">
            <h3 className="text-4xl font-black text-green-600">{fleetStats.utilization}%</h3>
            <span className="text-[11px] font-bold text-gray-400 mb-2 uppercase">Active</span>
          </div>
          <div className="mt-3 w-full bg-gray-100 h-1.5 rounded-full overflow-hidden relative z-10">
            <div className="bg-green-500 h-full transition-all duration-1000" style={{ width: `${fleetStats.utilization}%` }}></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-amber-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700"></div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 relative z-10">Workshop Load</p>
          <div className="flex items-end space-x-2 relative z-10">
            <h3 className="text-4xl font-black text-amber-600">{fleetStats.workshop}</h3>
            <span className="text-[11px] font-bold text-gray-400 mb-2 uppercase">Bikes</span>
          </div>
          <div className="text-[10px] text-amber-500 font-bold mt-2 relative z-10">Requires Technical Attention</div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-red-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700"></div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 relative z-10">Compliance Risk</p>
          <div className="flex items-end space-x-2 relative z-10">
            <h3 className={`text-4xl font-black ${fleetStats.licenseWarnings > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {fleetStats.licenseWarnings}
            </h3>
            <span className="text-[11px] font-bold text-gray-400 mb-2 uppercase">Alerts</span>
          </div>
          <div className={`text-[10px] font-bold mt-2 relative z-10 ${fleetStats.licenseWarnings > 0 ? 'text-red-400 animate-pulse' : 'text-green-500'}`}>
            {fleetStats.licenseWarnings > 0 ? 'Immediate Action Required' : 'All Systems Verified'}
          </div>
        </div>
      </div>

      {/* Modern Filter & Action Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="flex p-1.5 bg-gray-100 rounded-[1.25rem] w-fit">
          {(['all', 'active', 'maintenance', 'compliance'] as const).map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab ? 'bg-white text-blue-600 shadow-md scale-[1.02]' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab === 'all' ? 'Entire Fleet' : tab}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-4 flex-1 xl:max-w-md">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input 
              type="text" 
              placeholder="Search assets, plates, or VIN..." 
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-medium transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-600 text-white px-6 py-3 rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 font-black uppercase text-[10px] tracking-widest flex items-center space-x-2 shrink-0"
          >
            <span>+</span>
            <span>New Asset</span>
          </button>
        </div>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddBike} className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-blue-50 animate-in slide-in-from-top-4 duration-500 space-y-8">
           <div className="flex items-center space-x-3 mb-2">
             <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white text-xs font-black">MF</div>
             <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Register Vehicle into Fleet</h3>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Make & Model</label>
              <input required className="w-full border-gray-100 rounded-xl p-4 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold" value={newBike.makeModel} onChange={e => setNewBike({...newBike, makeModel: e.target.value})} placeholder="e.g. Hero ECO 150" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">License Plate</label>
              <input required className="w-full border-gray-100 rounded-xl p-4 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-black uppercase" value={newBike.licenseNumber} onChange={e => setNewBike({...newBike, licenseNumber: e.target.value})} placeholder="e.g. LG4 9WY GP" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">VIN Number</label>
              <input required className="w-full border-gray-100 rounded-xl p-4 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono font-bold" value={newBike.vin} onChange={e => setNewBike({...newBike, vin: e.target.value})} placeholder="VIN Number" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Year</label>
              <input required className="w-full border-gray-100 rounded-xl p-4 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold" value={newBike.year} onChange={e => setNewBike({...newBike, year: e.target.value})} placeholder="e.g. 2024" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Disk Expiry</label>
              <input type="date" required className="w-full border-gray-100 rounded-xl p-4 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold" value={newBike.licenseDiskExpiry} onChange={e => setNewBike({...newBike, licenseDiskExpiry: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">City Location</label>
              <select className="w-full border-gray-100 rounded-xl p-4 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold" value={newBike.city} onChange={e => setNewBike({...newBike, city: e.target.value})}>
                <option value="JHB">Johannesburg</option>
                <option value="CTN">Cape Town</option>
                <option value="EL">East London</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end pt-4 space-x-4">
             <button type="button" onClick={() => setShowAddForm(false)} className="px-8 py-4 font-black text-[10px] uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors">Cancel</button>
             <button type="submit" className="bg-blue-600 text-white px-12 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95">Enroll Asset</button>
          </div>
        </form>
      )}

      {/* Main Assets Table */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50 border-b border-gray-100">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Asset Identifier</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Operator</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Mechanical Health</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">License Compliance</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">State / Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredBikes.map((bike) => {
              const driver = drivers.find(d => d.id === bike.assignedDriverId);
              const diskStatus = getDiskStatus(bike.licenseDiskExpiry);
              const service = getServiceStatus(bike.id);
              const initials = driver?.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

              return (
                <tr key={bike.id} className="hover:bg-gray-50/50 transition-all group">
                  {/* Asset Info */}
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-white border border-gray-100 rounded-2xl shadow-sm flex items-center justify-center text-xl grayscale group-hover:grayscale-0 transition-all">🏍️</div>
                      <div>
                        <div className="font-black text-gray-900 uppercase tracking-tight text-lg leading-none">{bike.licenseNumber}</div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-wider">{bike.makeModel} • <span className="text-blue-500">{bike.city}</span></div>
                      </div>
                    </div>
                  </td>

                  {/* Operator Info */}
                  <td className="px-8 py-6">
                    {driver ? (
                      <div className="flex items-center space-x-3 group/driver cursor-pointer" onClick={() => sendWhatsApp(driver)}>
                        <div className="relative">
                          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                            {driver.profilePictureUrl ? (
                              <img src={driver.profilePictureUrl} alt={driver.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[10px] font-black text-blue-600">{initials}</span>
                            )}
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
                        </div>
                        <div>
                          <div className="text-[11px] font-black text-gray-800 uppercase group-hover/driver:text-blue-600 transition-colors">{driver.name}</div>
                          <div className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Click to contact</div>
                        </div>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setAssigningBikeId(bike.id)}
                        className="flex items-center space-x-2 text-gray-300 hover:text-blue-600 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-xl border-2 border-dashed border-gray-100 flex items-center justify-center text-sm">+</div>
                        <span className="text-[10px] font-black uppercase tracking-widest">Assign Driver</span>
                      </button>
                    )}
                  </td>

                  {/* Mechanical Health Meter */}
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1 max-w-[120px]">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className={`text-[8px] font-black uppercase tracking-widest ${
                            service.status === 'overdue' ? 'text-red-500' : 
                            service.status === 'due' ? 'text-amber-500' : 'text-green-500'
                          }`}>
                            Next: {service.label}
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-1000 ${
                              service.status === 'overdue' ? 'bg-red-500' : 
                              service.status === 'due' ? 'bg-amber-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${service.progress}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className={`p-1.5 rounded-lg text-xs ${
                        service.status === 'overdue' ? 'bg-red-50 text-red-600' : 
                        service.status === 'due' ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'
                      }`}>
                        {service.status === 'good' ? '✨' : '⚠️'}
                      </div>
                    </div>
                  </td>

                  {/* Compliance Detail */}
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-black text-gray-800">{new Date(bike.licenseDiskExpiry || '').toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                        {diskStatus.status === 'warning' && <span className="animate-pulse text-amber-500">⚠️</span>}
                      </div>
                      <div className={`text-[9px] font-black uppercase tracking-[0.1em] mt-1 ${
                        diskStatus.status === 'expired' ? 'text-red-500' : 
                        diskStatus.status === 'warning' ? 'text-amber-500' : 'text-gray-400'
                      }`}>
                        {diskStatus.days < 0 ? 'Expired' : `${diskStatus.days} days remaining`}
                      </div>
                    </div>
                  </td>

                  {/* Actions & Status */}
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end space-x-4">
                      <div className="relative group/status-select">
                        <div className={`px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest inline-flex items-center space-x-2 ${
                          bike.status === 'active' ? 'bg-green-50 border-green-100 text-green-700' :
                          bike.status === 'maintenance' ? 'bg-red-50 border-red-100 text-red-700' :
                          'bg-gray-100 border-gray-200 text-gray-500'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${bike.status === 'active' ? 'bg-green-500' : bike.status === 'maintenance' ? 'bg-red-500' : 'bg-gray-400'}`}></span>
                          <span>{bike.status}</span>
                        </div>
                        <select 
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          value={bike.status}
                          onChange={(e) => updateBikeStatus(bike.id, e.target.value as any)}
                        >
                          <option value="active">Active</option>
                          <option value="maintenance">Maintenance</option>
                          <option value="idle">Idle</option>
                        </select>
                      </div>

                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                        <button onClick={() => setHistoryBikeId(bike.id)} className="p-2 hover:bg-gray-100 rounded-xl text-lg" title="Full History">📜</button>
                        <button onClick={() => setEditingBike(bike)} className="p-2 hover:bg-blue-50 text-blue-600 rounded-xl text-lg" title="Edit Asset">✏️</button>
                        <button onClick={() => handleDeleteBike(bike.id)} className="p-2 hover:bg-red-50 text-red-500 rounded-xl text-lg" title="Retire Asset">🗑️</button>
                      </div>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filteredBikes.length === 0 && (
          <div className="p-24 text-center">
            <div className="text-4xl opacity-20 mb-4">🔍</div>
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">No matching assets located</p>
          </div>
        )}
      </div>

      {/* Driver Assignment Modal */}
      {assigningBikeId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full p-10 animate-in zoom-in duration-200">
              <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight mb-6">Assign Asset Operator</h3>
              <div className="space-y-4">
                 {drivers.map(d => (
                   <button 
                    key={d.id} 
                    onClick={() => handleAssignDriver(assigningBikeId, d.id)}
                    className="w-full flex items-center space-x-4 p-4 rounded-2xl border border-gray-100 hover:bg-blue-50 hover:border-blue-200 transition-all text-left"
                   >
                     <div className="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden">
                       {d.profilePictureUrl && <img src={d.profilePictureUrl} className="w-full h-full object-cover" />}
                     </div>
                     <span className="font-bold text-gray-800">{d.name}</span>
                   </button>
                 ))}
                 <button onClick={() => handleAssignDriver(assigningBikeId, 'none')} className="w-full p-4 rounded-2xl border border-dashed border-gray-200 text-gray-400 font-bold hover:bg-gray-50 uppercase text-[10px] tracking-widest">Unassign Driver</button>
              </div>
              <button onClick={() => setAssigningBikeId(null)} className="mt-8 w-full py-3 text-[10px] font-black uppercase text-gray-400 tracking-widest">Cancel Assignment</button>
           </div>
        </div>
      )}

      {/* History Modal & Analysis */}
      {historyBikeId && selectedBikeForHistory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom-8">
            <div className="p-10 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Lifecycle Analysis: {selectedBikeForHistory.licenseNumber}</h3>
                <p className="text-xs text-blue-500 font-black uppercase tracking-widest mt-1">Maintenance & Expense Telemetry</p>
              </div>
              <button onClick={() => setHistoryBikeId(null)} className="text-gray-300 hover:text-gray-600 text-5xl leading-none">&times;</button>
            </div>
            
            <div className="p-10 overflow-y-auto flex-1 space-y-12">
               {/* Trend Chart */}
               <div className="bg-gray-900 p-8 rounded-[2.5rem] text-white shadow-xl shadow-blue-900/10">
                  <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-6">Expense Distribution (R)</h4>
                  <div className="h-64 w-full">
                    {historyChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={historyChartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b', fontWeight: 'bold'}} />
                          <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b', fontWeight: 'bold'}} />
                          <Tooltip cursor={{fill: '#ffffff08'}} contentStyle={{ borderRadius: '16px', backgroundColor: '#1e293b', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                          <Bar dataKey="cost" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center opacity-40 italic text-sm">No recorded expenses found</div>
                    )}
                  </div>
               </div>

               {/* Log Items */}
               <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-3">Operational Log Events</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {maintenance.filter(m => m.bikeId === historyBikeId).map(m => (
                      <div key={m.id} className="p-5 bg-white rounded-3xl border border-gray-100 flex justify-between items-center group/item hover:border-blue-200 transition-all">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-xl">
                            {m.serviceType === 'fuel' ? '⛽' : m.serviceType === 'repair' ? '🔧' : '🛠️'}
                          </div>
                          <div>
                            <p className="text-sm font-black text-gray-800 leading-tight">{m.description}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">{new Date(m.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <span className="text-lg font-black text-gray-900">R{m.cost}</span>
                      </div>
                    ))}
                  </div>
               </div>
            </div>

            <div className="p-10 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
               <div className="bg-white px-6 py-4 rounded-3xl shadow-sm border border-gray-100">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Total Ownership Cost</p>
                  <p className="text-2xl font-black text-gray-900">R{maintenance.filter(m => m.bikeId === historyBikeId).reduce((a, b) => a + b.cost, 0).toLocaleString()}</p>
               </div>
               <button onClick={() => setHistoryBikeId(null)} className="bg-gray-900 text-white px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-black transition-all active:scale-95">Close Analysis</button>
            </div>
          </div>
        </div>
      )}

      {/* Standard Edit Modal */}
      {editingBike && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleUpdateBike} className="bg-white rounded-[2.5rem] shadow-2xl max-w-2xl w-full p-10 animate-in zoom-in duration-200 space-y-8">
            <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Modify Asset Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Make & Model</label>
                <input required className="w-full border-gray-100 rounded-xl p-4 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold" value={editingBike.makeModel} onChange={e => setEditingBike({...editingBike, makeModel: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">License Plate</label>
                <input required className="w-full border-gray-100 rounded-xl p-4 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-black uppercase" value={editingBike.licenseNumber} onChange={e => setEditingBike({...editingBike, licenseNumber: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Disk Expiry</label>
                <input type="date" required className="w-full border-gray-100 rounded-xl p-4 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold" value={editingBike.licenseDiskExpiry} onChange={e => setEditingBike({...editingBike, licenseDiskExpiry: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Operational City</label>
                <input required className="w-full border-gray-100 rounded-xl p-4 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold" value={editingBike.city} onChange={e => setEditingBike({...editingBike, city: e.target.value})} />
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <button type="button" onClick={() => setEditingBike(null)} className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-200 transition-all">Discard Changes</button>
              <button type="submit" className="flex-[2] bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all">Save Asset Metadata</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default FleetManagement;