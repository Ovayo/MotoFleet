
import React, { useState, useEffect, useMemo } from 'react';

interface RegisteredFleet {
  id: string;
  name: string;
}

interface FleetStats {
  bikes: number;
  drivers: number;
  payments: number;
}

interface SuperAdminDashboardProps {
  onImpersonate: (fleetId: string, fleetName: string) => void;
  onLogout: () => void;
}

const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ onImpersonate, onLogout }) => {
  const [registry, setRegistry] = useState<RegisteredFleet[]>([]);
  const [fleetStats, setFleetStats] = useState<Record<string, FleetStats>>({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const savedRegistry = localStorage.getItem('motofleet_master_registry');
    if (savedRegistry) {
      const parsedRegistry: RegisteredFleet[] = JSON.parse(savedRegistry);
      setRegistry(parsedRegistry);

      // Auditing Stats from LocalStorage Silos
      const stats: Record<string, FleetStats> = {};
      parsedRegistry.forEach(fleet => {
        const bikes = JSON.parse(localStorage.getItem(`mf_v2_${fleet.id}_bikes`) || '[]');
        const drivers = JSON.parse(localStorage.getItem(`mf_v2_${fleet.id}_drivers`) || '[]');
        const payments = JSON.parse(localStorage.getItem(`mf_v2_${fleet.id}_payments`) || '[]');
        stats[fleet.id] = {
          bikes: bikes.length,
          drivers: drivers.length,
          payments: payments.length
        };
      });
      setFleetStats(stats);
    }
  }, []);

  const filteredRegistry = useMemo(() => {
    return registry.filter(f => 
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      f.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [registry, searchTerm]);

  const handleDeleteFleet = (id: string) => {
    if (window.confirm(`DANGER: This will permanently remove ${id} from the registry. Silo data will remain in storage but the fleet will lose dashboard access. Proceed?`)) {
      const newRegistry = registry.filter(f => f.id !== id);
      setRegistry(newRegistry);
      localStorage.setItem('motofleet_master_registry', JSON.stringify(newRegistry));
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="bg-gray-950 rounded-[3rem] p-10 md:p-16 text-white relative overflow-hidden shadow-2xl border border-indigo-500/20">
        <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
          <span className="text-9xl">👑</span>
        </div>

        <div className="relative z-10 space-y-6">
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tight mb-2">Master Control Center</h2>
            <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.4em]">Multi-Tenant Provider Management Terminal</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10">
              <p className="text-indigo-300 text-[10px] font-black uppercase tracking-widest mb-1">Total Providers</p>
              <h4 className="text-3xl font-black">{registry.length}</h4>
            </div>
            <div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10">
              <p className="text-indigo-300 text-[10px] font-black uppercase tracking-widest mb-1">Total Managed Assets</p>
              <h4 className="text-3xl font-black">
                {Object.values(fleetStats).reduce((acc, s) => acc + s.bikes, 0)}
              </h4>
            </div>
            <div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10">
              <p className="text-indigo-300 text-[10px] font-black uppercase tracking-widest mb-1">Active Ledger Items</p>
              <h4 className="text-3xl font-black">
                {Object.values(fleetStats).reduce((acc, s) => acc + s.payments, 0)}
              </h4>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative flex-1 w-full">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input 
            type="text" 
            placeholder="Search provider registry..." 
            className="w-full pl-11 pr-4 py-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={onLogout}
          className="px-8 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-200 transition-all"
        >
          Exit Master Mode
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRegistry.map(fleet => (
          <div key={fleet.id} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8 hover:shadow-xl hover:border-indigo-100 transition-all group">
            <div className="flex justify-between items-start mb-6">
              <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-2xl shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-500">
                🏢
              </div>
              <button 
                onClick={() => handleDeleteFleet(fleet.id)}
                className="text-gray-200 hover:text-red-500 transition-colors p-2"
                title="De-register Business"
              >
                🗑️
              </button>
            </div>

            <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight mb-1">{fleet.name}</h3>
            <p className="text-[10px] text-indigo-500 font-black uppercase tracking-widest mb-6">ID: {fleet.id}</p>

            <div className="grid grid-cols-3 gap-2 mb-8">
              <div className="text-center p-3 bg-gray-50 rounded-2xl">
                <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Bikes</p>
                <p className="text-sm font-black text-gray-800">{fleetStats[fleet.id]?.bikes || 0}</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-2xl">
                <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Drivers</p>
                <p className="text-sm font-black text-gray-800">{fleetStats[fleet.id]?.drivers || 0}</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-2xl">
                <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Ledger</p>
                <p className="text-sm font-black text-gray-800">{fleetStats[fleet.id]?.payments || 0}</p>
              </div>
            </div>

            <button 
              onClick={() => onImpersonate(fleet.id, fleet.name)}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center space-x-2"
            >
              <span>⚡</span>
              <span>Impersonate Dashboard</span>
            </button>
          </div>
        ))}
      </div>

      {filteredRegistry.length === 0 && (
        <div className="py-20 text-center">
          <div className="text-6xl mb-6 opacity-10">🏜️</div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">No matching providers found in registry</p>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;
