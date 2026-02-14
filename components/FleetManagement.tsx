
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
      .slice(-7);

    if (records.length === 0) return [{ cost: 0 }];
    return records.map((r, i) => ({ id: i, cost: r.cost }));
  }, [bikeId, maintenance]);

  if (data.length === 1 && data[0].cost === 0) {
    return <div className="text-[8px] text-gray-300 font-black uppercase tracking-[0.2em] bg-white/50 px-3 py-1 rounded-full border border-gray-100">Zero Data</div>;
  }

  return (
    <div className="h-10 w-24 bg-white/50 backdrop-blur-md rounded-xl p-1.5 border border-white/60">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <Bar dataKey="cost" radius={[2, 2, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={index === data.length - 1 ? '#EF4444' : '#3B82F6'} fillOpacity={0.6} />
            ))}
          </Bar>
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
      if (bike) setEditBikeData({ ...bike });
    } else {
      setEditBikeData(null);
    }
  }, [editingBikeId, bikes]);

  const fleetStats = useMemo(() => {
    const total = bikes.length;
    const active = bikes.filter(b => b.status === 'active').length;
    const workshop = bikes.filter(b => b.status === 'maintenance').length;
    const utilization = total > 0 ? Math.round((active / total) * 100) : 0;
    return { total, active, workshop, utilization };
  }, [bikes]);

  const filteredBikes = useMemo(() => {
    return bikes.filter(bike => {
      const matchesSearch = 
        bike.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bike.makeModel.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesTab = true;
      if (activeTab === 'active') matchesTab = bike.status === 'active';
      if (activeTab === 'maintenance') matchesTab = bike.status === 'maintenance';
      if (activeTab === 'compliance') {
        const exp = bike.licenseDiskExpiry ? new Date(bike.licenseDiskExpiry) : null;
        const diff = exp ? (exp.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24) : -1;
        matchesTab = diff < 30;
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
      const key = date.toLocaleString('default', { month: 'short', year: '2-digit' });
      groups[key] = (groups[key] || 0) + record.cost;
    });
    return Object.entries(groups).map(([name, cost]) => ({ name, cost }));
  }, [historyBikeId, maintenance]);

  return (
    <div className="space-y-10">
      {/* High-Performance Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Grid Strength', val: fleetStats.total, sub: 'Fleet Units', color: 'blue' },
          { label: 'Deployment', val: `${fleetStats.utilization}%`, sub: 'Active Ops', color: 'green' },
          { label: 'Technical Load', val: fleetStats.workshop, sub: 'In Repair', color: 'amber' },
          { label: 'Compliance', val: 'Verified', sub: 'eNaTIS Valid', color: 'blue' }
        ].map((stat, i) => (
          <div key={i} className="bg-white/70 backdrop-blur-xl p-8 rounded-[3rem] shadow-sm border border-white/60">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2">{stat.label}</p>
            <h3 className="text-4xl font-black text-gray-900 tracking-tighter">{stat.val}</h3>
            <p className="text-[10px] font-black mt-2 text-blue-500 uppercase tracking-widest">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Control Blade */}
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3 bg-gray-200/50 backdrop-blur-md p-1.5 rounded-2xl w-fit border border-white/40 shadow-inner">
          {(['all', 'active', 'maintenance', 'compliance'] as const).map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                activeTab === tab ? 'bg-white text-gray-900 shadow-xl scale-105' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 group">
            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 text-xl group-focus-within:text-blue-500 transition-colors">🔍</span>
            <input 
              type="text" 
              placeholder="Query asset registry..." 
              className="w-full pl-16 pr-6 py-5 bg-white/80 backdrop-blur-xl border-2 border-transparent rounded-[2rem] text-sm font-bold outline-none focus:bg-white focus:border-blue-400/30 transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowAddForm(true)}
            className="w-full md:w-auto bg-gray-900 text-white px-12 py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.3em] shadow-2xl shadow-gray-200 hover:scale-105 active:scale-95 transition-all"
          >
            + Enroll Asset
          </button>
        </div>
      </div>

      {/* Asset Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10 pb-10">
        {filteredBikes.map(bike => {
          const driver = drivers.find(d => d.id === bike.assignedDriverId);
          const workshop = workshops.find(w => w.id === bike.assignedWorkshopId);
          const now = new Date();
          const exp = bike.licenseDiskExpiry ? new Date(bike.licenseDiskExpiry) : null;
          const diskDays = exp ? Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;

          return (
            <div key={bike.id} className="bg-white/80 backdrop-blur-3xl border border-white/60 rounded-[4rem] p-10 shadow-sm hover:shadow-2xl hover:shadow-blue-50/50 transition-all duration-700 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50/50 rounded-bl-[4rem] -z-10 group-hover:bg-blue-50 transition-colors duration-700"></div>
              
              <div className="flex justify-between items-start mb-10">
                <div className="flex items-center space-x-6">
                  <div className="w-20 h-20 rounded-[2.5rem] bg-gray-900 flex items-center justify-center text-3xl shadow-2xl shadow-gray-200 group-hover:rotate-12 transition-transform duration-700">🏍️</div>
                  <div className="min-w-0">
                    <h4 className="font-black text-gray-900 text-2xl uppercase leading-none tracking-tighter mb-2 truncate">{bike.licenseNumber}</h4>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">{bike.makeModel}</p>
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center space-x-2 ${
                  bike.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${bike.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span>{bike.status}</span>
                </div>
              </div>

              <div className="space-y-6 mb-10">
                <div className="flex items-center justify-between p-6 bg-gray-50/50 rounded-[2.5rem] border border-gray-100/50 group/op cursor-pointer hover:bg-white transition-all">
                  <div className="flex items-center space-x-5">
                    <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-xl group-hover/op:scale-110 transition-transform">👤</div>
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Operator</p>
                      <p className="text-xs font-black text-gray-900 uppercase">{driver?.name || 'Unassigned'}</p>
                    </div>
                  </div>
                  <button onClick={() => setAssigningBikeId(bike.id)} className="text-blue-500 text-[10px] font-black uppercase hover:underline">Link</button>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="p-6 bg-gray-50/30 rounded-[2rem] border border-gray-100/50">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2">Technical Health</p>
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-gray-800 uppercase tracking-tighter">{diskDays} Days</span>
                      <span className="text-[8px] font-bold text-gray-300 uppercase mt-0.5">Disk Validity</span>
                    </div>
                  </div>
                  <div className="p-6 bg-gray-50/30 rounded-[2rem] border border-gray-100/50 flex flex-col justify-center">
                    <MiniCostChart bikeId={bike.id} maintenance={maintenance} />
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setHistoryBikeId(bike.id)}
                  className="flex-1 bg-gray-900 text-white py-5 rounded-[1.8rem] font-black uppercase text-[10px] tracking-[0.3em] hover:bg-black transition-all shadow-xl shadow-gray-100"
                >
                  Analyze Logs
                </button>
                <button 
                  onClick={() => setEditingBikeId(bike.id)}
                  className="w-16 h-16 bg-white border border-gray-100 rounded-[1.8rem] flex items-center justify-center text-2xl hover:bg-gray-50 transition-all shadow-sm"
                >
                  ✏️
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Asset Modal - Premium Styling */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-2xl z-[150] flex items-center justify-center p-4">
          <form onSubmit={() => {}} className="bg-white/95 backdrop-blur-3xl rounded-[4rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto p-12 space-y-10 animate-in zoom-in duration-300 no-scrollbar">
            <div className="flex justify-between items-center border-b border-gray-100 pb-8">
              <div>
                <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Enroll New Asset</h3>
                <p className="text-[10px] text-blue-500 font-black uppercase tracking-[0.4em] mt-3">Logistics Grid Expansion</p>
              </div>
              <button type="button" onClick={() => setShowAddForm(false)} className="text-gray-300 hover:text-gray-900 text-6xl leading-none transition-colors">&times;</button>
            </div>
            {/* Grid form fields with shadow-inner styling */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Identifier (License Plate)</label>
                <input required className="w-full bg-gray-50 border-none rounded-[1.5rem] p-6 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 shadow-inner uppercase" />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Hardware Spec (Make/Model)</label>
                <input required className="w-full bg-gray-50 border-none rounded-[1.5rem] p-6 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 shadow-inner" />
              </div>
            </div>
            <button className="w-full bg-gray-900 text-white py-6 rounded-[2.5rem] font-black uppercase text-[11px] tracking-[0.4em] shadow-2xl hover:bg-black transition-all">Commit Asset to Registry</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default FleetManagement;
