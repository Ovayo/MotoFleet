import React, { useState, useRef } from 'react';
import { Bike, Driver, TrafficFine } from '../types';

interface TrafficFinesProps {
  bikes: Bike[];
  drivers: Driver[];
  fines: TrafficFine[];
  onAddFine: (fine: Omit<TrafficFine, 'id'>) => void;
  onUpdateStatus: (id: string, status: TrafficFine['status']) => void;
}

const TrafficFines: React.FC<TrafficFinesProps> = ({ bikes, drivers, fines, onAddFine, onUpdateStatus }) => {
  const [showForm, setShowForm] = useState(false);
  const [viewingAttachment, setViewingAttachment] = useState<string | null>(null);
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Traffic Fine Management</h2>
          <p className="text-sm text-gray-500 font-medium">Log and monitor infringement notices across the fleet.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-red-600 text-white px-6 py-2.5 rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-100 font-black uppercase text-[10px] tracking-widest"
        >
          {showForm ? 'Cancel Entry' : '+ Log Fine'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-xl border border-red-50 animate-in fade-in slide-in-from-top-4 duration-300">
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
                className="w-full border-gray-100 rounded-xl p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all font-bold text-sm"
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
            <div className="lg:col-span-3 flex justify-end">
              <button type="submit" className="bg-red-600 text-white px-12 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-red-100 hover:bg-red-700 transition-all">
                Log Infringement
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-4">
        {fines.length === 0 ? (
          <div className="bg-white p-20 text-center rounded-[2.5rem] border border-dashed border-gray-200">
             <div className="text-4xl opacity-20 mb-4">🚔</div>
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No infringements recorded</p>
          </div>
        ) : (
          fines.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(fine => {
            const bike = bikes.find(b => b.id === fine.bikeId);
            const driver = drivers.find(d => d.id === fine.driverId);
            return (
              <div key={fine.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-md transition-all">
                <div className="flex items-center space-x-5 w-full md:w-auto">
                  <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-sm">👮</div>
                  <div>
                    <h4 className="font-black text-gray-800 uppercase tracking-tight leading-tight">{fine.noticeNumber} — R{fine.amount}</h4>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                       {bike?.licenseNumber} • {driver?.name} • {new Date(fine.date).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500 mt-2 italic font-medium">"{fine.description}"</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-end">
                  {fine.attachmentUrl && (
                    <button 
                      onClick={() => setViewingAttachment(fine.attachmentUrl!)}
                      className="p-2.5 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors"
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
          })
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
                <img src={viewingAttachment} alt="Notice" className="max-w-full h-auto shadow-xl rounded-xl" />
              ) : (
                <div className="text-center">
                  <p className="text-gray-600 font-bold mb-4">PDF Document Notice</p>
                  <a href={viewingAttachment} download="traffic-fine" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest">Download Notice</a>
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