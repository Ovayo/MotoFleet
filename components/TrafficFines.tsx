
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFine.bikeId || !newFine.driverId) return;
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

  // Use React.FC to allow 'key' prop when rendering as a JSX element
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
               {groupingMode !== 'bike' && `${bike?.licenseNumber} • `} 
               {groupingMode !== 'driver' && `${driver?.name} • `}
               {new Date(fine.date).toLocaleDateString()}
            </p>
            <p className="text-xs text-gray-500 mt-2 italic font-medium">"{fine.description}"</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-end">
          <button 
            onClick={() => handleDuplicate(fine)}
            className="p-2.5 bg-gray-50 rounded-xl hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors border border-gray-100"
            title="Duplicate Fine"
          >
            👯
          </button>
          {fine.attachmentUrl && (
            <button 
              onClick={() => setViewingAttachment(fine.attachmentUrl!)}
              className="p-2.5 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors border border-gray-100"
              title="View Notice"
            >
              📄
            </button>
          )}
          <div className="relative group">
            <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
              fine.status === 'paid' ? 'bg-green-50 border-green-100 text-green-700' :
              fine.status === 'contested' ? 'bg-amber-50 border-amber-100 text-amber-700' :
              'bg-red-50 border-red-100 text-red-700'
            }`}>
              {fine.status}
            </div>
            <select 
              className="absolute inset-0 opacity-0 cursor-pointer"
              value={fine.status}
              onChange={(e) => onUpdateStatus(fine.id, e.target.value as any)}
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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tight uppercase">Traffic Fine Management</h2>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Capture & Pivot Violations</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="bg-gray-100 p-1 rounded-xl flex">
            {(['all', 'driver', 'bike'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setGroupingMode(mode)}
                className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                  groupingMode === mode ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'
                }`}
              >
                {mode === 'all' ? 'Timeline' : mode === 'driver' ? 'By Driver' : 'By Vehicle'}
              </button>
            ))}
          </div>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 transition-all shadow-xl shadow-red-100 font-black uppercase text-[10px] tracking-widest"
          >
            {showForm ? 'Cancel' : '+ Log Fine'}
          </button>
        </div>
      </div>

      {showForm && (
        <form ref={formRef} onSubmit={handleSubmit} className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl border border-red-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight mb-8">Infringement Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Vehicle</label>
              <select 
                required
                className="w-full border-gray-100 rounded-xl p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all font-bold text-sm"
                value={newFine.bikeId}
                onChange={e => {
                    const bikeId = e.target.value;
                    const bike = bikes.find(b => b.id === bikeId);
                    setNewFine({...newFine, bikeId, driverId: bike?.assignedDriverId || ''});
                }}
              >
                <option value="">Select Vehicle...</option>
                {bikes.map(b => <option key={b.id} value={b.id}>{b.licenseNumber} ({b.makeModel})</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Driver</label>
              <select 
                required
                className="w-full border-gray-100 rounded-xl p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all font-bold text-sm"
                value={newFine.driverId}
                onChange={e => {
                  const driverId = e.target.value;
                  const bike = bikes.find(b => b.assignedDriverId === driverId);
                  setNewFine({
                    ...newFine, 
                    driverId, 
                    bikeId: bike?.id || newFine.bikeId 
                  });
                }}
              >
                <option value="">Select Driver...</option>
                {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Notice Number</label>
              <input 
                type="text"
                required
                placeholder="Notice Number"
                className="w-full border-gray-100 rounded-xl p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all font-bold text-sm font-mono"
                value={newFine.noticeNumber}
                onChange={e => setNewFine({...newFine, noticeNumber: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Amount (R)</label>
              <input 
                type="number"
                required
                placeholder="Amount"
                className="w-full border-gray-100 rounded-xl p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all font-bold text-sm"
                value={newFine.amount || ''}
                onChange={e => setNewFine({...newFine, amount: Number(e.target.value)})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Date of Offence</label>
              <input 
                type="date"
                required
                className="w-full border-gray-100 rounded-xl p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all font-bold text-sm"
                value={newFine.date}
                onChange={e => setNewFine({...newFine, date: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Proof of Fine</label>
              <div className="relative">
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept="image/*,application/pdf" />
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-200 hover:border-red-300 rounded-xl p-3 text-xs font-bold text-gray-400 transition-all uppercase tracking-widest"
                >
                  {newFine.attachmentUrl ? '✅ Document Attached' : '📎 Upload Notice'}
                </button>
              </div>
            </div>
            <div className="lg:col-span-3 space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Infringement Description</label>
              <textarea 
                required
                placeholder="Describe the infringement (e.g. Speeding 75km/h in 60km/h zone)"
                className="w-full border-gray-100 rounded-xl p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all font-bold text-sm h-24"
                value={newFine.description}
                onChange={e => setNewFine({...newFine, description: e.target.value})}
              />
            </div>
            <div className="lg:col-span-3 flex justify-end pt-4">
              <button type="submit" className="bg-red-600 text-white px-12 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-red-100 hover:bg-red-700 transition-all">
                Submit Infringement
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="space-y-8 pb-10">
        {fines.length === 0 ? (
          <div className="bg-white p-20 text-center rounded-[2.5rem] border border-dashed border-gray-200">
             <div className="text-5xl opacity-20 mb-6">🚔</div>
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No infringements recorded</p>
          </div>
        ) : groupingMode === 'all' ? (
          <div className="grid grid-cols-1 gap-4">
             {fines.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(fine => (
               <FineCard key={fine.id} fine={fine} />
             ))}
          </div>
        ) : (
          <div className="space-y-10">
            {groupedFines?.map(([groupId, groupFines]) => {
              const entityName = groupingMode === 'driver' 
                ? drivers.find(d => d.id === groupId)?.name 
                : bikes.find(b => b.id === groupId)?.licenseNumber;
              const totalAmount = groupFines.reduce((sum, f) => sum + f.amount, 0);
              const unpaidCount = groupFines.filter(f => f.status === 'unpaid').length;

              return (
                <div key={groupId} className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                  <div className="flex items-end justify-between px-4 pb-2 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                       <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-xs ${groupingMode === 'driver' ? 'bg-blue-600' : 'bg-gray-800'}`}>
                         {entityName?.substring(0, 2).toUpperCase()}
                       </div>
                       <div>
                         <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight leading-none">{entityName || 'Unknown Entity'}</h3>
                         <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">
                           {groupFines.length} Fine{groupFines.length !== 1 ? 's' : ''} total
                         </p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-xl font-black text-red-600">R{totalAmount.toLocaleString()}</p>
                       <p className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${unpaidCount > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                         {unpaidCount} UNPAID
                       </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 pl-4 md:pl-8 relative">
                    <div className="absolute left-2 md:left-4 top-0 bottom-4 w-1 bg-gray-50 rounded-full"></div>
                    {groupFines.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(fine => (
                      <FineCard key={fine.id} fine={fine} compact />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {viewingAttachment && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="max-w-4xl w-full bg-white rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in duration-300">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Infringement Notice Evidence</h3>
              <button 
                onClick={() => setViewingAttachment(null)}
                className="text-gray-400 hover:text-gray-900 text-4xl leading-none transition-colors"
              >
                &times;
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-gray-200/50 flex items-center justify-center p-8 min-h-[50vh]">
              {viewingAttachment.startsWith('data:image') ? (
                <img src={viewingAttachment} alt="Notice" className="max-w-full h-auto shadow-2xl rounded-2xl border-4 border-white" />
              ) : (
                <div className="text-center space-y-6">
                  <div className="text-7xl">📄</div>
                  <p className="text-gray-600 font-bold">PDF Document Notice</p>
                  <a href={viewingAttachment} download="traffic-fine" className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-100 inline-block transition-transform hover:scale-105">Download Notice</a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrafficFines;
