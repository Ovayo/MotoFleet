import React, { useMemo, useRef } from 'react';
import { Driver, Payment, Bike, MaintenanceRecord } from '../types';

interface DriverProfileProps {
  driver: Driver;
  onUpdateDriver: (updatedDriver: Driver) => void;
  payments: Payment[];
  bike?: Bike;
  maintenance: MaintenanceRecord[];
  weeklyTarget: number;
}

const DriverProfile: React.FC<DriverProfileProps> = ({ driver, onUpdateDriver, payments, bike, maintenance, weeklyTarget }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stats = useMemo(() => {
    const driverPayments = payments.filter(p => p.driverId === driver.id);
    const totalPaid = driverPayments.reduce((acc, p) => acc + p.amount, 0);
    
    const weeksActive = 4;
    const expected = weeksActive * weeklyTarget;
    const balance = totalPaid - expected;
    
    const sortedPayments = [...driverPayments].sort((a, b) => b.weekNumber - a.weekNumber);
    let streak = 0;
    for (let p of sortedPayments) {
      if (p.amount >= weeklyTarget) streak++;
      else break;
    }

    const bikeMaintenance = bike ? maintenance.filter(m => m.bikeId === bike.id) : [];
    const totalMaintenanceCost = bikeMaintenance.reduce((acc, m) => acc + m.cost, 0);

    return { totalPaid, balance, streak, expected, bikeMaintenance, totalMaintenanceCost };
  }, [payments, driver.id, weeklyTarget, bike, maintenance]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateDriver({ ...driver, profilePictureUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const currentMonth = months[new Date().getMonth()];
  const headerBgImage = "https://images.unsplash.com/photo-1558981806-ec527fa84c39?q=80&w=2070&auto=format&fit=crop";

  return (
    <div className="w-full space-y-6 pb-20 md:pb-8">
      <div 
        className="relative overflow-hidden rounded-3xl shadow-xl shadow-green-100"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(21, 128, 61, 0.96), rgba(34, 197, 94, 0.85)), url('${headerBgImage}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="relative z-10 p-6 md:p-8 text-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center space-x-6">
               <div 
                className="relative group w-20 h-20 md:w-24 md:h-24 rounded-[2rem] bg-white/20 backdrop-blur-md border-4 border-white/30 overflow-hidden shrink-0 flex items-center justify-center font-black text-2xl cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
               >
                 {driver.profilePictureUrl ? (
                   <img src={driver.profilePictureUrl} alt={driver.name} className="w-full h-full object-cover" />
                 ) : (
                   driver.name.substring(0, 2).toUpperCase()
                 )}
                 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-[10px] font-black uppercase text-white tracking-widest text-center px-2">Update Photo</span>
                 </div>
                 <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
               </div>
               <div className="space-y-1">
                <div className="inline-block bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                  {stats.balance >= 0 ? '🏆 Elite Standing' : '📈 On the Way Up'}
                </div>
                <h2 className="text-3xl md:text-4xl font-black">Keep it up, {driver.name.split(' ')[0]}! 😊</h2>
                <p className="text-green-50 opacity-95 text-sm md:text-base font-medium">
                  {stats.balance >= 0 
                    ? "Your account is in great standing. Keep paying to own your future." 
                    : `You are only R${Math.abs(stats.balance)} away from clearing your arrears!`}
                </p>
              </div>
            </div>
            <div className="flex gap-4">
               <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl text-center min-w-[100px] border border-white/10">
                  <p className="text-[10px] font-bold uppercase opacity-70">Weekly Streak</p>
                  <p className="text-2xl font-black">{stats.streak} 🔥</p>
               </div>
               <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl text-center min-w-[100px] border border-white/10">
                  <p className="text-[10px] font-bold uppercase opacity-70">Payment Rank</p>
                  <p className="text-2xl font-black">Top 10%</p>
               </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Current Balance</p>
          <div className="flex items-baseline space-x-2">
            <h3 className={`text-3xl font-black ${stats.balance >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              R{stats.balance}
            </h3>
            <span className="text-gray-400 text-sm font-bold">{stats.balance >= 0 ? 'Surplus' : 'Arrears'}</span>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between text-xs font-bold text-gray-500">
             <span>Weekly Due:</span>
             <span className="text-gray-800">R{weeklyTarget}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Total Paid (Lifetime)</p>
          <h3 className="text-3xl font-black text-gray-800">R{stats.totalPaid.toLocaleString()}</h3>
          <p className="text-[10px] text-gray-400 mt-2 font-medium">You have already cleared {Math.floor((stats.totalPaid / 30000) * 100)}% of your bike's value!</p>
          <div className="w-full bg-gray-100 rounded-full h-2 mt-4">
             <div className="bg-green-500 h-2 rounded-full" style={{ width: `${Math.min(100, (stats.totalPaid / 30000) * 100)}%` }}></div>
          </div>
        </div>

        {bike ? (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group">
            <div className="absolute top-[-10px] right-[-10px] text-6xl opacity-5 transition-transform group-hover:scale-110">🏍️</div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Your Vehicle</p>
            <h3 className="text-lg font-black text-gray-800 leading-tight">{bike.makeModel}</h3>
            <p className="text-sm font-mono text-blue-600 font-bold mt-1">{bike.licenseNumber}</p>
            <div className={`mt-4 inline-block px-2 py-1 rounded-md text-[10px] font-bold uppercase ${bike.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              Status: {bike.status}
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 p-6 rounded-3xl border border-dashed border-gray-200 flex items-center justify-center italic text-gray-400 text-sm">
            No bike currently assigned to your profile.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight">Payment Scorecard</h3>
              <p className="text-gray-500 text-xs">Tracking your {currentMonth} payments.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(week => {
              const weekPayment = payments.find(p => p.driverId === driver.id && p.weekNumber === week);
              const isPaid = weekPayment && weekPayment.amount >= weeklyTarget;
              const isPartial = weekPayment && weekPayment.amount > 0 && weekPayment.amount < weeklyTarget;

              return (
                <div 
                  key={week} 
                  className={`p-4 rounded-2xl flex flex-col items-center justify-center text-center transition-all ${
                    isPaid ? 'bg-green-50 border border-green-100' : 
                    isPartial ? 'bg-yellow-50 border border-yellow-100' :
                    'bg-gray-50 border border-gray-100'
                  }`}
                >
                  <p className="text-[9px] font-black uppercase text-gray-400 mb-1">Week {week}</p>
                  <div className={`text-xl mb-1 ${isPaid ? 'text-green-600' : isPartial ? 'text-yellow-600' : 'text-gray-300'}`}>
                    {isPaid ? '✅' : isPartial ? '⚠️' : '🕒'}
                  </div>
                  <p className={`text-xs font-black ${isPaid ? 'text-green-700' : isPartial ? 'text-yellow-700' : 'text-gray-400'}`}>
                    {weekPayment ? `R${weekPayment.amount}` : 'Pending'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 overflow-hidden relative">
          <div className="absolute -right-4 -top-4 text-6xl opacity-[0.03] rotate-12">🔧</div>
          <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight mb-2">Vehicle Care</h3>
          <p className="text-gray-500 text-xs mb-6">Transparency on what we spend to keep you safe.</p>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-2xl border border-red-100">
              <span className="text-xs font-bold text-red-700">Total Maintenance Cost</span>
              <span className="text-lg font-black text-red-700">R{stats.totalMaintenanceCost}</span>
            </div>

            <div className="max-h-[160px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {stats.bikeMaintenance.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-xs italic">
                  No maintenance records yet. Drive safe! 🛡️
                </div>
              ) : (
                stats.bikeMaintenance.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(m => (
                  <div key={m.id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-xl transition-colors">
                    <div>
                      <p className="text-xs font-bold text-gray-700">{m.description}</p>
                      <p className="text-[10px] text-gray-400 uppercase">{new Date(m.date).toLocaleDateString()} • {m.serviceType}</p>
                    </div>
                    <span className="text-xs font-black text-gray-800">R{m.cost}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 p-6 bg-blue-50 rounded-2xl border border-blue-100 flex flex-col md:flex-row items-center gap-6">
         <div className="text-4xl">💡</div>
         <div>
           <h4 className="text-blue-900 font-black text-sm uppercase mb-1">Success Tip: Safe Driving Pays</h4>
           <p className="text-blue-700 text-xs leading-relaxed">
             Keeping your vehicle maintenance costs low helps us keep the rental fee stable. 
             Drivers with 0 avoidable repairs for 3 months get an <strong>R200 bonus</strong>!
           </p>
         </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50">
           <h3 className="font-black text-gray-800 uppercase text-sm tracking-wider">Recent Transactions</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {payments
            .filter(p => p.driverId === driver.id)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5)
            .map(p => (
              <div key={p.id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${p.amount >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {p.amount >= 0 ? '💰' : '📉'}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{p.type.charAt(0).toUpperCase() + p.type.slice(1)} Payment</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">{new Date(p.date).toLocaleDateString()} • Week {p.weekNumber}</p>
                  </div>
                </div>
                <p className={`font-black ${p.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {p.amount >= 0 ? `+R${p.amount}` : `R${p.amount}`}
                </p>
              </div>
            ))}
        </div>
        <div className="p-4 bg-gray-50 text-center">
           <button className="text-xs font-bold text-gray-400 hover:text-blue-600 uppercase tracking-widest">View Full Statement</button>
        </div>
      </div>
    </div>
  );
};

export default DriverProfile;