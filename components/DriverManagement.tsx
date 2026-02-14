
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
  const [showArchived, setShowArchived] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const activeDrivers = useMemo(() => drivers.filter(d => !d.isArchived), [drivers]);
  const archivedDrivers = useMemo(() => drivers.filter(d => d.isArchived), [drivers]);
  const displayDrivers = showArchived ? archivedDrivers : activeDrivers;

  const getBalance = (driverId: string) => {
    const paid = payments.filter(p => p.driverId === driverId).reduce((a, b) => a + b.amount, 0);
    const target = 650 * 4; // Simplified monthly target
    return paid - target;
  };

  return (
    <div className="space-y-12 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-2xl md:text-4xl font-black text-gray-900 tracking-tighter uppercase">Operator Force</h2>
          <p className="text-[11px] text-gray-400 font-black uppercase tracking-[0.4em] mt-3">
            {showArchived ? 'Archive Registry Access' : `Commanding ${activeDrivers.length} Active Logistics Pilots`}
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setShowArchived(!showArchived)}
            className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border ${showArchived ? 'bg-gray-900 text-white border-transparent shadow-xl' : 'bg-white/60 backdrop-blur-xl border-white/60 text-gray-400 hover:text-gray-900 shadow-sm'}`}
          >
            {showArchived ? 'Active Fleet' : 'Archived Nodes'}
          </button>
          <button 
            onClick={() => setIsAddingDriver(true)}
            className="bg-blue-600 text-white px-10 py-4 rounded-[1.8rem] font-black uppercase text-[10px] tracking-[0.25em] shadow-2xl shadow-blue-100 hover:scale-105 active:scale-95 transition-all flex items-center space-x-4"
          >
            <span className="text-xl">+</span>
            <span>Enroll Pilot</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
        {displayDrivers.map(driver => {
          const balance = getBalance(driver.id);
          const bike = bikes.find(b => b.assignedDriverId === driver.id);
          const initials = driver.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

          return (
            <div key={driver.id} className="bg-white/80 backdrop-blur-3xl rounded-[4rem] p-10 border border-white/60 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-700 group overflow-hidden relative">
              {/* Refractive gradient flare */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-2xl rounded-full translate-x-10 -translate-y-10 group-hover:bg-blue-500/10 transition-colors duration-700"></div>
              
              <div className="flex justify-between items-start mb-10">
                <div className="flex items-center space-x-6">
                  <div className={`w-20 h-20 rounded-[2.5rem] flex items-center justify-center font-black text-2xl shadow-2xl border-4 border-white overflow-hidden transition-all duration-700 group-hover:scale-110 ${balance >= 0 ? 'bg-blue-600 text-white shadow-blue-100' : 'bg-red-500 text-white shadow-red-100'}`}>
                    {driver.profilePictureUrl ? (
                      <img src={driver.profilePictureUrl} className="w-full h-full object-cover" />
                    ) : (
                      initials
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-black text-gray-900 text-2xl uppercase tracking-tighter leading-none mb-2 truncate">{driver.name}</h3>
                    <div className="flex items-center space-x-2">
                       <span className="text-[9px] font-black text-blue-500 bg-blue-50/50 px-3 py-1 rounded-full uppercase tracking-widest border border-blue-100/50">{driver.city}</span>
                       <span className="text-[9px] font-black text-gray-400 bg-gray-50/50 px-3 py-1 rounded-full uppercase tracking-widest border border-gray-100/50">ID: {driver.idNumber.substring(0, 4)}...</span>
                    </div>
                  </div>
                </div>
                <button className="w-10 h-10 bg-white/50 hover:bg-white rounded-xl flex items-center justify-center shadow-sm transition-all">✏️</button>
              </div>

              <div className="space-y-6 mb-10">
                <div className="p-6 bg-gray-50/30 rounded-[2.5rem] border border-gray-100/50 flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Financial Standing</p>
                    <span className={`text-[10px] font-black uppercase ${balance >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {balance >= 0 ? 'Verified Standing' : 'Account Deficit'}
                    </span>
                  </div>
                  <div className="flex items-baseline space-x-2">
                    <h4 className={`text-4xl font-black tracking-tighter ${balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      R{Math.abs(balance).toLocaleString()}
                    </h4>
                    <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">{balance >= 0 ? 'Surplus' : 'Arrears'}</span>
                  </div>
                  <div className="w-full bg-gray-100/50 h-2 rounded-full overflow-hidden shadow-inner">
                    <div className={`h-full transition-all duration-1000 ${balance >= 0 ? 'bg-blue-500 w-full' : 'bg-red-500 w-[40%]'}`}></div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-6 bg-gray-900 rounded-[2.5rem] text-white/90">
                   <div className="flex items-center space-x-4">
                     <div className="text-2xl">🏍️</div>
                     <div className="min-w-0">
                       <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-0.5">Assigned Asset</p>
                       <p className="text-xs font-black uppercase truncate">{bike?.licenseNumber || 'PENDING LINK'}</p>
                     </div>
                   </div>
                   <span className="text-[8px] font-black bg-white/10 px-3 py-1 rounded-full uppercase">DEPLOYED</span>
                </div>
              </div>

              <button 
                onClick={() => window.open(`tel:${driver.contact}`)}
                className="w-full bg-white text-gray-900 py-6 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.4em] shadow-xl shadow-gray-100 hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-center space-x-4 border border-gray-100"
              >
                <span>📞</span>
                <span>Open Secure Line</span>
              </button>
            </div>
          );
        })}
      </div>

      {isAddingDriver && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-2xl z-[150] flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-3xl rounded-[4rem] w-full max-w-2xl p-12 animate-in zoom-in duration-300">
             <div className="flex justify-between items-center border-b border-gray-100 pb-8 mb-10">
                <div>
                  <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tighter leading-none">Onboard Pilot</h3>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mt-3">Grid Force Multiplier</p>
                </div>
                <button type="button" onClick={() => setIsAddingDriver(false)} className="text-gray-300 hover:text-gray-900 text-6xl leading-none">&times;</button>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                <input placeholder="LEGAL FULL NAME" className="w-full bg-gray-50/50 border-none rounded-[1.5rem] p-6 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 shadow-inner" />
                <input placeholder="OPERATIONAL CITY" className="w-full bg-gray-50/50 border-none rounded-[1.5rem] p-6 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 shadow-inner" />
             </div>
             <button className="w-full bg-gray-900 text-white py-6 rounded-[2.5rem] font-black uppercase text-[11px] tracking-[0.4em] shadow-2xl hover:bg-black transition-all">Authorize Pilot Entry</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverManagement;
