
import React, { useState, useRef } from 'react';
import { Bike, MaintenanceRecord, Workshop } from '../types';

interface MaintenanceLogProps {
  bikes: Bike[];
  maintenance: MaintenanceRecord[];
  onAddMaintenance: (record: Omit<MaintenanceRecord, 'id'>) => void;
  onUpdateMaintenance: (record: MaintenanceRecord) => void;
  onDeleteMaintenance: (id: string) => void;
  workshops: Workshop[];
}

const MaintenanceLog: React.FC<MaintenanceLogProps> = ({ bikes, maintenance, onAddMaintenance, onUpdateMaintenance, onDeleteMaintenance, workshops }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [viewingAttachment, setViewingAttachment] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  
  const [formData, setFormData] = useState<Omit<MaintenanceRecord, 'id'>>({
    bikeId: bikes[0]?.id || '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    cost: 0,
    serviceType: 'repair',
    performedBy: 'In-House Workshop',
    attachmentUrl: ''
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, attachmentUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = (record: MaintenanceRecord) => {
    setEditingId(record.id);
    setIsDuplicating(false);
    setFormData({
      bikeId: record.bikeId,
      date: record.date,
      description: record.description,
      cost: record.cost,
      serviceType: record.serviceType,
      performedBy: record.performedBy || 'In-House Workshop',
      attachmentUrl: record.attachmentUrl || ''
    });
    setShowForm(true);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      onUpdateMaintenance({ ...formData, id: editingId });
    } else {
      onAddMaintenance(formData);
    }
    resetForm();
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setIsDuplicating(false);
    setFormData({
      bikeId: bikes[0]?.id || '',
      date: new Date().toISOString().split('T')[0],
      description: '',
      cost: 0,
      serviceType: 'repair',
      performedBy: 'In-House Workshop',
      attachmentUrl: ''
    });
  };

  const getServiceStyles = (type: MaintenanceRecord['serviceType']) => {
    switch(type) {
      case 'fuel': return { icon: '⛽', color: 'bg-orange-500', bg: 'bg-orange-50', text: 'text-orange-600' };
      case 'parts': return { icon: '📦', color: 'bg-indigo-500', bg: 'bg-indigo-50', text: 'text-indigo-600' };
      case 'tyres': return { icon: '🛞', color: 'bg-gray-900', bg: 'bg-gray-100', text: 'text-gray-900' };
      case 'oil': return { icon: '🛢️', color: 'bg-amber-600', bg: 'bg-amber-50', text: 'text-amber-700' };
      case 'repair': return { icon: '🔧', color: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-600' };
      case 'routine': return { icon: '🛠️', color: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-600' };
      default: return { icon: '📜', color: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-600' };
    }
  };

  const totalSpent = maintenance.reduce((sum, r) => sum + r.cost, 0);

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Technical Registry</h2>
          <p className="text-[11px] text-gray-400 font-black uppercase tracking-[0.3em] mt-3">
            Fleet Investment Portfolio • <span className="text-red-500">R{totalSpent.toLocaleString()} Aggregate burn</span>
          </p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="bg-gray-900 text-white px-10 py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.25em] shadow-2xl shadow-gray-200 hover:scale-105 active:scale-95 transition-all flex items-center space-x-4"
        >
          <span className="text-xl">+</span>
          <span>Register Event</span>
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-2xl z-[120] flex items-center justify-center p-4">
           <form ref={formRef} onSubmit={handleSubmit} className="bg-white/95 backdrop-blur-3xl p-12 rounded-[4rem] shadow-2xl max-w-2xl w-full space-y-10 animate-in zoom-in duration-300">
              <div className="flex justify-between items-center border-b border-gray-100 pb-8">
                 <div>
                   <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">{editingId ? 'Modify Record' : 'Log Operation'}</h3>
                   <p className="text-[11px] text-gray-400 font-black uppercase tracking-[0.3em] mt-2">Authorized Technical Entry</p>
                 </div>
                 <button type="button" onClick={resetForm} className="text-gray-300 hover:text-gray-900 text-6xl leading-none">&times;</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Asset identification</label>
                    <select 
                      className="w-full bg-gray-50 border-none rounded-2xl p-5 text-sm font-bold outline-none shadow-inner"
                      value={formData.bikeId}
                      onChange={e => setFormData({...formData, bikeId: e.target.value})}
                    >
                      {bikes.map(b => <option key={b.id} value={b.id}>{b.licenseNumber}</option>)}
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Service entity</label>
                    <select 
                      className="w-full bg-gray-50 border-none rounded-2xl p-5 text-sm font-bold outline-none shadow-inner"
                      value={formData.performedBy}
                      onChange={e => setFormData({...formData, performedBy: e.target.value})}
                    >
                      <option value="In-House Workshop">Internal Hub</option>
                      {workshops.map(w => <option key={w.id} value={w.name}>{w.name}</option>)}
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Invoice value (R)</label>
                    <input 
                      type="number" required
                      className="w-full bg-gray-50 border-none rounded-2xl p-5 text-sm font-bold outline-none shadow-inner"
                      placeholder="0.00"
                      value={formData.cost || ''}
                      onChange={e => setFormData({...formData, cost: Number(e.target.value)})}
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Registry timestamp</label>
                    <input 
                      type="date" required
                      className="w-full bg-gray-50 border-none rounded-2xl p-5 text-sm font-bold outline-none shadow-inner"
                      value={formData.date}
                      onChange={e => setFormData({...formData, date: e.target.value})}
                    />
                 </div>
              </div>

              <button type="submit" className="w-full bg-gray-900 text-white py-6 rounded-[2.5rem] font-black uppercase text-[11px] tracking-[0.4em] shadow-2xl hover:bg-black transition-all">Authorize Entry</button>
           </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 pb-10">
        {maintenance.length === 0 ? (
          <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-[3rem] py-32 text-center shadow-sm">
             <p className="text-gray-400 font-black uppercase tracking-[0.3em] text-[10px]">Technical Logs Empty — Grid Stabilized</p>
          </div>
        ) : (
          maintenance
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map(record => {
              const bike = bikes.find(b => b.id === record.bikeId);
              const styles = getServiceStyles(record.serviceType);
              
              return (
                <div key={record.id} className="bg-white/80 backdrop-blur-3xl border border-white/60 rounded-[3rem] p-8 md:p-10 shadow-sm hover:shadow-2xl hover:shadow-gray-100 transition-all duration-500 group relative overflow-hidden">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                     <div className="flex items-center space-x-8 flex-1">
                        <div className={`w-20 h-20 rounded-[2.5rem] flex items-center justify-center text-4xl shadow-2xl border-4 border-white transition-all duration-700 group-hover:scale-110 ${styles.bg} ${styles.text}`}>
                           {styles.icon}
                        </div>
                        <div className="min-w-0">
                           <h4 className="font-black text-gray-900 text-2xl uppercase leading-none tracking-tighter mb-2 truncate">
                              {record.description}
                           </h4>
                           <div className="flex flex-wrap items-center gap-3">
                              <span className="text-[10px] font-black text-blue-500 bg-blue-50/50 px-3 py-1 rounded-full uppercase tracking-widest border border-blue-100/50">
                                 {bike?.licenseNumber || 'UNK-UNIT'}
                              </span>
                              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{record.performedBy}</span>
                           </div>
                        </div>
                     </div>

                     <div className="flex items-center space-x-12 shrink-0 border-l-0 md:border-l border-gray-100 md:pl-10">
                        <div className="text-center md:text-right">
                           <p className="text-3xl font-black text-gray-900 leading-none tracking-tighter">R{record.cost.toLocaleString()}</p>
                           <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-2">{new Date(record.date).toLocaleDateString('en-GB')}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                           <button onClick={() => handleEdit(record)} className="w-12 h-12 bg-white rounded-[1.2rem] flex items-center justify-center shadow-sm border border-gray-50 hover:bg-gray-900 hover:text-white transition-all">✏️</button>
                           <button onClick={() => onDeleteMaintenance(record.id)} className="w-12 h-12 bg-white rounded-[1.2rem] flex items-center justify-center shadow-sm border border-gray-50 hover:bg-red-600 hover:text-white transition-all">🗑️</button>
                        </div>
                     </div>
                  </div>
                </div>
              );
            })
        )}
      </div>
    </div>
  );
};

export default MaintenanceLog;
