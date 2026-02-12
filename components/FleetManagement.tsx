
import React, { useState, useMemo, useEffect } from 'react';
import { Bike, Driver, MaintenanceRecord, Payment, Workshop } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area 
} from 'recharts';

interface FleetManagementProps {
  bikes: Bike[];
  setBikes: React.Dispatch<React.SetStateAction<Bike[]>>;
  drivers: Driver[];
  maintenance: MaintenanceRecord[];
  payments: Payment[];
  weeklyTarget: number;
  workshops: Workshop[];
}

const MiniCostChart = ({ bikeId, maintenance }: { bikeId: string, maintenance: MaintenanceRecord[] }) => {
  const data = useMemo(() => {
    const records = maintenance
      .filter(m => m.bikeId === bikeId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-5);

    if (records.length === 0) return [{ cost: 0 }];
    return records.map((r, i) => ({ id: i, cost: r.cost }));
  }, [bikeId, maintenance]);

  if (data.length === 1 && data[0].cost === 0) {
    return <div className="text-[8px] text-gray-300 font-bold uppercase tracking-tighter">No Expense Data</div>;
  }

  return (
    <div className="h-6 w-16 md:w-20">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <Bar dataKey="cost" fill="#94A3B8" radius={[1, 1, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const FleetManagement: React.FC<FleetManagementProps> = ({ bikes, setBikes, drivers, maintenance, payments, weeklyTarget, workshops }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBikeId, setEditingBikeId] = useState<string | null>(null);
  const [historyBikeId, setHistoryBikeId] = useState<string | null>(null);
  const [assigningBikeId, setAssigningBikeId] = useState<string | null>(null);
  const [assigningWorkshopBikeId, setAssigningWorkshopBikeId] = useState<string | null>(null);
  const [trendInterval, setTrendInterval] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  
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

  const [editBikeData, setEditBikeData] = useState<Bike | null>(null);

  useEffect(() => {
    if (editingBikeId) {
      const bike = bikes.find(b => b.id === editingBikeId);
      if (bike) {
        setEditBikeData({ ...bike });
      }
    } else {
      setEditBikeData(null);
    }
  }, [editingBikeId, bikes]);

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

  const historyChartData = useMemo(() => {
    if (!historyBikeId) return [];
    const bikeMaintenance = maintenance.filter(m => m.bikeId === historyBikeId);
    
    const groups: Record<string, number> = {};
    
    bikeMaintenance.forEach(record => {
      const date = new Date(record.date);
      let key = "";
      
      if (trendInterval === 'monthly') {
        key = date.toLocaleString('default', { month: 'short', year: '2-digit' });
      } else if (trendInterval === 'quarterly') {
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        key = `Q${quarter} ${date.getFullYear().toString().slice(-2)}`;
      } else {
        key = date.getFullYear().toString();
      }
      
      groups[key] = (groups[key] || 0) + record.cost;
    });

    return Object.entries(groups).map(([name, cost]) => ({ name, cost }));
  }, [historyBikeId, maintenance, trendInterval]);

  const getServiceStatus = (bikeId: string) => {
    const records = maintenance.filter(m => m.bikeId === bikeId && (m.serviceType === 'routine' || m.serviceType === 'oil'));
    if (records.length === 0) return { status: 'overdue', label: 'Never', progress: 0 };
    const latest = records.reduce((a, b) => new Date(a.date) > new Date(b.date) ? a : b);
    const diff = Math.floor((new Date().getTime() - new Date(latest.date).getTime()) / (1000 * 60 * 60 * 24));
    const progress = Math.max(0, Math.min(100, 100 - (diff / 90) * 100));
    if (diff > 90) return { status: 'overdue', label: `${diff}d`, progress };
    if (diff > 75) return { status: 'due', label: `${diff}d`, progress };
    return { status: 'good', label: `${diff}d`, progress };
  };

  const getDiskStatus = (expiry?: string) => {
    if (!expiry) return { status: 'unknown', days: 0 };
    const exp = new Date(expiry);
    const diff = Math.ceil((exp.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return { status: 'expired', days: diff };
    if (diff < 30) return { status: 'warning', days: diff };
    return { status: 'valid', days: diff };
  };

  const updateBikeStatus = (id: string, newStatus: Bike['status']) => {
    if (newStatus === 'maintenance') {
      setAssigningWorkshopBikeId(id);
    } else {
      setBikes(prev => prev.map(bike => bike.id === id ? { ...bike, status: newStatus, assignedWorkshopId: undefined } : bike));
    }
  };

  const handleAssignWorkshop = (bikeId: string, workshopId: string) => {
    setBikes(prev => prev.map(bike => bike.id === bikeId ? { ...bike, status: 'maintenance', assignedWorkshopId: workshopId === "none" ? undefined : workshopId } : bike));
    setAssigningWorkshopBikeId(null);
  };

  const handleAssignDriver = (bikeId: string, driverId: string) => {
    setBikes(prev => prev.map(bike => bike.id === bikeId ? { ...bike, assignedDriverId: driverId === "none" ? undefined : driverId } : bike));
    setAssigningBikeId(null);
  };

  const handleAddBike = (e: React.FormEvent) => {
    e.preventDefault();
    setBikes(prev => [...prev, { ...newBike, id: `b-${Date.now()}`, status: 'idle', enatisVerified: false }]);
    setShowAddForm(false);
  };

  const handleSaveEditBike = (e: React.FormEvent) => {
    e.preventDefault();
    if (editBikeData) {
      setBikes(prev => prev.map(bike => bike.id === editBikeData.id ? editBikeData : bike));
      setEditingBikeId(null);
    }
  };

  const handleDeleteBike = (id: string) => {
    if (window.confirm("Confirm deletion of this asset?")) setBikes(prev => prev.filter(b => b.id !== id));
  };

  const sendWhatsApp = (driver?: Driver) => {
    if (driver) window.open(`https://wa.me/${driver.contact.replace(/\s+/g, '')}`, '_blank');
  };

  return (
    <div className="space-y-6 md:space-y-10">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {[
          { label: 'Fleet Strength', val: fleetStats.total, sub: `${fleetStats.active} Operations`, color: 'blue' },
          { label: 'Utilization', val: `${fleetStats.utilization}%`, sub: 'Active Duty', color: 'green' },
          { label: 'Workshop', val: fleetStats.workshop, sub: 'Technical Load', color: 'amber' },
          { label: 'Risks', val: fleetStats.licenseWarnings, sub: 'Compliancy', color: 'red' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-4 md:p-6 rounded-2xl md:rounded-[2rem] shadow-sm border border-gray-100">
            <p className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <div className="flex items-baseline space-x-1">
              <h3 className={`text-xl md:text-3xl font-black text-gray-900`}>{stat.val}</h3>
            </div>
            <p className={`text-[8px] md:text-[10px] font-bold mt-1 text-gray-400`}>{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex overflow-x-auto pb-2 scrollbar-hide no-scrollbar -mx-4 px-4 gap-2">
          {(['all', 'active', 'maintenance', 'compliance'] as const).map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap px-6 py-2.5 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-400 border border-gray-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input 
              type="text" 
              placeholder="Search assets..." 
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-xl md:rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowAddForm(true)}
            className="w-full md:w-auto bg-blue-600 text-white px-8 py-3 rounded-xl md:rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-100"
          >
            + Register Asset
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:hidden gap-4">
          {filteredBikes.map(bike => {
            const driver = drivers.find(d => d.id === bike.assignedDriverId);
            const workshop = workshops.find(w => w.id === bike.assignedWorkshopId);
            const disk = getDiskStatus(bike.licenseDiskExpiry);
            const service = getServiceStatus(bike.id);
            return (
              <div key={bike.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-black text-gray-800 text-lg uppercase leading-tight">{bike.licenseNumber}</h4>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">{bike.makeModel}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => setAssigningBikeId(bike.id)}
                      className="p-2 bg-blue-50 text-blue-600 rounded-xl text-xs hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                      title="Assign Driver"
                    >
                      👤+
                    </button>
                    <div className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest truncate max-w-[150px] flex items-center space-x-1.5 ${
                      bike.status === 'active' ? 'bg-green-100 text-green-700' : 
                      bike.status === 'maintenance' ? 'bg-red-100 text-red-700' : 
                      'bg-amber-100 text-amber-700'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${bike.status === 'active' ? 'bg-green-500' : bike.status === 'maintenance' ? 'bg-red-500' : 'bg-amber-500'}`}></span>
                      <span>{bike.status}</span>
                    </div>
                  </div>
                </div>

                {bike.status === 'maintenance' && workshop && (
                  <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                    <p className="text-[8px] font-black text-red-400 uppercase tracking-widest">Assigned Mechanic</p>
                    <p className="text-xs font-bold text-red-800 uppercase">{workshop.name}</p>
                  </div>
                )}

                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-xs">👤</div>
                  <div className="flex-1">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Assigned Operator</p>
                    <p className="text-xs font-bold text-gray-800">{driver?.name || 'Unassigned'}</p>
                  </div>
                  <button 
                    onClick={() => setAssigningBikeId(bike.id)}
                    className="px-3 py-1.5 bg-white border border-gray-100 rounded-lg text-[8px] font-black uppercase tracking-widest shadow-sm hover:bg-blue-50 transition-colors"
                  >
                    {driver ? 'Change' : 'Assign'}
                  </button>
                  {driver && <button onClick={() => sendWhatsApp(driver)} className="text-xl ml-1">💬</button>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Next Service</p>
                    <div className="h-1 w-full bg-gray-100 rounded-full">
                      <div className={`h-full rounded-full ${service.status === 'good' ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${service.progress}%` }}></div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Disk Expiry</p>
                    <p className={`text-[10px] font-black ${disk.status === 'expired' ? 'text-red-600' : 'text-gray-800'}`}>{disk.days} Days</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-2 items-center">
                  <div className="flex flex-col items-center flex-1">
                    <p className="text-[7px] font-black text-gray-400 uppercase tracking-[0.1em] mb-1">Expense History</p>
                    <MiniCostChart bikeId={bike.id} maintenance={maintenance} />
                  </div>
                  <button onClick={() => setEditingBikeId(bike.id)} className="p-2 hover:bg-gray-100 rounded-xl" title="Edit Asset">✏️</button>
                  <button onClick={() => setHistoryBikeId(bike.id)} className="flex-1 py-2 bg-gray-100 rounded-xl text-[9px] font-black uppercase tracking-widest">Full Log</button>
                  <button onClick={() => handleDeleteBike(bike.id)} className="p-2 bg-red-50 text-red-600 rounded-xl">🗑️</button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="hidden md:block bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Identifier</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Operator</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Health & Costs</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status / Mechanic</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredBikes.map(bike => {
                const driver = drivers.find(d => d.id === bike.assignedDriverId);
                const workshop = workshops.find(w => w.id === bike.assignedWorkshopId);
                const disk = getDiskStatus(bike.licenseDiskExpiry);
                const service = getServiceStatus(bike.id);
                return (
                  <tr key={bike.id} className="hover:bg-gray-50/50 transition-all group">
                    <td className="px-8 py-6">
                      <div className="font-black text-gray-900 uppercase tracking-tight text-lg">{bike.licenseNumber}</div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">{bike.makeModel}</p>
                    </td>
                    <td className="px-8 py-6">
                      {driver ? (
                        <div className="flex flex-col">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-gray-800 truncate max-w-[120px]">{driver.name}</span>
                            <button 
                              onClick={() => setAssigningBikeId(bike.id)}
                              className="text-[9px] text-blue-500 hover:text-blue-700 font-black uppercase tracking-tighter transition-colors"
                            >
                              Change
                            </button>
                          </div>
                          <p className="text-[9px] text-gray-400 uppercase">{driver.contact}</p>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setAssigningBikeId(bike.id)}
                          className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                        >
                          + Assign Driver
                        </button>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center space-x-6">
                        <div className="flex-1">
                          <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden mb-1">
                            <div className={`h-full ${service.status === 'good' ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${service.progress}%` }}></div>
                          </div>
                          <span className="text-[9px] font-black uppercase text-gray-400">{service.label}</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <p className="text-[7px] font-black text-gray-300 uppercase tracking-widest mb-1">Expense Trend</p>
                          <MiniCostChart bikeId={bike.id} maintenance={maintenance} />
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col space-y-2">
                        <div className="relative group/status-select w-fit">
                          <div className={`px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest inline-flex items-center space-x-2 transition-colors ${
                            bike.status === 'active' ? 'bg-green-50 border-green-100 text-green-700' :
                            bike.status === 'maintenance' ? 'bg-red-50 border-red-100 text-red-700' :
                            'bg-amber-50 border-amber-100 text-amber-700'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${bike.status === 'active' ? 'bg-green-500' : bike.status === 'maintenance' ? 'bg-red-500' : 'bg-amber-500'}`}></span>
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
                        {bike.status === 'maintenance' && workshop && (
                          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded">At: {workshop.name}</p>
                        )}
                        {bike.status === 'maintenance' && !workshop && (
                          <p className="text-[8px] font-black text-red-400 uppercase tracking-widest italic">Unassigned Mechanic</p>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => setAssigningBikeId(bike.id)} 
                          className="p-2 hover:bg-blue-50 text-blue-600 rounded-xl transition-colors" 
                          title="Assign Driver"
                        >
                          👤+
                        </button>
                        <button onClick={() => setEditingBikeId(bike.id)} className="p-2 hover:bg-gray-100 rounded-xl" title="Edit Asset">✏️</button>
                        <button onClick={() => setHistoryBikeId(bike.id)} className="p-2 hover:bg-gray-100 rounded-xl" title="Maintenance Log">📜</button>
                        <button onClick={() => handleDeleteBike(bike.id)} className="p-2 hover:bg-red-50 text-red-500 rounded-xl">🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <form onSubmit={handleAddBike} className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 md:p-10 space-y-6 animate-in slide-in-from-bottom-8">
            <div className="flex justify-between items-center border-b border-gray-50 pb-4">
              <h3 className="text-xl font-black uppercase tracking-tight">New Asset</h3>
              <button type="button" onClick={() => setShowAddForm(false)} className="text-3xl">&times;</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Make/Model</label>
                <input required className="w-full border-gray-100 rounded-xl p-4 bg-gray-50 text-sm font-bold" placeholder="e.g. Hero ECO 150" value={newBike.makeModel} onChange={e => setNewBike({...newBike, makeModel: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">License Plate</label>
                <input required className="w-full border-gray-100 rounded-xl p-4 bg-gray-50 text-sm font-bold uppercase" placeholder="e.g. LG4 9WY GP" value={newBike.licenseNumber} onChange={e => setNewBike({...newBike, licenseNumber: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">VIN / Chassis Number</label>
                <input required className="w-full border-gray-100 rounded-xl p-4 bg-gray-50 text-sm font-bold" placeholder="VIN" value={newBike.vin} onChange={e => setNewBike({...newBike, vin: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Year</label>
                <input className="w-full border-gray-100 rounded-xl p-4 bg-gray-50 text-sm font-bold" placeholder="2024" value={newBike.year} onChange={e => setNewBike({...newBike, year: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Dealer / Source</label>
                <input className="w-full border-gray-100 rounded-xl p-4 bg-gray-50 text-sm font-bold" placeholder="Dealer Name" value={newBike.dealer} onChange={e => setNewBike({...newBike, dealer: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Purchase Price</label>
                <input className="w-full border-gray-100 rounded-xl p-4 bg-gray-50 text-sm font-bold" placeholder="e.g. R26,899" value={newBike.price} onChange={e => setNewBike({...newBike, price: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">License Expiry</label>
                <input type="date" required className="w-full border-gray-100 rounded-xl p-4 bg-gray-50 text-sm font-bold" value={newBike.licenseDiskExpiry} onChange={e => setNewBike({...newBike, licenseDiskExpiry: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Operational City</label>
                <select className="w-full border-gray-100 rounded-xl p-4 bg-gray-50 text-sm font-bold" value={newBike.city} onChange={e => setNewBike({...newBike, city: e.target.value})}>
                  <option value="JHB">Johannesburg</option>
                  <option value="CTN">Cape Town</option>
                  <option value="EL">East London</option>
                </select>
              </div>
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl">Confirm Enrollment</button>
          </form>
        </div>
      )}

      {editingBikeId && editBikeData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveEditBike} className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 md:p-10 space-y-6 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b border-gray-50 pb-4">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight">Edit Asset Details</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{editBikeData.licenseNumber}</p>
              </div>
              <button type="button" onClick={() => setEditingBikeId(null)} className="text-3xl">&times;</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Make/Model</label>
                <input required className="w-full border-gray-100 rounded-xl p-4 bg-gray-50 text-sm font-bold" placeholder="Make/Model" value={editBikeData.makeModel} onChange={e => setEditBikeData({...editBikeData, makeModel: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">License Plate</label>
                <input required className="w-full border-gray-100 rounded-xl p-4 bg-gray-50 text-sm font-bold uppercase" placeholder="License Plate" value={editBikeData.licenseNumber} onChange={e => setEditBikeData({...editBikeData, licenseNumber: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">VIN / Chassis Number</label>
                <input required className="w-full border-gray-100 rounded-xl p-4 bg-gray-50 text-sm font-bold" placeholder="VIN" value={editBikeData.vin} onChange={e => setEditBikeData({...editBikeData, vin: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Year</label>
                <input className="w-full border-gray-100 rounded-xl p-4 bg-gray-50 text-sm font-bold" placeholder="Year" value={editBikeData.year} onChange={e => setEditBikeData({...editBikeData, year: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Dealer / Source</label>
                <input className="w-full border-gray-100 rounded-xl p-4 bg-gray-50 text-sm font-bold" placeholder="Dealer" value={editBikeData.dealer} onChange={e => setEditBikeData({...editBikeData, dealer: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Purchase Price</label>
                <input className="w-full border-gray-100 rounded-xl p-4 bg-gray-50 text-sm font-bold" placeholder="Price" value={editBikeData.price} onChange={e => setEditBikeData({...editBikeData, price: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">License Expiry</label>
                <input type="date" required className="w-full border-gray-100 rounded-xl p-4 bg-gray-50 text-sm font-bold" value={editBikeData.licenseDiskExpiry} onChange={e => setEditBikeData({...editBikeData, licenseDiskExpiry: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Operational City</label>
                <select className="w-full border-gray-100 rounded-xl p-4 bg-gray-50 text-sm font-bold" value={editBikeData.city} onChange={e => setEditBikeData({...editBikeData, city: e.target.value})}>
                  <option value="JHB">Johannesburg</option>
                  <option value="CTN">Cape Town</option>
                  <option value="EL">East London</option>
                </select>
              </div>
              <div className="md:col-span-2 space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Asset Notes</label>
                <textarea className="w-full border-gray-100 rounded-xl p-4 bg-gray-50 text-sm font-bold resize-none h-24" placeholder="Additional notes about the vehicle..." value={editBikeData.notes || ''} onChange={e => setEditBikeData({...editBikeData, notes: e.target.value})} />
              </div>
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl">Save Changes</button>
          </form>
        </div>
      )}

      {assigningWorkshopBikeId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
           <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full p-8 md:p-10 animate-in zoom-in duration-200">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Dispatch to Workshop</h3>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Assign Service Partner</p>
                </div>
                <button onClick={() => setAssigningWorkshopBikeId(null)} className="text-3xl text-gray-300 hover:text-gray-600">&times;</button>
              </div>
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 no-scrollbar">
                 {workshops.filter(w => {
                    const bike = bikes.find(b => b.id === assigningWorkshopBikeId);
                    return bike ? w.city === bike.city : true;
                 }).map(w => (
                   <button 
                    key={w.id} 
                    onClick={() => handleAssignWorkshop(assigningWorkshopBikeId, w.id)}
                    className="w-full flex items-center justify-between p-4 rounded-2xl border border-gray-100 hover:bg-amber-50 hover:border-amber-200 transition-all text-left group"
                   >
                     <div className="flex items-center space-x-4">
                       <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-lg">🛠️</div>
                       <div>
                         <span className="font-bold text-gray-800 block uppercase text-xs">{w.name}</span>
                         <span className="text-[9px] text-gray-400 uppercase font-bold tracking-widest">{w.specialization[0]}</span>
                       </div>
                     </div>
                     <span className="text-amber-500 font-black text-[10px]">★{w.rating}</span>
                   </button>
                 ))}
                 <button onClick={() => handleAssignWorkshop(assigningWorkshopBikeId, 'none')} className="w-full p-4 rounded-2xl border border-dashed border-gray-200 text-gray-400 font-bold hover:bg-gray-50 uppercase text-[10px] tracking-widest mt-4">In-House / Other</button>
              </div>
           </div>
        </div>
      )}

      {assigningBikeId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
           <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full p-8 md:p-10 animate-in zoom-in duration-200">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Select Operator</h3>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Available Drivers Shown First</p>
                </div>
                <button onClick={() => setAssigningBikeId(null)} className="text-3xl text-gray-300 hover:text-gray-600">&times;</button>
              </div>
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 no-scrollbar">
                 {drivers.sort((a, b) => {
                    const aAssigned = bikes.some(bike => bike.assignedDriverId === a.id);
                    const bAssigned = bikes.some(bike => bike.assignedDriverId === b.id);
                    if (!aAssigned && bAssigned) return -1;
                    if (aAssigned && !bAssigned) return 1;
                    return 0;
                 }).map(d => {
                   const alreadyAssignedBike = bikes.find(bike => bike.assignedDriverId === d.id && bike.id !== assigningBikeId);
                   return (
                     <button 
                      key={d.id} 
                      onClick={() => handleAssignDriver(assigningBikeId, d.id)}
                      className={`w-full flex items-center space-x-4 p-4 rounded-2xl border transition-all text-left group ${
                        alreadyAssignedBike ? 'border-gray-50 bg-gray-50/30' : 'border-gray-100 hover:bg-blue-50 hover:border-blue-200'
                      }`}
                     >
                       <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white transition-all ${
                         alreadyAssignedBike ? 'bg-gray-300' : 'bg-blue-600'
                       }`}>
                         {d.profilePictureUrl ? (
                           <img src={d.profilePictureUrl} className="w-full h-full object-cover rounded-xl" />
                         ) : (
                           d.name.substring(0,2).toUpperCase()
                         )}
                       </div>
                       <div className="flex-1">
                         <span className="font-bold text-gray-800 block text-sm uppercase tracking-tight">{d.name}</span>
                         <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">
                           {alreadyAssignedBike ? `Assigned to: ${alreadyAssignedBike.licenseNumber}` : 'AVAILABLE'}
                         </span>
                       </div>
                       {!alreadyAssignedBike && <span className="text-blue-500 font-black text-xs">SELECT</span>}
                     </button>
                   );
                 })}
                 <button onClick={() => handleAssignDriver(assigningBikeId, 'none')} className="w-full p-4 rounded-2xl border border-dashed border-gray-200 text-gray-400 font-bold hover:bg-gray-50 uppercase text-[10px] tracking-widest mt-4">Unassign Current Driver</button>
              </div>
           </div>
        </div>
      )}

      {historyBikeId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom-8">
            <div className="p-8 md:p-10 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Lifecycle Analysis</h3>
                <p className="text-xs text-blue-500 font-black uppercase tracking-widest mt-1">Maintenance & Expense Telemetry</p>
              </div>
              <button onClick={() => {setHistoryBikeId(null); setTrendInterval('monthly');}} className="text-gray-300 hover:text-gray-600 text-5xl leading-none">&times;</button>
            </div>
            
            <div className="p-8 md:p-10 overflow-y-auto flex-1 space-y-10 no-scrollbar">
               {/* Comprehensive Chart Section */}
               <div className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-2">Expense Trajectory</h4>
                    <div className="flex bg-gray-100 p-1 rounded-xl">
                      {(['monthly', 'quarterly', 'yearly'] as const).map(interval => (
                        <button
                          key={interval}
                          onClick={() => setTrendInterval(interval)}
                          className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${trendInterval === interval ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                          {interval}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="h-64 md:h-80 w-full bg-white rounded-3xl border border-gray-50 p-6 shadow-sm">
                    {historyChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={historyChartData}>
                          <defs>
                            <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fontSize: 9, fontWeight: 'bold', fill: '#94A3B8'}} 
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fontSize: 9, fontWeight: 'bold', fill: '#94A3B8'}}
                            tickFormatter={(val) => `R${val}`}
                          />
                          <Tooltip 
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold' }}
                            formatter={(value) => [`R${value}`, 'Expense']}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="cost" 
                            stroke="#3B82F6" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorCost)" 
                            animationDuration={1500}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-30">
                        <div className="text-4xl">📉</div>
                        <p className="text-[10px] font-black uppercase tracking-widest">No Trend Data Available</p>
                      </div>
                    )}
                  </div>
               </div>

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
                    {maintenance.filter(m => m.bikeId === historyBikeId).length === 0 && (
                      <div className="col-span-full py-16 text-center">
                        <p className="text-gray-300 text-xs italic font-bold uppercase tracking-widest">No Logged Expenses for this Asset</p>
                      </div>
                    )}
                  </div>
               </div>
            </div>

            <div className="p-8 md:p-10 bg-gray-50 border-t border-gray-100 flex flex-col md:flex-row gap-6 justify-between items-center">
               <div className="bg-white px-8 py-5 rounded-[2rem] shadow-sm border border-gray-100 flex items-center space-x-6">
                  <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Total Ownership Cost</p>
                    <p className="text-3xl font-black text-gray-900">R{maintenance.filter(m => m.bikeId === historyBikeId).reduce((a, b) => a + b.cost, 0).toLocaleString()}</p>
                  </div>
                  <div className="h-10 w-[1px] bg-gray-100 hidden md:block"></div>
                  <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Records</p>
                    <p className="text-xl font-black text-gray-600">{maintenance.filter(m => m.bikeId === historyBikeId).length}</p>
                  </div>
               </div>
               <button onClick={() => {setHistoryBikeId(null); setTrendInterval('monthly');}} className="w-full md:w-auto bg-gray-900 text-white px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all active:scale-95">Close Analysis</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FleetManagement;
