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

// Sparkline component for in-list visual cost telemetry
const MiniCostChart = ({ bikeId, maintenance }: { bikeId: string, maintenance: MaintenanceRecord[] }) => {
  const data = useMemo(() => {
    const records = maintenance
      .filter(m => m.bikeId === bikeId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-5); // Last 5 expenses

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
    setBikes(prev => prev.map(bike => bike.id === id ? { ...bike, status: newStatus } : bike));
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

  const handleDeleteBike = (id: string) => {
    if (window.confirm("Confirm deletion of this asset?")) setBikes(prev => prev.filter(b => b.id !== id));
  };

  const sendWhatsApp = (driver?: Driver) => {
    if (driver) window.open(`https://wa.me/${driver.contact.replace(/\s+/g, '')}`, '_blank');
  };

  return (
    <div className="space-y-6 md:space-y-10">
      {/* Fluid Statistics Grid */}
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

      {/* Tabs & Search Container */}
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

      {/* Responsive Asset Layout */}
      <div className="space-y-4">
        {/* Mobile View: Cards */}
        <div className="grid grid-cols-1 md:hidden gap-4">
          {filteredBikes.map(bike => {
            const driver = drivers.find(d => d.id === bike.assignedDriverId);
            const disk = getDiskStatus(bike.licenseDiskExpiry);
            const service = getServiceStatus(bike.id);
            return (
              <div key={bike.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-black text-gray-800 text-lg uppercase leading-tight">{bike.licenseNumber}</h4>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">{bike.makeModel}</p>
                  </div>
                  <div className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest truncate max-w-[150px] flex items-center space-x-1.5 ${
                    bike.status === 'active' ? 'bg-green-100 text-green-700' : 
                    bike.status === 'maintenance' ? 'bg-red-100 text-red-700' : 
                    'bg-amber-100 text-amber-700'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${bike.status === 'active' ? 'bg-green-500' : bike.status === 'maintenance' ? 'bg-red-500' : 'bg-amber-500'}`}></span>
                    <span>{bike.status}</span>
                  </div>
                </div>

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
                  <button onClick={() => setHistoryBikeId(bike.id)} className="flex-1 py-2 bg-gray-100 rounded-xl text-[9px] font-black uppercase tracking-widest">Full Log</button>
                  <button onClick={() => handleDeleteBike(bike.id)} className="p-2 bg-red-50 text-red-600 rounded-xl">🗑️</button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Identifier</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Operator</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Health & Costs</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Compliance</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredBikes.map(bike => {
                const driver = drivers.find(d => d.id === bike.assignedDriverId);
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
                      <div className={`text-[10px] font-black uppercase tracking-widest ${disk.status === 'expired' ? 'text-red-600' : 'text-gray-800'}`}>
                        {disk.days} Days Left
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end space-x-4">
                        <div className="relative group/status-select">
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
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                          <button onClick={() => setHistoryBikeId(bike.id)} className="p-2 hover:bg-gray-100 rounded-xl" title="Maintenance Log">📜</button>
                          <button onClick={() => handleDeleteBike(bike.id)} className="p-2 hover:bg-red-50 text-red-500 rounded-xl">🗑️</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Responsive Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <form onSubmit={handleAddBike} className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 md:p-10 space-y-6 animate-in slide-in-from-bottom-8">
            <div className="flex justify-between items-center border-b border-gray-50 pb-4">
              <h3 className="text-xl font-black uppercase tracking-tight">New Asset</h3>
              <button type="button" onClick={() => setShowAddForm(false)} className="text-3xl">&times;</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <input required className="w-full border-gray-100 rounded-xl p-4 bg-gray-50 text-sm font-bold" placeholder="Make/Model" value={newBike.makeModel} onChange={e => setNewBike({...newBike, makeModel: e.target.value})} />
              <input required className="w-full border-gray-100 rounded-xl p-4 bg-gray-50 text-sm font-bold uppercase" placeholder="License Plate" value={newBike.licenseNumber} onChange={e => setNewBike({...newBike, licenseNumber: e.target.value})} />
              <input type="date" required className="w-full border-gray-100 rounded-xl p-4 bg-gray-50 text-sm font-bold" value={newBike.licenseDiskExpiry} onChange={e => setNewBike({...newBike, licenseDiskExpiry: e.target.value})} />
              <select className="w-full border-gray-100 rounded-xl p-4 bg-gray-50 text-sm font-bold" value={newBike.city} onChange={e => setNewBike({...newBike, city: e.target.value})}>
                <option value="JHB">Johannesburg</option>
                <option value="CTN">Cape Town</option>
                <option value="EL">East London</option>
              </select>
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl">Confirm Enrollment</button>
          </form>
        </div>
      )}

      {/* Driver Assignment Modal */}
      {assigningBikeId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
           <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full p-8 md:p-10 animate-in zoom-in duration-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Assign Asset Operator</h3>
                <button onClick={() => setAssigningBikeId(null)} className="text-3xl text-gray-300 hover:text-gray-600">&times;</button>
              </div>
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 no-scrollbar">
                 {drivers.map(d => (
                   <button 
                    key={d.id} 
                    onClick={() => handleAssignDriver(assigningBikeId, d.id)}
                    className="w-full flex items-center space-x-4 p-4 rounded-2xl border border-gray-100 hover:bg-blue-50 hover:border-blue-200 transition-all text-left group"
                   >
                     <div className="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden flex items-center justify-center font-black text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                       {d.profilePictureUrl ? (
                         <img src={d.profilePictureUrl} className="w-full h-full object-cover" />
                       ) : (
                         d.name.substring(0,2).toUpperCase()
                       )}
                     </div>
                     <div>
                       <span className="font-bold text-gray-800 block">{d.name}</span>
                       <span className="text-[10px] text-gray-400 uppercase font-bold">{d.city}</span>
                     </div>
                   </button>
                 ))}
                 <button onClick={() => handleAssignDriver(assigningBikeId, 'none')} className="w-full p-4 rounded-2xl border border-dashed border-gray-200 text-gray-400 font-bold hover:bg-gray-50 uppercase text-[10px] tracking-widest mt-4">Unassign Current Driver</button>
              </div>
           </div>
        </div>
      )}

      {/* History Modal & Analysis (Kept for detailed view) */}
      {historyBikeId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom-8">
            <div className="p-10 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Lifecycle Analysis</h3>
                <p className="text-xs text-blue-500 font-black uppercase tracking-widest mt-1">Maintenance & Expense Telemetry</p>
              </div>
              <button onClick={() => setHistoryBikeId(null)} className="text-gray-300 hover:text-gray-600 text-5xl leading-none">&times;</button>
            </div>
            
            <div className="p-10 overflow-y-auto flex-1 space-y-12">
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
                      <p className="col-span-full text-center py-20 text-gray-300 text-xs italic font-bold uppercase tracking-widest">No Logged Expenses</p>
                    )}
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
    </div>
  );
};

export default FleetManagement;