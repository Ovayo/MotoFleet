
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800 uppercase tracking-tight">Expenses & Maintenance</h2>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Capture technical telemetry and operational costs.</p>
        </div>
        <button 
          onClick={() => {
            if (showForm) resetForm();
            else setShowForm(true);
          }}
          className="bg-red-600 text-white px-6 py-2.5 rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-100 font-black uppercase text-[10px] tracking-widest"
        >
          {showForm ? 'Cancel Entry' : '+ Log Expense'}
        </button>
      </div>

      {showForm && (
        <form ref={formRef} onSubmit={handleSubmit} className="bg-white p-8 rounded-[2rem] shadow-xl border border-red-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Asset Allocation</label>
              <select 
                className="w-full border-gray-100 rounded-xl p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all font-bold text-sm appearance-none"
                value={formData.bikeId}
                onChange={e => setFormData({...formData, bikeId: e.target.value})}
              >
                {bikes.map(b => <option key={b.id} value={b.id}>{b.licenseNumber} - {b.makeModel}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Job Category</label>
              <select 
                className="w-full border-gray-100 rounded-xl p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all font-bold text-sm appearance-none"
                value={formData.serviceType}
                onChange={e => setFormData({...formData, serviceType: e.target.value as any})}
              >
                <option value="routine">Routine Service</option>
                <option value="repair">Major Repair</option>
                <option value="tyres">Tyres & Wheels</option>
                <option value="oil">Oil Change</option>
                <option value="parts">Parts / Spares</option>
                <option value="fuel">Fueling</option>
                <option value="other">Other Overhead</option>
              </select>
            </div>
            <div className="space-y-1 lg:col-span-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Cost (ZAR)</label>
              <input 
                type="number"
                required
                placeholder="0.00"
                className="w-full border-gray-100 rounded-xl p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all font-bold text-sm"
                value={formData.cost || ''}
                onChange={e => setFormData({...formData, cost: Number(e.target.value)})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Service Date</label>
              <input 
                type="date"
                required
                className="w-full border-gray-100 rounded-xl p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all font-bold text-sm"
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
              />
            </div>

            <div className="lg:col-span-2 space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Service Provider / Partner</label>
              <select 
                className="w-full border-gray-100 rounded-xl p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all font-bold text-sm appearance-none"
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
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Task Narrative</label>
              <input 
                type="text"
                required
                placeholder="e.g. Major engine rebuild and sprocket kit"
                className="w-full border-gray-100 rounded-xl p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all font-bold text-sm"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>
            
            <div className="lg:col-span-1 space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Document Evidence</label>
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
                    className="w-full flex items-center justify-center space-x-2 border-2 border-dashed border-gray-200 hover:border-red-300 hover:bg-red-50/30 rounded-xl p-3 transition-all group"
                  >
                    <span className="text-xl group-hover:scale-110 transition-transform">📎</span>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-red-600">Invoice / Slip</span>
                  </button>
                ) : (
                  <div className="flex items-center space-x-2 bg-green-50 border border-green-100 rounded-xl p-2.5">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-xs shadow-sm">📄</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-black text-green-700 uppercase tracking-tighter truncate">Doc Encoded</p>
                    </div>
                    <button 
                      type="button"
                      onClick={removeAttachment}
                      className="text-gray-400 hover:text-red-500 text-lg p-1"
                    >
                      &times;
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="lg:col-span-4 flex justify-end pt-4 space-x-3">
              {editingId && (
                <button 
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-100 text-gray-600 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs"
                >
                  Cancel Edit
                </button>
              )}
              <button type="submit" className="bg-red-600 text-white px-12 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-red-100 hover:bg-red-700 transition-all active:scale-95">
                {editingId ? 'Update Operational Expense' : 'Commit Operational Expense'}
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-4">
        {maintenance.length === 0 ? (
          <div className="bg-white p-20 text-center rounded-[2.5rem] border border-dashed border-gray-200">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 opacity-50">🛠️</div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Technician Log Empty</p>
            <p className="text-xs text-gray-400 mt-2 font-medium">Click "Log Expense" to populate the technical registry.</p>
          </div>
        ) : (
          maintenance.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(record => {
            const bike = bikes.find(b => b.id === record.bikeId);
            const getIcon = (type: MaintenanceRecord['serviceType']) => {
              switch(type) {
                case 'fuel': return '⛽';
                case 'parts': return '📦';
                case 'tyres': return '🛞';
                case 'oil': return '🛢️';
                case 'repair': return '🔧';
                case 'routine': return '🛠️';
                default: return '📜';
              }
            };
            return (
              <div key={record.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between hover:shadow-xl hover:shadow-gray-100 transition-all group">
                <div className="flex items-center space-x-5 w-full md:w-auto mb-4 md:mb-0">
                  <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center text-2xl shadow-sm ${
                    record.serviceType === 'repair' ? 'bg-red-50 text-red-600' :
                    record.serviceType === 'fuel' ? 'bg-orange-50 text-orange-600' :
                    record.serviceType === 'routine' ? 'bg-blue-50 text-blue-600' :
                    'bg-green-50 text-green-600'
                  }`}>
                    {getIcon(record.serviceType)}
                  </div>
                  <div>
                    <div className="font-black text-gray-800 tracking-tight leading-tight uppercase">{bike?.licenseNumber || 'N/A'} — {record.description}</div>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{new Date(record.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      <span className="text-[8px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">{record.serviceType}</span>
                      <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest border border-gray-100 px-2 py-0.5 rounded-full">Provider: {record.performedBy || 'Unknown'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0 mt-4 md:mt-0">
                  <div className="flex items-center space-x-2">
                    {record.attachmentUrl && (
                      <button 
                        onClick={() => setViewingAttachment(record.attachmentUrl!)}
                        className="p-2.5 bg-gray-50 rounded-xl hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-all border border-gray-100"
                        title="View Receipt"
                      >
                        <span className="text-base">📄</span>
                      </button>
                    )}
                    <button 
                      onClick={() => handleEdit(record)}
                      className="p-2.5 bg-gray-50 rounded-xl hover:bg-amber-50 text-gray-400 hover:text-amber-600 transition-all border border-gray-100"
                      title="Edit Entry"
                    >
                      <span className="text-base">✏️</span>
                    </button>
                    <button 
                      onClick={() => onDeleteMaintenance(record.id)}
                      className="p-2.5 bg-gray-50 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-600 transition-all border border-gray-100"
                      title="Delete Entry"
                    >
                      <span className="text-base">🗑️</span>
                    </button>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-black text-gray-800">R{record.cost.toLocaleString()}</div>
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Entry Total</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Attachment Viewer Modal */}
      {viewingAttachment && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 md:p-10">
          <div className="max-w-4xl w-full bg-white rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in duration-300">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Technical Evidence Registry</h3>
              <button 
                onClick={() => setViewingAttachment(null)}
                className="text-gray-400 hover:text-gray-900 text-4xl leading-none transition-colors"
              >
                &times;
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-gray-200/50 flex items-center justify-center p-8 min-h-[50vh]">
              {viewingAttachment.startsWith('data:image') ? (
                <img src={viewingAttachment} alt="Receipt Attachment" className="max-w-full h-auto shadow-xl rounded-xl border border-white" />
              ) : (
                <div className="text-center space-y-4">
                  <div className="text-6xl">📄</div>
                  <p className="text-gray-600 font-bold">Document Attachment (PDF or Other)</p>
                  <a href={viewingAttachment} download="receipt" className="inline-block bg-blue-600 text-white px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-blue-100">Download File</a>
                </div>
              )}
            </div>
            <div className="p-6 text-center bg-gray-50 border-t border-gray-100">
              <button onClick={() => setViewingAttachment(null)} className="bg-gray-800 text-white px-10 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest">Close Viewer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceLog;
