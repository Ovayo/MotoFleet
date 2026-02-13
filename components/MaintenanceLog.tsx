
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

  const handleDuplicate = (record: MaintenanceRecord) => {
    setEditingId(null);
    setIsDuplicating(true);
    setFormData({
      bikeId: record.bikeId,
      date: new Date().toISOString().split('T')[0],
      description: `${record.description}`,
      cost: record.cost,
      serviceType: record.serviceType,
      performedBy: record.performedBy || 'In-House Workshop',
      attachmentUrl: ''
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

  const removeAttachment = () => {
    setFormData(prev => ({ ...prev, attachmentUrl: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getServiceStyles = (type: MaintenanceRecord['serviceType']) => {
    switch(type) {
      case 'fuel': return { icon: '⛽', color: 'bg-orange-500', bg: 'bg-orange-50', text: 'text-orange-600' };
      case 'parts': return { icon: '📦', color: 'bg-indigo-500', bg: 'bg-indigo-50', text: 'text-indigo-600' };
      case 'tyres': return { icon: '🛞', color: 'bg-gray-700', bg: 'bg-gray-100', text: 'text-gray-700' };
      case 'oil': return { icon: '🛢️', color: 'bg-amber-600', bg: 'bg-amber-50', text: 'text-amber-700' };
      case 'repair': return { icon: '🔧', color: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-600' };
      case 'routine': return { icon: '🛠️', color: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-600' };
      default: return { icon: '📜', color: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-600' };
    }
  };

  const totalSpent = maintenance.reduce((sum, r) => sum + r.cost, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Maintenance Hub</h2>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
            Detailed Technical Registry • Total Invested: <span className="text-red-500">R{totalSpent.toLocaleString()}</span>
          </p>
        </div>
        <button 
          onClick={() => {
            if (showForm) resetForm();
            else setShowForm(true);
          }}
          className={`px-8 py-3 rounded-2xl transition-all shadow-xl font-black uppercase text-[10px] tracking-widest flex items-center space-x-2 ${
            showForm ? 'bg-gray-800 text-white shadow-gray-200' : 'bg-red-600 text-white shadow-red-200 hover:bg-red-700'
          }`}
        >
          <span>{showForm ? '✕' : '+'}</span>
          <span>{showForm ? 'Close Editor' : 'Register Expense'}</span>
        </button>
      </div>

      {showForm && (
        <form ref={formRef} onSubmit={handleSubmit} className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl border border-gray-100 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between mb-8 border-b border-gray-50 pb-6">
             <div>
               <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">
                 {editingId ? 'Modify Technical Record' : isDuplicating ? 'Clone Technical Telemetry' : 'New Operational Log'}
               </h3>
               <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-1">Authorized Maintenance Entry</p>
             </div>
             <button type="button" onClick={resetForm} className="text-gray-300 hover:text-gray-900 text-4xl leading-none">&times;</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Target Motorcycle</label>
              <select 
                className="w-full border-gray-100 rounded-2xl p-4 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all font-bold text-sm appearance-none shadow-sm"
                value={formData.bikeId}
                onChange={e => setFormData({...formData, bikeId: e.target.value})}
              >
                {bikes.map(b => <option key={b.id} value={b.id}>{b.licenseNumber} - {b.makeModel}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Service Classification</label>
              <select 
                className="w-full border-gray-100 rounded-2xl p-4 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all font-bold text-sm appearance-none shadow-sm"
                value={formData.serviceType}
                onChange={e => setFormData({...formData, serviceType: e.target.value as any})}
              >
                <option value="routine">Routine Maintenance</option>
                <option value="repair">Major Mechanical Repair</option>
                <option value="tyres">Tyres & Wheelset</option>
                <option value="oil">Lubrication & Oil</option>
                <option value="parts">Component Install / Spares</option>
                <option value="fuel">Fuel Logistics</option>
                <option value="other">Operational Overhead</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Expense Value (R)</label>
              <input 
                type="number"
                required
                placeholder="0.00"
                className="w-full border-gray-100 rounded-2xl p-4 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all font-bold text-sm shadow-sm"
                value={formData.cost || ''}
                onChange={e => setFormData({...formData, cost: Number(e.target.value)})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Event Timestamp</label>
              <input 
                type="date"
                required
                className="w-full border-gray-100 rounded-2xl p-4 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all font-bold text-sm shadow-sm"
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
              />
            </div>

            <div className="lg:col-span-2 space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Service Entity / Provider</label>
              <select 
                className="w-full border-gray-100 rounded-2xl p-4 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all font-bold text-sm appearance-none shadow-sm"
                value={formData.performedBy}
                onChange={e => setFormData({...formData, performedBy: e.target.value})}
              >
                <option value="In-House Workshop">In-House Workshop</option>
                {workshops.map(w => (
                  <option key={w.id} value={w.name}>{w.name} ({w.city})</option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2 space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Technical Log Narrative</label>
              <input 
                type="text"
                required
                placeholder="Detailed description of work performed..."
                className="w-full border-gray-100 rounded-2xl p-4 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all font-bold text-sm shadow-sm"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>
            
            <div className="lg:col-span-2 space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Document Evidence (Invoice / Receipt)</label>
              <div className="relative">
                <input 
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
                {!formData.attachmentUrl ? (
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center space-x-3 border-2 border-dashed border-gray-200 hover:border-red-400 hover:bg-red-50/20 rounded-2xl p-4 transition-all group"
                  >
                    <span className="text-xl group-hover:scale-125 transition-transform duration-300">📸</span>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-red-600">Upload Receipt Evidence</span>
                  </button>
                ) : (
                  <div className="flex items-center space-x-3 bg-green-50 border border-green-200 rounded-2xl p-3.5">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-lg shadow-sm">✅</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black text-green-700 uppercase tracking-widest truncate">Document Successfully Stored</p>
                    </div>
                    <button 
                      type="button" 
                      onClick={removeAttachment}
                      className="text-red-500 hover:text-red-700 p-2 font-black text-xl"
                    >
                      &times;
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="lg:col-span-4 flex flex-col md:flex-row justify-end pt-6 gap-4">
              <button 
                type="button"
                onClick={resetForm}
                className="px-10 py-4 bg-gray-100 text-gray-400 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-200 hover:text-gray-600 transition-all"
              >
                Cancel Entry
              </button>
              <button type="submit" className="bg-red-600 text-white px-16 py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-red-200 hover:bg-red-700 transition-all active:scale-95">
                {editingId ? 'Authorize System Update' : isDuplicating ? 'Post Cloned Dataset' : 'Finalize Registry Entry'}
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {maintenance.length === 0 ? (
          <div className="bg-white p-32 text-center rounded-[3.5rem] border border-dashed border-gray-200 shadow-inner flex flex-col items-center">
            <div className="w-24 h-24 bg-gray-50 rounded-[2.5rem] flex items-center justify-center text-5xl mb-8 opacity-40 shadow-inner">🔧</div>
            <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">The Registry is Idle</h3>
            <p className="text-gray-400 font-bold uppercase text-[11px] tracking-widest mt-2 max-w-xs">No technical events have been logged for the current fleet operations.</p>
            <button onClick={() => setShowForm(true)} className="mt-8 bg-red-600 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-red-100">Log First Expense</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {maintenance
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map(record => {
                const bike = bikes.find(b => b.id === record.bikeId);
                const styles = getServiceStyles(record.serviceType);
                const formattedDate = new Date(record.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                
                return (
                  <div key={record.id} className="bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-2xl hover:shadow-gray-100 transition-all duration-300 group overflow-hidden relative">
                    <div className={`absolute top-0 left-0 w-1.5 h-full ${styles.color}`}></div>
                    <div className="p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
                      {/* Service Icon Section */}
                      <div className={`w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center text-3xl md:text-4xl shadow-inner transition-transform group-hover:scale-105 duration-300 ${styles.bg} ${styles.text}`}>
                        {styles.icon}
                      </div>

                      {/* Content Section */}
                      <div className="flex-1 min-w-0 text-center md:text-left">
                        <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                          <h4 className="font-black text-gray-900 text-lg uppercase tracking-tight truncate leading-tight">
                            {bike?.licenseNumber || 'UNIDENTIFIED'} — {record.description}
                          </h4>
                          <span className={`w-fit mx-auto md:mx-0 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border border-gray-100 shadow-sm ${styles.text} ${styles.bg}`}>
                            {record.serviceType}
                          </span>
                        </div>
                        <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 md:gap-4">
                           <div className="flex items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                              <span className="mr-2">🏪</span>
                              {record.performedBy || 'In-House'}
                           </div>
                           <span className="hidden md:block w-1 h-1 rounded-full bg-gray-200"></span>
                           <div className="flex items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                              <span className="mr-2">🏷️</span>
                              {bike?.makeModel || 'N/A'}
                           </div>
                        </div>
                      </div>

                      {/* Metrics Section */}
                      <div className="flex flex-col items-center md:items-end justify-center shrink-0 border-t md:border-t-0 md:border-l border-gray-50 pt-6 md:pt-0 md:pl-10 min-w-[140px]">
                         <p className="text-[28px] font-black text-gray-900 leading-none">R{record.cost.toLocaleString()}</p>
                         <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em] mt-2 bg-red-50 px-2 py-0.5 rounded-full">Cost Basis</p>
                         <div className="mt-4 flex flex-col items-center md:items-end">
                            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{formattedDate}</p>
                            <p className="text-[8px] font-bold text-gray-300 uppercase mt-0.5">Registry Timestamp</p>
                         </div>
                      </div>

                      {/* Actions Bar (Overlay or Static) */}
                      <div className="flex items-center gap-2 border-t md:border-t-0 md:border-l border-gray-50 pt-6 md:pt-0 md:pl-6 w-full md:w-auto justify-center">
                         {record.attachmentUrl && (
                           <button 
                            onClick={() => setViewingAttachment(record.attachmentUrl!)}
                            className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm flex items-center justify-center text-xl"
                            title="View Invoice"
                           >
                            📄
                           </button>
                         )}
                         <button 
                          onClick={() => handleDuplicate(record)}
                          className="w-12 h-12 bg-gray-50 text-gray-400 rounded-2xl hover:bg-gray-900 hover:text-white transition-all shadow-sm flex items-center justify-center text-xl"
                          title="Clone Entry"
                         >
                          📑
                         </button>
                         <button 
                          onClick={() => handleEdit(record)}
                          className="w-12 h-12 bg-gray-50 text-gray-400 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm flex items-center justify-center text-xl"
                          title="Modify Entry"
                         >
                          ✏️
                         </button>
                         <button 
                          onClick={() => onDeleteMaintenance(record.id)}
                          className="w-12 h-12 bg-gray-50 text-gray-400 rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-sm flex items-center justify-center text-xl"
                          title="Delete Record"
                         >
                          🗑️
                         </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Attachment Viewer Modal */}
      {viewingAttachment && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[110] flex items-center justify-center p-4 md:p-10">
          <div className="max-w-4xl w-full bg-white rounded-[3rem] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in duration-300">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-[11px] font-black text-gray-800 uppercase tracking-widest">Digital Evidence Vault</h3>
              <button 
                onClick={() => setViewingAttachment(null)}
                className="text-gray-400 hover:text-gray-900 text-5xl leading-none transition-colors"
              >
                &times;
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center p-10 min-h-[60vh]">
              {viewingAttachment.startsWith('data:image') ? (
                <img src={viewingAttachment} alt="Evidence" className="max-w-full h-auto shadow-2xl rounded-2xl border border-white" />
              ) : (
                <div className="text-center space-y-6">
                  <div className="text-8xl">📄</div>
                  <p className="text-gray-800 font-black uppercase text-sm tracking-widest">Encrypted Document Link</p>
                  <a href={viewingAttachment} download="maintenance-receipt" className="inline-block bg-blue-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-xl">Download for Reference</a>
                </div>
              )}
            </div>
            <div className="p-8 text-center bg-white border-t border-gray-100">
              <button onClick={() => setViewingAttachment(null)} className="bg-gray-900 text-white px-12 py-4 rounded-2xl font-black uppercase text-xs tracking-widest">Close Security Viewer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceLog;
