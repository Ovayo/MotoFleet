
import React, { useMemo, useRef, useState } from 'react';
import { Driver, Payment, Bike, MaintenanceRecord, Workshop, TrafficFine, AccidentReport } from '../types';

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
  isAdminViewing = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logFileInputRef = useRef<HTMLInputElement>(null);
  const accidentFileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'portfolio' | 'service'>('portfolio');
  const [showLogForm, setShowLogForm] = useState(false);
  const [showFineForm, setShowFineForm] = useState(false);
  const [showAccidentForm, setShowAccidentForm] = useState(false);

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
    const driverPayments = (payments || []).filter(p => p?.driverId === driver.id);
    const targetThisWeek = driver.weeklyTarget || weeklyTarget;
    const paidThisWeek = driverPayments.filter(p => p.weekNumber === CURRENT_WEEK).reduce((acc, p) => acc + (p?.amount || 0), 0);
    const weeklyStanding = paidThisWeek - targetThisWeek;
    const driverFines = (fines || []).filter(f => f?.driverId === driver.id);
    const unpaidFines = driverFines.filter(f => f?.status === 'unpaid').reduce((acc, f) => acc + (f?.amount || 0), 0);
    const driverAccidents = (accidents || []).filter(a => a.driverId === driver.id);

    return { 
      paidThisWeek, targetThisWeek, weeklyStanding, totalUnpaidFines: unpaidFines, 
      accidentsCount: driverAccidents.length, currentWeek: CURRENT_WEEK, driverFines, driverAccidents
    };
  }, [payments, fines, accidents, driver.id, driver.weeklyTarget, weeklyTarget]);

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
    alert("Accident reported successfully. The management team will review it immediately.");
  };

  const requestSupport = () => {
    const message = `Emergency Support Required: Driver ${driver.name}, Vehicle ${bike?.licenseNumber}. Assistance needed.`;
    window.open(`https://wa.me/27682170330?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="w-full space-y-6 pb-20 md:pb-8">
      {isAdminViewing && (
        <div className="bg-blue-600 text-white p-3 rounded-2xl mb-4 flex items-center justify-between shadow-xl animate-in slide-in-from-top-4">
           <div className="flex items-center space-x-3">
              <span className="text-xl">🕵️</span>
              <p className="text-[10px] font-black uppercase tracking-widest">Administrator Preview Active</p>
           </div>
           <button onClick={() => setShowFineForm(true)} className="bg-white/20 hover:bg-white/40 px-3 py-1 rounded-lg text-[9px] font-black uppercase transition-colors">+ Assign Fine</button>
        </div>
      )}

      <div className="relative overflow-hidden rounded-[2.5rem] shadow-2xl shadow-green-100/50 p-8 md:p-12 text-white bg-gradient-to-br from-green-700 to-green-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="flex items-center space-x-8">
             <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-[2.5rem] bg-white/20 backdrop-blur-xl border-4 border-white/30 overflow-hidden flex items-center justify-center font-black text-3xl cursor-pointer" onClick={() => fileInputRef.current?.click()}>
               {driver.profilePictureUrl ? <img src={driver.profilePictureUrl} className="w-full h-full object-cover" /> : (driver.name || '??').substring(0, 2).toUpperCase()}
               <input type="file" ref={fileInputRef} onChange={handleProfilePhotoChange} accept="image/*" className="hidden" />
             </div>
             <div>
              <div className="inline-flex items-center bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20 mb-2">🏁 {stats.weeklyStanding >= 0 ? 'Good Standing' : 'Settlement Required'}</div>
              <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">Welcome back, {driver.name.split(' ')[0]}</h2>
            </div>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button onClick={() => setShowAccidentForm(true)} className="bg-red-500/20 backdrop-blur-md border border-red-400/50 px-6 py-4 rounded-[1.8rem] font-black uppercase text-[10px] tracking-widest hover:bg-red-500 transition-all">🚨 Report Accident</button>
            <button onClick={requestSupport} className="bg-white text-green-700 px-8 py-4 rounded-[1.8rem] font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-gray-100 flex items-center justify-center">🆘 Support</button>
          </div>
        </div>
      </div>

      <div className="flex bg-white p-2 rounded-3xl border border-gray-100 shadow-sm w-full md:w-fit mx-auto sticky top-24 z-30 backdrop-blur-md bg-white/80">
        <button onClick={() => setActiveTab('portfolio')} className={`px-10 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'portfolio' ? 'bg-green-600 text-white shadow-lg' : 'text-gray-400'}`}>💰 Portfolio</button>
        <button onClick={() => setActiveTab('service')} className={`px-10 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'service' ? 'bg-amber-600 text-white shadow-lg' : 'text-gray-400'}`}>🔧 Service</button>
      </div>

      {activeTab === 'portfolio' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Weekly Standing (W{stats.currentWeek})</p>
              <h3 className={`text-4xl font-black ${stats.weeklyStanding >= 0 ? 'text-green-600' : 'text-red-500'}`}>R{Math.abs(stats.weeklyStanding)}</h3>
              <p className="text-[9px] text-gray-400 font-black uppercase mt-1">Paid: R{stats.paidThisWeek} / Target: R{stats.targetThisWeek}</p>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Active Incident Log</p>
              <h3 className={`text-4xl font-black ${stats.accidentsCount > 0 ? 'text-red-500' : 'text-gray-800'}`}>{stats.accidentsCount} Reports</h3>
              <p className="text-[9px] text-gray-400 font-black uppercase mt-1">Safe Driving Record Status</p>
            </div>
            <div className="bg-gray-900 p-8 rounded-[2.5rem] shadow-xl text-white">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Unpaid Notices</p>
              <h3 className="text-4xl font-black text-red-500">R{stats.totalUnpaidFines}</h3>
              <p className="text-[9px] text-gray-500 font-black uppercase mt-1">Settlement required by weekend</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden p-8">
           <div className="flex justify-between items-center mb-8">
              <h3 className="font-black text-gray-800 uppercase text-xs tracking-widest">Service Hub</h3>
              <button onClick={() => setShowLogForm(true)} className="bg-amber-600 text-white px-6 py-2.5 rounded-xl font-black uppercase text-[9px] tracking-widest">+ Log Maintenance</button>
           </div>
           {/* Maintenance list logic similar to existing would go here */}
        </div>
      )}

      {/* Accident Report Modal */}
      {showAccidentForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
           <form onSubmit={handleAccidentSubmit} className="bg-white rounded-[3rem] shadow-2xl max-w-2xl w-full p-10 space-y-8 animate-in zoom-in duration-300">
              <div className="flex justify-between items-center border-b border-gray-50 pb-6">
                 <div>
                   <h3 className="text-2xl font-black text-red-600 uppercase tracking-tight">Accident Report Terminal</h3>
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
                       <button type="button" onClick={() => accidentFileInputRef.current?.click()} className={`w-full p-5 rounded-2xl border-2 border-dashed transition-all flex items-center justify-center space-x-3 ${accidentFormData.attachmentUrl ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-400 hover:border-red-400'}`}>
                          <span>📸</span>
                          <span className="text-[10px] font-black uppercase tracking-widest">{accidentFormData.attachmentUrl ? 'Photos Attached' : 'Capture Scene Evidence'}</span>
                       </button>
                    </div>
                 </div>
              </div>

              <button type="submit" className="w-full bg-red-600 text-white py-6 rounded-[2rem] font-black uppercase text-[11px] tracking-widest shadow-2xl shadow-red-200 hover:bg-red-700 transition-all active:scale-95">Official Incident Dispatch</button>
           </form>
        </div>
      )}

      {/* Existing form placeholders */}
      {showLogForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
           {/* Add maintenance log logic here */}
           <button onClick={() => setShowLogForm(false)} className="text-white">Close</button>
        </div>
      )}
    </div>
  );
};

export default DriverProfile;
