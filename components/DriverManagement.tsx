
import React, { useState, useRef, useMemo } from 'react';
import { Driver, Bike, Payment, TrafficFine } from '../types';

interface DriverManagementProps {
  drivers: Driver[];
  setDrivers: React.Dispatch<React.SetStateAction<Driver[]>>;
  bikes: Bike[];
  payments: Payment[];
  fines: TrafficFine[];
  onAddFine: (fine: Omit<TrafficFine, 'id'>) => void;
  weeklyTarget: number;
}

const DriverManagement: React.FC<DriverManagementProps> = ({ drivers, setDrivers, bikes, payments, fines, onAddFine, weeklyTarget }) => {
  const [editingDriverId, setEditingDriverId] = useState<string | null>(null);
  const [isAddingDriver, setIsAddingDriver] = useState(false);
  const [isVerifying, setIsVerifying] = useState<string | null>(null);
  const [showFineForm, setShowFineForm] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<Omit<Driver, 'id'>>({
    name: '',
    contact: '',
    nationality: '',
    address: '',
    idNumber: '',
    city: '',
    notes: '',
    licenseExpiry: '',
    pdpExpiry: '',
    contactVerified: false,
    profilePictureUrl: '',
    weeklyTarget: 650,
    isArchived: false
  });

  const [fineFormData, setFineFormData] = useState<Omit<TrafficFine, 'id'>>({
    bikeId: '',
    driverId: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    noticeNumber: '',
    description: '',
    status: 'unpaid'
  });

  const weeksInCurrentMonth = useMemo(() => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const days = lastDay.getDate();
    return days > 28 ? 5 : 4;
  }, []);

  const getMonthlyDue = (driverTarget?: number) => weeksInCurrentMonth * (driverTarget || weeklyTarget);

  const getFullBalance = (driver: Driver) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const totalPaidInMonth = payments
      .filter(p => {
        const pDate = new Date(p.date);
        return p.driverId === driver.id && 
               pDate.getMonth() === currentMonth && 
               pDate.getFullYear() === currentYear;
      })
      .reduce((sum, p) => sum + p.amount, 0);
    
    const totalDue = getMonthlyDue(driver.weeklyTarget);
    return totalPaidInMonth - totalDue;
  };

  const getUnpaidFines = (driverId: string) => {
    return fines
      .filter(f => f.driverId === driverId && f.status === 'unpaid')
      .reduce((sum, f) => sum + f.amount, 0);
  };

  const getPaymentStatus = (driver: Driver) => {
    const balance = getFullBalance(driver);
    if (balance >= 0) return 'fully-paid';
    const totalPaidInMonth = getMonthlyDue(driver.weeklyTarget) + balance;
    if (totalPaidInMonth > 0) return 'partial';
    return 'overdue';
  };

  const getExpiryStatus = (expiry?: string) => {
    if (!expiry) return 'unknown';
    const exp = new Date(expiry);
    const now = new Date();
    const diff = (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    if (diff < 0) return 'expired';
    if (diff < 30) return 'warning';
    return 'valid';
  };

  const toggleArchiveDriver = (driverId: string) => {
    const driver = drivers.find(d => d.id === driverId);
    if (!driver) return;
    const action = driver.isArchived ? 'restore' : 'archive';
    if (window.confirm(`Are you sure you want to ${action} ${driver.name}?`)) {
      setDrivers(prev => prev.map(d => d.id === driverId ? { ...d, isArchived: !d.isArchived } : d));
    }
  };

  const verifyEnatis = (driverId: string) => {
    setIsVerifying(driverId);
    setTimeout(() => {
      setDrivers(prev => prev.map(d => d.id === driverId ? { ...d, enatisVerified: true } : d));
      setIsVerifying(null);
    }, 2000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'weeklyTarget' ? Number(value) : value 
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, profilePictureUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setFormData(prev => ({ ...prev, profilePictureUrl: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDriverId) {
      setDrivers(prev => prev.map(d => d.id === editingDriverId ? { ...formData, id: editingDriverId } : d));
      setEditingDriverId(null);
    } else if (isAddingDriver) {
      const newDriver: Driver = { ...formData, id: `d-${Date.now()}`, enatisVerified: false, contactVerified: false };
      setDrivers(prev => [...prev, newDriver]);
      setIsAddingDriver(false);
    }
  };

  const handleFineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddFine(fineFormData);
    setShowFineForm(null);
    setFineFormData({
      bikeId: '',
      driverId: '',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      noticeNumber: '',
      description: '',
      status: 'unpaid'
    });
  };

  const sendReminder = (driver: Driver) => {
    const balance = getFullBalance(driver);
    const unpaidFineTotal = getUnpaidFines(driver.id);
    const bike = bikes.find(b => b.assignedDriverId === driver.id);
    const payStatus = getPaymentStatus(driver);
    const monthlyDue = getMonthlyDue(driver.weeklyTarget);
    
    let message = `Hello ${driver.name}, this is an official monthly payment update from MotoFleet Management. `;
    
    if (payStatus === 'fully-paid' && unpaidFineTotal === 0) {
      message += `\n\nYour account is currently in good standing. You have fully paid your R${monthlyDue} target for this month. `;
      message += `Keep up the excellent work! Safe driving!`;
    } else {
      if (payStatus === 'overdue') {
        message += `\n\nYour account for this month is currently OVERDUE by R${Math.abs(balance)}. `;
      } else if (payStatus === 'partial') {
        message += `\n\nYour account for this month is in partial arrears by R${Math.abs(balance)}. `;
      }
      
      if (unpaidFineTotal > 0) {
        message += `\n\nIn addition, you have R${unpaidFineTotal} in unpaid traffic fines recorded in your name. `;
      }

      const totalDebt = Math.abs(balance) + unpaidFineTotal;
      message += `\nTotal Outstanding: R${totalDebt}. `;
      message += `Target Monthly Rental: R${monthlyDue}. `;
      
      if (bike) message += `\nVehicle: ${bike.licenseNumber}`;
      message += `\n\nPlease ensure the outstanding balance is settled immediately to avoid service interruption. Contact us if you have already made payment.`;
    }
    
    const encodedMsg = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${driver.contact.replace(/\s+/g, '')}?text=${encodedMsg}`;
    window.open(whatsappUrl, '_blank');
  };

  const displayDrivers = useMemo(() => {
    return drivers.filter(d => !!d.isArchived === showArchived);
  }, [drivers, showArchived]);

  // Updated Form as a Lightbox Modal
  const DriverModal = () => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[150] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in duration-300">
        <form onSubmit={handleSubmit}>
          <div className="p-8 md:p-10 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
            <div>
              <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight">
                {editingDriverId ? 'Edit Operator Profile' : 'New Operator Onboarding'}
              </h3>
              <p className="text-[10px] text-blue-500 font-black uppercase tracking-[0.2em] mt-1">Registry Compliance System</p>
            </div>
            <button 
              type="button" 
              onClick={() => { setIsAddingDriver(false); setEditingDriverId(null); }} 
              className="text-gray-400 hover:text-gray-900 text-4xl leading-none transition-colors"
            >
              &times;
            </button>
          </div>
          
          <div className="p-8 md:p-10 max-h-[70vh] overflow-y-auto no-scrollbar">
            <div className="flex flex-col items-center mb-10">
              <div className="relative group">
                <div className="w-32 h-32 rounded-[2.5rem] bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-200 group-hover:border-blue-300 transition-all shadow-inner">
                  {formData.profilePictureUrl ? (
                    <img src={formData.profilePictureUrl} alt="Profile Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl opacity-20">👤</span>
                  )}
                  <div 
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <span className="text-white font-black uppercase text-[10px] tracking-widest text-center px-4">Update Digital Avatar</span>
                  </div>
                </div>
                {formData.profilePictureUrl && (
                  <button type="button" onClick={removePhoto} className="absolute -top-2 -right-2 bg-red-500 text-white w-8 h-8 rounded-full shadow-lg flex items-center justify-center text-xl hover:bg-red-600 transition-all border-2 border-white">&times;</button>
                )}
                <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute -bottom-2 -right-2 bg-blue-600 text-white w-10 h-10 rounded-2xl shadow-xl flex items-center justify-center text-lg hover:bg-blue-700 transition-all border-4 border-white">📷</button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Full Legal Name</label>
                <input name="name" value={formData.name} onChange={handleInputChange} required className="w-full border-gray-100 rounded-2xl p-4 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-sm" placeholder="e.g. Sipho Nkosi" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Mobile Terminal</label>
                <input name="contact" value={formData.contact} onChange={handleInputChange} required className="w-full border-gray-100 rounded-2xl p-4 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-sm" placeholder="072 123 4567" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Rental Tier Target (R)</label>
                <select name="weeklyTarget" value={formData.weeklyTarget} onChange={handleInputChange} className="w-full border-gray-100 rounded-2xl p-4 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-black text-sm appearance-none cursor-pointer">
                  <option value={600}>R600 (Lower Tier / CTN / EL)</option>
                  <option value={650}>R650 (Standard JHB Tier)</option>
                  <option value={700}>R700 (Premium Fleet)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">National ID / Passport</label>
                <input name="idNumber" value={formData.idNumber} onChange={handleInputChange} required className="w-full border-gray-100 rounded-2xl p-4 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-sm" placeholder="ID Number" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">License Expiry</label>
                <input type="date" name="licenseExpiry" value={formData.licenseExpiry} onChange={handleInputChange} required className="w-full border-gray-100 rounded-2xl p-4 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Region</label>
                <select name="city" value={formData.city} onChange={handleInputChange} required className="w-full border-gray-100 rounded-2xl p-4 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-sm appearance-none">
                  <option value="">Select Operational Hub...</option>
                  <option value="JHB">Johannesburg</option>
                  <option value="CTN">Cape Town</option>
                  <option value="EL">East London</option>
                </select>
              </div>
              <div className="md:col-span-2 space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Residential Coordinates</label>
                <input name="address" value={formData.address} onChange={handleInputChange} required className="w-full border-gray-100 rounded-2xl p-4 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-sm" placeholder="Full residential address" />
              </div>
            </div>
          </div>
          
          <div className="p-8 bg-gray-50 border-t border-gray-100 flex flex-col md:flex-row gap-4">
            <button 
              type="button" 
              onClick={() => { setIsAddingDriver(false); setEditingDriverId(null); }} 
              className="flex-1 py-4 bg-white border border-gray-200 text-gray-400 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-100 transition-all"
            >
              Abort Changes
            </button>
            <button 
              type="submit" 
              className="flex-[2] bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
            >
              {editingDriverId ? 'Commit Profile Update' : 'Authorize New Operator'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tight uppercase">Operational Personnel</h2>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
            {showArchived ? `Viewing ${displayDrivers.length} Deactivated Profiles` : `Managing ${displayDrivers.length} Active Logistics Operators`}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setShowArchived(!showArchived)}
            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border shadow-sm ${showArchived ? 'bg-gray-900 text-white border-gray-800' : 'bg-white text-gray-400 border-gray-100 hover:text-gray-600'}`}
          >
            {showArchived ? 'View Active Fleet' : 'View Archived Registry'}
          </button>
          {!isAddingDriver && !editingDriverId && (
            <button 
              onClick={() => {
                setFormData({
                  name: '',
                  contact: '',
                  nationality: '',
                  address: '',
                  idNumber: '',
                  city: '',
                  notes: '',
                  licenseExpiry: '',
                  pdpExpiry: '',
                  contactVerified: false,
                  profilePictureUrl: '',
                  weeklyTarget: 650,
                  isArchived: false
                });
                setIsAddingDriver(true);
              }}
              className="bg-blue-600 text-white px-8 py-3 rounded-2xl hover:bg-blue-700 transition-all font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-100 flex items-center space-x-3"
            >
              <span className="text-xl">+</span>
              <span>Enroll Driver</span>
            </button>
          )}
        </div>
      </div>

      {(isAddingDriver || editingDriverId) && <DriverModal />}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {displayDrivers.map(driver => {
          const assignedBike = bikes.find(b => b.assignedDriverId === driver.id);
          const payStatus = getPaymentStatus(driver);
          const balance = getFullBalance(driver);
          const unpaidFineTotal = getUnpaidFines(driver.id);
          const licStatus = getExpiryStatus(driver.licenseExpiry);
          const initials = driver.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

          const statusColors = {
            'fully-paid': 'bg-green-500',
            'partial': 'bg-amber-500',
            'overdue': 'bg-red-500'
          };

          const statusGradient = {
            'fully-paid': 'from-green-500 to-emerald-600',
            'partial': 'from-amber-400 to-orange-500',
            'overdue': 'from-red-500 to-orange-600'
          };

          const statusLabels = {
            'fully-paid': 'Settled Standing',
            'partial': 'Partial Arrears',
            'overdue': 'Critical Overdue'
          };

          const monthlyDue = getMonthlyDue(driver.weeklyTarget);
          const totalPaidInMonth = monthlyDue + balance;
          const progressPercent = Math.max(0, Math.min(100, (totalPaidInMonth / monthlyDue) * 100));

          return (
            <div key={driver.id} className={`bg-white rounded-[3rem] shadow-sm border border-gray-100 group relative flex flex-col p-8 transition-all hover:shadow-2xl hover:shadow-gray-100 ${driver.isArchived ? 'opacity-60' : ''}`}>
              <div className="flex justify-between items-start mb-8">
                <div className="flex -space-x-1">
                  {driver.isArchived ? (
                    <div className="bg-gray-800 text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border-2 border-white shadow-sm">Archived Profile</div>
                  ) : (
                    <>
                      {driver.enatisVerified ? (
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg border border-blue-100 shadow-sm" title="eNaTIS Verified">🛡️</div>
                      ) : (
                        <button onClick={() => verifyEnatis(driver.id)} className="w-10 h-10 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center text-[10px] font-black border border-gray-100 hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                          {isVerifying === driver.id ? '...' : 'VER'}
                        </button>
                      )}
                    </>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  {!driver.isArchived && (
                    <button 
                      onClick={() => {
                        setShowFineForm(driver.id);
                        setFineFormData(prev => ({ ...prev, driverId: driver.id, bikeId: assignedBike?.id || '' }));
                      }}
                      className="w-11 h-11 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                      title="Attach Infringement"
                    >
                      🚔
                    </button>
                  )}
                  <button 
                    onClick={() => { 
                      setEditingDriverId(driver.id); 
                      setFormData({ ...driver, id: undefined } as any); 
                    }}
                    className="w-11 h-11 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                    title="Modify Registry"
                  >
                    ✏️
                  </button>
                  <button 
                    onClick={() => toggleArchiveDriver(driver.id)}
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 shadow-sm ${driver.isArchived ? 'bg-green-50 text-green-600 hover:bg-green-600 hover:text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-800 hover:text-white'}`}
                    title={driver.isArchived ? "Restore Profile" : "Archive Operator"}
                  >
                    {driver.isArchived ? '📤' : '📥'}
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-6 mb-10">
                <div className="relative shrink-0">
                  <div className={`w-20 h-20 rounded-[2.2rem] flex items-center justify-center font-black text-2xl shadow-xl overflow-hidden bg-gradient-to-br ${statusGradient[payStatus]} text-white border-4 border-white`}>
                    {driver.profilePictureUrl ? (
                      <img src={driver.profilePictureUrl} alt={driver.name} className="w-full h-full object-cover" />
                    ) : (
                      initials
                    )}
                  </div>
                  {!driver.isArchived && (
                    <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-white ${statusColors[payStatus]} ${payStatus === 'overdue' ? 'animate-pulse shadow-lg shadow-red-500/50' : ''}`}></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-gray-800 text-2xl leading-tight uppercase tracking-tight truncate">
                    {driver.name}
                  </h3>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className="text-blue-500 font-black text-[10px] uppercase tracking-widest">Hub: {driver.city}</span>
                    <span className="bg-gray-100 px-2.5 py-0.5 rounded-full text-[9px] font-black text-gray-500 uppercase">Target: R{driver.weeklyTarget || 650}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4 mb-10 flex-grow">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-[1.5rem] border border-gray-100/50">
                  <div className="flex items-center space-x-4">
                    <span className="text-xl opacity-40">📞</span>
                    <span className="text-sm font-bold text-gray-800">{driver.contact}</span>
                  </div>
                  <button onClick={() => window.open(`tel:${driver.contact}`)} className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:underline">Dial</button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-5 rounded-[2rem] border transition-all ${licStatus === 'valid' ? 'bg-green-50/30 border-green-100' : licStatus === 'warning' ? 'bg-amber-50 border-amber-100' : 'bg-red-50 border-red-100'}`}>
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2">Technical License</p>
                    <p className={`text-xs font-black uppercase ${licStatus === 'expired' ? 'text-red-600' : 'text-gray-800'}`}>
                      {driver.licenseExpiry ? new Date(driver.licenseExpiry).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : 'NOT FOUND'}
                    </p>
                  </div>
                  <div className={`p-5 rounded-[2rem] border bg-blue-50/20 border-blue-50`}>
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2">Rental Target</p>
                    <p className="text-xs font-black text-blue-700 uppercase">R{driver.weeklyTarget || 650}</p>
                    <p className="text-[7px] font-bold text-blue-400 uppercase mt-1">Expected R{monthlyDue}</p>
                  </div>
                </div>

                {!driver.isArchived && (
                  <div className={`p-6 rounded-[2rem] border flex flex-col space-y-3 transition-colors ${payStatus === 'fully-paid' ? 'bg-green-50/50 border-green-100' : payStatus === 'partial' ? 'bg-amber-50/50 border-amber-100' : 'bg-red-50/50 border-red-100'}`}>
                    <div className="flex items-center justify-between">
                      <p className={`text-[9px] font-black uppercase tracking-[0.15em] ${payStatus === 'fully-paid' ? 'text-green-600' : payStatus === 'partial' ? 'text-amber-600' : 'text-red-600'}`}>Ledger Standing</p>
                      <p className={`text-[10px] font-black uppercase ${payStatus === 'fully-paid' ? 'text-green-700' : payStatus === 'partial' ? 'text-amber-700' : 'text-red-700'}`}>{statusLabels[payStatus]}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs font-black">
                        <span className="text-gray-400 uppercase text-[9px] tracking-widest">Net Surplus/Deficit</span>
                        <div className="flex flex-col items-end">
                          <span className={balance >= 0 ? 'text-green-600' : 'text-red-600'}>{balance >= 0 ? `+R${balance}` : `R${balance}`}</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden shadow-inner">
                        <div className={`h-full transition-all duration-700 ${payStatus === 'partial' ? 'bg-amber-500' : payStatus === 'overdue' ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${progressPercent}%` }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {!driver.isArchived && (
                <button 
                  onClick={() => sendReminder(driver)}
                  className={`w-full text-white text-[11px] font-black uppercase tracking-[0.25em] py-6 rounded-[1.8rem] transition-all shadow-2xl flex items-center justify-center group/btn active:scale-95 ${
                    payStatus === 'overdue' || unpaidFineTotal > 0 ? 'bg-red-600 hover:bg-red-700 shadow-red-200' : 
                    payStatus === 'partial' ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-200' :
                    'bg-gray-900 hover:bg-black shadow-gray-300'
                  }`}
                >
                  <span className="mr-4 text-xl transition-transform group-hover/btn:scale-125">💬</span> 
                  {payStatus === 'fully-paid' && unpaidFineTotal === 0 ? 'Send Status Heartbeat' : 'Dispatch Arrears Alert'}
                </button>
              )}
            </div>
          );
        })}
      </div>
      
      {showFineForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[160] flex items-center justify-center p-4">
          <form onSubmit={handleFineSubmit} className="bg-white p-10 rounded-[3rem] shadow-2xl max-w-lg w-full space-y-8 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b border-gray-50 pb-6">
               <div>
                 <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Assign Infringement</h3>
                 <p className="text-[10px] text-red-500 font-black uppercase tracking-widest mt-1">Official Liability Linkage</p>
               </div>
               <button type="button" onClick={() => setShowFineForm(null)} className="text-gray-400 hover:text-gray-900 text-5xl leading-none">&times;</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Notice Serial</label>
                <input required className="w-full border-gray-100 rounded-2xl p-4 bg-gray-50 text-sm font-bold outline-none focus:ring-2 focus:ring-red-500 transition-all" value={fineFormData.noticeNumber} onChange={e => setFineFormData({...fineFormData, noticeNumber: e.target.value})} placeholder="e.g. INF-991" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Liability Amount (R)</label>
                <input type="number" required className="w-full border-gray-100 rounded-2xl p-4 bg-gray-50 text-sm font-bold outline-none focus:ring-2 focus:ring-red-500 transition-all" value={fineFormData.amount || ''} onChange={e => setFineFormData({...fineFormData, amount: Number(e.target.value)})} placeholder="0.00" />
              </div>
            </div>
            <button type="submit" className="w-full bg-red-600 text-white py-5 rounded-[1.8rem] font-black uppercase text-[11px] tracking-widest shadow-2xl shadow-red-200 hover:bg-red-700 active:scale-95 transition-all">Finalize Liability Attribution</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default DriverManagement;
