
import React, { useMemo, useRef, useState } from 'react';
import { Driver, Payment, Bike, MaintenanceRecord, Workshop, TrafficFine } from '../types';

interface DriverProfileProps {
  driver: Driver;
  onUpdateDriver: (updatedDriver: Driver) => void;
  payments: Payment[];
  fines: TrafficFine[];
  onAddFine: (fine: Omit<TrafficFine, 'id'>) => void;
  bike?: Bike;
  maintenance: MaintenanceRecord[];
  onAddMaintenance: (record: Omit<MaintenanceRecord, 'id'>) => void;
  workshops: Workshop[];
  weeklyTarget: number;
  isAdminViewing?: boolean;
}

const DriverProfile: React.FC<DriverProfileProps> = ({ 
  driver, 
  onUpdateDriver, 
  payments = [], 
  fines = [],
  onAddFine,
  bike, 
  maintenance = [], 
  onAddMaintenance,
  workshops = [],
  weeklyTarget,
  isAdminViewing = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logFileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'portfolio' | 'service'>('portfolio');
  const [showLogForm, setShowLogForm] = useState(false);
  const [showFineForm, setShowFineForm] = useState(false);

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

  const stats = useMemo(() => {
    // Current logical week for the fleet simulation is 4
    const CURRENT_WEEK = 4;
    const driverPayments = (payments || []).filter(p => p?.driverId === driver.id);
    
    // Weekly standing logic
    const weeklyTargetValue = driver.weeklyTarget || weeklyTarget;
    const paidThisWeek = driverPayments
      .filter(p => p.weekNumber === CURRENT_WEEK)
      .reduce((acc, p) => acc + (p?.amount || 0), 0);
    
    const weeklyBalance = paidThisWeek - weeklyTargetValue;
    const weeklyProgress = Math.max(0, Math.min(100, (paidThisWeek / weeklyTargetValue) * 100));

    // Fines calculation
    const driverFines = (fines || []).filter(f => f?.driverId === driver.id);
    const unpaidFines = driverFines.filter(f => f?.status === 'unpaid');
    const totalUnpaidFines = unpaidFines.reduce((acc, f) => acc + (f?.amount || 0), 0);
    
    // Streak logic
    const sortedPayments = [...driverPayments].sort((a, b) => (b.weekNumber || 0) - (a.weekNumber || 0));
    let streak = 0;
    for (let p of sortedPayments) {
      if (p && p.amount >= weeklyTargetValue) streak++;
      else break;
    }

    const bikeMaintenance = bike ? (maintenance || []).filter(m => m?.bikeId === bike.id) : [];
    const totalMaintenanceCost = bikeMaintenance.reduce((acc, m) => acc + (m?.cost || 0), 0);

    return { 
      paidThisWeek,
      weeklyTargetValue,
      weeklyBalance,
      weeklyProgress,
      totalUnpaidFines, 
      streak, 
      bikeMaintenance, 
      totalMaintenanceCost, 
      driverFines,
      currentWeek: CURRENT_WEEK
    };
  }, [payments, fines, driver.id, weeklyTarget, bike, maintenance]);

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => onUpdateDriver({ ...driver, profilePictureUrl: reader.result as string });
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

  const requestSupport = () => {
    const message = `Support Request: ${driver.name}, Vehicle ${bike?.licenseNumber || 'N/A'}. I need technical assistance.`;
    window.open(`https://wa.me/27682170330?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="w-full space-y-6 pb-20 md:pb-8">
      {isAdminViewing && (
        <div className="bg-blue-600 text-white p-4 rounded-3xl mb-4 flex items-center justify-between shadow-xl animate-in slide-in-from-top-4">
           <div className="flex items-center space-x-3">
              <span className="text-xl">🕵️</span>
              <p className="text-[10px] font-black uppercase tracking-widest">Administrator Impersonation Active</p>
           </div>
           <button onClick={() => setShowFineForm(true)} className="bg-white/20 hover:bg-white/40 px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest">+ Assign Fine</button>
        </div>
      )}

      <div className="relative overflow-hidden rounded-[2.5rem] shadow-2xl transition-all duration-700 bg-gradient-to-br from-green-700 to-green-500">
        <div className="relative z-10 p-8 md:p-12 text-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div className="flex items-center space-x-6 md:space-x-8">
               <div 
                className="relative group w-24 h-24 md:w-32 md:h-32 rounded-[2.5rem] bg-white/20 backdrop-blur-xl border-4 border-white/30 overflow-hidden shrink-0 flex items-center justify-center font-black text-3xl cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
               >
                 {driver.profilePictureUrl ? (
                   <img src={driver.profilePictureUrl} className="w-full h-full object-cover" />
                 ) : (
                   (driver.name || '??').substring(0, 2).toUpperCase()
                 )}
                 <input type="file" ref={fileInputRef} onChange={handleProfilePhotoChange} accept="image/*" className="hidden" />
               </div>
               <div className="space-y-2">
                <div className="inline-flex items-center bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                  <span className="mr-2">🏁</span>
                  {stats.weeklyBalance >= 0 ? 'Verified Account Standing' : 'Active Settlement Cycle'}
                </div>
                <h2 className="text-3xl md:text-5xl font-black tracking-tight">Howzit, {(driver.name || '').split(' ')[0]}!</h2>
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
               <div className="bg-white/10 backdrop-blur-md p-5 rounded-[2rem] text-center border border-white/10 flex-1">
                  <p className="text-[9px] font-black uppercase opacity-60 tracking-widest mb-1">Consistency</p>
                  <p className="text-3xl font-black">{stats.streak} 🔥</p>
               </div>
               <button onClick={requestSupport} className="bg-white text-green-700 px-8 py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center">
                 <span className="mr-3">🆘</span> Support
               </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex bg-white dark:bg-gray-900/50 p-2 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm w-full md:w-fit mx-auto sticky top-24 z-30 backdrop-blur-md">
        <button onClick={() => setActiveTab('portfolio')} className={`flex-1 md:flex-none px-10 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'portfolio' ? 'bg-green-600 text-white shadow-lg' : 'text-gray-400'}`}>💰 Portfolio</button>
        <button onClick={() => setActiveTab('service')} className={`flex-1 md:flex-none px-10 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'service' ? 'bg-amber-600 text-white shadow-lg' : 'text-gray-400'}`}>🔧 Service</button>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === 'portfolio' ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-900/60 backdrop-blur-3xl p-8 rounded-[3rem] shadow-sm border border-white/60 dark:border-white/5 flex flex-col justify-between">
                <p className="text-[10px] font-black text-gray-400 dark:text-white/30 uppercase tracking-widest mb-4">Weekly Standing</p>
                <div className="flex flex-col">
                  <div className="flex items-baseline space-x-2">
                    <h3 className={`text-5xl font-black ${stats.weeklyBalance >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      R{Math.abs(stats.weeklyBalance)}
                    </h3>
                    <span className="text-gray-400 dark:text-white/20 text-xs font-black uppercase">{stats.weeklyBalance >= 0 ? 'Surplus' : 'Pending'}</span>
                  </div>
                  <div className="mt-4 w-full bg-gray-100 dark:bg-white/5 h-2 rounded-full overflow-hidden">
                    <div className={`h-full ${stats.weeklyProgress === 100 ? 'bg-green-500' : 'bg-blue-500'} transition-all duration-1000`} style={{ width: `${stats.weeklyProgress}%` }}></div>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-gray-50 dark:border-white/5 flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                   <span className="text-gray-400 dark:text-white/30">Target: R{stats.weeklyTargetValue}</span>
                   <span className="text-green-600">Paid: R{stats.paidThisWeek}</span>
                </div>
              </div>

              {bike && (
                <div className="bg-white dark:bg-gray-900/60 backdrop-blur-3xl p-8 rounded-[3rem] shadow-sm border border-white/60 dark:border-white/5 relative overflow-hidden group">
                  <p className="text-[10px] font-black text-gray-400 dark:text-white/30 uppercase tracking-widest mb-4">Assigned Asset</p>
                  <h3 className="text-2xl font-black text-gray-800 dark:text-white leading-tight uppercase tracking-tight">{bike.makeModel}</h3>
                  <p className="text-xs font-black text-blue-500 mt-2">{bike.licenseNumber}</p>
                  <div className={`mt-6 inline-flex items-center px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest ${bike.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                    Status: {bike.status}
                  </div>
                </div>
              )}

              <div className="bg-gray-900 dark:bg-black p-8 rounded-[3rem] shadow-xl text-white flex flex-col justify-center border border-white/5">
                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-4">Unpaid Fines</p>
                <div className="flex items-center justify-between">
                   <h3 className="text-4xl font-black text-red-500">R{stats.totalUnpaidFines}</h3>
                   <span className="text-2xl">🚔</span>
                </div>
                <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em] mt-4">Settle to clear record</p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900/60 backdrop-blur-3xl rounded-[3.5rem] shadow-sm border border-white/60 dark:border-white/5 overflow-hidden">
               <div className="p-8 border-b border-gray-50 dark:border-white/5 flex justify-between items-center">
                  <h3 className="font-black text-gray-800 dark:text-white uppercase text-xs tracking-widest">Recent Transactions</h3>
               </div>
               <div className="divide-y divide-gray-50 dark:divide-white/5">
                  {payments.filter(p => p.driverId === driver.id).sort((a,b) => b.weekNumber - a.weekNumber).slice(0, 5).map(p => (
                    <div key={p.id} className="p-8 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-white/5 transition-all">
                       <div className="flex items-center space-x-6">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${p.amount >= 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                             {p.amount >= 0 ? '💸' : '⚠️'}
                          </div>
                          <div>
                             <p className="text-sm font-black text-gray-900 dark:text-white uppercase">WEEK {p.weekNumber} SETTLEMENT</p>
                             <p className="text-[10px] text-gray-400 dark:text-white/30 font-bold uppercase mt-1">{p.date}</p>
                          </div>
                       </div>
                       <p className={`text-xl font-black ${p.amount >= 0 ? 'text-green-600' : 'text-red-500'}`}>R{p.amount}</p>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="bg-white dark:bg-gray-900/60 backdrop-blur-3xl p-10 rounded-[4rem] shadow-sm border border-white/60 dark:border-white/5">
               <div className="flex justify-between items-center mb-10">
                  <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest">Technical Event Log</h3>
                  <button onClick={() => setShowLogForm(true)} className="bg-amber-600 text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-amber-900/20 hover:scale-105 active:scale-95 transition-all">+ Log Fuel/Service</button>
               </div>
               <div className="divide-y divide-gray-50 dark:divide-white/5">
                 {stats.bikeMaintenance.length === 0 ? (
                    <div className="py-20 text-center text-gray-300 dark:text-white/10 uppercase font-black text-xs tracking-widest">No service data recorded</div>
                 ) : (
                   stats.bikeMaintenance.map(m => (
                     <div key={m.id} className="py-8 flex justify-between items-center">
                        <div className="flex items-center space-x-6">
                           <div className="w-14 h-14 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center text-2xl">🔧</div>
                           <div>
                              <p className="text-sm font-black text-gray-900 dark:text-white uppercase">{m.description}</p>
                              <p className="text-[10px] text-gray-400 dark:text-white/30 font-bold uppercase mt-1">{m.date} • {m.performedBy}</p>
                           </div>
                        </div>
                        <p className="text-xl font-black text-gray-900 dark:text-white">R{m.cost}</p>
                     </div>
                   ))
                 )}
               </div>
            </div>
          </div>
        )}
      </div>

      {showLogForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-2xl z-[150] flex items-center justify-center p-4">
           <form onSubmit={handleLogSubmit} className="bg-white dark:bg-gray-900 backdrop-blur-3xl rounded-[4rem] w-full max-w-xl p-12 space-y-10 animate-in zoom-in duration-300 border dark:border-white/10">
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-white/10 pb-8 mb-8">
                 <h3 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">New Log Entry</h3>
                 <button type="button" onClick={() => setShowLogForm(false)} className="text-6xl text-gray-300 leading-none">&times;</button>
              </div>
              <div className="space-y-6">
                 <select className="w-full bg-gray-50 dark:bg-black/50 border-none rounded-[1.5rem] p-6 text-sm font-bold outline-none shadow-inner dark:text-white" value={newLog.serviceType} onChange={e => setNewLog({...newLog, serviceType: e.target.value as any})}>
                    <option value="fuel">Fueling</option>
                    <option value="repair">Major Repair</option>
                    <option value="routine">Routine Service</option>
                 </select>
                 <input type="number" placeholder="Cost (R)" className="w-full bg-gray-50 dark:bg-black/50 border-none rounded-[1.5rem] p-6 text-sm font-bold outline-none shadow-inner dark:text-white" value={newLog.cost || ''} onChange={e => setNewLog({...newLog, cost: Number(e.target.value)})} />
                 <input type="text" placeholder="Description" className="w-full bg-gray-50 dark:bg-black/50 border-none rounded-[1.5rem] p-6 text-sm font-bold outline-none shadow-inner dark:text-white" value={newLog.description} onChange={e => setNewLog({...newLog, description: e.target.value})} />
              </div>
              <button className="w-full bg-gray-900 dark:bg-amber-600 text-white py-6 rounded-[2.5rem] font-black uppercase text-[11px] tracking-widest shadow-2xl">Submit Job Card</button>
           </form>
        </div>
      )}
    </div>
  );
};

export default DriverProfile;
