
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

  const stats = useMemo(() => {
    const total = payments.reduce((a, b) => a + b.amount, 0);
    const arrears = activeDrivers.length * 650 * 4 - total; // Very simplified
    return { total, arrears };
  }, [payments, activeDrivers]);

  return (
    <div className="space-y-10">
      {/* Financial Health Blade */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/70 backdrop-blur-2xl p-8 rounded-[3rem] shadow-sm border border-white/60 flex items-center justify-between group hover:shadow-2xl transition-all duration-500">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2">Cycle Revenue</p>
            <h3 className="text-4xl font-black text-gray-900 tracking-tighter leading-none">R{stats.total.toLocaleString()}</h3>
          </div>
          <div className="text-3xl grayscale opacity-30 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700">💰</div>
        </div>
        <div className="bg-white/70 backdrop-blur-2xl p-8 rounded-[3rem] shadow-sm border border-white/60 flex items-center justify-between group hover:shadow-2xl transition-all duration-500">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2">Net Exposure</p>
            <h3 className="text-4xl font-black text-red-500 tracking-tighter leading-none">R{Math.max(0, stats.arrears).toLocaleString()}</h3>
          </div>
          <div className="text-3xl grayscale opacity-30 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700">💸</div>
        </div>
        <div className="bg-gray-900 p-8 rounded-[3rem] shadow-2xl text-white flex flex-col justify-center">
          <div className="flex justify-between items-center mb-4">
            <p className="text-[9px] font-black text-blue-400 uppercase tracking-[0.4em]">Settlement Rate</p>
            <span className="text-[10px] font-black">94%</span>
          </div>
          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
             <div className="bg-blue-500 h-full w-[94%] shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 uppercase tracking-tighter">Global Ledger</h2>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.4em] mt-2">
            Fiscal Audit • {months[selectedMonth]} {selectedYear}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))} className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-[1.5rem] px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] outline-none cursor-pointer hover:bg-white transition-all shadow-sm">
            {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
          </select>
          <button 
            onClick={() => setShowForm(true)}
            className="bg-gray-900 text-white px-10 py-5 rounded-[1.8rem] font-black uppercase text-[10px] tracking-[0.3em] shadow-2xl shadow-gray-200 hover:scale-105 active:scale-95 transition-all"
          >
            + Post Entry
          </button>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-3xl rounded-[3.5rem] shadow-sm border border-white/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/50 border-b border-gray-100/50 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
              <tr>
                <th className="px-10 py-8">Operator node</th>
                <th className="px-6 py-8 text-center">W1</th>
                <th className="px-6 py-8 text-center">W2</th>
                <th className="px-6 py-8 text-center">W3</th>
                <th className="px-6 py-8 text-center">W4</th>
                <th className="px-10 py-8 text-right">Aggregate</th>
                <th className="px-10 py-8 text-right">Standing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {activeDrivers.map(driver => (
                <tr key={driver.id} className="hover:bg-white transition-all duration-500 group">
                  <td className="px-10 py-8">
                    <div className="font-black text-gray-900 uppercase tracking-tighter text-lg leading-none">{driver.name}</div>
                    <div className="text-[8px] font-black text-blue-500 uppercase tracking-[0.3em] mt-2 group-hover:translate-x-1 transition-transform">Command Hub: {driver.city}</div>
                  </td>
                  {[1,2,3,4].map(w => (
                    <td key={w} className="px-6 py-8 text-center">
                       <button className="px-5 py-3 rounded-2xl bg-gray-50 text-gray-300 text-[10px] font-black uppercase tracking-tighter hover:bg-blue-600 hover:text-white transition-all duration-500 hover:scale-110 shadow-sm border border-gray-100/50">
                        + Pay
                       </button>
                    </td>
                  ))}
                  <td className="px-10 py-8 text-[11px] font-black text-gray-900 text-right uppercase tracking-tighter">R0.00</td>
                  <td className="px-10 py-8 text-right">
                    <span className="px-4 py-1.5 rounded-full bg-red-50 text-red-500 text-[9px] font-black uppercase tracking-widest border border-red-100">Arrears</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {showForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-2xl z-[150] flex items-center justify-center p-4">
           <form className="bg-white/95 backdrop-blur-3xl rounded-[4rem] w-full max-w-xl p-12 space-y-10 animate-in zoom-in duration-300">
              <div className="flex justify-between items-center border-b border-gray-100 pb-8 mb-8">
                 <div>
                    <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tighter leading-none">Post Collection</h3>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mt-3">Fiscal Data Authorization</p>
                 </div>
                 <button type="button" onClick={() => setShowForm(false)} className="text-gray-300 hover:text-gray-900 text-6xl leading-none transition-colors">&times;</button>
              </div>
              <div className="space-y-6">
                 <select className="w-full bg-gray-50/50 border-none rounded-[1.5rem] p-6 text-sm font-bold outline-none shadow-inner">
                   {activeDrivers.map(d => <option key={d.id}>{d.name}</option>)}
                 </select>
                 <input type="number" placeholder="SETTLEMENT AMOUNT (R)" className="w-full bg-gray-50/50 border-none rounded-[1.5rem] p-6 text-sm font-bold outline-none shadow-inner" />
              </div>
              <button className="w-full bg-gray-900 text-white py-6 rounded-[2.5rem] font-black uppercase text-[11px] tracking-[0.4em] shadow-2xl hover:bg-black transition-all">Authorize Transaction</button>
           </form>
        </div>
      )}
    </div>
  );
};

export default PaymentTracking;
