import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Driver, Payment } from '../types';

interface PaymentTrackingProps {
  drivers: Driver[];
  payments: Payment[];
  onAddPayment: (payment: Omit<Payment, 'id'>) => void;
  onUpdatePayment: (id: string, amount: number) => void;
  onDeletePayment: (id: string) => void;
  weeklyTarget: number;
}

const PaymentTracking: React.FC<PaymentTrackingProps> = ({ 
  drivers, 
  payments, 
  onAddPayment, 
  onUpdatePayment,
  onDeletePayment,
  weeklyTarget 
}) => {
  const [showForm, setShowForm] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [filterArrearsOnly, setFilterArrearsOnly] = useState(false);
  
  const [editingCell, setEditingCell] = useState<{ driverId: string, weekIndex: number } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const editInputRef = useRef<HTMLInputElement>(null);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const [newPayment, setNewPayment] = useState({
    driverId: drivers[0]?.id || '',
    amount: 650,
    date: new Date().toISOString().split('T')[0],
    weekNumber: 1,
    type: 'rental' as const
  });

  const weeksInMonth = useMemo(() => {
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0);
    const days = lastDay.getDate();
    return days > 28 ? 5 : 4;
  }, [selectedMonth, selectedYear]);

  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      const pDate = new Date(p.date);
      return pDate.getMonth() === selectedMonth && pDate.getFullYear() === selectedYear;
    });
  }, [payments, selectedMonth, selectedYear]);

  const getWeeklyPaymentsForSlot = (driverId: string, weekIndex: number) => {
    return filteredPayments.filter(p => {
      if (p.driverId !== driverId) return false;
      const day = new Date(p.date).getDate();
      if (weekIndex === 0) return day >= 1 && day <= 7;
      if (weekIndex === 1) return day >= 8 && day <= 14;
      if (weekIndex === 2) return day >= 15 && day <= 21;
      if (weekIndex === 3) return day >= 22 && day <= 28;
      if (weekIndex === 4) return day >= 29;
      return false;
    });
  };

  const handleCellClick = (driverId: string, weekIndex: number, currentAmount: number) => {
    if (currentAmount === 0) {
      const day = (weekIndex * 7) + 1;
      const date = new Date(selectedYear, selectedMonth, day).toISOString().split('T')[0];
      onAddPayment({
        driverId,
        amount: weeklyTarget,
        date,
        weekNumber: weekIndex + 1,
        type: 'rental'
      });
    } else {
      setEditingCell({ driverId, weekIndex });
      setEditValue(currentAmount.toString());
    }
  };

  const saveEdit = () => {
    if (!editingCell) return;
    const { driverId, weekIndex } = editingCell;
    const slotPayments = getWeeklyPaymentsForSlot(driverId, weekIndex);
    const newVal = parseFloat(editValue);
    
    if (isNaN(newVal) || newVal <= 0) {
      if (slotPayments.length > 0) {
        slotPayments.forEach(p => onDeletePayment(p.id));
      }
    } else {
      if (slotPayments.length > 0) {
        onUpdatePayment(slotPayments[0].id, newVal);
        slotPayments.slice(1).forEach(p => onDeletePayment(p.id));
      } else {
        const day = (weekIndex * 7) + 1;
        const date = new Date(selectedYear, selectedMonth, day).toISOString().split('T')[0];
        onAddPayment({
          driverId,
          amount: newVal,
          date,
          weekNumber: weekIndex + 1,
          type: 'rental'
        });
      }
    }
    setEditingCell(null);
  };

  const sendArrearsReminder = (driver: Driver, balance: number) => {
    const monthName = months[selectedMonth];
    const amountOwed = Math.abs(balance);
    const message = `Hello ${driver.name}, this is a payment reminder from MotoFleet regarding your account for ${monthName} ${selectedYear}. Currently, you have an outstanding balance of R${amountOwed}. Please settle this balance as soon as possible to ensure continued asset access. Thank you.`;
    const encoded = encodeURIComponent(message);
    const url = `https://wa.me/${driver.contact.replace(/\s+/g, '')}?text=${encoded}`;
    window.open(url, '_blank');
  };

  const collectionStats = useMemo(() => {
    const driverData = drivers.map(d => {
      const total = filteredPayments.filter(p => p.driverId === d.id).reduce((acc, p) => acc + p.amount, 0);
      const due = weeksInMonth * weeklyTarget;
      return { id: d.id, total, due, balance: total - due };
    });

    const totalArrears = driverData.filter(d => d.balance < 0).reduce((acc, d) => acc + Math.abs(d.balance), 0);
    const overdueCount = driverData.filter(d => d.balance < 0).length;
    const collectionRate = driverData.reduce((acc, d) => acc + d.total, 0) / (drivers.length * weeksInMonth * weeklyTarget);

    return { totalArrears, overdueCount, collectionRate: Math.round(collectionRate * 100), driverData };
  }, [drivers, filteredPayments, weeksInMonth, weeklyTarget]);

  const displayDrivers = useMemo(() => {
    if (!filterArrearsOnly) return drivers;
    return drivers.filter(d => {
      const stats = collectionStats.driverData.find(sd => sd.id === d.id);
      return stats && stats.balance < 0;
    });
  }, [drivers, filterArrearsOnly, collectionStats]);

  useEffect(() => {
    if (editingCell && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingCell]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Fleet Arrears</p>
            <h3 className={`text-2xl font-black ${collectionStats.totalArrears > 0 ? 'text-red-600' : 'text-gray-800'}`}>R{collectionStats.totalArrears.toLocaleString()}</h3>
          </div>
          <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-xl">💸</div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Overdue Accounts</p>
            <h3 className="text-2xl font-black text-gray-800">{collectionStats.overdueCount} Operators</h3>
          </div>
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-xl">⚠️</div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Collection Target</p>
            <span className="text-[10px] font-black text-blue-600">{collectionStats.collectionRate}%</span>
          </div>
          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
             <div className="bg-blue-600 h-full transition-all duration-1000" style={{ width: `${collectionStats.collectionRate}%` }}></div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">Payment Ledger</h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            {months[selectedMonth]} {selectedYear} Collection Cycle
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setFilterArrearsOnly(!filterArrearsOnly)}
            className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${filterArrearsOnly ? 'bg-red-600 text-white shadow-lg' : 'bg-white border border-gray-100 text-gray-400'}`}
          >
            {filterArrearsOnly ? 'Arrears Active' : 'Filter Arrears'}
          </button>
          <select 
            value={selectedMonth} 
            onChange={e => setSelectedMonth(parseInt(e.target.value))}
            className="bg-white border border-gray-100 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-blue-500/10 outline-none"
          >
            {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
          </select>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 font-black uppercase text-[10px] tracking-widest"
          >
            {showForm ? 'Cancel' : '+ Manual Entry'}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={(e) => { e.preventDefault(); onAddPayment(newPayment); setShowForm(false); }} className="bg-white p-8 rounded-[2rem] shadow-xl border border-blue-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Operator</label>
              <select className="w-full border-gray-100 rounded-xl p-3 bg-gray-50 text-sm font-bold" value={newPayment.driverId} onChange={e => setNewPayment({...newPayment, driverId: e.target.value})}>
                {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Amount (R)</label>
              <input type="number" className="w-full border-gray-100 rounded-xl p-3 bg-gray-50 text-sm font-bold" value={newPayment.amount} onChange={e => setNewPayment({...newPayment, amount: Number(e.target.value)})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Date</label>
              <input type="date" className="w-full border-gray-100 rounded-xl p-3 bg-gray-50 text-sm font-bold" value={newPayment.date} onChange={e => setNewPayment({...newPayment, date: e.target.value})} />
            </div>
            <div className="flex items-end">
              <button type="submit" className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-black uppercase text-[10px] tracking-widest">Post Entry</button>
            </div>
          </div>
        </form>
      )}

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50/50 border-b border-gray-100 text-[9px] font-black text-gray-400 uppercase tracking-widest">
            <tr>
              <th className="px-8 py-5 sticky left-0 bg-gray-50/50 z-10">Operator</th>
              {[...Array(weeksInMonth)].map((_, i) => (
                <th key={i} className="px-4 py-5 text-center">W{i + 1}</th>
              ))}
              <th className="px-8 py-5 text-right">Settled</th>
              <th className="px-8 py-5 text-right">Balance</th>
              <th className="px-8 py-5 text-center">Notify</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {displayDrivers.map(driver => {
              const weeklyPaidSums = [...Array(weeksInMonth)].map((_, i) => 
                getWeeklyPaymentsForSlot(driver.id, i).reduce((a, b) => a + b.amount, 0)
              );
              const monthlyTotal = weeklyPaidSums.reduce((a, b) => a + b, 0);
              const monthlyDue = weeksInMonth * weeklyTarget;
              const monthlyBalance = monthlyTotal - monthlyDue;

              return (
                <tr key={driver.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-8 py-6 sticky left-0 bg-white group-hover:bg-gray-50/50 transition-colors">
                    <div className="font-black text-gray-800 whitespace-nowrap uppercase tracking-tight leading-tight">{driver.name}</div>
                    <div className="text-[8px] text-gray-400 uppercase font-bold tracking-widest mt-1">
                      {monthlyBalance >= 0 ? '✔️ Healthy' : '🚨 Arrears'}
                    </div>
                  </td>
                  
                  {weeklyPaidSums.map((amount, i) => {
                    const isEditing = editingCell?.driverId === driver.id && editingCell?.weekIndex === i;
                    return (
                      <td key={i} className="px-4 py-6 text-center">
                        {isEditing ? (
                          <input 
                            ref={editInputRef}
                            type="number"
                            className="w-20 px-2 py-1.5 rounded-lg border-2 border-blue-500 text-center font-black text-[10px] outline-none"
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onBlur={saveEdit}
                            onKeyDown={e => e.key === 'Enter' && saveEdit()}
                          />
                        ) : (
                          <button 
                            onClick={() => handleCellClick(driver.id, i, amount)}
                            className={`inline-block px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-tighter min-w-[65px] transition-all ${
                              amount >= weeklyTarget ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                              amount > 0 ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' :
                              'bg-gray-100 text-gray-300 hover:bg-blue-600 hover:text-white'
                            }`}
                          >
                            {amount > 0 ? `R${amount}` : '+ Pay'}
                          </button>
                        )}
                      </td>
                    );
                  })}

                  <td className="px-8 py-6 text-[11px] font-black text-gray-800 text-right">R{monthlyTotal}</td>
                  <td className={`px-8 py-6 text-[11px] font-black text-right ${monthlyBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {monthlyBalance >= 0 ? `+R${monthlyBalance}` : `R${monthlyBalance}`}
                  </td>
                  <td className="px-8 py-6 text-center">
                    {monthlyBalance < 0 && (
                      <button 
                        onClick={() => sendArrearsReminder(driver, monthlyBalance)}
                        className="w-8 h-8 bg-green-50 text-green-600 rounded-lg flex items-center justify-center hover:bg-green-600 hover:text-white transition-all shadow-sm"
                        title="WhatsApp Arrears Reminder"
                      >
                        💬
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {displayDrivers.length === 0 && (
        <div className="bg-white p-20 text-center rounded-[2.5rem] border border-dashed border-gray-200">
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No accounts found matching filter</p>
        </div>
      )}
    </div>
  );
};

export default PaymentTracking;