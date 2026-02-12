
import React, { useState, useRef, useMemo } from 'react';
import { Bike, Driver, TrafficFine } from '../types';

interface TrafficFinesProps {
  bikes: Bike[];
  drivers: Driver[];
  fines: TrafficFine[];
  onAddFine: (fine: Omit<TrafficFine, 'id'>) => void;
  onUpdateStatus: (id: string, status: TrafficFine['status']) => void;
}

type GroupingMode = 'all' | 'driver' | 'bike';

const TrafficFines: React.FC<TrafficFinesProps> = ({ bikes, drivers, fines, onAddFine, onUpdateStatus }) => {
  const [showForm, setShowForm] = useState(false);
  const [viewingAttachment, setViewingAttachment] = useState<string | null>(null);
  const [groupingMode, setGroupingMode] = useState<GroupingMode>('all');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewFine(prev => ({ ...prev, attachmentUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDuplicate = (fine: TrafficFine) => {
    setNewFine({
      bikeId: fine.bikeId,
      driverId: fine.driverId,
      amount: fine.amount,
      date: fine.date,
      noticeNumber: '', 
      description: fine.description,
      status: 'unpaid', 
      attachmentUrl: '' 
    });
    setShowForm(true);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
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
      alert("Please select both a vehicle and a driver.");
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
    if (groupingMode === 'all') return null;

    if (groupingMode === 'driver') {
      const groups: Record<string, TrafficFine[]> = {};
      fines.forEach(f => {
        if (!groups[f.driverId]) groups[f.driverId] = [];
        groups[f.driverId].push(f);
      });
      return Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
    }

    if (groupingMode === 'bike') {
      const groups: Record<string, TrafficFine[]> = {};
      fines.forEach(f => {
        if (!groups[f.bikeId]) groups[f.bikeId] = [];
        groups[f.bikeId].push(f);
      });
      return Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
    }

    return null;
  }, [fines, groupingMode]);

  const FineCard: React.FC<{ fine: TrafficFine; compact?: boolean }> = ({ fine, compact = false }) => {
    const bike = bikes.find(b => b.id === fine.bikeId);
    const driver = drivers.find(d => d.id === fine.driverId);
    return (
      <div className={`bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-md transition-all ${compact ? 'border-l-4 border-l-red-500' : ''}`}>
        <div className="flex items-center space-x-5 w-full md:w-auto">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-sm">👮</div>
          <div>
            <h4 className="font-black text-gray-800 uppercase tracking-tight leading-tight">{fine.noticeNumber || 'Pending No.'} — R{fine.amount}</h4>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
              {driver?.name || 'Unknown Operator'} • {bike?.licenseNumber || 'Unknown Bike'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-6 w-full md:w-auto justify-between md:justify-end">
          <div className="text-right">
            <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${
              fine.status === 'paid' ? 'bg-green-100 text-green-700' : 
              fine.status === 'contested' ? 'bg-blue-100 text-blue-700' : 
              'bg-red-100 text-red-700'
            }`}>
              {fine.status}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <select 
              value={fine.status} 
              onChange={(e) => onUpdateStatus(fine.id, e.target.value as any)}
              className="bg-gray-50 border border-gray-100 rounded-xl px-2 py-1.5 text-[10px] font-black uppercase tracking-widest outline-none"
            >
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
              <option value="contested">Contested</option>
            </select>
            <button 
              onClick={() => handleDuplicate(fine)}
              className="p-2 hover:bg-gray-100 rounded-xl"
              title="Duplicate/Re-issue"
            >
              📋
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">Traffic Fines Terminal</h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            Tracking infringements and payment compliance across the fleet
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="bg-gray-100 p-1 rounded-xl flex">
            {(['all', 'driver', 'bike'] as GroupingMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setGroupingMode(mode)}
                className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${groupingMode === mode ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400'}`}
              >
                {mode}
              </button>
            ))}
          </div>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="bg-red-600 text-white px-6 py-2.5 rounded-xl hover:bg-red-700 transition-all shadow-xl shadow-red-100 font-black uppercase text-[10px] tracking-widest"
          >
            {showForm ? 'Discard' : '+ Log Fine'}
          </button>
        </div>
      </div>

      {showForm && (
        <form ref={formRef} onSubmit={handleSubmit} className="bg-white p-8 rounded-[2rem] shadow-xl border border-red-50 animate-in fade-in slide-in-from-top-4 duration-300">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Vehicle</label>
                <select 
                  className="w-full border-gray-100 rounded-xl p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all font-bold text-sm"
                  value={newFine.bikeId}
                  onChange={e => setNewFine({...newFine, bikeId: e.target.value})}
                >
                  <option value="">Select Asset...</option>
                  {bikes.map(b => <option key={b.id} value={b.id}>{b.licenseNumber} - {b.makeModel}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Operator</label>
                <select 
                  className="w-full border-gray-100 rounded-xl p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all font-bold text-sm"
                  value={newFine.driverId}
                  onChange={e => setNewFine({...newFine, driverId: e.target.value})}
                >
                  <option value="">Select Driver...</option>
                  {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Amount (R)</label>
                <input 
                  type="number"
                  className="w-full border-gray-100 rounded-xl p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all font-bold text-sm"
                  value={newFine.amount || ''}
                  onChange={e => setNewFine({...newFine, amount: Number(e.target.value)})}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Notice Number</label>
                <input 
                  type="text"
                  className="w-full border-gray-100 rounded-xl p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all font-bold text-sm"
                  value={newFine.noticeNumber}
                  onChange={e => setNewFine({...newFine, noticeNumber: e.target.value})}
                  placeholder="e.g. 8021..."
                />
              </div>
              <div className="lg:col-span-3 space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Infringement Description</label>
                <input 
                  type="text"
                  className="w-full border-gray-100 rounded-xl p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all font-bold text-sm"
                  value={newFine.description}
                  onChange={e => setNewFine({...newFine, description: e.target.value})}
                  placeholder="e.g. Speeding 80 in 60 zone"
                />
              </div>
              <div className="flex items-end">
                <button type="submit" className="w-full bg-red-600 text-white py-3.5 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-red-100 hover:bg-red-700 transition-all">Record Fine</button>
              </div>
           </div>
        </form>
      )}

      <div className="space-y-4">
        {groupingMode === 'all' ? (
          fines.length === 0 ? (
            <div className="bg-white p-20 text-center rounded-[2.5rem] border border-dashed border-gray-200">
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No infringements recorded</p>
            </div>
          ) : (
            fines.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(fine => (
              <FineCard key={fine.id} fine={fine} />
            ))
          )
        ) : (
          groupedFines?.map(([id, groupFines]) => {
            const label = groupingMode === 'driver' 
              ? drivers.find(d => d.id === id)?.name || 'Unknown' 
              : bikes.find(b => b.id === id)?.licenseNumber || 'Unknown';
            const total = groupFines.reduce((acc, f) => acc + f.amount, 0);
            const isExpanded = expandedGroups[id];

            return (
              <div key={id} className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">
                <button 
                  onClick={() => toggleGroup(id)}
                  className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-lg">
                      {groupingMode === 'driver' ? '👤' : '🏍️'}
                    </div>
                    <div>
                      <h4 className="font-black text-gray-800 uppercase tracking-tight">{label}</h4>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{groupFines.length} Infringements</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-8">
                    <div className="text-right">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Accumulated Value</p>
                      <p className="text-lg font-black text-red-600">R{total}</p>
                    </div>
                    <span className={`text-xl transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                  </div>
                </button>
                {isExpanded && (
                  <div className="p-6 bg-gray-50/50 border-t border-gray-50 space-y-3">
                    {groupFines.map(fine => (
                      <FineCard key={fine.id} fine={fine} compact />
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TrafficFines;
