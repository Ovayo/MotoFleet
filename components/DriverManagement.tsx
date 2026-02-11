
import React, { useState } from 'react';
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
  
  const [formData, setFormData] = useState<Omit<Driver, 'id'>>({
    name: '',
    contact: '',
    nationality: '',
    address: '',
    idNumber: '',
    driverCode: '',
    city: '',
    notes: '',
    licenseExpiry: '',
    pdpExpiry: ''
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDriverId) {
      setDrivers(prev => prev.map(d => d.id === editingDriverId ? { ...formData, id: editingDriverId } : d));
      setEditingDriverId(null);
    } else if (isAddingDriver) {
      const newDriver: Driver = { ...formData, id: `d-${Date.now()}`, enatisVerified: false };
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
        <div className="space-y-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Full Name</label>
          <input name="name" value={formData.name} onChange={handleInputChange} required className="w-full border-gray-100 rounded-xl p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="e.g. John Doe" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Contact Number</label>
          <input name="contact" value={formData.contact} onChange={handleInputChange} required className="w-full border-gray-100 rounded-xl p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="082 123 4567" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">ID / Passport Number</label>
          <input name="idNumber" value={formData.idNumber} onChange={handleInputChange} required className="w-full border-gray-100 rounded-xl p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Identification Number" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Driver Code (Internal)</label>
          <input name="driverCode" value={formData.driverCode} onChange={handleInputChange} required className="w-full border-gray-100 rounded-xl p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="e.g. B1-D1" />
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Fleet Drivers</h2>
          <p className="text-xs text-gray-400 font-medium">Monitoring license validity and eNaTIS status</p>
        </div>
        {!isAddingDriver && !editingDriverId && (
          <button 
            onClick={() => setIsAddingDriver(true)}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-all font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-100"
          >
            + Register Driver
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

          return (
            <div key={driver.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 group relative flex flex-col p-6 overflow-hidden">
              {/* Verification Badge */}
              <div className="absolute -right-4 -top-4 w-12 h-12 flex items-center justify-center pt-2 pr-2">
                 {driver.enatisVerified ? (
                   <span className="text-blue-500 drop-shadow-sm text-xl" title="eNaTIS Verified Member">🛡️</span>
                 ) : (
                   <button 
                     onClick={() => verifyEnatis(driver.id)}
                     className="bg-gray-100 text-[8px] font-black uppercase px-2 py-1 rounded-bl-xl tracking-tighter hover:bg-blue-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                   >
                     {isVerifying === driver.id ? '...' : 'Verify'}
                   </button>
                 )}
              </div>

              <button 
                onClick={() => { setEditingDriverId(driver.id); setFormData(driver); }}
                className="absolute top-4 right-10 text-blue-500 opacity-0 group-hover:opacity-100 text-[10px] font-black uppercase tracking-widest transition-all"
              >
                Edit
              </button>

              <div className="flex items-center space-x-4 mb-6">
                <div 
                  className={`w-3 h-3 rounded-full shrink-0 ${payStatus === 'paid' ? 'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.5)]' : 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]'}`}
                  title={payStatus === 'paid' ? 'Financials Clear' : 'Arrears Detected'}
                ></div>
                <div>
                  <h3 className="font-black text-gray-800 text-lg leading-tight uppercase tracking-tight">{driver.name}</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{driver.driverCode}</p>
                </div>
              </div>
              
              <div className="space-y-4 mb-8 flex-grow">
                <div className="flex items-center text-sm text-gray-600">
                  <span className="w-8 text-xl opacity-60">📞</span>
                  <span className="font-medium">{driver.contact}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="w-8 text-xl opacity-60">📍</span>
                  <span className="line-clamp-1">{driver.address}</span>
                </div>
                
                {/* Expiry Tracking */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className={`p-2.5 rounded-2xl border ${
                    licStatus === 'valid' ? 'bg-green-50 border-green-100 text-green-700' :
                    licStatus === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-red-50 border-red-100 text-red-700'
                  }`}>
                    <p className="text-[9px] font-black uppercase tracking-widest mb-1">License Exp</p>
                    <p className="text-xs font-black">{driver.licenseExpiry ? new Date(driver.licenseExpiry).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : 'MISSING'}</p>
                  </div>
                  <div className={`p-2.5 rounded-2xl border ${
                    pdpStatus === 'valid' ? 'bg-green-50 border-green-100 text-green-700' :
                    pdpStatus === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-red-50 border-red-100 text-red-700'
                  }`}>
                    <p className="text-[9px] font-black uppercase tracking-widest mb-1">PrDP Exp</p>
                    <p className="text-xs font-black">{driver.pdpExpiry ? new Date(driver.pdpExpiry).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : 'N/A'}</p>
                  </div>
                </div>

                {assignedBike ? (
                  <div className="mt-4 p-4 bg-blue-50/50 rounded-2xl border border-blue-100/30 flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-0.5">Asset Attached</p>
                      <p className="text-sm font-black text-blue-800">{assignedBike.licenseNumber}</p>
                    </div>
                    <span className="text-2xl">🏍️</span>
                  </div>
                ) : (
                  <div className="mt-4 p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200 flex items-center justify-center">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest italic">Unassigned Asset</p>
                  </div>
                )}
              </div>

              <button 
                onClick={() => sendReminder(driver)}
                className="w-full bg-green-600 hover:bg-green-700 text-white text-[10px] font-black uppercase tracking-widest py-3 rounded-2xl transition-all shadow-lg shadow-green-100 flex items-center justify-center active:scale-95"
              >
                <span className="mr-2 text-base">💬</span> Send WhatsApp Reminder
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DriverManagement;
