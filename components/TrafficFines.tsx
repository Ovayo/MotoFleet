
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
  const [viewingAttachment, setViewingAttachment] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'unpaid': true,
    'paid': false,
    'contested': false
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFine.bikeId || !newFine.driverId) {
      alert("Validation Error: Every fine must be linked to both a vehicle and a driver.");
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
          <div className="flex items-center space-x-3">
            {fine.attachmentUrl && (
              <button 
                onClick={() => setViewingAttachment(fine.attachmentUrl!)}
                className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all"
                title="View Notice Copy"
              >
                📄
              </button>
            )}
            <select 
              value={fine.status} 
              onChange={(e) => onUpdateStatus(fine.id, e.target.value as any)}
              className={`border-none rounded-xl px-4 py-2 text-[9px] font-black uppercase tracking-widest outline-none cursor-pointer transition-colors ${
                fine.status === 'unpaid' ? 'bg-red-50 text-red-600' : 
                fine.status === 'paid' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
              }`}
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

  const fineStats = useMemo(() => {
    const total = fines.reduce((acc, f) => acc + f.amount, 0);
    const unpaid = fines.filter(f => f.status === 'unpaid').reduce((acc, f) => acc + f.amount, 0);
    const count = fines.filter(f => f.status === 'unpaid').length;
    return { total, unpaid, count };
  }, [fines]);

  return (
    <div className="space-y-8 pb-10 max-w-6xl mx-auto">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between">
           <div>
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Fine Exposure</p>
             <h3 className="text-2xl font-black text-gray-900">R{fineStats.total.toLocaleString()}</h3>
           </div>
           <div className="text-3xl">🚔</div>
        </div>
        <div className="bg-red-600 p-6 rounded-[2rem] shadow-xl shadow-red-100 flex items-center justify-between text-white">
           <div>
             <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">Outstanding Liability</p>
             <h3 className="text-2xl font-black">R{fineStats.unpaid.toLocaleString()}</h3>
           </div>
           <div className="bg-white/20 p-3 rounded-2xl font-black text-xs">{fineStats.count}</div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between">
           <div>
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Notice Health</p>
             <h3 className="text-2xl font-black text-gray-900">92% Compliance</h3>
           </div>
           <div className="text-3xl">⚖️</div>
        </div>
      </div>

      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">Active Infringements</h2>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-1">
            Tracking infringements for {drivers.length} registered operators
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
            onClick={() => setShowForm(true)}
            className="bg-red-600 text-white px-8 py-3.5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-red-100 hover:bg-red-700 transition-all active:scale-95 flex items-center space-x-2"
          >
            <span>+</span>
            <span>Log Traffic Notice</span>
          </button>
        </div>
      </div>

      {/* Entry Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-white p-8 md:p-10 rounded-[3rem] shadow-2xl max-w-2xl w-full space-y-8 animate-in zoom-in duration-200">
             <div className="flex justify-between items-center border-b border-gray-50 pb-6">
                <div>
                   <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Notice Submission</h3>
                   <p className="text-[10px] text-red-600 font-black uppercase tracking-widest mt-1">Official Traffic Infringement Record</p>
                </div>
                <button type="button" onClick={() => setShowForm(false)} className="text-gray-300 hover:text-gray-600 text-5xl leading-none">&times;</button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Responsible Operator</label>
                  <select 
                    required
                    className="w-full border-gray-100 rounded-xl p-4 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all font-bold text-sm appearance-none"
                    value={newFine.driverId}
                    onChange={e => handleDriverChange(e.target.value)}
                  >
                    <option value="">Choose Driver...</option>
                    {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Offending Asset</label>
                  <select 
                    required
                    className="w-full border-gray-100 rounded-xl p-4 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all font-bold text-sm appearance-none"
                    value={newFine.bikeId}
                    onChange={e => handleBikeChange(e.target.value)}
                  >
                    <option value="">Choose Asset...</option>
                    {bikes.map(b => <option key={b.id} value={b.id}>{b.licenseNumber} - {b.makeModel}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Notice Amount (R)</label>
                  <input 
                    type="number"
                    required
                    className="w-full border-gray-100 rounded-xl p-4 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all font-bold text-sm"
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
                    className="w-full border-gray-100 rounded-xl p-4 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all font-bold text-sm"
                    value={newFine.noticeNumber}
                    onChange={e => setNewFine({...newFine, noticeNumber: e.target.value})}
                    placeholder="e.g. INF-992-00"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Violation Timestamp</label>
                  <input 
                    type="date"
                    required
                    className="w-full border-gray-100 rounded-xl p-4 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all font-bold text-sm"
                    value={newFine.date}
                    onChange={e => setNewFine({...newFine, date: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Initial Status</label>
                  <select 
                    className="w-full border-gray-100 rounded-xl p-4 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all font-bold text-sm appearance-none"
                    value={newFine.status}
                    onChange={e => setNewFine({...newFine, status: e.target.value as any})}
                  >
                    <option value="unpaid">Unpaid Notice</option>
                    <option value="paid">Pre-paid / Settled</option>
                    <option value="contested">Being Contested</option>
                  </select>
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Violation Narrative</label>
                  <input 
                    type="text"
                    required
                    className="w-full border-gray-100 rounded-xl p-4 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all font-bold text-sm"
                    value={newFine.description}
                    onChange={e => setNewFine({...newFine, description: e.target.value})}
                    placeholder="e.g. Exceeded speed limit in residential zone"
                  />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Notice Evidence (Photo / Scan)</label>
                  <div className="relative">
                    <input 
                      type="file"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*,application/pdf"
                    />
                    {!newFine.attachmentUrl ? (
                      <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full border-2 border-dashed border-gray-100 hover:border-red-400 hover:bg-red-50/50 rounded-2xl p-4 text-gray-400 font-bold text-xs transition-all flex items-center justify-center space-x-2"
                      >
                        <span>📸</span>
                        <span className="uppercase tracking-widest text-[10px] font-black">Upload Digital Notice</span>
                      </button>
                    ) : (
                      <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center justify-between">
                         <span className="text-green-700 font-black uppercase text-[10px] tracking-widest flex items-center"><span className="mr-2">✅</span> Document Encoded</span>
                         <button type="button" onClick={() => setNewFine({...newFine, attachmentUrl: ''})} className="text-red-500 hover:text-red-700 font-black text-lg">&times;</button>
                      </div>
                    )}
                  </div>
                </div>
             </div>
             
             <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-5 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-200 transition-all">Cancel</button>
                <button type="submit" className="flex-[2] bg-red-600 text-white py-5 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-2xl shadow-red-200 hover:bg-red-700 transition-all active:scale-95">Commit Log Entry</button>
             </div>
          </form>
        </div>
      )}

      {/* Accordion Grouping List */}
      <div className="space-y-4">
        {groupedFines.map(([id, groupFines]) => {
          const isExpanded = expandedGroups[id];
          
          let title = id;
          let subtitle = `${groupFines.length} Registered Notices`;
          let icon = '🚔';
          let statusColor = 'text-gray-400';

          if (groupingMode === 'status') {
            title = id.charAt(0).toUpperCase() + id.slice(1);
            statusColor = id === 'unpaid' ? 'text-red-600' : id === 'paid' ? 'text-green-600' : 'text-blue-600';
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
                className="w-full p-6 md:p-10 flex items-center justify-between hover:bg-gray-50/50 transition-colors text-left"
              >
                <div className="flex items-center space-x-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl transition-all shadow-inner ${isExpanded ? 'bg-white' : 'bg-gray-50'}`}>
                    {icon}
                  </div>
                  <div>
                    <h4 className={`text-xl font-black uppercase tracking-tight ${statusColor}`}>{title}</h4>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{subtitle}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-12">
                  <div className="hidden md:block text-right">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Category exposure</p>
                    <p className="text-2xl font-black text-gray-800">R{totalValue.toLocaleString()}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-gray-50' : ''}`}>
                    <span className="text-[10px]">▼</span>
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="px-6 pb-6 md:px-10 md:pb-10 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  {groupFines.length === 0 ? (
                    <div className="py-16 text-center bg-gray-50/50 rounded-[2rem] border border-dashed border-gray-200">
                      <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">No infringements logged in this category</p>
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
        <div className="bg-white p-32 text-center rounded-[4rem] border border-dashed border-gray-200 shadow-inner">
           <div className="w-24 h-24 bg-gray-50 rounded-[2.5rem] flex items-center justify-center text-5xl mx-auto mb-8 opacity-30">🏁</div>
           <h3 className="text-gray-800 font-black uppercase tracking-tight text-xl">The Registry is Clean</h3>
           <p className="text-gray-400 font-bold uppercase text-[11px] tracking-widest mt-2">No infringements have been logged yet.</p>
           <button onClick={() => setShowForm(true)} className="mt-8 text-red-600 font-black text-xs uppercase tracking-widest hover:underline">Log your first notice</button>
        </div>
      )}

      {/* Attachment Viewer Modal */}
      {viewingAttachment && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[110] flex items-center justify-center p-4 md:p-10">
          <div className="max-w-4xl w-full bg-white rounded-[3rem] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in duration-300">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-[11px] font-black text-gray-800 uppercase tracking-widest">Official Notice Copy</h3>
              <button 
                onClick={() => setViewingAttachment(null)}
                className="text-gray-400 hover:text-gray-900 text-5xl leading-none transition-colors"
              >
                &times;
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center p-10 min-h-[60vh]">
              {viewingAttachment.startsWith('data:image') ? (
                <img src={viewingAttachment} alt="Notice Copy" className="max-w-full h-auto shadow-2xl rounded-2xl border border-white" />
              ) : (
                <div className="text-center space-y-6">
                  <div className="text-8xl">📄</div>
                  <p className="text-gray-800 font-black uppercase text-sm tracking-widest">PDF Notice File</p>
                  <a href={viewingAttachment} download="traffic-notice" className="inline-block bg-blue-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-xl">Download for Reference</a>
                </div>
              )}
            </div>
            <div className="p-8 text-center bg-white border-t border-gray-100">
              <button onClick={() => setViewingAttachment(null)} className="bg-gray-900 text-white px-12 py-4 rounded-2xl font-black uppercase text-xs tracking-widest">Close Registry</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrafficFines;
