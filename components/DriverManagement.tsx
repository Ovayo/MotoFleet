import React, { useState, useRef } from 'react';
import { Driver, Bike, Payment } from '../types';

interface DriverManagementProps {
  drivers: Driver[];
  setDrivers: React.Dispatch<React.SetStateAction<Driver[]>>;
  bikes: Bike[];
  payments: Payment[];
  weeklyTarget: number;
}

const DriverManagement: React.FC<DriverManagementProps> = ({ drivers, setDrivers, bikes, payments, weeklyTarget }) => {
  const [editingDriverId, setEditingDriverId] = useState<string | null>(null);
  const [isAddingDriver, setIsAddingDriver] = useState(false);
  const [isVerifying, setIsVerifying] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State for contact OTP verification
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
    profilePictureUrl: ''
  });

  const getPaymentStatus = (driverId: string) => {
    const currentWeek = 4;
    const paid = payments
      .filter(p => p.driverId === driverId && p.weekNumber === currentWeek)
      .reduce((sum, p) => sum + p.amount, 0);
    return paid >= weeklyTarget ? 'paid' : 'overdue';
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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

  const sendReminder = (driver: Driver) => {
    const currentWeek = 4;
    const paid = payments
      .filter(p => p.driverId === driver.id && p.weekNumber === currentWeek)
      .reduce((sum, p) => sum + p.amount, 0);
    const balance = paid - weeklyTarget;
    
    let message = `Hello ${driver.name}, this is a reminder from MotoFleet eNaTIS compliance. `;
    if (balance < 0) {
      message += `Your account is currently overdue by R${Math.abs(balance)}. Please settle your weekly R${weeklyTarget} rental as soon as possible. Thank you!`;
    } else {
      message += `Your account is up to date! Please remember to check your license disc expiry. Safe driving!`;
    }
    
    const encodedMsg = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${driver.contact.replace(/\s+/g, '')}?text=${encodedMsg}`;
    window.open(whatsappUrl, '_blank');
  };

  const DriverForm = () => (
    <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-xl border border-blue-100 col-span-full mb-8 animate-in slide-in-from-top-4 duration-300">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">{editingDriverId ? 'Update Driver Profile' : 'Register New Driver'}</h3>
        <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded">eNaTIS Compliant Form</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Profile Picture Upload Section */}
        <div className="lg:col-span-3 flex flex-col items-center mb-6">
          <div className="relative group">
            <div className="w-24 h-24 rounded-3xl bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-200 group-hover:border-blue-300 transition-all">
              {formData.profilePictureUrl ? (
                <img src={formData.profilePictureUrl} alt="Profile Preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl opacity-30">📷</span>
              )}
            </div>
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 bg-blue-600 text-white w-8 h-8 rounded-xl shadow-lg flex items-center justify-center text-sm hover:bg-blue-700 transition-all"
            >
              +
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />
          </div>
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-3">Upload Driver Photo</p>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Full Name</label>
          <input name="name" value={formData.name} onChange={handleInputChange} required className="w-full border-gray-100 rounded-xl p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="e.g. John Doe" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Contact Number</label>
          <div className="relative group">
            <input name="contact" value={formData.contact} onChange={handleInputChange} required className="w-full border-gray-100 rounded-xl p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="082 123 4567" />
          </div>
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
        <div className="space-y-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">PrDP Expiry</label>
          <input type="date" name="pdpExpiry" value={formData.pdpExpiry} onChange={handleInputChange} className="w-full border-gray-100 rounded-xl p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tight uppercase">Fleet Drivers</h2>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Managing {drivers.length} Delivery Personnel</p>
        </div>
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

      {(isAddingDriver || editingDriverId) && <DriverForm />}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {drivers.map(driver => {
          const assignedBike = bikes.find(b => b.assignedDriverId === driver.id);
          const payStatus = getPaymentStatus(driver.id);
          const licStatus = getExpiryStatus(driver.licenseExpiry);
          const pdpStatus = getExpiryStatus(driver.pdpExpiry);
          const isVerifyingContact = verifyingContactId === driver.id;
          const initials = driver.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

          return (
            <div key={driver.id} className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 group relative flex flex-col p-8 transition-all hover:shadow-xl hover:shadow-gray-100">
              {/* Header: Badges & Edit */}
              <div className="flex justify-between items-start mb-6">
                <div className="flex -space-x-1">
                  {driver.enatisVerified ? (
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm border-2 border-white" title="eNaTIS Verified">🛡️</div>
                  ) : (
                    <button 
                      onClick={() => verifyEnatis(driver.id)}
                      className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[8px] font-black border-2 border-white hover:bg-blue-600 hover:text-white transition-all"
                    >
                      {isVerifying === driver.id ? '...' : 'VER'}
                    </button>
                  )}
                  {driver.contactVerified ? (
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-sm border-2 border-white" title="Contact Verified">✅</div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-xs border-2 border-white" title="Unverified Contact">⚠️</div>
                  )}
                </div>
                
                <button 
                  onClick={() => { setEditingDriverId(driver.id); setFormData(driver); }}
                  className="w-10 h-10 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 transition-all opacity-0 group-hover:opacity-100"
                >
                  ✏️
                </button>
              </div>

              {/* Profile Main */}
              <div className="flex items-center space-x-5 mb-8">
                <div className="relative">
                  <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center font-black text-xl shadow-lg overflow-hidden ${payStatus === 'paid' ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-green-100' : 'bg-gradient-to-br from-red-500 to-orange-600 text-white shadow-red-100'}`}>
                    {driver.profilePictureUrl ? (
                      <img src={driver.profilePictureUrl} alt={driver.name} className="w-full h-full object-cover" />
                    ) : (
                      initials
                    )}
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-white ${payStatus === 'paid' ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
                </div>
                <div>
                  <h3 className="font-black text-gray-800 text-xl leading-tight uppercase tracking-tight flex items-center">
                    {driver.name}
                    <span className={`w-2.5 h-2.5 rounded-full ml-3 ${payStatus === 'paid' ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} title={payStatus === 'paid' ? 'Account in Good Standing' : 'Account Overdue'}></span>
                  </h3>
                  <div className="flex items-center text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                    <span className="text-blue-500 mr-2">📍 {driver.city}</span>
                    <span className="bg-gray-100 px-2 py-0.5 rounded-full">{driver.nationality}</span>
                  </div>
                </div>
              </div>
              
              {/* Detailed Specs */}
              <div className="space-y-4 mb-8 flex-grow">
                <div className="group/contact flex items-center justify-between p-3 bg-gray-50/50 rounded-2xl hover:bg-blue-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg opacity-40">📞</span>
                    <span className="text-sm font-bold text-gray-700">{driver.contact}</span>
                  </div>
                  {!driver.contactVerified && !isVerifyingContact && (
                    <button 
                      onClick={() => startContactVerification(driver.id)}
                      className="text-[9px] font-black text-blue-500 uppercase tracking-widest hover:underline"
                    >
                      Verify Now
                    </button>
                  )}
                </div>

                {/* OTP Verification Interactive Section */}
                {isVerifyingContact && (
                  <div className="bg-blue-600 p-5 rounded-3xl text-white shadow-xl shadow-blue-100 animate-in zoom-in duration-300">
                    {otpStep === 'sending' ? (
                      <div className="flex flex-col items-center py-2">
                        <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin mb-3"></div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">Transmitting OTP...</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Security Check</p>
                          <button onClick={() => setVerifyingContactId(null)} className="text-white/60 hover:text-white">&times;</button>
                        </div>
                        <div className="flex space-x-2">
                          <input 
                            autoFocus
                            type="text" 
                            maxLength={4}
                            placeholder="0000"
                            className="w-full bg-white/20 border border-white/30 rounded-2xl py-3 text-center font-black tracking-[0.8em] text-white placeholder:text-white/40 outline-none focus:bg-white/30"
                            value={otpValue}
                            onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                          />
                          <button 
                            onClick={completeContactVerification}
                            className="bg-white text-blue-600 px-5 rounded-2xl font-black text-xs uppercase"
                          >
                            OK
                          </button>
                        </div>
                        <p className="text-[8px] font-bold text-blue-100 italic">Enter any 4 digits to verify this mock number.</p>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex items-start space-x-3 p-3 bg-gray-50/50 rounded-2xl">
                  <span className="text-lg opacity-40">🏠</span>
                  <span className="text-[11px] font-medium text-gray-500 leading-snug line-clamp-2 uppercase tracking-tighter">{driver.address}</span>
                </div>
                
                {/* Expiry Tracking Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className={`p-4 rounded-3xl border ${
                    licStatus === 'valid' ? 'bg-green-50/50 border-green-100' :
                    licStatus === 'warning' ? 'bg-amber-50 border-amber-100' : 'bg-red-50 border-red-100'
                  }`}>
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Driver License</p>
                    <p className={`text-xs font-black ${licStatus === 'expired' ? 'text-red-600' : 'text-gray-800'}`}>
                      {driver.licenseExpiry ? new Date(driver.licenseExpiry).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : 'NONE'}
                    </p>
                    <div className={`mt-2 h-1 rounded-full ${licStatus === 'valid' ? 'bg-green-500' : 'bg-red-500'}`} style={{width: '60%'}}></div>
                  </div>
                  <div className={`p-4 rounded-3xl border ${
                    pdpStatus === 'valid' ? 'bg-green-50/50 border-green-100' :
                    pdpStatus === 'warning' ? 'bg-amber-50 border-amber-100' : 'bg-red-50 border-red-100'
                  }`}>
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1.5">PrDP PERMIT</p>
                    <p className={`text-xs font-black ${pdpStatus === 'expired' ? 'text-red-600' : 'text-gray-800'}`}>
                      {driver.pdpExpiry ? new Date(driver.pdpExpiry).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : 'N/A'}
                    </p>
                    <div className={`mt-2 h-1 rounded-full ${pdpStatus === 'valid' ? 'bg-green-500' : 'bg-gray-200'}`} style={{width: '40%'}}></div>
                  </div>
                </div>

                {/* Assigned Asset Display */}
                {assignedBike ? (
                  <div className="p-4 bg-blue-50 rounded-3xl border border-blue-100/50 flex items-center justify-between group/bike transition-all hover:bg-blue-100/50">
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl grayscale group-hover/bike:grayscale-0 transition-all">🏍️</div>
                      <div>
                        <p className="text-[8px] font-black text-blue-500 uppercase tracking-[0.2em] mb-0.5">Assigned Asset</p>
                        <p className="text-xs font-black text-blue-900 tracking-tight">{assignedBike.licenseNumber}</p>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-[10px] font-black text-blue-600 shadow-sm">
                      #{assignedBike.id}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-3xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-center py-6">
                    <span className="text-xl mb-1 opacity-20">🏍️</span>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest italic">Inventory Pending</p>
                  </div>
                )}
              </div>

              {/* Action: Communication */}
              <button 
                onClick={() => sendReminder(driver)}
                className="w-full bg-gray-900 hover:bg-green-600 text-white text-[10px] font-black uppercase tracking-[0.2em] py-5 rounded-[1.5rem] transition-all shadow-xl shadow-gray-200 hover:shadow-green-100 flex items-center justify-center group/btn active:scale-95"
              >
                <span className="mr-3 transition-transform group-hover/btn:scale-125">💬</span> 
                Contact via WhatsApp
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DriverManagement;