
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

  const getSpecIcon = (spec: string) => {
    const s = spec.toLowerCase();
    if (s.includes('engine')) return '⚙️';
    if (s.includes('tyre') || s.includes('tire')) return '🛞';
    if (s.includes('elect') || s.includes('wire')) return '⚡';
    if (s.includes('brake')) return '🛑';
    if (s.includes('oil') || s.includes('lube')) return '🛢️';
    if (s.includes('body') || s.includes('paint')) return '🎨';
    if (s.includes('general')) return '🛠️';
    if (s.includes('honda')) return '🇯🇵';
    if (s.includes('hero')) return '🇮🇳';
    if (s.includes('big boy')) return '🏁';
    return '🔧';
  };

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

  const filteredWorkshops = useMemo(() => {
    let result = (workshops || []).filter(w => {
      const matchesSearch = (w.name || '').toLowerCase().includes(workshopSearch.toLowerCase()) || 
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

  const handleWorkshopSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const specsInput = form.elements.namedItem('specializations') as HTMLInputElement;
    const specs = (specsInput?.value || '')
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    const data = { ...workshopFormData, specialization: specs };
    
    if (editingWorkshopId) {
      onUpdateWorkshop(editingWorkshopId, data);
    } else {
      onAddWorkshop(data);
    }
    closeWorkshopForm();
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

  const openEditWorkshop = (workshop: Workshop) => {
    setEditingWorkshopId(workshop.id);
    setWorkshopFormData({
      name: workshop.name,
      city: workshop.city,
      location: workshop.location,
      contact: workshop.contact,
      specialization: workshop.specialization,
      rating: workshop.rating
    });
    setShowWorkshopForm(true);
  };

  const handleAssignWorkshop = (bikeId: string, workshopId: string) => {
    setBikes(prev => prev.map(b => b.id === bikeId ? { ...b, status: 'maintenance', assignedWorkshopId: workshopId === 'none' ? undefined : workshopId } : b));
    setAssigningWorkshopBikeId(null);
  };

  const formatForWhatsApp = (phone: string) => {
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '27' + cleaned.substring(1);
    }
    return cleaned;
  };

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
              <div className="p-6 border-b border-gray-100 bg-gray-50/30 flex justify-between items-center">
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Active Workshop Queue</h3>
                <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-full uppercase">Technical Grid</span>
              </div>
              <div className="divide-y divide-gray-50">
                {workshopBikes.length === 0 ? (
                  <div className="py-24 text-center">
                    <p className="text-gray-300 font-black uppercase tracking-widest text-[10px]">Registry Empty — All Assets Operational</p>
                  </div>
                ) : (
                  workshopBikes.map(bike => {
                    const workshop = workshops.find(w => w.id === bike.assignedWorkshopId);
                    return (
                      <div key={bike.id} className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-gray-50/50 transition-all group/row">
                        <div className="flex items-center space-x-6 min-w-0">
                          <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-2xl shadow-inner border border-amber-100 transition-transform group-hover/row:scale-110">🏍️</div>
                          <div className="min-w-0">
                            <h4 className="font-black text-gray-900 text-lg uppercase leading-none truncate">{bike.licenseNumber}</h4>
                            <p className="text-[10px] text-gray-400 font-bold uppercase mt-1.5">{bike.makeModel}</p>
                          </div>
                        </div>

                        {workshop ? (
                          <div className="flex-1 flex flex-col md:flex-row items-center md:justify-end gap-6 animate-in fade-in slide-in-from-right-4">
                            <div className="text-center md:text-right border-l-0 md:border-l border-gray-100 md:pl-6">
                              <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1 flex items-center justify-center md:justify-end">
                                <span className="mr-1">🏪</span> Assigned Partner
                              </p>
                              <h5 className="text-sm font-black text-gray-800 uppercase truncate leading-tight mb-1">{workshop.name}</h5>
                              <div className="flex flex-col items-center md:items-end">
                                <span className="text-[10px] text-gray-400 font-bold uppercase truncate">{workshop.contact}</span>
                                <span className="text-[9px] text-gray-300 font-black uppercase mt-0.5 truncate">{workshop.location}</span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button 
                                onClick={() => window.open(`tel:${workshop.contact}`)}
                                className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-90"
                                title="Call Workshop"
                              >
                                📞
                              </button>
                              <button 
                                onClick={() => window.open(`https://wa.me/${formatForWhatsApp(workshop.contact)}`, '_blank')}
                                className="w-11 h-11 rounded-xl bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-600 hover:text-white transition-all shadow-sm active:scale-90"
                                title="WhatsApp Workshop"
                              >
                                💬
                              </button>
                              <button 
                                onClick={() => setAssigningWorkshopBikeId(bike.id)}
                                className="text-[8px] font-black text-gray-400 uppercase hover:text-amber-600 transition-colors px-3 py-2 bg-gray-50 rounded-lg hover:bg-white border border-transparent hover:border-amber-100"
                              >
                                Re-Assign
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1 flex justify-center md:justify-end">
                            <button 
                              onClick={() => setAssigningWorkshopBikeId(bike.id)}
                              className="bg-amber-600 text-white px-8 py-3.5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-amber-100 hover:bg-amber-700 active:scale-95 transition-all flex items-center space-x-2"
                            >
                              <span>🚚</span>
                              <span>Dispatch to Partner</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {activeTab === 'roadmap' && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
               <div className="p-6 border-b border-gray-100 bg-gray-50/30">
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Preventative Service Roadmap</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {roadmapBikes.map(bike => {
                   const status = getServiceStatus(bike.id);
                   const isInMaintenance = bike.status === 'maintenance';
                   
                   return (
                     <div key={bike.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between hover:bg-gray-50/50 gap-4">
                        <div className="flex items-center space-x-6">
                           <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                             status.status === 'overdue' ? 'bg-red-50 text-red-600' : 
                             status.status === 'due' ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'
                           }`}>
                             {status.status === 'overdue' ? '🛑' : status.status === 'due' ? '⚠️' : '✅'}
                           </div>
                           <div className="min-w-0">
                              <h4 className="font-black text-gray-800 text-sm uppercase truncate">{bike.licenseNumber}</h4>
                              <p className="text-[9px] text-gray-400 font-bold uppercase">Last Service: {status.lastDate}</p>
                           </div>
                        </div>
                        
                        <div className="flex items-center justify-between md:justify-end gap-8 flex-1">
                          <div className="text-right">
                             <p className={`text-xl font-black ${
                               status.status === 'overdue' ? 'text-red-600' : 
                               status.status === 'due' ? 'text-amber-600' : 'text-green-600'
                             }`}>{status.days} Days</p>
                             <p className="text-[9px] font-black uppercase text-gray-400">Since Hub Visit</p>
                          </div>
                          
                          <div className="shrink-0">
                            {isInMaintenance ? (
                              <div className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse"></span>
                                Work in Progress
                              </div>
                            ) : (
                              <button 
                                onClick={() => setAssigningWorkshopBikeId(bike.id)}
                                className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg transition-all active:scale-95 ${
                                  status.status === 'overdue' ? 'bg-red-600 text-white shadow-red-100' : 'bg-gray-900 text-white shadow-gray-200'
                                }`}
                              >
                                Dispatch to Workshop
                              </button>
                            )}
                          </div>
                        </div>
                     </div>
                   );
                })}
              </div>
            </div>
          )}

          {activeTab === 'warranties' && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
               <div className="p-6 border-b border-gray-100 bg-gray-50/30">
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Active Component Warranties</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {activeWarranties.length === 0 ? (
                  <div className="py-24 text-center">
                    <p className="text-gray-300 font-black uppercase tracking-widest text-[10px]">No active technical warranties recorded</p>
                  </div>
                ) : (
                  activeWarranties.map(w => {
                    const bike = bikes.find(b => b.id === w.bikeId);
                    return (
                      <div key={w.id} className="p-6 flex items-center justify-between">
                         <div className="flex items-center space-x-6">
                           <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl">🛡️</div>
                           <div>
                              <h4 className="font-black text-gray-800 text-sm uppercase">{w.description}</h4>
                              <p className="text-[9px] text-gray-400 font-bold uppercase">Linked to: {bike?.licenseNumber}</p>
                           </div>
                         </div>
                         <div className="text-right">
                            <p className="text-xl font-black text-blue-600">{w.remainingDays} Days</p>
                            <p className="text-[9px] font-black uppercase text-gray-400">Protection Left</p>
                         </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {activeTab === 'workshops' && (
            <div className="space-y-6">
               <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                       <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30">🔍</span>
                       <input 
                        type="text" 
                        placeholder="Search partners by name or specialty..."
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-amber-500/10 text-xs font-bold"
                        value={workshopSearch}
                        onChange={(e) => setWorkshopSearch(e.target.value)}
                       />
                    </div>
                    <div className="flex gap-2">
                       <select 
                        className="bg-gray-50 border border-gray-100 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none"
                        value={cityFilter}
                        onChange={(e) => setCityFilter(e.target.value as any)}
                       >
                         <option value="all">All Regions</option>
                         <option value="JHB">Johannesburg</option>
                         <option value="CTN">Cape Town</option>
                         <option value="EL">East London</option>
                       </select>
                       <select 
                        className="bg-gray-50 border border-gray-100 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                       >
                         <option value="rating">Sort: Top Rated</option>
                         <option value="name">Sort: A-Z Name</option>
                       </select>
                       <button 
                        onClick={() => setShowWorkshopForm(true)}
                        className="bg-amber-600 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-100 hover:bg-amber-700 transition-all active:scale-95"
                       >
                         + New Partner
                       </button>
                    </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-500">
                  {filteredWorkshops.map(workshop => {
                    const primarySpec = workshop.specialization && workshop.specialization.length > 0 ? workshop.specialization[0] : null;
                    const otherSpecs = workshop.specialization && workshop.specialization.length > 1 ? workshop.specialization.slice(1) : [];
                    
                    return (
                      <div key={workshop.id} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm group hover:shadow-xl transition-all relative overflow-hidden flex flex-col">
                         <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center space-x-4">
                               <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-3xl group-hover:bg-amber-500 group-hover:text-white transition-all duration-500 relative">
                                 🏪
                                 {primarySpec && <span className="absolute -right-1 -bottom-1 bg-white text-[10px] w-6 h-6 rounded-lg flex items-center justify-center shadow-sm text-gray-800 border border-gray-100">{getSpecIcon(primarySpec)}</span>}
                               </div>
                               <div>
                                  <h4 className="font-black text-gray-800 text-lg uppercase leading-tight tracking-tight">{workshop.name}</h4>
                                  <div className="flex items-center mt-1 space-x-2">
                                    <span className="text-[10px] font-black text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full uppercase">{workshop.city}</span>
                                    <div className="flex text-[10px]">
                                      {[...Array(5)].map((_, i) => (
                                        <span key={i} className={i < (workshop.rating || 0) ? 'text-amber-400' : 'text-gray-200'}>★</span>
                                      ))}
                                    </div>
                                  </div>
                               </div>
                            </div>
                            <div className="flex items-center space-x-1">
                               <button onClick={() => openEditWorkshop(workshop)} className="p-2 text-gray-300 hover:text-blue-500 transition-colors" title="Edit Partner">✏️</button>
                               <button onClick={() => onDeleteWorkshop(workshop.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors" title="Delete Partner">🗑️</button>
                            </div>
                         </div>

                         {primarySpec && (
                           <div className="mb-4 bg-amber-600/5 p-4 rounded-2xl border border-amber-600/10">
                              <p className="text-[8px] font-black text-amber-600 uppercase tracking-widest mb-1">Main Focus</p>
                              <div className="flex items-center space-x-2">
                                 <span className="text-xl">{getSpecIcon(primarySpec)}</span>
                                 <span className="text-sm font-black text-gray-800 uppercase tracking-tight">{primarySpec}</span>
                              </div>
                           </div>
                         )}

                         <div className="space-y-4 mb-6 flex-grow">
                            <div className="p-3 bg-gray-50 rounded-xl flex items-center space-x-3">
                               <span className="text-gray-400">📍</span>
                               <span className="text-[11px] font-bold text-gray-600 uppercase truncate">{workshop.location}</span>
                            </div>
                            {otherSpecs.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                 {otherSpecs.map((spec, i) => (
                                   <span key={i} className="px-2.5 py-1 bg-white text-gray-400 rounded-lg text-[9px] font-black uppercase border border-gray-100 flex items-center space-x-1.5 transition-colors hover:bg-gray-50 hover:text-gray-600">
                                     <span>{getSpecIcon(spec)}</span>
                                     <span>{spec}</span>
                                   </span>
                                 ))}
                              </div>
                            )}
                         </div>

                         <div className="flex gap-2">
                            <button 
                              onClick={() => window.open(`tel:${workshop.contact}`)}
                              className="flex-1 bg-gray-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95"
                            >
                              Call Office
                            </button>
                            <button 
                              onClick={() => window.open(`https://wa.me/${formatForWhatsApp(workshop.contact)}`, '_blank')}
                              className="flex-1 bg-green-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-green-700 transition-all shadow-lg active:scale-95"
                            >
                              WhatsApp
                            </button>
                         </div>
                      </div>
                    );
                  })}
               </div>
            </div>
          )}
        </div>

        <div className="space-y-8">
           <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm relative overflow-hidden group">
              <div className="absolute -right-6 -bottom-6 text-7xl opacity-[0.03] group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500">🔧</div>
              <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-6">Technical Queue Summary</h4>
              <div className="space-y-6">
                 <div className="flex items-center justify-between">
                    <div>
                      <p className="text-3xl font-black text-gray-800">{workshopBikes.length}</p>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Active Repairs</p>
                    </div>
                    <div className="w-14 h-2 bg-gray-100 rounded-full overflow-hidden">
                       <div className="bg-amber-500 h-full w-[40%]"></div>
                    </div>
                 </div>
                 <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                    <div>
                      <p className="text-3xl font-black text-gray-800">R{maintenance.reduce((acc, m) => acc + (m.cost || 0), 0).toLocaleString()}</p>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Lifecycle Investment</p>
                    </div>
                    <span className="text-2xl">💰</span>
                 </div>
              </div>
           </div>

           <div className="bg-gray-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
              <div className="relative z-10">
                <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-6">Partner Ranking</h4>
                <div className="space-y-4">
                   {workshops.sort((a,b) => b.rating - a.rating).slice(0, 3).map(w => (
                     <div key={w.id} className="flex items-center justify-between group/ws">
                        <div className="flex items-center space-x-4">
                           <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center group-hover/ws:bg-amber-500 transition-colors">
                             {w.specialization && w.specialization.length > 0 ? getSpecIcon(w.specialization[0]) : '🏪'}
                           </div>
                           <div>
                              <p className="text-xs font-black uppercase tracking-tight">{w.name}</p>
                              <p className="text-[9px] text-gray-500 font-bold uppercase">{w.city}</p>
                           </div>
                        </div>
                        <span className="text-[10px] font-black text-amber-500">★{w.rating}</span>
                     </div>
                   ))}
                </div>
                <button 
                  onClick={() => setActiveTab('workshops')}
                  className="w-full mt-8 py-4 bg-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-white/20 transition-all border border-white/5"
                >
                  View Full Directory
                </button>
              </div>
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
           </div>
        </div>
      </div>

      {showLogForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xl z-[120] flex items-center justify-center p-4">
           <form onSubmit={handleLogSubmit} className="bg-white rounded-[2.5rem] shadow-2xl max-w-2xl w-full p-10 space-y-8 animate-in zoom-in duration-200">
              <div className="flex justify-between items-center border-b border-gray-50 pb-6">
                <div>
                  <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Open System Job Card</h3>
                  <p className="text-[10px] text-amber-600 font-black uppercase tracking-widest mt-1">Technical Event Authorization</p>
                </div>
                <button type="button" onClick={() => setShowLogForm(false)} className="text-gray-400 hover:text-gray-600 text-4xl leading-none">&times;</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Target Asset</label>
                    <select 
                      required 
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500 transition-all appearance-none shadow-sm"
                      value={newLog.bikeId}
                      onChange={e => setNewLog({...newLog, bikeId: e.target.value})}
                    >
                       <option value="">Select Motorcycle...</option>
                       {bikes.map(b => <option key={b.id} value={b.id}>{b.licenseNumber} - {b.makeModel}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Service Entity</label>
                    <select 
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500 transition-all appearance-none shadow-sm"
                      value={newLog.performedBy}
                      onChange={e => setNewLog({...newLog, performedBy: e.target.value})}
                    >
                       <option value="In-House Workshop">In-House Workshop</option>
                       {workshops.map(w => <option key={w.id} value={w.name}>{w.name}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Expense Amount (R)</label>
                    <input 
                      type="number" 
                      required 
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500 transition-all shadow-sm"
                      placeholder="0.00"
                      value={newLog.cost || ''}
                      onChange={e => setNewLog({...newLog, cost: Number(e.target.value)})}
                    />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Classification</label>
                    <select 
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500 transition-all appearance-none shadow-sm"
                      value={newLog.serviceType}
                      onChange={e => setNewLog({...newLog, serviceType: e.target.value as any})}
                    >
                       <option value="routine">Routine Service</option>
                       <option value="repair">Major Mechanical</option>
                       <option value="tyres">Tyres & Wheelset</option>
                       <option value="oil">Oil & Lube</option>
                       <option value="parts">Component Install</option>
                       <option value="other">Other Overhead</option>
                    </select>
                 </div>
                 <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Job Description</label>
                    <input 
                      type="text" 
                      required 
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500 transition-all shadow-sm"
                      placeholder="e.g. Full service including chain tensioning and brake pads"
                      value={newLog.description}
                      onChange={e => setNewLog({...newLog, description: e.target.value})}
                    />
                 </div>
              </div>

              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center justify-between">
                 <div className="flex items-center space-x-3">
                    <input 
                      type="checkbox" 
                      id="mark-op" 
                      className="w-5 h-5 rounded accent-amber-600"
                      checked={markOperational}
                      onChange={e => setMarkOperational(e.target.checked)}
                    />
                    <label htmlFor="mark-op" className="text-[10px] font-black text-amber-800 uppercase tracking-widest cursor-pointer">Mark Asset as Fully Operational on Save</label>
                 </div>
                 <span className="text-lg">🏎️</span>
              </div>

              <div className="flex gap-4">
                 <button type="button" onClick={() => setShowLogForm(false)} className="flex-1 py-5 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase text-[10px] tracking-widest">Abort</button>
                 <button type="submit" className="flex-[2] bg-amber-600 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-amber-100 hover:bg-amber-700 active:scale-95 transition-all">Authorize Job Completion</button>
              </div>
           </form>
        </div>
      )}

      {showWorkshopForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xl z-[130] flex items-center justify-center p-4">
           <form onSubmit={handleWorkshopSubmit} className="bg-white rounded-[2.5rem] shadow-2xl max-w-xl w-full p-10 space-y-8 animate-in zoom-in duration-200">
              <div className="flex justify-between items-center border-b border-gray-50 pb-6">
                 <div>
                   <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight">{editingWorkshopId ? 'Modify Partner Details' : 'Register Service Partner'}</h3>
                   <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Authorized Workshop Registry</p>
                 </div>
                 <button type="button" onClick={closeWorkshopForm} className="text-gray-400 hover:text-gray-600 text-4xl leading-none">&times;</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Workshop Entity Name</label>
                    <input 
                      type="text" 
                      required 
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500 transition-all shadow-sm"
                      placeholder="e.g. Master Moto JHB"
                      value={workshopFormData.name}
                      onChange={e => setWorkshopFormData({...workshopFormData, name: e.target.value})}
                    />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Operational City</label>
                    <select 
                      required 
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500 transition-all appearance-none shadow-sm"
                      value={workshopFormData.city}
                      onChange={e => setWorkshopFormData({...workshopFormData, city: e.target.value as any})}
                    >
                       <option value="JHB">Johannesburg</option>
                       <option value="CTN">Cape Town</option>
                       <option value="EL">East London</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Contact Terminal</label>
                    <input 
                      type="tel" 
                      required 
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500 transition-all shadow-sm"
                      placeholder="011 440 1234"
                      value={workshopFormData.contact}
                      onChange={e => setWorkshopFormData({...workshopFormData, contact: e.target.value})}
                    />
                 </div>
                 <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Specializations (Comma separated)</label>
                    <input 
                      type="text" 
                      name="specializations"
                      defaultValue={(workshopFormData.specialization || []).join(', ')}
                      placeholder="e.g. Engines, Tyres, Electronics"
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500 transition-all shadow-sm"
                    />
                 </div>
                 <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Full Physical Coordinates</label>
                    <input 
                      type="text" 
                      required 
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500 transition-all shadow-sm"
                      placeholder="e.g. 42 Main Road, Wynberg"
                      value={workshopFormData.location}
                      onChange={e => setWorkshopFormData({...workshopFormData, location: e.target.value})}
                    />
                 </div>
              </div>

              <div className="flex gap-4">
                 <button type="button" onClick={closeWorkshopForm} className="flex-1 py-5 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase text-[10px] tracking-widest">Abort</button>
                 <button type="submit" className="flex-[2] bg-amber-600 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-amber-100 hover:bg-amber-700 active:scale-95 transition-all">Commit to Registry</button>
              </div>
           </form>
        </div>
      )}

      {assigningWorkshopBikeId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
           <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full p-8 md:p-10 animate-in zoom-in duration-200">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Partner Selection</h3>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Dispatching {bikes.find(b => b.id === assigningWorkshopBikeId)?.licenseNumber}</p>
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
                    className="w-full flex items-center justify-between p-5 rounded-2xl border border-gray-100 hover:bg-amber-50 hover:border-amber-200 transition-all text-left group"
                   >
                     <div className="flex items-center space-x-4">
                       <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-xl group-hover:bg-amber-500 group-hover:text-white transition-colors">
                         {w.specialization && w.specialization.length > 0 ? getSpecIcon(w.specialization[0]) : '🏪'}
                       </div>
                       <div>
                         <span className="font-black text-gray-800 block uppercase text-xs">{w.name}</span>
                         <span className="text-[9px] text-gray-400 uppercase font-black tracking-widest">{w.location}</span>
                       </div>
                     </div>
                     <span className="text-amber-500 font-black text-[10px]">★{w.rating}</span>
                   </button>
                 ))}
                 <button onClick={() => handleAssignWorkshop(assigningWorkshopBikeId!, 'none')} className="w-full p-5 rounded-2xl border border-dashed border-gray-200 text-gray-400 font-black hover:bg-gray-50 uppercase text-[10px] tracking-widest mt-4">In-House Workshop / Pending</button>
              </div>
           </div>
        </div>
      )}

      {viewingAttachment && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[150] flex items-center justify-center p-4 md:p-10">
          <div className="max-w-4xl w-full bg-white rounded-[3rem] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in duration-300">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-[11px] font-black text-gray-800 uppercase tracking-widest">Registry Document Copy</h3>
              <button onClick={() => setViewingAttachment(null)} className="text-gray-400 hover:text-gray-900 text-5xl leading-none transition-colors">&times;</button>
            </div>
            <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center p-10 min-h-[60vh]">
              {viewingAttachment.startsWith('data:image') ? (
                <img src={viewingAttachment} alt="Notice Copy" className="max-w-full h-auto shadow-2xl rounded-2xl border border-white" />
              ) : (
                <div className="text-center space-y-6">
                  <div className="text-8xl">📄</div>
                  <p className="text-gray-800 font-black uppercase text-sm tracking-widest">Digital Service Copy</p>
                  <a href={viewingAttachment} download="service-document" className="inline-block bg-blue-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-xl">Download Local Copy</a>
                </div>
              )}
            </div>
            <div className="p-8 text-center bg-white border-t border-gray-100">
              <button onClick={() => setViewingAttachment(null)} className="bg-gray-900 text-white px-12 py-4 rounded-2xl font-black uppercase text-xs tracking-widest">Exit Secure View</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MechanicPortal;
