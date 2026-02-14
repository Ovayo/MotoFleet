
import React, { useState, useMemo, useRef } from 'react';
import { Bike, MaintenanceRecord, Workshop } from '../types';

interface MechanicPortalProps {
  bikes: Bike[];
  setBikes: React.Dispatch<React.SetStateAction<Bike[]>>;
  maintenance: MaintenanceRecord[];
  onAddMaintenance: (record: Omit<MaintenanceRecord, 'id'>) => void;
  workshops: Workshop[];
  onAddWorkshop: (workshop: Omit<Workshop, 'id'>) => void;
  onUpdateWorkshop: (id: string, workshop: Omit<Workshop, 'id'>) => void;
  onDeleteWorkshop: (id: string) => void;
}

const MechanicPortal: React.FC<MechanicPortalProps> = ({ 
  bikes = [], 
  setBikes, 
  maintenance = [], 
  onAddMaintenance,
  workshops = [],
  onAddWorkshop,
  onUpdateWorkshop,
  onDeleteWorkshop
}) => {
  const [selectedBikeId, setSelectedBikeId] = useState<string | null>(null);
  const [showLogForm, setShowLogForm] = useState(false);
  const [showWorkshopForm, setShowWorkshopForm] = useState(false);
  const [editingWorkshopId, setEditingWorkshopId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'queue' | 'roadmap' | 'warranties' | 'workshops'>('queue');
  const [viewingAttachment, setViewingAttachment] = useState<string | null>(null);
  const [workshopSearch, setWorkshopSearch] = useState('');
  const [cityFilter, setCityFilter] = useState<'all' | 'JHB' | 'CTN' | 'EL'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'rating'>('rating');
  const [markOperational, setMarkOperational] = useState(true);
  const [assigningWorkshopBikeId, setAssigningWorkshopBikeId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [newLog, setNewLog] = useState<Omit<MaintenanceRecord, 'id'>>({
    bikeId: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    cost: 0,
    serviceType: 'routine',
    warrantyMonths: 0,
    performedBy: 'In-House Workshop',
    attachmentUrl: ''
  });

  const [workshopFormData, setWorkshopFormData] = useState<Omit<Workshop, 'id'>>({
    name: '',
    city: 'JHB',
    location: '',
    contact: '',
    specialization: [],
    rating: 5
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewLog(prev => ({ ...prev, attachmentUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const getServiceStatus = (bikeId: string) => {
    const records = (maintenance || []).filter(m => m.bikeId === bikeId && (m.serviceType === 'routine' || m.serviceType === 'oil'));
    if (records.length === 0) return { status: 'overdue', days: 999, lastDate: 'Never' };
    
    const latest = records.reduce((a, b) => {
      const dA = new Date(a.date).getTime();
      const dB = new Date(b.date).getTime();
      return dA > dB ? a : b;
    });
    
    const latestTime = new Date(latest.date).getTime();
    if (isNaN(latestTime)) return { status: 'overdue', days: 999, lastDate: 'Invalid Date' };

    const diff = Math.floor((new Date().getTime() - latestTime) / (1000 * 60 * 60 * 24));
    
    if (diff > 90) return { status: 'overdue', days: diff, lastDate: new Date(latest.date).toLocaleDateString() };
    if (diff > 75) return { status: 'due', days: diff, lastDate: new Date(latest.date).toLocaleDateString() };
    return { status: 'good', days: diff, lastDate: new Date(latest.date).toLocaleDateString() };
  };

  const activeWarranties = useMemo(() => {
    const now = new Date();
    return (maintenance || []).filter(m => {
      if (!m.warrantyMonths) return false;
      const expiryDate = new Date(m.date);
      if (isNaN(expiryDate.getTime())) return false;
      expiryDate.setMonth(expiryDate.getMonth() + m.warrantyMonths);
      return expiryDate > now;
    }).map(m => {
      const expiryDate = new Date(m.date);
      expiryDate.setMonth(expiryDate.getMonth() + m.warrantyMonths!);
      const remaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return { ...m, remainingDays: remaining };
    });
  }, [maintenance]);

  const workshopBikes = (bikes || []).filter(b => b.status === 'maintenance');
  
  const roadmapBikes = useMemo(() => {
    return [...(bikes || [])].sort((a, b) => {
      const statusA = getServiceStatus(a.id);
      const statusB = getServiceStatus(b.id);
      return (statusB.days || 0) - (statusA.days || 0);
    });
  }, [bikes, maintenance]);

  const getSpecIcon = (spec: string) => {
    if (!spec) return '🔹';
    const s = spec.toLowerCase();
    if (s.includes('hero')) return '🦸';
    if (s.includes('honda')) return '🇯🇵';
    if (s.includes('engine') || s.includes('rebuild')) return '⚙️';
    if (s.includes('tyre') || s.includes('wheel')) return '🛞';
    if (s.includes('service') || s.includes('routine')) return '🛠️';
    if (s.includes('oil') || s.includes('lube')) return '🛢️';
    if (s.includes('sprocket') || s.includes('chain')) return '🔗';
    if (s.includes('electric') || s.includes('battery')) return '⚡';
    if (s.includes('brake')) return '🛑';
    if (s.includes('body') || s.includes('fairing')) return '🛡️';
    return '🔹';
  };

  const filteredWorkshops = useMemo(() => {
    let result = (workshops || []).filter(w => {
      const matchesSearch = w.name?.toLowerCase().includes(workshopSearch.toLowerCase()) || 
                           (w.specialization || []).some(s => s.toLowerCase().includes(workshopSearch.toLowerCase()));
      const matchesCity = cityFilter === 'all' || w.city === cityFilter;
      return matchesSearch && matchesCity;
    });

    return result.sort((a, b) => {
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [workshops, workshopSearch, cityFilter, sortBy]);

  const handleLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLog.bikeId) return;
    onAddMaintenance(newLog);
    
    if (markOperational) {
      setBikes(prev => prev.map(b => b.id === newLog.bikeId ? { ...b, status: 'active', assignedWorkshopId: undefined } : b));
    }
    
    setShowLogForm(false);
    setNewLog({ 
      bikeId: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
      cost: 0,
      serviceType: 'routine',
      warrantyMonths: 0,
      performedBy: 'In-House Workshop',
      attachmentUrl: ''
    });
  };

  const handleWorkshopSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingWorkshopId) {
      onUpdateWorkshop(editingWorkshopId, workshopFormData);
    } else {
      onAddWorkshop(workshopFormData);
    }
    closeWorkshopForm();
  };

  const openEditWorkshop = (workshop: Workshop) => {
    setEditingWorkshopId(workshop.id);
    setWorkshopFormData({
      name: workshop.name || '',
      city: workshop.city || 'JHB',
      location: workshop.location || '',
      contact: workshop.contact || '',
      specialization: workshop.specialization || [],
      rating: workshop.rating || 5
    });
    setShowWorkshopForm(true);
  };

  const closeWorkshopForm = () => {
    setShowWorkshopForm(false);
    setEditingWorkshopId(null);
    setWorkshopFormData({
      name: '',
      city: 'JHB',
      location: '',
      contact: '',
      specialization: [],
      rating: 5
    });
  };

  const handleAssignWorkshop = (bikeId: string, workshopId: string) => {
    setBikes(prev => prev.map(b => b.id === bikeId ? { ...b, assignedWorkshopId: workshopId === 'none' ? undefined : workshopId } : b));
    setAssigningWorkshopBikeId(null);
  };

  // Normalization helper for WhatsApp links
  const formatForWhatsApp = (phone: string) => {
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '27' + cleaned.substring(1);
    }
    return cleaned;
  };

  const selectedBike = (bikes || []).find(b => b.id === selectedBikeId);

  return (
    <div className="w-full space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-amber-100 flex items-center justify-between">
           <div>
             <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">In Workshop</p>
             <h3 className="text-3xl font-black text-gray-800">{workshopBikes.length}</h3>
           </div>
           <div className="text-3xl">🛠️</div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-red-100 flex items-center justify-between">
           <div>
             <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Service Overdue</p>
             <h3 className="text-3xl font-black text-gray-800">{bikes.filter(b => getServiceStatus(b.id).status === 'overdue').length}</h3>
           </div>
           <div className="text-3xl">🛑</div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-blue-100 flex items-center justify-between">
           <div>
             <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Active Warranties</p>
             <h3 className="text-3xl font-black text-gray-800">{activeWarranties.length}</h3>
           </div>
           <div className="text-3xl">🛡️</div>
        </div>
        <button 
          onClick={() => setShowLogForm(true)}
          className="bg-amber-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-amber-100 hover:bg-amber-700 transition-all flex flex-col items-center justify-center space-y-2 py-6"
        >
          <span className="text-2xl">➕</span>
          <span>Open Job Card</span>
        </button>
      </div>

      <div className="flex flex-wrap gap-2 bg-gray-100 p-1.5 rounded-2xl w-fit">
        {(['queue', 'roadmap', 'warranties', 'workshops'] as const).map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            {tab === 'workshops' ? 'Partner Directory' : tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2">
          {activeTab === 'queue' && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-left-4">
              <div className="p-6 border-b border-gray-100 bg-gray-50/30">
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Active Workshop Queue</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {workshopBikes.length === 0 ? (
                  <div className="p-20 text-center">
                    <div className="text-4xl mb-4">✨</div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Workspace Clear</p>
                    <p className="text-xs text-gray-400 mt-1">All bikes are currently operational.</p>
                  </div>
                ) : (
                  workshopBikes.map(bike => {
                    const assignedWorkshop = workshops.find(w => w.id === bike.assignedWorkshopId);
                    return (
                      <div key={bike.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between hover:bg-amber-50/20 transition-colors">
                        <div className="flex items-center space-x-4 mb-4 md:mb-0">
                           <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center text-xl font-black">
                              {bike.licenseNumber.substring(0,2)}
                           </div>
                           <div>
                              <h4 className="font-black text-gray-800 uppercase tracking-tight">{bike.licenseNumber}</h4>
                              <p className="text-[10px] text-gray-400 font-bold uppercase">{bike.makeModel}</p>
                              <div className="mt-1 flex items-center space-x-2">
                                {assignedWorkshop ? (
                                  <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Dispatched To: {assignedWorkshop.name}</p>
                                ) : (
                                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest italic">Pending Assignment</p>
                                )}
                                <button 
                                  onClick={() => setAssigningWorkshopBikeId(bike.id)}
                                  className="text-[8px] font-black text-blue-500 hover:underline uppercase"
                                >
                                  {assignedWorkshop ? 'Modify' : 'Assign Workshop'}
                                </button>
                              </div>
                           </div>
                        </div>
                        <div className="flex items-center space-x-3">
                           <button 
                            onClick={() => {
                              setNewLog({ ...newLog, bikeId: bike.id, serviceType: 'repair', performedBy: assignedWorkshop?.name || 'In-House Workshop' });
                              setShowLogForm(true);
                            }}
                            className="px-4 py-2 bg-amber-50 text-amber-700 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-amber-100 transition-colors"
                           >
                             Log Repair
                           </button>
                           <button 
                            onClick={() => setSelectedBikeId(bike.id)}
                            className="px-4 py-2 text-gray-400 hover:text-gray-600 text-[9px] font-black uppercase tracking-widest transition-colors"
                           >
                             View History
                           </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {activeTab === 'roadmap' && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-left-4">
               <div className="p-6 border-b border-gray-100 bg-gray-50/30">
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Fleet Service Roadmap</h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {roadmapBikes.map(bike => {
                  const status = getServiceStatus(bike.id);
                  
                  return (
                    <div key={bike.id} className="group relative p-4 rounded-2xl border border-gray-100 bg-gray-50/50 flex flex-col justify-between transition-all hover:border-amber-200 hover:bg-amber-50/20 cursor-default">
                       <div className="flex justify-between items-start mb-4">
                          <div>
                             <h4 className="font-black text-gray-800 text-sm">{bike.licenseNumber}</h4>
                             <p className="text-[9px] text-gray-400 font-bold uppercase">{bike.makeModel}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                            status.status === 'overdue' ? 'bg-red-100 text-red-600' :
                            status.status === 'due' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'
                          }`}>
                            {status.status}
                          </span>
                       </div>
                       <div className="space-y-2">
                          <div className="flex justify-between text-[10px]">
                             <span className="text-gray-400 font-bold uppercase">Last Service</span>
                             <span className="text-gray-800 font-black">{status.lastDate}</span>
                          </div>
                          <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                             <div 
                              className={`h-full transition-all ${status.status === 'overdue' ? 'bg-red-500' : status.status === 'due' ? 'bg-amber-500' : 'bg-green-500'}`} 
                              style={{ width: `${Math.min(100, (status.days / 90) * 100)}%` }}
                             ></div>
                          </div>
                       </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {activeTab === 'workshops' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
              <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm">
                <div className="relative flex-1">
                   <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                   <input 
                    type="text" 
                    placeholder="Search workshop or specialization..." 
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                    value={workshopSearch}
                    onChange={(e) => setWorkshopSearch(e.target.value)}
                   />
                </div>
                <div className="flex bg-gray-100 p-1 rounded-xl shrink-0">
                  {(['all', 'JHB', 'CTN', 'EL'] as const).map(c => (
                    <button 
                      key={c}
                      onClick={() => setCityFilter(c)}
                      className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${cityFilter === c ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400'}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <div className="flex bg-gray-100 p-1 rounded-xl shrink-0">
                  {(['rating', 'name'] as const).map(s => (
                    <button 
                      key={s}
                      onClick={() => setSortBy(s)}
                      className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${sortBy === s ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400'}`}
                    >
                      Sort: {s}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => setShowWorkshopForm(true)}
                  className="bg-amber-600 text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-amber-100 hover:bg-amber-700 transition-all shrink-0 active:scale-95"
                >
                  + Add Workshop
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {filteredWorkshops.map(w => {
                   const primarySpec = (w.specialization || [])[0];
                   const otherSpecs = (w.specialization || []).slice(1);
                   const isTopRated = (w.rating || 0) >= 4.7;
                   
                   return (
                     <div key={w.id} className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm hover:shadow-2xl hover:shadow-gray-100 transition-all group relative overflow-hidden">
                        {isTopRated && (
                          <div className="absolute top-0 right-0">
                             <div className="bg-amber-50 text-amber-600 px-6 py-2 rounded-bl-3xl font-black text-[9px] uppercase tracking-widest border-b border-l border-amber-100 shadow-sm">
                               ★ Top Rated Partner
                             </div>
                          </div>
                        )}

                        <div className="flex justify-between items-start mb-6">
                           <div className="flex items-center space-x-5">
                              <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-[1.5rem] flex items-center justify-center text-3xl shadow-inner group-hover:scale-105 transition-transform">🏪</div>
                              <div className="min-w-0">
                                 <h4 className="font-black text-gray-900 uppercase tracking-tight text-lg truncate leading-tight">{w.name}</h4>
                                 <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-1.5 flex items-center">
                                    <span className="mr-2">📍</span>
                                    {w.location} • {w.city}
                                 </p>
                              </div>
                           </div>
                           <div className="flex flex-col items-end gap-2 shrink-0 pt-2">
                             <div className="bg-white px-3 py-1 rounded-xl border border-gray-50 shadow-sm flex items-center text-amber-500 font-black text-sm">
                                <span className="mr-1 text-xs">★</span>
                                <span>{(w.rating || 0).toFixed(1)}</span>
                             </div>
                             <div className="flex items-center gap-1.5">
                                <button 
                                  onClick={() => openEditWorkshop(w)}
                                  className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all opacity-0 group-hover:opacity-100"
                                  title="Edit Workshop"
                                >
                                  ✏️
                                </button>
                                <button 
                                  onClick={() => onDeleteWorkshop(w.id)}
                                  className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                                  title="Remove Partner"
                                >
                                  🗑️
                                </button>
                             </div>
                           </div>
                        </div>

                        <div className="space-y-4 mb-8">
                           {/* Primary Specialization Highlight - PROMINENT */}
                           {primarySpec && (
                             <div className="bg-amber-600 p-5 rounded-[2rem] text-white shadow-xl shadow-amber-100 flex items-center justify-between group-hover:translate-x-1 transition-transform border-4 border-amber-500/30">
                                <div className="flex items-center space-x-4">
                                   <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl backdrop-blur-md">
                                     {getSpecIcon(primarySpec)}
                                   </div>
                                   <div>
                                      <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-70">Technical Focus</p>
                                      <p className="text-sm font-black uppercase tracking-tight">{primarySpec}</p>
                                   </div>
                                </div>
                                <span className="text-[10px] font-black bg-white/10 px-3 py-1 rounded-full border border-white/20">SPECIALIST</span>
                             </div>
                           )}

                           <div className="flex flex-wrap gap-2">
                             {otherSpecs.map((s, i) => (
                               <div key={i} className="flex items-center space-x-2 px-4 py-2 bg-gray-50 text-gray-500 rounded-2xl text-[9px] font-black uppercase tracking-widest border border-gray-100 hover:bg-white hover:border-amber-200 transition-colors">
                                 <span className="text-base">{getSpecIcon(s)}</span>
                                 <span>{s}</span>
                               </div>
                             ))}
                           </div>
                        </div>

                        <div className="flex items-center gap-3 pt-6 border-t border-gray-50">
                          <a 
                            href={`tel:${w.contact}`}
                            className="flex-1 flex items-center justify-center space-x-3 py-4 bg-amber-50 text-amber-700 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-amber-600 hover:text-white transition-all shadow-sm active:scale-95"
                          >
                            <span>📞</span>
                            <span>Direct Dial</span>
                          </a>
                          <a 
                            href={`https://wa.me/${formatForWhatsApp(w.contact || '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center space-x-3 py-4 bg-green-50 text-green-700 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-green-600 hover:text-white transition-all shadow-sm active:scale-95"
                          >
                            <span>💬</span>
                            <span>WhatsApp</span>
                          </a>
                        </div>
                     </div>
                   );
                 })}
                 {filteredWorkshops.length === 0 && (
                   <div className="col-span-full py-24 text-center bg-white rounded-[2.5rem] border border-dashed border-gray-200">
                      <div className="text-4xl mb-4">🔍</div>
                      <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">No workshops match your criteria</p>
                      <button onClick={() => {setWorkshopSearch(''); setCityFilter('all');}} className="mt-4 text-amber-600 font-black text-[10px] uppercase tracking-widest hover:underline">Clear all filters</button>
                   </div>
                 )}
              </div>
            </div>
          )}

          {activeTab === 'warranties' && ( activeWarranties.length > 0 ? (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-left-4">
               <div className="p-6 border-b border-gray-100 bg-gray-50/30">
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Active Mechanical Guarantees</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {activeWarranties.map(w => {
                    const bike = bikes.find(b => b.id === w.bikeId);
                    return (
                      <div key={w.id} className="p-6 flex items-center justify-between hover:bg-blue-50/20 transition-colors">
                        <div className="flex items-center space-x-4">
                           <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl">🛡️</div>
                           <div>
                              <h4 className="font-black text-gray-800 text-sm uppercase leading-tight">{w.description}</h4>
                              <p className="text-[10px] text-gray-400 font-bold uppercase">{bike?.licenseNumber} • {w.performedBy}</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-blue-600 font-black text-lg leading-tight">{w.remainingDays} Days</p>
                           <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Left on coverage</p>
                        </div>
                      </div>
                    )
                  })
                }
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-24 text-center animate-in fade-in slide-in-from-left-4">
               <div className="text-4xl mb-4">🛡️</div>
               <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest italic">No active mechanical guarantees in the system</p>
            </div>
          ))}
        </div>

        <div className="space-y-6">
           {selectedBike ? (
             <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 animate-in slide-in-from-right-4">
                <div className="flex justify-between items-start mb-8">
                   <div>
                      <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight">{selectedBike.licenseNumber}</h3>
                      <p className="text-xs text-blue-500 font-black uppercase tracking-widest">{selectedBike.makeModel}</p>
                   </div>
                   <button onClick={() => setSelectedBikeId(null)} className="text-gray-300 hover:text-gray-600 text-3xl leading-none transition-colors">&times;</button>
                </div>

                <div className="space-y-6">
                   <div>
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-2 mb-4">Historical Workshop Logs</h4>
                      <div className="space-y-3">
                         {maintenance.filter(m => m.bikeId === selectedBikeId).length === 0 ? (
                           <p className="text-center py-10 text-gray-300 text-xs italic">No job cards found for this asset.</p>
                         ) : (
                           maintenance
                            .filter(m => m.bikeId === selectedBikeId)
                            .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .map(m => (
                              <div key={m.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                 <p className="text-xs font-black text-gray-800 uppercase leading-tight">{m.description}</p>
                                 <div className="flex justify-between items-center mt-2">
                                    <span className="text-[9px] font-bold text-gray-400 uppercase">{m.date} • {m.serviceType}</span>
                                    <span className="text-[10px] font-black text-gray-700">R{m.cost}</span>
                                 </div>
                              </div>
                            ))
                         )}
                      </div>
                   </div>
                   <button 
                    onClick={() => {
                      setNewLog({...newLog, bikeId: selectedBikeId});
                      setShowLogForm(true);
                    }}
                    className="w-full py-4 bg-amber-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-amber-100 hover:bg-amber-700 transition-all active:scale-95"
                   >
                     Initiate New Job Card
                   </button>
                </div>
             </div>
           ) : (
             <div className="bg-amber-50/50 rounded-[2.5rem] border border-dashed border-amber-200 p-10 text-center flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-20 h-20 bg-white rounded-[2rem] shadow-xl shadow-amber-900/5 flex items-center justify-center text-4xl mb-6">⚙️</div>
                <h4 className="text-sm font-black text-amber-900 uppercase tracking-widest">Asset Diagnostics</h4>
                <p className="text-xs text-amber-700/60 mt-2 max-w-[200px] font-medium leading-relaxed">Select a motorcycle from the queue or roadmap to view full service telemetry and log evidence.</p>
             </div>
           )}
        </div>
      </div>

      {/* Workshop Assignment Modal */}
      {assigningWorkshopBikeId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
           <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full p-8 md:p-10 animate-in zoom-in duration-200">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Assign Workshop</h3>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Select Service Partner</p>
                </div>
                <button onClick={() => setAssigningWorkshopBikeId(null)} className="text-3xl text-gray-300 hover:text-gray-600">&times;</button>
              </div>
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 no-scrollbar">
                 {workshops.filter(w => {
                    const bike = bikes.find(b => b.id === assigningWorkshopBikeId);
                    return bike ? w.city === bike.city : true;
                 }).map(w => (
                   <button 
                    key={w.id} 
                    onClick={() => handleAssignWorkshop(assigningWorkshopBikeId!, w.id)}
                    className="w-full flex items-center justify-between p-4 rounded-2xl border border-gray-100 hover:bg-amber-50 hover:border-amber-200 transition-all text-left group"
                   >
                     <div className="flex items-center space-x-4">
                       <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-lg">🛠️</div>
                       <div>
                         <span className="font-bold text-gray-800 block uppercase text-xs">{w.name}</span>
                         <span className="text-[9px] text-gray-400 uppercase font-bold tracking-widest">{(w.specialization || [])[0]}</span>
                       </div>
                     </div>
                     <span className="text-amber-500 font-black text-[10px]">★{(w.rating || 0).toFixed(1)}</span>
                   </button>
                 ))}
                 <button onClick={() => handleAssignWorkshop(assigningWorkshopBikeId!, 'none')} className="w-full p-4 rounded-2xl border border-dashed border-gray-200 text-gray-400 font-bold hover:bg-gray-50 uppercase text-[10px] tracking-widest mt-4">In-House / Other</button>
              </div>
           </div>
        </div>
      )}

      {/* Robust Workshop Registration Modal */}
      {showWorkshopForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
           <form onSubmit={handleWorkshopSubmit} className="bg-white rounded-[2.5rem] shadow-2xl max-w-xl w-full p-10 space-y-6 animate-in zoom-in duration-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight">
                    {editingWorkshopId ? 'Modify Partner Details' : 'Register Partner Workshop'}
                  </h3>
                  <p className="text-[10px] text-amber-600 font-black uppercase tracking-widest mt-1">
                    Complete all telemetry for technical assignment
                  </p>
                </div>
                <button type="button" onClick={closeWorkshopForm} className="text-gray-300 hover:text-gray-600 text-4xl leading-none">&times;</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                 <div className="md:col-span-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 mb-2 block">Workshop Identification</label>
                    <input 
                      required 
                      placeholder="e.g. Master Moto Works"
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none transition-all" 
                      value={workshopFormData.name} 
                      onChange={e => setWorkshopFormData({...workshopFormData, name: e.target.value})} 
                    />
                 </div>

                 <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 mb-2 block">Region / City</label>
                    <select 
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none transition-all appearance-none" 
                      value={workshopFormData.city} 
                      onChange={e => setWorkshopFormData({...workshopFormData, city: e.target.value as any})}
                    >
                       <option value="JHB">Johannesburg</option>
                       <option value="CTN">Cape Town</option>
                       <option value="EL">East London</option>
                    </select>
                 </div>

                 <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 mb-2 block">Direct Contact Number</label>
                    <input 
                      required 
                      placeholder="011 000 0000"
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none transition-all" 
                      value={workshopFormData.contact} 
                      onChange={e => setWorkshopFormData({...workshopFormData, contact: e.target.value})} 
                    />
                 </div>

                 <div className="md:col-span-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 mb-2 block">Geographic Location / Address</label>
                    <input 
                      required 
                      placeholder="Street address and suburb"
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none transition-all" 
                      value={workshopFormData.location} 
                      onChange={e => setWorkshopFormData({...workshopFormData, location: e.target.value})} 
                    />
                 </div>

                 <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 mb-2 block">Technical Rating (1.0 - 5.0)</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="5" 
                      step="0.1" 
                      required
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none transition-all" 
                      value={workshopFormData.rating} 
                      onChange={e => setWorkshopFormData({...workshopFormData, rating: Number(e.target.value)})} 
                    />
                 </div>

                 <div className="md:col-span-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 mb-2 block">Core Specializations (Comma Separated)</label>
                    <input 
                      placeholder="e.g. Hero, Honda, Engine Rebuilds, Tyres"
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none transition-all" 
                      value={workshopFormData.specialization.join(', ')} 
                      onChange={e => setWorkshopFormData({...workshopFormData, specialization: e.target.value.split(',').map(s => s.trim()).filter(s => s !== '')})} 
                    />
                    <p className="text-[8px] text-gray-400 font-bold uppercase mt-2 px-1">Example: Hero, Big Boy, Major Repairs, Electrical</p>
                 </div>
              </div>

              <button type="submit" className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-2xl hover:bg-black transition-all active:scale-95">
                {editingWorkshopId ? 'Authorize Changes' : 'Confirm Registration'}
              </button>
           </form>
        </div>
      )}

      {/* Modern Job Card Modal */}
      {showLogForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <form onSubmit={handleLogSubmit} className="bg-white rounded-[2.5rem] shadow-2xl max-w-xl w-full p-10 space-y-8 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Workshop Job Card</h3>
                <p className="text-[10px] text-amber-500 font-black uppercase tracking-widest mt-1">Mechanical Maintenance Logging</p>
              </div>
              <button type="button" onClick={() => setShowLogForm(false)} className="text-gray-300 hover:text-gray-600 text-4xl leading-none transition-colors">&times;</button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Select Asset</label>
                  <select 
                    required
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500 transition-all appearance-none"
                    value={newLog.bikeId}
                    onChange={e => {
                        const bike = (bikes || []).find(b => b.id === e.target.value);
                        const ws = (workshops || []).find(w => w.id === bike?.assignedWorkshopId);
                        setNewLog({...newLog, bikeId: e.target.value, performedBy: ws?.name || 'In-House Workshop'});
                    }}
                  >
                    <option value="">Choose Motorcycle...</option>
                    {(bikes || []).map(b => <option key={b.id} value={b.id}>{b.licenseNumber} - {b.makeModel}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Job Category</label>
                  <select 
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500 transition-all appearance-none"
                    value={newLog.serviceType}
                    onChange={e => setNewLog({...newLog, serviceType: e.target.value as any})}
                  >
                    <option value="routine">Routine Service</option>
                    <option value="repair">Major Repair</option>
                    <option value="tyres">Tyres & Wheels</option>
                    <option value="parts">Component Install</option>
                    <option value="oil">Oil & Lube</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Job Narrative</label>
                <textarea 
                  required
                  placeholder="Describe the fault and work performed..."
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500 h-24 resize-none transition-all"
                  value={newLog.description}
                  onChange={e => setNewLog({...newLog, description: e.target.value})}
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Cost (R)</label>
                  <input 
                    type="number"
                    required
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                    value={newLog.cost || ''}
                    onChange={e => setNewLog({...newLog, cost: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Performed By</label>
                  <select 
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500 transition-all appearance-none"
                    value={newLog.performedBy}
                    onChange={e => setNewLog({...newLog, performedBy: e.target.value})}
                  >
                    <option value="In-House Workshop">In-House Workshop</option>
                    {(workshops || []).map(w => (
                      <option key={w.id} value={w.name}>{w.name} ({w.city})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <input 
                  type="checkbox" 
                  id="markActive" 
                  checked={markOperational} 
                  onChange={e => setMarkOperational(e.target.checked)}
                  className="w-5 h-5 rounded accent-blue-600"
                />
                <label htmlFor="markActive" className="text-xs font-black text-blue-800 uppercase tracking-widest cursor-pointer">Mark asset as operational after logging</label>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Documentation (Evidence / Invoice)</label>
                <div className="relative">
                  <input 
                    type="file"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*,application/pdf"
                  />
                  {!newLog.attachmentUrl ? (
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-gray-200 rounded-2xl p-4 bg-gray-50 text-gray-400 hover:bg-amber-50 hover:border-amber-300 transition-all flex items-center justify-center space-x-2"
                    >
                      <span className="text-xl">📸</span>
                      <span className="text-[10px] font-black uppercase tracking-widest">Attach Doc / Photo</span>
                    </button>
                  ) : (
                    <div className="bg-green-50 border border-green-100 rounded-2xl p-4 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">✅</span>
                        <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">File Encoded</span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => {
                          setNewLog(prev => ({ ...prev, attachmentUrl: '' }));
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="text-gray-400 hover:text-red-500"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button type="submit" className="w-full bg-amber-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-amber-100 hover:bg-amber-700 transition-all active:scale-95">
              Authorize & Finalize Job Card
            </button>
          </form>
        </div>
      )}

      {viewingAttachment && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 md:p-10">
          <div className="max-w-4xl w-full bg-white rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in duration-300">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Mechanical Evidence Viewer</h3>
              <button 
                onClick={() => setViewingAttachment(null)}
                className="text-gray-400 hover:text-gray-900 text-4xl leading-none transition-colors"
              >
                &times;
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-gray-200/50 flex items-center justify-center p-8 min-h-[50vh]">
              {viewingAttachment.startsWith('data:image') ? (
                <img src={viewingAttachment} alt="Workshop Evidence" className="max-w-full h-auto shadow-xl rounded-xl" />
              ) : (
                <div className="text-center space-y-4">
                  <div className="text-6xl">📄</div>
                  <p className="text-gray-600 font-bold">Document Attachment (PDF or Other)</p>
                  <a href={viewingAttachment} download="maintenance-doc" className="inline-block bg-blue-600 text-white px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-blue-100">Download File</a>
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

export default MechanicPortal;
