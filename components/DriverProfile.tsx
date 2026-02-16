
import React, { useMemo, useRef, useState } from 'react';
import { Driver, Payment, Bike, MaintenanceRecord, Workshop, TrafficFine, AccidentReport } from '../types';
import { 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  ComposedChart,
  Line,
  Area
} from 'recharts';

interface DriverProfileProps {
  driver: Driver;
  onUpdateDriver: (updatedDriver: Driver) => void;
  payments: Payment[];
  fines: TrafficFine[];
  accidents: AccidentReport[];
  onAddFine: (fine: Omit<TrafficFine, 'id'>) => void;
  onAddAccident: (report: Omit<AccidentReport, 'id'>) => void;
  bike?: Bike;
  maintenance: MaintenanceRecord[];
  onAddMaintenance: (record: Omit<MaintenanceRecord, 'id'>) => void;
  workshops: Workshop[];
  weeklyTarget: number;
  isAdminViewing?: boolean;
  allDrivers?: Driver[]; 
  onAdminSwitchDriver?: (driver: Driver) => void; 
}

const DriverProfile: React.FC<DriverProfileProps> = ({ 
  driver, 
  onUpdateDriver, 
  payments = [], 
  fines = [],
  accidents = [],
  onAddFine,
  onAddAccident,
  bike, 
  maintenance = [], 
  onAddMaintenance,
  workshops = [],
  weeklyTarget,
  isAdminViewing = false,
  allDrivers = [],
  onAdminSwitchDriver
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logFileInputRef = useRef<HTMLInputElement>(null);
  const accidentFileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'payments' | 'vehicle' | 'safety'>('overview');
  const [showLogForm, setShowLogForm] = useState(false);
  const [showFineForm, setShowFineForm] = useState(false);
  const [showAccidentForm, setShowAccidentForm] = useState(false);
  const [viewingAttachment, setViewingAttachment] = useState<string | null>(null);

  const [newLog, setNewLog] = useState<Omit<MaintenanceRecord, 'id'>>({
    bikeId: bike?.id || '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    cost: 0,
    serviceType: 'fuel',
    performedBy: 'Self / Driver',
    attachmentUrl: ''
  });

  const [fineFormData, setFineFormData] = useState<Omit<TrafficFine, 'id'>>({
    bikeId: bike?.id || '',
    driverId: driver.id,
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    noticeNumber: '',
    description: '',
    status: 'unpaid'
  });

  const [accidentFormData, setAccidentFormData] = useState<Omit<AccidentReport, 'id'>>({
    bikeId: bike?.id || '',
    driverId: driver.id,
    date: new Date().toISOString().split('T')[0],
    location: '',
    description: '',
    status: 'reported',
    thirdPartyDetails: '',
    attachmentUrl: ''
  });

  const stats = useMemo(() => {
    const CURRENT_WEEK = 4;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const driverPayments = (payments || []).filter(p => p?.driverId === driver.id);
    const targetThisWeek = driver.weeklyTarget || weeklyTarget;
    
    const monthlyPayments = driverPayments.filter(p => {
        const d = new Date(p.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const paidThisWeek = driverPayments.filter(p => p.weekNumber === CURRENT_WEEK).reduce((acc, p) => acc + (p?.amount || 0), 0);
    const weeklyStanding = paidThisWeek - targetThisWeek;
    
    const driverFines = (fines || []).filter(f => f?.driverId === driver.id);
    const unpaidFines = driverFines.filter(f => f?.status === 'unpaid').reduce((acc, f) => acc + (f?.amount || 0), 0);
    const driverAccidents = (accidents || []).filter(a => a.driverId === driver.id);

    // Week by week breakdown for current month
    const weeklyBreakdown = [1, 2, 3, 4].map(w => {
        const paid = driverPayments.filter(p => p.weekNumber === w).reduce((acc, p) => acc + (p?.amount || 0), 0);
        return { 
          name: `Week ${w}`, 
          paid, 
          target: targetThisWeek, 
          balance: paid - targetThisWeek,
          performance: Math.round((paid / targetThisWeek) * 100)
        };
    });

    const weeksMet = weeklyBreakdown.filter(w => w.paid >= w.target).length;
    const consistencyScore = Math.round((weeksMet / 4) * 100);

    // Leaderboard Calculation
    const leaderboard = (allDrivers.length > 0 ? allDrivers : [driver])
      .filter(d => !d.isArchived)
      .map(d => {
        const dPayments = payments.filter(p => {
          const dt = new Date(p.date);
          return p.driverId === d.id && dt.getMonth() === currentMonth && dt.getFullYear() === currentYear;
        });
        const dTarget = (d.weeklyTarget || weeklyTarget) * 4;
        const dPaid = dPayments.reduce((sum, p) => sum + p.amount, 0);
        const dPerf = Math.round((dPaid / dTarget) * 100);
        return { 
          id: d.id, 
          name: d.name, 
          performance: dPerf,
          pic: d.profilePictureUrl,
          initials: d.name.substring(0,2).toUpperCase()
        };
      })
      .sort((a, b) => b.performance - a.performance);

    const myRank = leaderboard.findIndex(l => l.id === driver.id) + 1;

    return { 
      paidThisWeek, 
      targetThisWeek, 
      weeklyStanding, 
      totalUnpaidFines: unpaidFines, 
      accidentsCount: driverAccidents.length, 
      currentWeek: CURRENT_WEEK, 
      driverFines, 
      driverAccidents, 
      weeklyBreakdown, 
      monthlyTotal: monthlyPayments.reduce((a,b) => a + b.amount, 0),
      consistencyScore,
      leaderboard,
      myRank
    };
  }, [payments, fines, accidents, driver.id, driver.weeklyTarget, weeklyTarget, allDrivers]);

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => onUpdateDriver({ ...driver, profilePictureUrl: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleAccidentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAccidentFormData(prev => ({ ...prev, attachmentUrl: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const handleLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bike) return;
    onAddMaintenance({ ...newLog, bikeId: bike.id });
    setShowLogForm(false);
  };

  const handleFineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddFine(fineFormData);
    setShowFineForm(false);
  };

  const handleAccidentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddAccident(accidentFormData);
    setShowAccidentForm(false);
  };

  const requestSupport = () => {
    const message = `Emergency Support Required: Driver ${driver.name}, Vehicle ${bike?.licenseNumber}. Assistance needed.`;
    window.open(`https://wa.me/27682170330?text=${encodeURIComponent(message)}`, '_blank');
  };

  const getDiskExpiryStatus = () => {
    if (!bike?.licenseDiskExpiry) return 'none';
    const exp = new Date(bike.licenseDiskExpiry);
    const diff = (exp.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
    if (diff < 0) return 'expired';
    if (diff < 30) return 'warning';
    return 'valid';
  };

  return (
    <div className="w-full space-y-6 pb-24 md:pb-8">
      {/* Admin Spectator Bar */}
      {isAdminViewing && (
        <div className="bg-gray-900 text-white p-4 md:p-6 rounded-[2rem] mb-6 flex flex-col md:flex-row items-center justify-between shadow-2xl animate-in slide-in-from-top-4 border-2 border-blue-500/30 gap-4">
           <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg animate-pulse">👁️</div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">Spectator Mode Active</p>
                <p className="text-xs font-bold opacity-80 uppercase">You are viewing <span className="text-white font-black">{driver.name}</span>'s Hub</p>
              </div>
           </div>
           
           <div className="flex items-center gap-3 w-full md:w-auto">
             <div className="flex-1 md:flex-none relative">
                <select 
                  onChange={(e) => {
                    const selected = allDrivers.find(d => d.id === e.target.value);
                    if (selected && onAdminSwitchDriver) onAdminSwitchDriver(selected);
                  }}
                  value={driver.id}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-10"
                >
                  {allDrivers.map(d => (
                    <option key={d.id} value={d.id} className="text-gray-900">{d.name} {d.id === driver.id ? '(Viewing)' : ''}</option>
                  ))}
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">▼</span>
             </div>
             <button onClick={() => setShowFineForm(true)} className="bg-red-600 hover:bg-red-700 px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg">+ Log Fine</button>
           </div>
        </div>
      )}

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-[3rem] shadow-2xl p-8 md:p-12 text-white bg-gradient-to-br from-emerald-900 via-emerald-800 to-green-600">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="flex items-center space-x-8">
             <div className="relative group">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-[2.8rem] bg-white/10 backdrop-blur-2xl border-4 border-white/20 overflow-hidden flex items-center justify-center font-black text-4xl shadow-2xl">
                    {driver.profilePictureUrl ? (
                        <img src={driver.profilePictureUrl} className="w-full h-full object-cover" alt="Profile" />
                    ) : (
                        (driver.name || '??').substring(0, 2).toUpperCase()
                    )}
                </div>
                {!isAdminViewing && (
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 w-10 h-10 bg-white text-emerald-700 rounded-2xl shadow-xl flex items-center justify-center hover:bg-emerald-50 transition-transform active:scale-90 border-2 border-white"
                  >
                    📸
                  </button>
                )}
                <input type="file" ref={fileInputRef} onChange={handleProfilePhotoChange} accept="image/*" className="hidden" />
             </div>
             <div>
                <div className="inline-flex items-center bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-white/20 mb-3">
                    <span className={`w-2 h-2 rounded-full mr-2 ${stats.weeklyStanding >= 0 ? 'bg-green-400' : 'bg-orange-400 animate-pulse'}`}></span>
                    {stats.weeklyStanding >= 0 ? 'Active & Settled' : 'Action Required'}
                </div>
                <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight uppercase">Hello, {driver.name.split(' ')[0]}</h2>
                <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.3em] mt-1">{bike?.licenseNumber || 'Asset Unassigned'} • Global Logistics ID: {driver.idNumber.split('/')[0]}</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="bg-white/10 backdrop-blur-md border border-white/10 px-6 py-4 rounded-[1.8rem] flex items-center gap-4">
               <div className="text-right">
                  <p className="text-[8px] font-black uppercase text-white/50">Reliability Index</p>
                  <p className="text-xl font-black">{stats.consistencyScore}%</p>
               </div>
               <div className={`w-3 h-3 rounded-full ${stats.consistencyScore >= 100 ? 'bg-green-400' : stats.consistencyScore >= 75 ? 'bg-amber-400' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse'}`}></div>
            </div>
            <button onClick={requestSupport} className="bg-white text-emerald-900 px-10 py-4 rounded-[1.8rem] font-black uppercase text-[10px] tracking-widest shadow-2xl hover:scale-105 transition-all flex items-center justify-center">
                🆘 Support
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Tab Navigation */}
      <div className="flex bg-white/80 backdrop-blur-xl p-1.5 rounded-[2.5rem] border border-gray-100 shadow-xl w-full md:w-fit mx-auto sticky top-4 z-40">
        {[
            { id: 'overview', icon: '🏠', label: 'Home' },
            { id: 'payments', icon: '💰', label: 'Wallet' },
            { id: 'vehicle', icon: '🏍️', label: 'Vehicle' },
            { id: 'safety', icon: '🛡️', label: 'Safety' },
        ].map(tab => (
            <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)} 
                className={`px-6 md:px-10 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                    activeTab === tab.id ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 scale-105' : 'text-gray-400 hover:text-emerald-600'
                }`}
            >
                <span className="text-lg">{tab.icon}</span>
                <span className="hidden md:inline">{tab.label}</span>
            </button>
        ))}
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        {activeTab === 'overview' && (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100 relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 text-7xl opacity-5 group-hover:scale-110 transition-transform">💰</div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Wallet Balance</p>
                        <h3 className={`text-4xl font-black ${stats.weeklyStanding >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            {stats.weeklyStanding >= 0 ? `+R${stats.weeklyStanding}` : `R${stats.weeklyStanding}`}
                        </h3>
                        <div className="mt-6 w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                            <div className={`h-full transition-all duration-1000 ${stats.weeklyStanding >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${Math.min(100, (stats.paidThisWeek / stats.targetThisWeek) * 100)}%` }}></div>
                        </div>
                        <p className="text-[8px] text-gray-400 font-bold uppercase mt-3 tracking-widest">W{stats.currentWeek} Target: R{stats.targetThisWeek}</p>
                    </div>

                    <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100 relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 text-7xl opacity-5 group-hover:scale-110 transition-transform">🛠️</div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Maintenance Index</p>
                        <h3 className="text-4xl font-black text-gray-800">Health: Good</h3>
                        <p className="text-[9px] text-gray-400 font-black uppercase mt-3 tracking-widest">Disk Status: {getDiskExpiryStatus().toUpperCase()}</p>
                        <button onClick={() => setActiveTab('vehicle')} className="mt-4 text-[9px] font-black text-emerald-600 uppercase hover:underline">Full Asset Report →</button>
                    </div>

                    <div className="bg-gray-900 p-8 rounded-[3rem] shadow-2xl text-white relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 text-7xl opacity-5 group-hover:scale-110 transition-transform">⚖️</div>
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-6">Traffic Liabilities</p>
                        <h3 className={`text-4xl font-black ${stats.totalUnpaidFines > 0 ? 'text-red-500' : 'text-emerald-400'}`}>
                            R{stats.totalUnpaidFines}
                        </h3>
                        <p className="text-[9px] text-white/30 font-black uppercase mt-3 tracking-widest">Active Infringements: {stats.driverFines.filter(f => f.status === 'unpaid').length}</p>
                        <button onClick={() => setActiveTab('safety')} className="mt-4 text-[9px] font-black text-white/60 uppercase hover:underline">Settle Outstanding →</button>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[3rem] border border-gray-100">
                    <h4 className="text-xs font-black text-gray-800 uppercase tracking-[0.2em] mb-8 flex items-center">
                        <span className="mr-3">📡</span> Live Operational Updates
                    </h4>
                    <div className="space-y-4">
                        <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <span className="text-2xl">✅</span>
                                <div>
                                    <p className="text-[10px] font-black text-emerald-800 uppercase tracking-tight">Technical Compliance</p>
                                    <p className="text-[9px] font-bold text-emerald-600 uppercase mt-0.5">Vehicle eNaTIS status is currently valid.</p>
                                </div>
                            </div>
                            <span className="text-[8px] font-black text-emerald-400">ACTIVE</span>
                        </div>
                        <div className="p-5 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <span className="text-2xl">📅</span>
                                <div>
                                    <p className="text-[10px] font-black text-blue-800 uppercase tracking-tight">Upcoming License Renewal</p>
                                    <p className="text-[9px] font-bold text-blue-600 uppercase mt-0.5">License Disk expires on {bike?.licenseDiskExpiry || 'N/A'}.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'payments' && (
            <div className="space-y-6">
                {/* Community Leaderboard Hook */}
                <div className="bg-gray-950 rounded-[3rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl mb-8">
                    <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(white 1px, transparent 0)', backgroundSize: '16px 16px' }}></div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-center mb-10">
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tight">Fleet Community Standing</h3>
                                <p className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Current Monthly Performance Rank</p>
                            </div>
                            <div className="bg-white/10 px-6 py-2 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-widest">
                                Your Rank: <span className="text-emerald-400">#{stats.myRank}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                            <div className="space-y-3">
                                {stats.leaderboard.slice(0, 3).map((entry, idx) => (
                                    <div key={entry.id} className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${entry.id === driver.id ? 'bg-emerald-600 border-emerald-500 scale-105 shadow-xl' : 'bg-white/5 border-white/5'}`}>
                                        <div className="flex items-center space-x-4">
                                            <span className="text-xl">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</span>
                                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-black text-[10px] overflow-hidden">
                                                {entry.pic ? <img src={entry.pic} className="w-full h-full object-cover" /> : entry.initials}
                                            </div>
                                            <p className="text-sm font-black uppercase tracking-tight truncate max-w-[120px]">{entry.id === driver.id ? 'YOU' : entry.name}</p>
                                        </div>
                                        <span className="text-sm font-black text-emerald-400">{entry.performance}%</span>
                                    </div>
                                ))}
                            </div>
                            <div className="text-center md:text-left bg-white/5 p-8 rounded-[2rem] border border-white/5">
                                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-4">Performance Insight</p>
                                <h4 className="text-2xl font-black leading-tight mb-4 uppercase">
                                    {stats.myRank <= 3 ? "You are a Fleet Elite!" : stats.myRank <= 10 ? "You are an Emerging Star!" : "Maintain Momentum to Rise!"}
                                </h4>
                                <p className="text-xs text-white/50 leading-relaxed uppercase">Compare your performance with top operators to improve your techniques and reach targets faster.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm p-8 md:p-12">
                    <div className="flex flex-col lg:flex-row justify-between items-start gap-12 mb-12">
                        <div className="max-w-md">
                            <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Payment Performance</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 mb-8">Weekly settlement trajectory vs mandatory target</p>
                            
                            <div className="grid grid-cols-2 gap-4">
                               <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                                  <p className="text-[9px] font-black text-gray-400 uppercase mb-2">Monthly Collected</p>
                                  <p className="text-2xl font-black text-emerald-600">R{stats.monthlyTotal}</p>
                               </div>
                               <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                                  <p className="text-[9px] font-black text-gray-400 uppercase mb-2">Reliability</p>
                                  <p className="text-2xl font-black text-gray-800">{stats.consistencyScore}%</p>
                               </div>
                            </div>

                            <div className="mt-8 p-6 bg-blue-50 rounded-3xl border border-blue-100">
                               <p className="text-[9px] font-black text-blue-600 uppercase mb-2 tracking-widest">System Insight</p>
                               <p className="text-xs font-bold text-blue-800 leading-relaxed uppercase">
                                  {stats.consistencyScore === 100 ? "Elite Consistency: You are in the top 5% of operators." : 
                                   stats.consistencyScore >= 75 ? "Strong Performance: Maintain this level for priority maintenance access." : 
                                   "Action Required: High arrears risk. Please settle current balance to avoid immobilizer trigger."}
                               </p>
                            </div>
                        </div>

                        <div className="flex-1 w-full h-[300px] bg-gray-50/50 rounded-[2.5rem] p-6 border border-gray-100 shadow-inner">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={stats.weeklyBreakdown}>
                                    <defs>
                                        <linearGradient id="colorPaid" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#10B981" stopOpacity={0.2}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 'bold', fill: '#94a3b8'}} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 'bold', fill: '#94a3b8'}} />
                                    <Tooltip 
                                        cursor={{fill: '#f1f5f9', radius: 12}}
                                        contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold'}}
                                    />
                                    <Bar dataKey="paid" radius={[12, 12, 0, 0]} name="Settled" barSize={40}>
                                        {stats.weeklyBreakdown.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.paid >= entry.target ? '#10B981' : '#F59E0B'} />
                                        ))}
                                    </Bar>
                                    <Line type="monotone" dataKey="target" stroke="#64748b" strokeWidth={2} strokeDasharray="5 5" name="Target Threshold" dot={false} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {stats.weeklyBreakdown.map(wb => (
                            <div key={wb.name} className="p-6 rounded-[2rem] border border-gray-50 bg-gray-50/50 flex items-center justify-between hover:bg-white hover:shadow-lg transition-all group">
                                <div className="flex items-center space-x-6">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black transition-colors ${
                                        wb.balance >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-600'
                                    }`}>
                                        W{wb.name.split(' ')[1]}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-gray-800 uppercase tracking-tight">{wb.name} Settlement</h4>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Performance: {wb.performance}% of target</p>
                                    </div>
                                </div>
                                <div className="text-right flex items-center space-x-8">
                                    <div>
                                        <p className="text-lg font-black text-gray-800">R{wb.paid}</p>
                                        <p className={`text-[9px] font-black uppercase tracking-widest ${wb.balance >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                            {wb.balance >= 0 ? `Surplus: +R${wb.balance}` : `Arrears: R${wb.balance}`}
                                        </p>
                                    </div>
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${wb.balance >= 0 ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-300'}`}>
                                        {wb.balance >= 0 ? '✓' : '!'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 p-8 bg-gray-900 rounded-[2.5rem] text-white flex flex-col md:flex-row items-center justify-between gap-8">
                        <div>
                            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Next Scheduled Payment</p>
                            <h4 className="text-xl font-black uppercase">Sunday, {new Date(new Date().setDate(new Date().getDate() + (7 - new Date().getDay()))).toLocaleDateString()}</h4>
                        </div>
                        <button className="w-full md:w-auto bg-white text-gray-900 px-10 py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl hover:scale-105 transition-transform">
                            Request Statement
                        </button>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'vehicle' && (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm p-8 flex flex-col items-center text-center">
                        <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-[2.5rem] flex items-center justify-center text-5xl mb-6 shadow-inner">🏍️</div>
                        <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight">{bike?.licenseNumber || 'Unassigned'}</h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{bike?.makeModel || 'Request Asset Assignment'}</p>
                        
                        <div className="grid grid-cols-2 gap-3 w-full mt-10">
                            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Engine/Vin</p>
                                <p className="text-[10px] font-bold text-gray-800 truncate">{bike?.vin || 'N/A'}</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Region</p>
                                <p className="text-[10px] font-bold text-gray-800">{bike?.city || 'JHB'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm p-8">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-8">Technical Standing</h4>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center text-xl">🏷️</div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-800 uppercase">License Disk</p>
                                        <p className="text-[9px] font-bold text-gray-400">Expires: {bike?.licenseDiskExpiry || 'Not Loaded'}</p>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase ${
                                    getDiskExpiryStatus() === 'valid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>{getDiskExpiryStatus()}</span>
                            </div>
                        </div>
                        <div className="mt-10">
                            <button onClick={() => setShowLogForm(true)} className="w-full bg-amber-500 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-amber-100 hover:bg-amber-600 transition-all">
                                ➕ Record Technical Event
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm p-8">
                    <h3 className="font-black text-gray-800 uppercase text-xs tracking-widest mb-8">Maintenance History</h3>
                    <div className="space-y-3">
                        {maintenance.filter(m => m.bikeId === bike?.id).length === 0 ? (
                            <p className="text-center py-10 text-[10px] font-black text-gray-300 uppercase">No recent mechanical logs</p>
                        ) : (
                            maintenance.filter(m => m.bikeId === bike?.id).slice(0, 5).map(m => (
                                <div key={m.id} className="p-5 rounded-2xl bg-gray-50 flex items-center justify-between border border-gray-100/50">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-lg">🛠️</div>
                                        <div>
                                            <p className="text-[11px] font-black text-gray-800 uppercase">{m.description}</p>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase mt-0.5">{new Date(m.date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-black text-gray-800">R{m.cost}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'safety' && (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm p-8">
                        <div className="flex justify-between items-center mb-10">
                            <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Accident Log</h3>
                            <button onClick={() => setShowAccidentForm(true)} className="bg-red-600 text-white px-6 py-2.5 rounded-xl font-black uppercase text-[9px] tracking-widest">Report Incident</button>
                        </div>
                        <div className="space-y-4">
                            {stats.driverAccidents.length === 0 ? (
                                <div className="py-20 text-center flex flex-col items-center">
                                    <div className="text-4xl mb-4 opacity-20">🛡️</div>
                                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Perfect Safety Score</p>
                                </div>
                            ) : (
                                stats.driverAccidents.map(acc => (
                                    <div key={acc.id} className="p-6 rounded-[2rem] bg-gray-50 border border-gray-100 group hover:bg-white hover:shadow-lg transition-all">
                                        <div className="flex justify-between items-start mb-4">
                                            <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                                                acc.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                            }`}>{acc.status}</span>
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{new Date(acc.date).toLocaleDateString()}</p>
                                        </div>
                                        <h4 className="text-sm font-black text-gray-800 uppercase mb-2">{acc.location}</h4>
                                        <p className="text-xs text-gray-500 italic">"{acc.description}"</p>
                                        {acc.attachmentUrl && (
                                            <button onClick={() => setViewingAttachment(acc.attachmentUrl!)} className="mt-4 text-[9px] font-black text-emerald-600 uppercase">View Evidence Photo →</button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="bg-gray-900 rounded-[3rem] shadow-xl p-8 text-white">
                        <h3 className="text-xl font-black uppercase tracking-tight mb-10">Traffic Fines</h3>
                        <div className="space-y-4">
                            {stats.driverFines.length === 0 ? (
                                <div className="py-20 text-center opacity-40">
                                    <div className="text-4xl mb-4">👮</div>
                                    <p className="text-[10px] font-black uppercase tracking-widest">No Traffic Notices</p>
                                </div>
                            ) : (
                                stats.driverFines.map(fine => (
                                    <div key={fine.id} className="p-6 rounded-[2rem] bg-white/5 border border-white/5 flex items-center justify-between group hover:bg-white/10 transition-all">
                                        <div className="flex items-center space-x-5">
                                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-xl">👮</div>
                                            <div>
                                                <h4 className="text-xs font-black uppercase tracking-widest">{fine.noticeNumber}</h4>
                                                <p className="text-[9px] font-bold text-white/40 uppercase mt-1">{new Date(fine.date).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-black text-red-400">R{fine.amount}</p>
                                            <p className={`text-[8px] font-black uppercase tracking-widest ${fine.status === 'paid' ? 'text-emerald-400' : 'text-orange-400'}`}>
                                                {fine.status.toUpperCase()}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>

      {/* Accident Report Modal */}
      {showAccidentForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
           <form onSubmit={handleAccidentSubmit} className="bg-white rounded-[3rem] shadow-2xl max-w-2xl w-full p-10 space-y-8 animate-in zoom-in duration-300">
              <div className="flex justify-between items-center border-b border-gray-50 pb-6">
                 <div>
                   <h3 className="text-2xl font-black text-red-600 uppercase tracking-tight">Incident Report Terminal</h3>
                   <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Official Incident Declaration</p>
                 </div>
                 <button type="button" onClick={() => setShowAccidentForm(false)} className="text-gray-300 hover:text-red-500 text-5xl leading-none">&times;</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Incident Date</label>
                    <input type="date" required className="w-full border-gray-100 rounded-2xl p-4 bg-gray-50 font-bold" value={accidentFormData.date} onChange={e => setAccidentFormData({...accidentFormData, date: e.target.value})} />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Specific Location</label>
                    <input type="text" required placeholder="e.g. Cnr Main & 4th, Sandton" className="w-full border-gray-100 rounded-2xl p-4 bg-gray-50 font-bold" value={accidentFormData.location} onChange={e => setAccidentFormData({...accidentFormData, location: e.target.value})} />
                 </div>
                 <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Describe the Incident</label>
                    <textarea required placeholder="Briefly explain what happened..." className="w-full border-gray-100 rounded-2xl p-4 bg-gray-50 font-bold h-32 resize-none" value={accidentFormData.description} onChange={e => setAccidentFormData({...accidentFormData, description: e.target.value})} />
                 </div>
                 <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Third Party Details (If applicable)</label>
                    <input type="text" placeholder="Name, License Plate, Contact info" className="w-full border-gray-100 rounded-2xl p-4 bg-gray-50 font-bold" value={accidentFormData.thirdPartyDetails} onChange={e => setAccidentFormData({...accidentFormData, thirdPartyDetails: e.target.value})} />
                 </div>
                 <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Incident Evidence (Photos)</label>
                    <div className="relative">
                       <input type="file" ref={accidentFileInputRef} className="hidden" accept="image/*" onChange={handleAccidentFileChange} />
                       <button type="button" onClick={() => accidentFileInputRef.current?.click()} className={`w-full p-5 rounded-2xl border-2 border-dashed transition-all flex items-center justify-center space-x-3 ${accidentFormData.attachmentUrl ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-gray-50 border-gray-200 text-gray-400 hover:border-red-400'}`}>
                          <span>📸</span>
                          <span className="text-[10px] font-black uppercase tracking-widest">{accidentFormData.attachmentUrl ? 'Photos Attached' : 'Capture Scene Evidence'}</span>
                       </button>
                    </div>
                 </div>
              </div>

              <button type="submit" className="w-full bg-red-600 text-white py-6 rounded-[2.2rem] font-black uppercase text-[11px] tracking-widest shadow-2xl shadow-red-200 hover:bg-red-700 transition-all active:scale-95">Official Incident Dispatch</button>
           </form>
        </div>
      )}

      {/* Attachment Viewer */}
      {viewingAttachment && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[300] flex items-center justify-center p-4">
           <div className="bg-white rounded-[3rem] overflow-hidden max-w-4xl w-full flex flex-col animate-in zoom-in duration-300">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                 <h3 className="text-[10px] font-black text-gray-800 uppercase tracking-widest">Digital Evidence Viewer</h3>
                 <button onClick={() => setViewingAttachment(null)} className="text-gray-400 hover:text-gray-900 text-4xl leading-none">&times;</button>
              </div>
              <div className="bg-gray-100 p-6 flex items-center justify-center min-h-[50vh] max-h-[75vh] overflow-hidden">
                 <img src={viewingAttachment} className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl" alt="Evidence" />
              </div>
           </div>
        </div>
      )}

      {/* Log Maintenance Modal */}
      {showLogForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
           <form onSubmit={handleLogSubmit} className="bg-white rounded-[3rem] shadow-2xl max-w-xl w-full p-10 space-y-8 animate-in zoom-in duration-300">
              <div className="flex justify-between items-center border-b border-gray-50 pb-6">
                 <div>
                   <h3 className="text-2xl font-black text-amber-600 uppercase tracking-tight">Log Maintenance</h3>
                   <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Operator Self-Registry</p>
                 </div>
                 <button type="button" onClick={() => setShowLogForm(false)} className="text-gray-300 hover:text-red-500 text-5xl leading-none">&times;</button>
              </div>
              
              <div className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Short Description</label>
                    <input type="text" required className="w-full border-gray-100 rounded-2xl p-4 bg-gray-50 font-bold" value={newLog.description} onChange={e => setNewLog({...newLog, description: e.target.value})} placeholder="e.g. Engine oil top-up" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Expense Amount (R)</label>
                    <input type="number" required className="w-full border-gray-100 rounded-2xl p-4 bg-gray-50 font-bold" value={newLog.cost || ''} onChange={e => setNewLog({...newLog, cost: Number(e.target.value)})} placeholder="0.00" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Log Category</label>
                    <select className="w-full border-gray-100 rounded-2xl p-4 bg-gray-50 font-bold" value={newLog.serviceType} onChange={e => setNewLog({...newLog, serviceType: e.target.value as any})}>
                       <option value="fuel">Fuel Logistics</option>
                       <option value="oil">Lubrication/Oil</option>
                       <option value="parts">Component Spares</option>
                       <option value="repair">Technical Repair</option>
                    </select>
                 </div>
              </div>

              <button type="submit" className="w-full bg-amber-600 text-white py-6 rounded-[2.2rem] font-black uppercase text-[11px] tracking-widest shadow-2xl shadow-amber-200 hover:bg-amber-700 transition-all active:scale-95">Finalize Technical Log</button>
           </form>
        </div>
      )}

      {/* Admin Fine Form Modal */}
      {showFineForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
           <form onSubmit={handleFineSubmit} className="bg-white rounded-[3rem] shadow-2xl max-w-xl w-full p-10 space-y-8 animate-in zoom-in duration-300">
              <div className="flex justify-between items-center border-b border-gray-50 pb-6">
                 <div>
                   <h3 className="text-2xl font-black text-red-600 uppercase tracking-tight">Assign Traffic Notice</h3>
                   <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Official Infringement Allocation</p>
                 </div>
                 <button type="button" onClick={() => setShowFineForm(false)} className="text-gray-300 hover:text-red-500 text-5xl leading-none">&times;</button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Notice Serial</label>
                    <input type="text" required className="w-full border-gray-100 rounded-2xl p-4 bg-gray-50 font-bold" value={fineFormData.noticeNumber} onChange={e => setFineFormData({...fineFormData, noticeNumber: e.target.value})} placeholder="e.g. INF-12345" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Amount (R)</label>
                    <input type="number" required className="w-full border-gray-100 rounded-2xl p-4 bg-gray-50 font-bold" value={fineFormData.amount || ''} onChange={e => setFineFormData({...fineFormData, amount: Number(e.target.value)})} placeholder="0.00" />
                 </div>
                 <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Violation Description</label>
                    <input type="text" required className="w-full border-gray-100 rounded-2xl p-4 bg-gray-50 font-bold" value={fineFormData.description} onChange={e => setFineFormData({...fineFormData, description: e.target.value})} placeholder="e.g. Speeding at M1 North" />
                 </div>
              </div>

              <button type="submit" className="w-full bg-red-600 text-white py-6 rounded-[2.2rem] font-black uppercase text-[11px] tracking-widest shadow-2xl shadow-red-200 hover:bg-red-700 transition-all active:scale-95">Commit Liability to Driver</button>
           </form>
        </div>
      )}
    </div>
  );
};

export default DriverProfile;
