
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
  const [viewMode, setViewMode] = useState<'ledger' | 'calendar'>('ledger');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [filterArrearsOnly, setFilterArrearsOnly] = useState(false);
  
  const [editingCell, setEditingCell] = useState<{ driverId: string, weekIndex: number } | null>(null);
  const [editingTargetDriverId, setEditingTargetDriverId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [targetEditValue, setTargetEditValue] = useState<string>('');
  
  const editInputRef = useRef<HTMLInputElement>(null);
  const targetInputRef = useRef<HTMLInputElement>(null);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const activeDrivers = useMemo(() => drivers.filter(d => !d.isArchived), [drivers]);

  const [newPayment, setNewPayment] = useState({
    driverId: activeDrivers[0]?.id || '',
    amount: activeDrivers[0]?.weeklyTarget || weeklyTarget,
    date: new Date().toISOString().split('T')[0],
    weekNumber: 1,
    type: 'rental' as const
  });

  const handleDriverChangeInForm = (driverId: string) => {
    const driver = activeDrivers.find(d => d.id === driverId);
    setNewPayment(prev => ({
      ...prev,
      driverId,
      amount: driver?.weeklyTarget || weeklyTarget
    }));
  };

  const weeksInMonth = useMemo(() => {
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0);
    const days = lastDay.getDate();
    return days > 28 ? 5 : 4;
  }, [selectedMonth, selectedYear]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(selectedYear, selectedMonth, 1).getDay();
    const padding = firstDay === 0 ? 6 : firstDay - 1;
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    
    const days: { day: number; currentMonth: boolean }[] = [];
    
    for (let i = padding - 1; i >= 0; i--) {
      days.push({ day: daysInPrevMonth - i, currentMonth: false });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, currentMonth: true });
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, currentMonth: false });
    }
    return days;
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

  const collectionStats = useMemo(() => {
    const CURRENT_WEEK = 4;
    const driverData = activeDrivers.map(d => {
      const total = filteredPayments.filter(p => p.driverId === d.id).reduce((acc, p) => acc + p.amount, 0);
      const target = d.weeklyTarget || weeklyTarget;
      const due = weeksInMonth * target;
      return { id: d.id, total, due, balance: total - due };
    });

    const totalArrears = driverData.filter(d => d.balance < 0).reduce((acc, d) => acc + Math.abs(d.balance), 0);
    const overdueCount = driverData.filter(d => d.balance < 0).length;
    
    const totalDueFleet = driverData.reduce((acc, d) => acc + d.due, 0);
    const totalCollected = driverData.reduce((acc, d) => acc + d.total, 0);
    const collectionRate = totalDueFleet > 0 ? Math.round((totalCollected / totalDueFleet) * 100) : 100;
    
    // Calculate weekly outstanding for active week (Simulated as Week 4)
    const totalPaidWeek = payments.filter(p => p.weekNumber === CURRENT_WEEK).reduce((acc, p) => acc + p.amount, 0);
    const totalDueWeek = activeDrivers.reduce((acc, d) => acc + (d.weeklyTarget || weeklyTarget), 0);
    const remainingDueWeek = Math.max(0, totalDueWeek - totalPaidWeek);

    return { totalArrears, overdueCount, collectionRate, driverData, remainingDueWeek };
  }, [activeDrivers, filteredPayments, weeksInMonth, weeklyTarget, payments]);

  const displayDrivers = useMemo(() => {
    const list = activeDrivers;
    if (!filterArrearsOnly) return list;
    return list.filter(d => {
      const stats = collectionStats.driverData.find(sd => sd.id === d.id);
      return stats && stats.balance < 0;
    });
  }, [activeDrivers, filterArrearsOnly, collectionStats]);

  const ledgerTotals = useMemo(() => {
    let settled = 0;
    let balance = 0;
    let weeklyTargetSum = 0;

    displayDrivers.forEach(driver => {
      const monthlyTotal = [...Array(weeksInMonth)].reduce((acc, _, i) => 
        acc + getWeeklyPaymentsForSlot(driver.id, i).reduce((a, b) => a + b.amount, 0), 0
      );
      const currentTarget = driver.weeklyTarget || weeklyTarget;
      const monthlyDue = weeksInMonth * currentTarget;
      
      settled += monthlyTotal;
      balance += (monthlyTotal - monthlyDue);
      weeklyTargetSum += currentTarget;
    });

    return { settled, balance, weeklyTargetSum };
  }, [displayDrivers, weeksInMonth, weeklyTarget, filteredPayments]);

  const handleCellClick = (driverId: string, weekIndex: number, currentAmount: number) => {
    const driver = drivers.find(d => d.id === driverId);
    const target = driver?.weeklyTarget || weeklyTarget;
    if (currentAmount === 0) {
      const day = (weekIndex * 7) + 1;
      const date = new Date(selectedYear, selectedMonth, day).toISOString().split('T')[0];
      onAddPayment({
        driverId,
        amount: target,
        date,
        weekNumber: weekIndex + 1,
        type: 'rental'
      });
    } else {
      setEditingCell({ driverId, weekIndex });
      setEditValue(currentAmount.toString());
    }
  };

  const handleTargetClick = (driver: Driver) => {
    setEditingTargetDriverId(driver.id);
    setTargetEditValue((driver.weeklyTarget || weeklyTarget).toString());
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

  const saveTargetEdit = () => {
    if (!editingTargetDriverId) return;
    const driver = drivers.find(d => d.id === editingTargetDriverId);
    const newVal = parseFloat(targetEditValue);
    if (driver && !isNaN(newVal) && newVal >= 0) {
      onUpdateDriver({ ...driver, weeklyTarget: newVal });
    }
    setEditingTargetDriverId(null);
  };

  const handleCalendarDayClick = (day: number, currentMonth: boolean) => {
    if (!currentMonth) return;
    const dateStr = new Date(selectedYear, selectedMonth, day).toISOString().split('T')[0];
    const weekNum = Math.ceil(day / 7);
    setNewPayment(prev => ({ ...prev, date: dateStr, weekNumber: weekNum }));
    setShowForm(true);
  };

  useEffect(() => {
    if (editingCell && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
    if (editingTargetDriverId && targetInputRef.current) {
      targetInputRef.current.focus();
      targetInputRef.current.select();
    }
  }, [editingCell, editingTargetDriverId]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Active Arrears</p>
            <h3 className={`text-2xl font-black ${collectionStats.totalArrears > 0 ? 'text-red-600' : 'text-gray-800'}`}>R{collectionStats.totalArrears.toLocaleString()}</h3>
          </div>
          <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-xl">💸</div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Outstanding (Week)</p>
            <h3 className={`text-2xl font-black text-orange-600`}>R{collectionStats.remainingDueWeek.toLocaleString()}</h3>
          </div>
          <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-xl">⌛</div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Overdue Accounts</p>
            <h3 className="text-2xl font-black text-gray-800">{collectionStats.overdueCount} Active</h3>
          </div>
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-xl">⚠️</div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Fleet Collection</p>
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
            {months[selectedMonth]} {selectedYear} • Managed by Fleet Logistics
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="bg-gray-100 p-1 rounded-xl flex mr-2">
            <button onClick={() => setViewMode('ledger')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'ledger' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}>Ledger</button>
            <button onClick={() => setViewMode('calendar')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'calendar' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}>Calendar</button>
          </div>
          <select value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))} className="bg-white border border-gray-100 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-blue-500/10 outline-none">
            {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
          </select>
          <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 font-black uppercase text-[10px] tracking-widest">
            {showForm ? 'Cancel' : '+ Manual Entry'}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={(e) => { e.preventDefault(); onAddPayment(newPayment); setShowForm(false); }} className="bg-white p-8 rounded-[2rem] shadow-xl border border-blue-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Operator</label>
              <select 
                className="w-full border-gray-100 rounded-xl p-3 bg-gray-50 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                value={newPayment.driverId} 
                onChange={e => handleDriverChangeInForm(e.target.value)}
              >
                {activeDrivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Amount (R)</label>
              <input type="number" className="w-full border-gray-100 rounded-xl p-3 bg-gray-50 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all" value={newPayment.amount} onChange={e => setNewPayment({...newPayment, amount: Number(e.target.value)})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Date</label>
              <input type="date" className="w-full border-gray-100 rounded-xl p-3 bg-gray-50 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all" value={newPayment.date} onChange={e => setNewPayment({...newPayment, date: e.target.value})} />
            </div>
            <div className="flex items-end">
              <button type="submit" className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-blue-100">Post Entry</button>
            </div>
          </div>
        </form>
      )}

      {viewMode === 'ledger' ? (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/50 border-b border-gray-100 text-[9px] font-black text-gray-400 uppercase tracking-widest">
              <tr>
                <th className="px-8 py-5 sticky left-0 bg-gray-50/50 z-10">Operator Hub</th>
                {[...Array(weeksInMonth)].map((_, i) => <th key={i} className="px-4 py-5 text-center">Week {i + 1}</th>)}
                <th className="px-8 py-5 text-right">Settled</th>
                <th className="px-8 py-5 text-right">Balance</th>
                <th className="px-8 py-5 text-center bg-gray-100/30">Set Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {displayDrivers.map(driver => {
                const weeklyPaidSums = [...Array(weeksInMonth)].map((_, i) => 
                  getWeeklyPaymentsForSlot(driver.id, i).reduce((a, b) => a + b.amount, 0)
                );
                const monthlyTotal = weeklyPaidSums.reduce((a, b) => a + b, 0);
                const currentTarget = driver.weeklyTarget || weeklyTarget;
                const monthlyDue = weeksInMonth * currentTarget;
                const monthlyBalance = monthlyTotal - monthlyDue;
                const isEditingTarget = editingTargetDriverId === driver.id;

                return (
                  <tr key={driver.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-8 py-6 sticky left-0 bg-white group-hover:bg-gray-50/50 transition-colors">
                      <div className="font-black text-gray-800 whitespace-nowrap uppercase tracking-tight leading-tight">{driver.name}</div>
                      <div className={`text-[8px] uppercase font-bold tracking-widest mt-1 ${monthlyBalance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {monthlyBalance >= 0 ? 'Account Health: Positive' : 'Account Health: Arrears'}
                      </div>
                    </td>
                    
                    {weeklyPaidSums.map((amount, i) => {
                      const isEditing = editingCell?.driverId === driver.id && editingCell?.weekIndex === i;
                      const isFullyPaid = amount >= currentTarget;
                      return (
                        <td key={i} className="px-4 py-6 text-center">
                          {isEditing ? (
                            <input ref={editInputRef} type="number" className="w-20 px-2 py-1.5 rounded-lg border-2 border-blue-500 text-center font-black text-[10px] outline-none" value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={saveEdit} onKeyDown={e => e.key === 'Enter' && saveEdit()} />
                          ) : (
                            <button 
                              onClick={() => handleCellClick(driver.id, i, amount)}
                              className={`inline-block px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-tighter min-w-[70px] transition-all ${isFullyPaid ? 'bg-green-100 text-green-700 hover:bg-green-200' : amount > 0 ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-gray-100 text-gray-300 hover:bg-blue-600 hover:text-white'}`}
                            >
                              {amount > 0 ? `R${amount}` : '+ Pay'}
                            </button>
                          )}
                        </td>
                      );
                    })}

                    <td className="px-8 py-6 text-[11px] font-black text-gray-800 text-right">R{monthlyTotal.toLocaleString()}</td>
                    <td className={`px-8 py-6 text-[11px] font-black text-right ${monthlyBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {monthlyBalance >= 0 ? `+R${monthlyBalance}` : `R${monthlyBalance}`}
                    </td>
                    <td className="px-8 py-6 text-center bg-gray-50/30">
                      <div className="flex flex-col items-center">
                        {isEditingTarget ? (
                           <input ref={targetInputRef} type="number" className="w-20 px-2 py-1.5 rounded-lg border-2 border-indigo-500 text-center font-black text-[10px] outline-none" value={targetEditValue} onChange={e => setTargetEditValue(e.target.value)} onBlur={saveTargetEdit} onKeyDown={e => e.key === 'Enter' && saveTargetEdit()} />
                        ) : (
                          <div 
                            onClick={() => handleTargetClick(driver)}
                            className="group/target cursor-pointer"
                          >
                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black border transition-all group-hover/target:bg-indigo-50 ${driver.weeklyTarget ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                              R{currentTarget}
                            </span>
                            <div className="opacity-0 group-hover/target:opacity-100 transition-opacity text-[6px] font-black text-indigo-400 uppercase mt-0.5">Click to edit</div>
                          </div>
                        )}
                        {driver.weeklyTarget && !isEditingTarget && <span className="text-[7px] font-black text-indigo-400 uppercase tracking-tighter mt-1">Driver Specific</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-50 border-t-2 border-gray-100">
              <tr className="font-black text-gray-900 text-[10px] uppercase tracking-widest">
                <td className="px-8 py-6 sticky left-0 bg-gray-50 z-10">Fleet Cumulative</td>
                {[...Array(weeksInMonth)].map((_, i) => <td key={i} className="px-4 py-6"></td>)}
                <td className="px-8 py-6 text-right">R{ledgerTotals.settled.toLocaleString()}</td>
                <td className={`px-8 py-6 text-right ${ledgerTotals.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {ledgerTotals.balance >= 0 ? `+R${ledgerTotals.balance.toLocaleString()}` : `R${ledgerTotals.balance.toLocaleString()}`}
                </td>
                <td className="px-8 py-6 text-center bg-gray-100/50">
                  <div className="flex flex-col items-center">
                    <span className="text-indigo-600 text-sm">R{ledgerTotals.weeklyTargetSum.toLocaleString()}</span>
                    <span className="text-[7px] text-gray-400 mt-1">Total Weekly Demand</span>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-500">
           <div className="grid grid-cols-7 border-b border-gray-100">
             {daysOfWeek.map(d => <div key={d} className="px-4 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">{d}</div>)}
           </div>
           <div className="grid grid-cols-7 grid-rows-6 h-[700px]">
             {calendarDays.map((dayObj, idx) => {
               const dayPayments = dayObj.currentMonth ? filteredPayments.filter(p => new Date(p.date).getDate() === dayObj.day) : [];
               return (
                 <div key={idx} onClick={() => handleCalendarDayClick(dayObj.day, dayObj.currentMonth)} className={`border-r border-b border-gray-50 p-2 flex flex-col space-y-1 overflow-hidden transition-colors ${!dayObj.currentMonth ? 'bg-gray-50/50' : 'hover:bg-blue-50/20 cursor-pointer'} ${idx % 7 === 6 ? 'border-r-0' : ''}`}>
                   <div className="flex justify-between items-start">
                     <span className={`text-[11px] font-black ${dayObj.currentMonth ? 'text-gray-800' : 'text-gray-300'}`}>{dayObj.day}</span>
                   </div>
                   <div className="flex-1 overflow-y-auto no-scrollbar space-y-1">
                     {dayPayments.map(p => {
                       const driver = drivers.find(d => d.id === p.driverId);
                       return (
                         <div key={p.id} className="bg-white border border-gray-100 rounded-lg p-1.5 shadow-sm flex items-center space-x-2">
                           <div className="w-5 h-5 rounded-md bg-blue-100 flex items-center justify-center text-[8px] font-black text-blue-600 shrink-0 overflow-hidden">
                              {driver?.profilePictureUrl ? <img src={driver.profilePictureUrl} className="w-full h-full object-cover" /> : driver?.name.substring(0, 1)}
                           </div>
                           <div className="min-w-0 flex-1">
                             <p className="text-[7px] font-black text-gray-800 uppercase truncate leading-tight">{driver?.name.split(' ')[0]}</p>
                             <p className="text-[8px] font-black text-blue-500 leading-tight">R{p.amount}</p>
                           </div>
                         </div>
                       );
                     })}
                   </div>
                 </div>
               );
             })}
           </div>
        </div>
      )}
    </div>
  );
};

export default PaymentTracking;
