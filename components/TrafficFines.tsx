
import React, { useState, useRef, useMemo } from 'react';
import { Bike, Driver, TrafficFine } from '../types';

interface TrafficFinesProps {
  bikes: Bike[];
  drivers: Driver[];
  fines: TrafficFine[];
  onAddFine: (fine: Omit<TrafficFine, 'id'>) => void;
  onUpdateStatus: (id: string, status: TrafficFine['status']) => void;
}

type GroupingMode = 'status' | 'driver' | 'bike';

const TrafficFines: React.FC<TrafficFinesProps> = ({ bikes, drivers, fines, onAddFine, onUpdateStatus }) => {
  const [showForm, setShowForm] = useState(false);
  const [groupingMode, setGroupingMode] = useState<GroupingMode>('status');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'unpaid': true,
    'paid': false,
    'contested': false
  });
  const formRef = useRef<HTMLFormElement>(null);

  const [newFine, setNewFine] = useState<Omit<TrafficFine, 'id'>>({
    bikeId: '',
    driverId: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    noticeNumber: '',
    description: '',
    status: 'unpaid',
    attachmentUrl: ''
  });

  // Intelligent Association: Driver -> Bike
  const handleDriverChange = (driverId: string) => {
    const assignedBike = bikes.find(b => b.assignedDriverId === driverId);
    setNewFine(prev => ({
      ...prev,
      driverId: driverId,
      bikeId: assignedBike ? assignedBike.id : prev.bikeId
    }));
  };

  // Intelligent Association: Bike -> Driver
  const handleBikeChange = (bikeId: string) => {
    const bike = bikes.find(b => b.id === bikeId);
    setNewFine(prev => ({
      ...prev,
      bikeId: bikeId,
      driverId: bike?.assignedDriverId || prev.driverId
    }));
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFine.bikeId || !newFine.driverId) {
      alert("Error: Every fine must be linked to both a vehicle and a driver.");
      return;
    }
    onAddFine(newFine);
    setShowForm(false);
    setNewFine({
      bikeId: '',
      driverId: '',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      noticeNumber: '',
      description: '',
      status: 'unpaid',
      attachmentUrl: ''
    });
  };

  const groupedFines = useMemo(() => {
    const groups: Record<string, TrafficFine[]> = {};

    if (groupingMode === 'status') {
      ['unpaid', 'paid', 'contested'].forEach(s => groups[s] = []);
      fines.forEach(f => groups[f.status].push(f));
      return Object.entries(groups);
    }

    if (groupingMode === 'driver') {
      fines.forEach(f => {
        if (!groups[f.driverId]) groups[f.driverId] = [];
        groups[f.driverId].push(f);
      });
      return Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
    }

    if (groupingMode === 'bike') {
      fines.forEach(f => {
        if (!groups[f.bikeId]) groups[f.bikeId] = [];
        groups[f.bikeId].push(f);
      });
      return Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
    }

    return [];
  }, [fines, groupingMode]);

  const FineRow: React.FC<{ fine: TrafficFine }> = ({ fine }) => {
    const bike = bikes.find(b => b.id === fine.bikeId);
    const driver = drivers.find(d => d.id === fine.driverId);
    return (
      <div className="flex flex-col md:flex-row items-center justify-between p-5 bg-white rounded-2xl border border-gray-50 hover:border-gray-200 transition-all gap-4 group/row">
        <div className="flex items-center space-x-4 flex-1 min-w-0">
          <div className="w-10 h-10 bg-gray-50 text-gray-400 rounded-xl flex items-center justify-center text-lg shrink-0 group-hover/row:bg-red-50 group-hover/row:text-red-500 transition-colors">
            🚔
          </div>
          <div className="min-w-0">
            <h5 className="text-sm font-black text-gray-800 uppercase tracking-tight truncate">
              {fine.noticeNumber} <span className="text-gray-300 mx-2">|</span> R{fine.amount}
            </h5>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5 truncate">
              {driver?.name || 'Unknown'} • {bike?.licenseNumber || 'N/A'} • {new Date(fine.date).toLocaleDateString()}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4 w-full md:w-auto shrink-0">
          <p className="hidden lg:block text-[10px] text-gray-400 font-medium max-w-[200px] truncate italic">"{fine.description}"</p>
          <div className="flex items-center space-x-2">
            <select 
              value={fine.status} 
              onChange={(e) => onUpdateStatus(fine.id, e.target.value as any)}
              className="bg-gray-100 border-none rounded-lg px-3 py-1.5 text-[9px] font-black uppercase tracking-widest outline-none cursor-pointer hover:bg-gray-200 transition-colors"
            >
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
              <option value="contested">Contested</option>
            </select>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-10 max-w-6xl mx-auto">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Fines Repository</h2>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-1">
            Official Traffic Infringement & Compliance Terminal
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="bg-gray-100 p-1 rounded-2xl flex shadow-inner">
            {(['status', 'driver', 'bike'] as GroupingMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setGroupingMode(mode)}
                className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${groupingMode === mode ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {mode}
              </button>
            ))}
          </div>
          <button 
            onClick={() => setShowForm(!showForm)}
            className={`px-8 py-3 rounded-2xl transition-all font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center space-x-2 ${
              showForm ? 'bg-gray-800 text-white shadow-gray-200' : 'bg-red-600 text-white shadow-red-100 hover:bg-red-700'
            }`}
          >
            <span>{showForm ? '✕' : '+'}</span>
            <span>{showForm ? 'Close Terminal' : 'Log Notice'}</span>
          </button>
        </div>
      </div>

      {/* Entry Form */}
      {showForm && (
        <form ref={formRef} onSubmit={handleSubmit} className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl border border-red-50 animate-in fade-in slide-in-from-top-4 duration-300">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Operator Identity</label>
                <select 
                  required
                  className="w-full border-gray-100 rounded-xl p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all font-bold text-sm"
                  value={newFine.driverId}
                  onChange={e => handleDriverChange(e.target.value)}
                >
                  <option value="">Choose Driver...</option>
                  {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Linked Vehicle</label>
                <select 
                  required
                  className="w-full border-gray-100 rounded-xl p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all font-bold text-sm"
                  value={newFine.bikeId}
                  onChange={e => handleBikeChange(e.target.value)}
                >
                  <option value="">Choose Asset...</option>
                  {bikes.map(b => <option key={b.id} value={b.id}>{b.licenseNumber} - {b.makeModel}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Monetary Amount (R)</label>
                <input 
                  type="number"
                  required
                  className="w-full border-gray-100 rounded-xl p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all font-bold text-sm"
                  value={newFine.amount || ''}
                  onChange={e => setNewFine({...newFine, amount: Number(e.target.value)})}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Notice Serial Number</label>
                <input 
                  type="text"
                  required
                  className="w-full border-gray-100 rounded-xl p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all font-bold text-sm"
                  value={newFine.noticeNumber}
                  onChange={e => setNewFine({...newFine, noticeNumber: e.target.value})}
                  placeholder="Notice Number"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Violation Date</label>
                <input 
                  type="date"
                  required
                  className="w-full border-gray-100 rounded-xl p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all font-bold text-sm"
                  value={newFine.date}
                  onChange={e => setNewFine({...newFine, date: e.target.value})}
                />
              </div>
              <div className="lg:col-span-2 space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Infringement Details</label>
                <input 
                  type="text"
                  required
                  className="w-full border-gray-100 rounded-xl p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all font-bold text-sm"
                  value={newFine.description}
                  onChange={e => setNewFine({...newFine, description: e.target.value})}
                  placeholder="e.g. Failure to stop at signal"
                />
              </div>
              <div className="flex items-end">
                <button type="submit" className="w-full bg-red-600 text-white py-3.5 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-red-100 hover:bg-red-700 transition-all active:scale-95">Commit Log Entry</button>
              </div>
           </div>
        </form>
      )}

      {/* Accordion Grouping List */}
      <div className="space-y-4">
        {groupedFines.map(([id, groupFines]) => {
          const isExpanded = expandedGroups[id];
          
          let title = id;
          let subtitle = `${groupFines.length} Notices`;
          let icon = '🚔';
          let statusColor = 'text-gray-400';

          if (groupingMode === 'status') {
            title = id.charAt(0).toUpperCase() + id.slice(1);
            statusColor = id === 'unpaid' ? 'text-red-500' : id === 'paid' ? 'text-green-500' : 'text-blue-500';
            icon = id === 'unpaid' ? '🚨' : id === 'paid' ? '✅' : '⚖️';
          } else if (groupingMode === 'driver') {
            title = drivers.find(d => d.id === id)?.name || 'Unknown Operator';
            icon = '👤';
          } else if (groupingMode === 'bike') {
            title = bikes.find(b => b.id === id)?.licenseNumber || 'Unknown Asset';
            icon = '🏍️';
          }

          const totalValue = groupFines.reduce((acc, f) => acc + f.amount, 0);

          return (
            <div key={id} className={`bg-white rounded-[2.5rem] border transition-all duration-300 overflow-hidden ${isExpanded ? 'shadow-xl shadow-gray-100 border-gray-200' : 'shadow-sm border-gray-100'}`}>
              <button 
                onClick={() => toggleGroup(id)}
                className="w-full p-6 md:p-8 flex items-center justify-between hover:bg-gray-50/50 transition-colors text-left"
              >
                <div className="flex items-center space-x-5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all shadow-inner ${isExpanded ? 'bg-white' : 'bg-gray-50'}`}>
                    {icon}
                  </div>
                  <div>
                    <h4 className={`text-lg font-black uppercase tracking-tight ${statusColor}`}>{title}</h4>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{subtitle}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-10">
                  <div className="hidden md:block text-right">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Category Exposure</p>
                    <p className="text-xl font-black text-gray-800">R{totalValue.toLocaleString()}</p>
                  </div>
                  <div className={`w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-gray-50' : ''}`}>
                    <span className="text-[10px]">▼</span>
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="px-6 pb-6 md:px-8 md:pb-8 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  {groupFines.length === 0 ? (
                    <div className="py-12 text-center bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
                      <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">No entries found for this category</p>
                    </div>
                  ) : (
                    groupFines
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map(fine => <FineRow key={fine.id} fine={fine} />)
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {fines.length === 0 && !showForm && (
        <div className="bg-white p-24 text-center rounded-[3rem] border border-dashed border-gray-200 shadow-inner">
           <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 opacity-40">🏁</div>
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">The registry is currently clean</p>
           <p className="text-xs text-gray-300 mt-2 font-medium">Click "Log Notice" to record the first infringement.</p>
        </div>
      )}
    </div>
  );
};

export default TrafficFines;
