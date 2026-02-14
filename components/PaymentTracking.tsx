
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Driver, Payment } from '../types';

interface PaymentTrackingProps {
  drivers: Driver[];
  payments: Payment[];
  onAddPayment: (payment: Omit<Payment, 'id'>) => void;
  onUpdatePayment: (id: string, amount: number) => void;
  onDeletePayment: (id: string) => void;
  onUpdateDriver: (driver: Driver) => void;
  weeklyTarget: number;
}

const PaymentTracking: React.FC<PaymentTrackingProps> = ({ 
  drivers, 
  payments, 
  onAddPayment, 
  onUpdatePayment,
  onDeletePayment,
  onUpdateDriver,
  weeklyTarget 
}) => {
  const [showForm, setShowForm] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  const months = [
    "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
    "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
  ];

  const activeDrivers = useMemo(() => drivers.filter(d => !d.isArchived), [drivers]);

  const weeksInMonth = useMemo(() => {
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0);
    const days = lastDay.getDate();
    return days > 28 ? 5 : 4;
  }, [selectedMonth, selectedYear]);

  // Precise Monthly Financial Analytics
  const stats = useMemo(() => {
    const monthPayments = payments.filter(p => {
      const d = new Date(p.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });

    const totalCollected = monthPayments.reduce((a, b) => a + b.amount, 0);
    
    const totalTarget = activeDrivers.reduce((acc, d) => {
      const target = d.weeklyTarget || weeklyTarget;
      return acc + (target * weeksInMonth);
    }, 0);

    const amountRemaining = Math.max(0, totalTarget - totalCollected);
    const collectionRate = totalTarget > 0 ? Math.round((totalCollected / totalTarget) * 100) : 100;

    return { totalCollected, amountRemaining, collectionRate, totalTarget };
  }, [payments, activeDrivers, selectedMonth, selectedYear, weeklyTarget, weeksInMonth]);

  return (
    <div className="space-y-10">
      {/* Financial Health Blade */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-2xl p-8 rounded-[3rem] shadow-sm border border-white/60 dark:border-white/5 flex items-center justify-between group hover:shadow-2xl transition-all duration-500">
          <div>
            <p className="text-[10px] font-black text-gray-400 dark:text-white/30 uppercase tracking-[0.3em] mb-2">Cycle Revenue</p>
            <h3 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter leading-none">R{stats.totalCollected.toLocaleString()}</h3>
            <p className="text-[9px] font-black text-blue-500 mt-2 uppercase tracking-widest">Target: R{stats.totalTarget.toLocaleString()}</p>
          </div>
          <div className="text-3xl grayscale opacity-30 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700">💰</div>
        </div>

        <div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-2xl p-8 rounded-[3rem] shadow-sm border border-white/60 dark:border-white/5 flex items-center justify-between group hover:shadow-2xl transition-all duration-500">
          <div>
            <p className="text-[10px] font-black text-red-500/60 uppercase tracking-[0.3em] mb-2">Pending Collections</p>
            <h3 className="text-4xl font-black text-red-500 tracking-tighter leading-none">R{stats.amountRemaining.toLocaleString()}</h3>
            <p className="text-[9px] font-black text-gray-400 dark:text-white/20 mt-2 uppercase tracking-widest">Amount still to be paid</p>
          </div>
          <div className="text-3xl grayscale opacity-30 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700">⏳</div>
        </div>

        <div className="bg-gray-900 dark:bg-black p-8 rounded-[3rem] shadow-2xl text-white flex flex-col justify-center border border-white/5">
          <div className="flex justify-between items-center mb-4">
            <p className="text-[9px] font-black text-blue-400 uppercase tracking-[0.4em]">Settlement Progress</p>
            <span className="text-[10px] font-black">{stats.collectionRate}%</span>
          </div>
          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
             <div 
               className="bg-blue-500 h-full transition-all duration-1000 shadow-[0_0_15px_rgba(59,130,246,0.5)]" 
               style={{ width: `${stats.collectionRate}%` }}
             ></div>
          </div>
          <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] mt-3 text-center">Month-to-date velocity</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Global Ledger</h2>
          <p className="text-[10px] text-gray-400 dark:text-white/30 font-black uppercase tracking-[0.4em] mt-2">
            Fiscal Audit • {months[selectedMonth]} {selectedYear}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select 
            value={selectedMonth} 
            onChange={e => setSelectedMonth(parseInt(e.target.value))} 
            className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-[1.5rem] px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] outline-none cursor-pointer hover:bg-white dark:hover:bg-gray-800 transition-all shadow-sm dark:text-white"
          >
            {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
          </select>
          <button 
            onClick={() => setShowForm(true)}
            className="bg-gray-900 dark:bg-blue-600 text-white px-10 py-5 rounded-[1.8rem] font-black uppercase text-[10px] tracking-[0.3em] shadow-2xl shadow-gray-200 dark:shadow-blue-900/20 hover:scale-105 active:scale-95 transition-all"
          >
            + Post Entry
          </button>
        </div>
      </div>

      <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-3xl rounded-[3.5rem] shadow-sm border border-white/60 dark:border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/50 dark:bg-white/5 border-b border-gray-100/50 dark:border-white/5 text-[10px] font-black text-gray-400 dark:text-white/30 uppercase tracking-[0.3em]">
              <tr>
                <th className="px-10 py-8">Operator node</th>
                <th className="px-6 py-8 text-center">Month Target</th>
                <th className="px-6 py-8 text-center">Settled</th>
                <th className="px-6 py-8 text-center">Balance Due</th>
                <th className="px-10 py-8 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-white/5">
              {activeDrivers.map(driver => {
                const driverTarget = (driver.weeklyTarget || weeklyTarget) * weeksInMonth;
                const driverPaid = payments
                  .filter(p => p.driverId === driver.id && new Date(p.date).getMonth() === selectedMonth && new Date(p.date).getFullYear() === selectedYear)
                  .reduce((a, b) => a + b.amount, 0);
                const remaining = Math.max(0, driverTarget - driverPaid);
                const isSettled = driverPaid >= driverTarget;

                return (
                  <tr key={driver.id} className="hover:bg-white dark:hover:bg-white/5 transition-all duration-500 group">
                    <td className="px-10 py-8">
                      <div className="font-black text-gray-900 dark:text-white uppercase tracking-tighter text-lg leading-none">{driver.name}</div>
                      <div className="text-[8px] font-black text-blue-500 uppercase tracking-[0.3em] mt-2 group-hover:translate-x-1 transition-transform">Command Hub: {driver.city}</div>
                    </td>
                    <td className="px-6 py-8 text-center">
                      <span className="text-[11px] font-black text-gray-400 dark:text-white/20">R{driverTarget.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-8 text-center">
                      <span className="text-sm font-black text-gray-900 dark:text-white">R{driverPaid.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-8 text-center">
                      <span className={`text-sm font-black ${remaining > 0 ? 'text-red-500' : 'text-green-500'}`}>
                        {remaining > 0 ? `R${remaining.toLocaleString()}` : 'SETTLED'}
                      </span>
                    </td>
                    <td className="px-10 py-8 text-right">
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                        isSettled 
                        ? 'bg-green-50 dark:bg-green-400/10 text-green-600 dark:text-green-400 border-green-100 dark:border-green-400/20' 
                        : 'bg-red-50 dark:bg-red-400/10 text-red-500 dark:text-red-400 border-red-100 dark:border-red-400/20'
                      }`}>
                        {isSettled ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      {showForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-2xl z-[150] flex items-center justify-center p-4">
           <form className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-3xl rounded-[4rem] w-full max-w-xl p-12 space-y-10 animate-in zoom-in duration-300">
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-white/10 pb-8 mb-8">
                 <div>
                    <h3 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">Post Collection</h3>
                    <p className="text-[10px] text-gray-400 dark:text-white/30 font-black uppercase tracking-[0.3em] mt-3">Fiscal Data Authorization</p>
                 </div>
                 <button type="button" onClick={() => setShowForm(false)} className="text-gray-300 hover:text-gray-900 dark:hover:text-white text-6xl leading-none transition-colors">&times;</button>
              </div>
              <div className="space-y-6">
                 <select className="w-full bg-gray-50 dark:bg-black/50 border-none rounded-[1.5rem] p-6 text-sm font-bold outline-none shadow-inner dark:text-white">
                   {activeDrivers.map(d => <option key={d.id}>{d.name}</option>)}
                 </select>
                 <input type="number" placeholder="SETTLEMENT AMOUNT (R)" className="w-full bg-gray-50 dark:bg-black/50 border-none rounded-[1.5rem] p-6 text-sm font-bold outline-none shadow-inner dark:text-white" />
              </div>
              <button className="w-full bg-gray-900 dark:bg-blue-600 text-white py-6 rounded-[2.5rem] font-black uppercase text-[11px] tracking-[0.4em] shadow-2xl hover:bg-black transition-all">Authorize Transaction</button>
           </form>
        </div>
      )}
    </div>
  );
};

export default PaymentTracking;
