
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
  payments, 
  fines = [],
  onAddFine,
  bike, 
  maintenance, 
  onAddMaintenance,
  workshops,
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
    const driverPayments = payments.filter(p => p.driverId === driver.id);
    const totalPaid = driverPayments.reduce((acc, p) => acc + p.amount, 0);
    
    // Monthly Rent calculation
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const weeksInMonth = Math.ceil(lastDay / 7);
    const expectedRent = weeksInMonth * weeklyTarget;
    const rentBalance = totalPaid - expectedRent;
    
    // Fines calculation
    const driverFines = fines.filter(f => f.driverId === driver.id);
    const unpaidFines = driverFines.filter(f => f.status === 'unpaid');
    const totalUnpaidFines = unpaidFines.reduce((acc, f) => acc + f.amount, 0);
    
    // Final Standing
    const totalBalance = rentBalance - totalUnpaidFines;
    
    const sortedPayments = [...driverPayments].sort((a, b) => b.weekNumber - a.weekNumber);
    let streak = 0;
    for (let p of sortedPayments) {
      if (p.amount >= weeklyTarget) streak++;
      else break;
    }

    const bikeMaintenance = bike ? maintenance.filter(m => m.bikeId === bike.id) : [];
    const totalMaintenanceCost = bikeMaintenance.reduce((acc, m) => acc + m.cost, 0);

    // Service Health logic
    const routineServices = bikeMaintenance.filter(m => m.serviceType === 'routine' || m.serviceType === 'oil');
    let lastServiceDate = "Never";
    let serviceDaysDiff = 999;
    if (routineServices.length > 0) {
      const latest = routineServices.reduce((a, b) => new Date(a.date) > new Date(b.date) ? a : b);
      lastServiceDate = new Date(latest.date).toLocaleDateString();
      serviceDaysDiff = Math.floor((now.getTime() - new Date(latest.date).getTime()) / (1000 * 60 * 60 * 24));
    }

    return { 
      totalPaid, 
      rentBalance, 
      totalUnpaidFines, 
      totalBalance, 
      streak, 
      expectedRent, 
      bikeMaintenance, 
      totalMaintenanceCost, 
      lastServiceDate, 
      serviceDaysDiff,
      driverFines
    };
  }, [payments, fines, driver.id, weeklyTarget, bike, maintenance]);

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateDriver({ ...driver, profilePictureUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewLog(prev => ({ ...prev, attachmentUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bike) return;
    onAddMaintenance({ ...newLog, bikeId: bike.id });
    setShowLogForm(false);
    setNewLog({
      bikeId: bike.id,
      date: new Date().toISOString().split('T')[0],
      description: '',
      cost: 0,
      serviceType: 'fuel',
      performedBy: 'Self / Driver',
      attachmentUrl: ''
    });
  };

  const handleFineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddFine(fineFormData);
    setShowFineForm(false);
    setFineFormData({
      bikeId: bike?.id || '',
      driverId: driver.id,
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      noticeNumber: '',
      description: '',
      status: 'unpaid'
    });
  };

  const requestSupport = () => {
    const message = `Emergency Support Required: Driver ${driver.name}, Vehicle ${bike?.licenseNumber}. I am currently experiencing technical issues. Please assist.`;
    window.open(`https://wa.me/0718398532?text=${encodeURIComponent(message)}`, '_blank');
  };

  const headerBgImage = "https://images.unsplash.com/photo-1558981806-ec527fa84c39?q=80&w=2070&auto=format&fit=crop";

  return (
    <div className="w-full space-y-6 pb-20 md:pb-8">
      {isAdminViewing && (
        <div className="bg-blue-600 text-white p-3 rounded-2xl mb-4 flex items-center justify-between shadow-xl shadow-blue-500/20 animate-in slide-in-from-top-4">
           <div className="flex items-center space-x-3">
              <span className="text-xl">🕵️</span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest">Administrator Preview Active</p>
                <p className="text-[8px] font-bold opacity-70 uppercase">You are currently viewing {driver.name}'s dedicated portal.</p>
              </div>
           </div>
           <div className="flex items-center space-x-2">
             <button 
                onClick={() => setShowFineForm(true)}
                className="bg-white/20 hover:bg-white/40 px-3 py-1 rounded-lg text-[9px] font-black uppercase transition-colors"
             >
               + Assign Fine
             </button>
             <span className="text-[9px] font-black border border-white/30 px-2 py-0.5 rounded-full uppercase">Impersonation Mode</span>
           </div>
        </div>
      )}

      {/* Header Branding Section */}
      <div 
        className="relative overflow-hidden rounded-[2.5rem] shadow-2xl shadow-green-100/50 transition-all duration-500"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(21, 128, 61, 0.96), rgba(34, 197, 94, 0.85)), url('${headerBgImage}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="relative z-10 p-8 md:p-12 text-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div className="flex items-center space-x-8">
               <div 
                className="relative group w-24 h-24 md:w-32 md:h-32 rounded-[2.5rem] bg-white/20 backdrop-blur-xl border-4 border-white/30 overflow-hidden shrink-0 flex items-center justify-center font-black text-3xl cursor-pointer hover:scale-105 transition-transform"
                onClick={() => fileInputRef.current?.click()}
               >
                 {driver.profilePictureUrl ? (
                   <img src={driver.profilePictureUrl} alt={driver.name} className="w-full h-full object-cover" />
                 ) : (
                   driver.name.substring(0, 2).toUpperCase()
                 )}
                 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-[10px] font-black uppercase text-white tracking-widest text-center px-2">Update Profile Picture</span>
                 </div>
                 <input type="file" ref={fileInputRef} onChange={handleProfilePhotoChange} accept="image/*" className="hidden" />
               </div>
               <div className="space-y-2">
                <div className="inline-flex items-center bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20">
                  <span className="mr-2">🏁</span>
                  {stats.totalBalance >= 0 ? 'Verified Elite Standing' : 'Active Growth Phase'}
                </div>
                <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">Welcome back, <br className="hidden md:block"/> {driver.name.split(' ')[0]}</h2>
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
               <div className="bg-white/10 backdrop-blur-md p-5 rounded-[2rem] text-center min-w-[120px] border border-white/10 flex-1">
                  <p className="text-[9px] font-black uppercase opacity-60 tracking-widest mb-1">Consistency</p>
                  <p className="text-3xl font-black">{stats.streak} 🔥</p>
               </div>
               <button 
                onClick={requestSupport}
                className="bg-white text-green-700 px-8 py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl hover:bg-gray-100 transition-all active:scale-95 flex items-center justify-center"
               >
                 <span className="mr-3">🆘</span>
                 Get Support
               </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex bg-white p-2 rounded-3xl border border-gray-100 shadow-sm w-full md:w-fit mx-auto sticky top-24 z-30 backdrop-blur-md bg-white/80">
        <button 
          onClick={() => setActiveTab('portfolio')}
          className={`flex-1 md:flex-none px-10 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center space-x-3 ${activeTab === 'portfolio' ? 'bg-green-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <span>💰</span>
          <span>My Portfolio</span>
        </button>
        <button 
          onClick={() => setActiveTab('service')}
          className={`flex-1 md:flex-none px-10 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center space-x-3 ${activeTab === 'service' ? 'bg-amber-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <span>🔧</span>
          <span>Service Center</span>
        </button>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === 'portfolio' ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col justify-between relative overflow-hidden">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Account Standing</p>
                <div className="flex flex-col">
                  <div className="flex items-baseline space-x-2">
                    <h3 className={`text-4xl font-black ${stats.totalBalance >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      R{stats.totalBalance}
                    </h3>
                    <span className="text-gray-400 text-xs font-black uppercase">{stats.totalBalance >= 0 ? 'Surplus' : 'Liability'}</span>
                  </div>
                  {stats.totalUnpaidFines > 0 && (
                    <div className="mt-2 text-red-400 text-[10px] font-bold uppercase tracking-widest bg-red-50 px-3 py-1 rounded-full w-fit">
                      Includes R{stats.totalUnpaidFines} in Fines
                    </div>
                  )}
                </div>
                <div className="mt-6 pt-6 border-t border-gray-50 flex flex-col space-y-2">
                   <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                     <span className="text-gray-400">Monthly Rent:</span>
                     <span className="text-gray-800">R{stats.expectedRent}</span>
                   </div>
                   <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                     <span className="text-gray-400">Total Paid:</span>
                     <span className="text-green-600">R{stats.totalPaid}</span>
                   </div>
                </div>
              </div>

              {bike ? (
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 relative overflow-hidden group">
                  <div className="absolute -right-6 -top-6 text-7xl opacity-[0.03] transition-transform group-hover:scale-110 group-hover:rotate-12 duration-500">🏍️</div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Linked Asset</p>
                  <h3 className="text-2xl font-black text-gray-800 leading-tight uppercase tracking-tight">{bike.makeModel}</h3>
                  <p className="text-xs font-black text-blue-600 uppercase tracking-[0.2em] mt-2">{bike.licenseNumber}</p>
                  <div className={`mt-6 inline-flex items-center px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest ${bike.status === 'active' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full mr-2 ${bike.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    Status: {bike.status}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 p-8 rounded-[2.5rem] border border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl mb-2">🚫</span>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No Asset Assigned</p>
                </div>
              )}

              <div className="bg-gray-900 p-8 rounded-[2.5rem] shadow-xl text-white flex flex-col justify-center">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Active Infringements</p>
                <div className="flex items-center justify-between">
                   <div>
                     <p className="text-4xl font-black text-red-500">{stats.driverFines.length}</p>
                     <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Total Notices</p>
                   </div>
                   <div className="text-right">
                     <p className="text-2xl font-black text-white">R{stats.totalUnpaidFines}</p>
                     <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mt-1">Unpaid Liability</p>
                   </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Payments Section */}
              <div className="bg-white rounded-[3rem] shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                   <h3 className="font-black text-gray-800 uppercase text-xs tracking-[0.2em]">Rental Collections</h3>
                   <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{payments.filter(p => p.driverId === driver.id).length} Records</span>
                </div>
                <div className="divide-y divide-gray-50">
                  {payments
                    .filter(p => p.driverId === driver.id)
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 5)
                    .map(p => (
                      <div key={p.id} className="p-6 flex justify-between items-center hover:bg-gray-50/50 transition-colors">
                        <div className="flex items-center space-x-6">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm ${p.amount >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                            {p.amount >= 0 ? '💸' : '⚠️'}
                          </div>
                          <div>
                            <p className="text-sm font-black text-gray-800 uppercase tracking-tight">{p.type} ENTRY</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{new Date(p.date).toLocaleDateString('en-GB')}</p>
                          </div>
                        </div>
                        <p className={`text-lg font-black ${p.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {p.amount >= 0 ? `+R${p.amount}` : `R${p.amount}`}
                        </p>
                      </div>
                    ))}
                  {payments.filter(p => p.driverId === driver.id).length === 0 && (
                    <div className="py-20 text-center text-gray-300 font-black uppercase text-[10px] tracking-widest">No rental data</div>
                  )}
                </div>
              </div>

              {/* Fines Section */}
              <div className="bg-white rounded-[3rem] shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                   <h3 className="font-black text-gray-800 uppercase text-xs tracking-[0.2em]">Traffic Infringements</h3>
                   <span className="text-[9px] font-black text-red-400 uppercase tracking-widest">{stats.driverFines.length} Notices</span>
                </div>
                <div className="divide-y divide-gray-50">
                  {stats.driverFines
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map(f => (
                      <div key={f.id} className="p-6 flex justify-between items-center hover:bg-gray-50/50 transition-colors group">
                        <div className="flex items-center space-x-6">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm ${f.status === 'unpaid' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                            🚔
                          </div>
                          <div>
                            <p className="text-sm font-black text-gray-800 uppercase tracking-tight">{f.noticeNumber}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{f.description}</p>
                            <p className="text-[8px] text-gray-400 mt-0.5">{new Date(f.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-black ${f.status === 'unpaid' ? 'text-red-600' : 'text-gray-400'}`}>R{f.amount}</p>
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${f.status === 'unpaid' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                            {f.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  {stats.driverFines.length === 0 && (
                    <div className="py-20 text-center text-gray-300 font-black uppercase text-[10px] tracking-widest">Clear Record</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Service Hub Tab */
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               <div className="lg:col-span-2 space-y-8">
                  <div className="bg-white rounded-[3rem] shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
                       <h3 className="font-black text-gray-800 uppercase text-xs tracking-[0.2em]">Vehicle Technical History</h3>
                       <button 
                        onClick={() => setShowLogForm(true)}
                        className="bg-amber-600 text-white px-6 py-2.5 rounded-xl font-black uppercase text-[9px] tracking-widest shadow-lg shadow-amber-100 hover:bg-amber-700 transition-all active:scale-95"
                       >
                         + Report Expense / Service
                       </button>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {stats.bikeMaintenance.length === 0 ? (
                        <div className="py-24 text-center">
                           <div className="text-4xl mb-4">🛠️</div>
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No Maintenance Events Logged</p>
                        </div>
                      ) : (
                        stats.bikeMaintenance
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .map(m => (
                            <div key={m.id} className="p-6 md:p-8 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                               <div className="flex items-center space-x-6">
                                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm ${
                                    m.serviceType === 'fuel' ? 'bg-orange-50 text-orange-600' :
                                    m.serviceType === 'repair' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                                  }`}>
                                    {m.serviceType === 'fuel' ? '⛽' : m.serviceType === 'repair' ? '🔧' : '🛠️'}
                                  </div>
                                  <div>
                                     <h4 className="text-sm font-black text-gray-800 uppercase tracking-tight">{m.description}</h4>
                                     <div className="flex flex-wrap items-center gap-3 mt-1.5">
                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{new Date(m.date).toLocaleDateString()}</span>
                                        <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                        <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-md">{m.serviceType}</span>
                                        <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Provider: {m.performedBy}</span>
                                     </div>
                                  </div>
                               </div>
                               <div className="text-right">
                                  <p className="text-lg font-black text-gray-800">R{m.cost.toLocaleString()}</p>
                                  {m.attachmentUrl && <span className="text-[8px] font-black text-green-600 bg-green-50 px-1.5 py-0.5 rounded uppercase tracking-tighter">Slip Logged</span>}
                               </div>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
               </div>

               <div className="space-y-6">
                  <div className={`p-8 rounded-[2.5rem] border shadow-xl transition-all ${
                    stats.serviceDaysDiff > 90 ? 'bg-red-600 text-white border-red-500' : 
                    stats.serviceDaysDiff > 75 ? 'bg-amber-500 text-white border-amber-400' : 'bg-white border-gray-100'
                  }`}>
                     <div className="flex items-center space-x-4 mb-6">
                        <span className="text-3xl">{stats.serviceDaysDiff > 75 ? '⚠️' : '🛡️'}</span>
                        <h4 className={`text-xs font-black uppercase tracking-[0.2em] ${stats.serviceDaysDiff > 75 ? 'text-white' : 'text-gray-400'}`}>Asset Health Status</h4>
                     </div>
                     <div className="space-y-1">
                        <p className={`text-4xl font-black ${stats.serviceDaysDiff > 75 ? 'text-white' : 'text-gray-800'}`}>
                          {stats.serviceDaysDiff} Days
                        </p>
                        <p className={`text-[10px] font-black uppercase tracking-widest ${stats.serviceDaysDiff > 75 ? 'text-white/60' : 'text-gray-400'}`}>Since Last Service</p>
                     </div>
                     <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                        <span>Last Visit:</span>
                        <span>{stats.lastServiceDate}</span>
                     </div>
                  </div>

                  <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group">
                     <div className="absolute -right-4 -bottom-4 text-7xl opacity-[0.03] group-hover:rotate-12 transition-transform duration-500">💰</div>
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Fleet Investment</p>
                     <p className="text-3xl font-black text-gray-800">R{stats.totalMaintenanceCost.toLocaleString()}</p>
                     <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2 leading-relaxed">
                       This is the total amount MotoFleet has invested in maintaining this vehicle.
                     </p>
                  </div>

                  <div className="bg-gray-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                     <div className="relative z-10">
                        <h4 className="text-xs font-black uppercase tracking-[0.2em] mb-4 text-amber-500">Workshop Partners</h4>
                        <div className="space-y-4">
                           {workshops.filter(w => w.city === driver.city).slice(0, 2).map(w => (
                             <div key={w.id} className="flex items-center space-x-4 group/ws">
                                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl group-hover/ws:bg-amber-500 transition-colors">🏪</div>
                                <div className="min-w-0">
                                   <p className="text-xs font-black uppercase tracking-tight truncate">{w.name}</p>
                                   <p className="text-[9px] text-gray-400 uppercase tracking-widest truncate">{w.location}</p>
                                </div>
                             </div>
                           ))}
                        </div>
                     </div>
                     <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>

      {/* Driver Job Card Form Modal */}
      {showLogForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
           <form onSubmit={handleLogSubmit} className="bg-white rounded-[2.5rem] shadow-2xl max-w-xl w-full p-10 space-y-8 animate-in zoom-in duration-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Report Operational Cost</h3>
                  <p className="text-[10px] text-amber-600 font-black uppercase tracking-widest mt-1">Capture fuel or emergency technical events</p>
                </div>
                <button type="button" onClick={() => setShowLogForm(false)} className="text-gray-400 hover:text-gray-600 text-4xl leading-none">&times;</button>
              </div>

              <div className="space-y-6">
                 <div className="grid grid-cols-2 gap-6">
                    <div>
                       <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Expense Type</label>
                       <select 
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500 transition-all appearance-none"
                        value={newLog.serviceType}
                        onChange={e => setNewLog({...newLog, serviceType: e.target.value as any})}
                       >
                          <option value="fuel">Fueling</option>
                          <option value="repair">Emergency Repair</option>
                          <option value="oil">Oil Top-up</option>
                          <option value="other">Other Overhead</option>
                       </select>
                    </div>
                    <div>
                       <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Cost (ZAR)</label>
                       <input 
                        type="number" 
                        required 
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                        placeholder="0.00"
                        value={newLog.cost || ''}
                        onChange={e => setNewLog({...newLog, cost: Number(e.target.value)})}
                       />
                    </div>
                 </div>

                 <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Job Description</label>
                    <input 
                      type="text" 
                      required 
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                      placeholder="e.g. Full tank 95 Unleaded or Replaced front bulb"
                      value={newLog.description}
                      onChange={e => setNewLog({...newLog, description: e.target.value})}
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div>
                       <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Date of Event</label>
                       <input 
                        type="date" 
                        required 
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                        value={newLog.date}
                        onChange={e => setNewLog({...newLog, date: e.target.value})}
                       />
                    </div>
                    <div>
                       <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Proof of Payment</label>
                       <div className="relative">
                          <input type="file" ref={logFileInputRef} onChange={handleLogPhotoChange} className="hidden" accept="image/*" />
                          <button 
                            type="button" 
                            onClick={() => logFileInputRef.current?.click()}
                            className={`w-full p-4 rounded-2xl border transition-all flex items-center justify-center space-x-2 ${newLog.attachmentUrl ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-100 text-gray-400 hover:border-amber-300'}`}
                          >
                             <span>📸</span>
                             <span className="text-[10px] font-black uppercase tracking-widest">{newLog.attachmentUrl ? 'Slip Captured' : 'Attach Slip'}</span>
                          </button>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="flex gap-4 pt-4">
                 <button type="button" onClick={() => setShowLogForm(false)} className="flex-1 py-5 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase text-[10px] tracking-widest">Cancel</button>
                 <button type="submit" className="flex-[2] bg-amber-600 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-amber-100 hover:bg-amber-700 transition-all">Submit operational Report</button>
              </div>
           </form>
        </div>
      )}

      {/* Admin Fine Assignment Modal */}
      {showFineForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <form onSubmit={handleFineSubmit} className="bg-white p-8 md:p-10 rounded-[3rem] shadow-2xl max-w-lg w-full space-y-6 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b border-gray-50 pb-4">
               <div>
                 <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Assign Traffic Notice</h3>
                 <p className="text-[10px] text-red-500 font-black uppercase tracking-widest mt-1">Direct Liability Link: {driver.name}</p>
               </div>
               <button type="button" onClick={() => setShowFineForm(false)} className="text-gray-400 hover:text-gray-900 text-4xl leading-none">&times;</button>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Notice Number</label>
                <input 
                  required 
                  className="w-full border-gray-100 rounded-xl p-3 bg-gray-50 text-sm font-bold" 
                  value={fineFormData.noticeNumber} 
                  onChange={e => setFineFormData({...fineFormData, noticeNumber: e.target.value})}
                  placeholder="e.g. INF-2023-XX"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Amount (R)</label>
                  <input 
                    type="number" 
                    required 
                    className="w-full border-gray-100 rounded-xl p-3 bg-gray-50 text-sm font-bold" 
                    value={fineFormData.amount || ''} 
                    onChange={e => setFineFormData({...fineFormData, amount: Number(e.target.value)})}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Date</label>
                  <input 
                    type="date" 
                    required 
                    className="w-full border-gray-100 rounded-xl p-3 bg-gray-50 text-sm font-bold" 
                    value={fineFormData.date} 
                    onChange={e => setFineFormData({...fineFormData, date: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Infringement Narrative</label>
                <textarea 
                  required 
                  className="w-full border-gray-100 rounded-xl p-3 bg-gray-50 text-sm font-bold resize-none h-20" 
                  value={fineFormData.description} 
                  onChange={e => setFineFormData({...fineFormData, description: e.target.value})}
                  placeholder="e.g. Disobeyed stop sign at Cnr Main & 4th"
                />
              </div>
            </div>
            <button type="submit" className="w-full bg-red-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">Confirm Liability Link</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default DriverProfile;
