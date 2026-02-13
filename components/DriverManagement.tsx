
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
  
  const [verifyingContactId, setVerifyingContactId] = useState<string | null>(null);
  const [otpStep, setOtpStep] = useState<'idle' | 'sending' | 'input'>('idle');
  const [otpValue, setOtpValue] = useState('');
  
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

  const startContactVerification = (driverId: string) => {
    setVerifyingContactId(driverId);
    setOtpStep('sending');
    setTimeout(() => {
      setOtpStep('input');
    }, 1500);
  };

  const completeContactVerification = () => {
    if (otpValue.length === 4) {
      setDrivers(prev => prev.map(d => d.id === verifyingContactId ? { ...d, contactVerified: true } : d));
      setVerifyingContactId(null);
      setOtpStep('idle');
      setOtpValue('');
    }
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

  const DriverForm = () => (
    <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-xl border border-blue-100 col-span-full mb-8 animate-in slide-in-from-top-4 duration-300">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">{editingDriverId ? 'Update Driver Profile' : 'Register New Driver'}</h3>
        <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded">eNaTIS Compliant Form</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-3 flex flex-col items-center mb-8">
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
                <span className="text-white font-black uppercase text-[10px] tracking-widest">Change Photo</span>
              </div>
            </div>
            {formData.profilePictureUrl && (
              <button type="button" onClick={removePhoto} className="absolute -top-2 -right-2 bg-red-500 text-white w-7 h-7 rounded-full shadow-lg flex items-center justify-center text-lg hover:bg-red-600 transition-all border-2 border-white">&times;</button>
            )}
            <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute -bottom-2 -right-2 bg-blue-600 text-white w-9 h-9 rounded-2xl shadow-xl flex items-center justify-center text-sm hover:bg-blue-700 transition-all border-4 border-white">📷</button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-4">Driver Profile Asset</p>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Full Name</label>
          <input name="name" value={formData.name} onChange={handleInputChange} required className="w-full border-gray-100 rounded-xl p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="e.g. John Doe" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Contact Number</label>
          <input name="contact" value={formData.contact} onChange={handleInputChange} required className="w-full border-gray-100 rounded-xl p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="082 123 4567" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Weekly Rental Target (R)</label>
          <select name="weeklyTarget" value={formData.weeklyTarget} onChange={handleInputChange} className="w-full border-gray-100 rounded-xl p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold">
            <option value={600}>R600 (East London / CTN)</option>
            <option value={650}>R650 (Standard JHB)</option>
            <option value={700}>R700 (Premium)</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">ID / Passport Number</label>
          <input name="idNumber" value={formData.idNumber} onChange={handleInputChange} required className="w-full border-gray-100 rounded-xl p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Identification Number" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">City</label>
          <input name="city" value={formData.city} onChange={handleInputChange} required className="w-full border-gray-100 rounded-xl p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="e.g. Johannesburg" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">License Expiry</label>
          <input type="date" name="licenseExpiry" value={formData.licenseExpiry} onChange={handleInputChange} required className="w-full border-gray-100 rounded-xl p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
        </div>
        <div className="lg:col-span-3 space-y-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Residential Address</label>
          <input name="address" value={formData.address} onChange={handleInputChange} required className="w-full border-gray-100 rounded-xl p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Street name, suburb, city" />
        </div>
      </div>
      <div className="flex justify-end space-x-3 mt-8">
        <button type="button" onClick={() => { setIsAddingDriver(false); setEditingDriverId(null); }} className="px-6 py-3 font-bold text-gray-400 hover:text-gray-600 uppercase tracking-widest text-xs">Discard</button>
        <button type="submit" className="bg-blue-600 text-white px-10 py-3 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">
          {editingDriverId ? 'Update Profile' : 'Complete Registration'}
        </button>
      </div>
    </form>
  );

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tight uppercase">Fleet Operators</h2>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
            {showArchived ? `Viewing ${displayDrivers.length} Past Operators` : `Managing ${displayDrivers.length} Active Personnel`}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setShowArchived(!showArchived)}
            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all border ${showArchived ? 'bg-gray-800 text-white' : 'bg-white text-gray-400 border-gray-100'}`}
          >
            {showArchived ? 'View Active' : 'View Archived'}
          </button>
          {!isAddingDriver && !editingDriverId && (
            <button 
              onClick={() => setIsAddingDriver(true)}
              className="bg-blue-600 text-white px-8 py-3 rounded-2xl hover:bg-blue-700 transition-all font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-100 flex items-center space-x-2"
            >
              <span>+</span>
              <span>Register Driver</span>
            </button>
          )}
        </div>
      </div>

      {(isAddingDriver || editingDriverId) && <DriverForm />}

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
            'fully-paid': 'Fully Paid',
            'partial': 'Partial Payment',
            'overdue': 'Overdue'
          };

          const monthlyDue = getMonthlyDue(driver.weeklyTarget);
          const totalPaidInMonth = monthlyDue + balance;
          const progressPercent = Math.max(0, Math.min(100, (totalPaidInMonth / monthlyDue) * 100));

          return (
            <div key={driver.id} className={`bg-white rounded-[2.5rem] shadow-sm border border-gray-100 group relative flex flex-col p-8 transition-all hover:shadow-xl hover:shadow-gray-100 ${driver.isArchived ? 'opacity-60 grayscale-[0.5]' : ''}`}>
              <div className="flex justify-between items-start mb-6">
                <div className="flex -space-x-1">
                  {driver.isArchived ? (
                    <div className="w-8 h-8 rounded-full bg-gray-800 text-white flex items-center justify-center text-[10px] font-black border-2 border-white">ARC</div>
                  ) : (
                    <>
                      {driver.enatisVerified ? (
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm border-2 border-white" title="eNaTIS Verified">🛡️</div>
                      ) : (
                        <button onClick={() => verifyEnatis(driver.id)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[8px] font-black border-2 border-white hover:bg-blue-600 hover:text-white transition-all">
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
                      className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                      title="Attach Fine"
                    >
                      🚔
                    </button>
                  )}
                  <button 
                    onClick={() => { setEditingDriverId(driver.id); setFormData({ ...driver, id: undefined } as any); }}
                    className="w-10 h-10 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                  >
                    ✏️
                  </button>
                  <button 
                    onClick={() => toggleArchiveDriver(driver.id)}
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 shadow-sm ${driver.isArchived ? 'bg-green-50 text-green-600 hover:bg-green-600 hover:text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-800 hover:text-white'}`}
                    title={driver.isArchived ? "Restore Operator" : "Archive Operator"}
                  >
                    {driver.isArchived ? '📤' : '📥'}
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-5 mb-8">
                <div className="relative">
                  <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center font-black text-xl shadow-lg overflow-hidden bg-gradient-to-br ${statusGradient[payStatus]} text-white`}>
                    {driver.profilePictureUrl ? (
                      <img src={driver.profilePictureUrl} alt={driver.name} className="w-full h-full object-cover" />
                    ) : (
                      initials
                    )}
                  </div>
                  {!driver.isArchived && (
                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-white ${statusColors[payStatus]} ${payStatus === 'overdue' ? 'animate-pulse' : ''}`}></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-gray-800 text-xl leading-tight uppercase tracking-tight flex items-center">
                    {!driver.isArchived && <span className={`w-3 h-3 rounded-full mr-2.5 shrink-0 shadow-sm border-2 border-white ${statusColors[payStatus]} ${payStatus === 'overdue' ? 'animate-pulse' : ''}`} title={statusLabels[payStatus]}></span>}
                    <span className="truncate">{driver.name}</span>
                  </h3>
                  <div className="flex items-center text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                    <span className="text-blue-500 mr-2">📍 {driver.city}</span>
                    <span className="bg-gray-100 px-2 py-0.5 rounded-full text-[9px]">Target: R{driver.weeklyTarget || 650}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4 mb-8 flex-grow">
                <div className="group/contact flex items-center justify-between p-3 bg-gray-50/50 rounded-2xl hover:bg-blue-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg opacity-40">📞</span>
                    <span className="text-sm font-bold text-gray-700">{driver.contact}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className={`p-4 rounded-3xl border ${licStatus === 'valid' ? 'bg-green-50/50 border-green-100' : licStatus === 'warning' ? 'bg-amber-50 border-amber-100' : 'bg-red-50 border-red-100'}`}>
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Driver License</p>
                    <p className={`text-xs font-black ${licStatus === 'expired' ? 'text-red-600' : 'text-gray-800'}`}>
                      {driver.licenseExpiry ? new Date(driver.licenseExpiry).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : 'NONE'}
                    </p>
                  </div>
                  <div className={`p-4 rounded-3xl border bg-blue-50/30 border-blue-50`}>
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Weekly Rate</p>
                    <p className="text-xs font-black text-blue-700">R{driver.weeklyTarget || 650}</p>
                    <p className="text-[7px] font-bold text-blue-400 uppercase mt-1">Monthly R{monthlyDue}</p>
                  </div>
                </div>

                {!driver.isArchived && (
                  <div className={`p-4 rounded-3xl border flex flex-col space-y-2 transition-colors ${payStatus === 'fully-paid' ? 'bg-green-50 border-green-100' : payStatus === 'partial' ? 'bg-amber-50 border-amber-100' : 'bg-red-50 border-red-100'}`}>
                    <div className="flex items-center justify-between">
                      <p className={`text-[8px] font-black uppercase tracking-widest ${payStatus === 'fully-paid' ? 'text-green-500' : payStatus === 'partial' ? 'text-amber-600' : 'text-red-500'}`}>Current Status</p>
                      <p className={`text-[10px] font-black uppercase ${payStatus === 'fully-paid' ? 'text-green-600' : payStatus === 'partial' ? 'text-amber-700' : 'text-red-600'}`}>{statusLabels[payStatus]}</p>
                    </div>
                    
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase">
                        <span className="text-gray-400">Monthly Balance</span>
                        <div className="flex flex-col items-end">
                          <span className={balance >= 0 ? 'text-green-600' : 'text-red-600'}>{balance >= 0 ? `+R${balance}` : `R${balance}`}</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-500 ${payStatus === 'partial' ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${progressPercent}%` }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {!driver.isArchived && (
                <button 
                  onClick={() => sendReminder(driver)}
                  className={`w-full text-white text-[10px] font-black uppercase tracking-[0.2em] py-5 rounded-[1.5rem] transition-all shadow-xl flex items-center justify-center group/btn active:scale-95 ${
                    payStatus === 'overdue' || unpaidFineTotal > 0 ? 'bg-red-600 hover:bg-red-700 shadow-red-100' : 
                    payStatus === 'partial' ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-100' :
                    'bg-gray-900 hover:bg-green-600 shadow-gray-200'
                  }`}
                >
                  <span className="mr-3 transition-transform group-hover/btn:scale-125">💬</span> 
                  {payStatus === 'fully-paid' && unpaidFineTotal === 0 ? 'Send Status Update' : 'Send Payment Warning'}
                </button>
              )}
            </div>
          );
        })}
      </div>
      
      {showFineForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <form onSubmit={handleFineSubmit} className="bg-white p-8 md:p-10 rounded-[3rem] shadow-2xl max-w-lg w-full space-y-6 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b border-gray-50 pb-4">
               <div>
                 <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Attach Fine</h3>
                 <p className="text-[10px] text-red-500 font-black uppercase tracking-widest mt-1">Operator Liability Check</p>
               </div>
               <button type="button" onClick={() => setShowFineForm(null)} className="text-gray-400 hover:text-gray-900 text-4xl">&times;</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Fine Notice No.</label>
                <input required className="w-full border-gray-100 rounded-xl p-3 bg-gray-50 text-sm font-bold" value={fineFormData.noticeNumber} onChange={e => setFineFormData({...fineFormData, noticeNumber: e.target.value})} placeholder="e.g. INF-2023-XX" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Amount (R)</label>
                <input type="number" required className="w-full border-gray-100 rounded-xl p-3 bg-gray-50 text-sm font-bold" value={fineFormData.amount || ''} onChange={e => setFineFormData({...fineFormData, amount: Number(e.target.value)})} placeholder="0.00" />
              </div>
            </div>
            <button type="submit" className="w-full bg-red-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">Confirm Fine Assignment</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default DriverManagement;
