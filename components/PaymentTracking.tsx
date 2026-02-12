
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
  
  // State for inline editing
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

  // Helper to get total payments for a specific driver and "week slot" in the month
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
      // Instant quick pay
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
      // Enter edit mode
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
      // If cleared or 0, maybe user wants to delete?
      if (slotPayments.length > 0) {
        slotPayments.forEach(p => onDeletePayment(p.id));
      }
    } else {
      // Update existing or add new if something weird happened
      if (slotPayments.length > 0) {
        // Simple logic: update the first payment in the slot
        onUpdatePayment(slotPayments[0].id, newVal);
        // If there were multiple, delete others to consolidate (on the fly logic)
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') saveEdit();
    if (e.key === 'Escape') setEditingCell(null);
  };

  useEffect(() => {
    if (editingCell && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingCell]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddPayment(newPayment);
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">Payment Ledger</h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            Instantly click cells to log/edit weekly rentals (Target: R{weeklyTarget})
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <select 
            value={selectedMonth} 
            onChange={e => setSelectedMonth(parseInt(e.target.value))}
            className="bg-white border border-gray-100 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-blue-500/10 outline-none"
          >
            {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
          </select>
          <select 
            value={selectedYear} 
            onChange={e => setSelectedYear(parseInt(e.target.value))}
            className="bg-white border border-gray-100 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-blue-500/10 outline-none"
          >
            {[2023, 2024, 2025].map(y => <option key={y} value={y}>{y}</option>)}
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
        <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-[2rem] shadow-xl border border-blue-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Operator</label>
              <select 
                className="w-full border-gray-100 rounded-xl p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-sm"
                value={newPayment.driverId}
                onChange={e => setNewPayment({...newPayment, driverId: e.target.value})}
              >
                {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Date</label>
              <input 
                type="date"
                className="w-full border-gray-100 rounded-xl p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-sm"
                value={newPayment.date}
                onChange={e => setNewPayment({...newPayment, date: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Amount (R)</label>
              <input 
                type="number"
                className="w-full border-gray-100 rounded-xl p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-sm"
                value={newPayment.amount}
                onChange={e => setNewPayment({...newPayment, amount: Number(e.target.value)})}
              />
            </div>
            <div className="flex items-end">
              <button type="submit" className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">Save Transaction</button>
            </div>
          </div>
        </form>
      )}

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-x-auto min-h-[400px]">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50/50 border-b border-gray-100">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest sticky left-0 bg-gray-50/50 z-10">Driver Profile</th>
              {[...Array(weeksInMonth)].map((_, i) => (
                <th key={i} className="px-4 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Week {i + 1}</th>
              ))}
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Settled</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {drivers.map(driver => {
              const weeklyPaidData = [...Array(weeksInMonth)].map((_, i) => getWeeklyPaymentsForSlot(driver.id, i));
              const weeklyPaidSums = weeklyPaidData.map(ps => ps.reduce((a, b) => a + b.amount, 0));
              const monthlyTotal = weeklyPaidSums.reduce((a, b) => a + b, 0);
              const monthlyDue = weeksInMonth * weeklyTarget;
              const monthlyBalance = monthlyTotal - monthlyDue;

              return (
                <tr key={driver.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-8 py-6 sticky left-0 bg-white group-hover:bg-gray-50/50 transition-colors">
                    <div className="font-black text-gray-800 whitespace-nowrap uppercase tracking-tight leading-tight">{driver.name}</div>
                    <div className="text-[9px] text-gray-400 uppercase font-bold tracking-widest mt-1">{driver.city}</div>
                  </td>
                  
                  {weeklyPaidSums.map((amount, i) => {
                    const isEditing = editingCell?.driverId === driver.id && editingCell?.weekIndex === i;
                    
                    return (
                      <td key={i} className="px-4 py-6 text-center">
                        {isEditing ? (
                          <div className="flex flex-col items-center">
                            <input 
                              ref={editInputRef}
                              type="number"
                              className="w-20 px-2 py-1.5 rounded-lg border-2 border-blue-500 text-center font-black text-[10px] outline-none shadow-lg"
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              onKeyDown={handleKeyDown}
                              onBlur={saveEdit}
                            />
                            <div className="flex space-x-1 mt-1">
                               <button onMouseDown={(e) => { e.preventDefault(); setEditValue(''); }} className="text-[8px] font-black text-red-500 uppercase">Clear</button>
                               <span className="text-gray-300 text-[8px]">|</span>
                               <button onMouseDown={(e) => { e.preventDefault(); setEditingCell(null); }} className="text-[8px] font-black text-gray-400 uppercase">Exit</button>
                            </div>
                          </div>
                        ) : (
                          <button 
                            onClick={() => handleCellClick(driver.id, i, amount)}
                            className={`inline-block px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter min-w-[70px] transition-all transform active:scale-95 ${
                              amount >= weeklyTarget ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                              amount > 0 ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' :
                              'bg-gray-100 text-gray-300 hover:bg-blue-600 hover:text-white group-hover:bg-gray-200'
                            }`}
                          >
                            {amount > 0 ? `R${amount}` : '+ Pay'}
                          </button>
                        )}
                      </td>
                    );
                  })}

                  <td className="px-8 py-6 text-sm font-black text-gray-800 text-right">
                    R{monthlyTotal.toLocaleString()}
                  </td>
                  
                  <td className={`px-8 py-6 text-sm font-black text-right ${monthlyBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {monthlyBalance >= 0 ? `+R${monthlyBalance.toLocaleString()}` : `R${monthlyBalance.toLocaleString()}`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center space-x-4 mb-2">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-2xl">📈</div>
            <div>
              <h4 className="text-sm font-black text-gray-800 uppercase tracking-tight">Monthly Snapshot</h4>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{months[selectedMonth]} {selectedYear}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
             <div>
               <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Collected</p>
               <p className="text-2xl font-black text-blue-600">R{filteredPayments.reduce((acc, p) => acc + p.amount, 0).toLocaleString()}</p>
             </div>
             <div className="text-right">
               <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Arrears Count</p>
               <p className="text-2xl font-black text-red-600">
                 {drivers.filter(d => {
                   const total = filteredPayments.filter(p => p.driverId === d.id).reduce((a, b) => a + b.amount, 0);
                   return total < (weeksInMonth * weeklyTarget);
                 }).length}
               </p>
             </div>
          </div>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-sm">
          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Ledger Intelligence</h4>
          <div className="space-y-3">
             <div className="flex items-center space-x-3">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <p className="text-[10px] font-bold text-gray-500 uppercase">Click empty cells to instantly log target payment (R{weeklyTarget})</p>
             </div>
             <div className="flex items-center space-x-3">
                <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                <p className="text-[10px] font-bold text-gray-500 uppercase">Click existing payments to edit "on the fly" or clear amount to delete</p>
             </div>
             <div className="flex items-center space-x-3">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <p className="text-[10px] font-bold text-gray-500 uppercase">Press <strong>Enter</strong> to save, <strong>Esc</strong> to cancel edit</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentTracking;
