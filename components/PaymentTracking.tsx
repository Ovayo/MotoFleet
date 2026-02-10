
import React, { useState, useMemo } from 'react';
import { Driver, Payment } from '../types';

interface PaymentTrackingProps {
  drivers: Driver[];
  payments: Payment[];
  onAddPayment: (payment: Omit<Payment, 'id'>) => void;
  weeklyTarget: number;
}

const PaymentTracking: React.FC<PaymentTrackingProps> = ({ drivers, payments, onAddPayment, weeklyTarget }) => {
  const [showForm, setShowForm] = useState(false);
  
  // State for the selected month/year view
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

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

  // Calculate weeks in the selected month
  const weeksInMonth = useMemo(() => {
    const firstDay = new Date(selectedYear, selectedMonth, 1);
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0);
    const days = lastDay.getDate();
    
    // Simple logic: determine how many full/partial weeks fall into this month
    // We'll standardise on 4 or 5 slots for display
    return days > 28 || firstDay.getDay() > 4 ? 5 : 4;
  }, [selectedMonth, selectedYear]);

  // Filter payments for the selected month
  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      const pDate = new Date(p.date);
      return pDate.getMonth() === selectedMonth && pDate.getFullYear() === selectedYear;
    });
  }, [payments, selectedMonth, selectedYear]);

  // Helper to get payments for a specific driver and "week slot" in the month
  const getWeeklyPayment = (driverId: string, weekIndex: number) => {
    // We calculate "week slot" based on day of month: 1-7, 8-14, 15-21, 22-28, 29+
    return filteredPayments
      .filter(p => {
        if (p.driverId !== driverId) return false;
        const day = new Date(p.date).getDate();
        if (weekIndex === 0) return day >= 1 && day <= 7;
        if (weekIndex === 1) return day >= 8 && day <= 14;
        if (weekIndex === 2) return day >= 15 && day <= 21;
        if (weekIndex === 3) return day >= 22 && day <= 28;
        if (weekIndex === 4) return day >= 29;
        return false;
      })
      .reduce((acc, p) => acc + p.amount, 0);
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMonth(parseInt(e.target.value));
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(parseInt(e.target.value));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Auto-assign week number based on date if needed, 
    // but here we let the user specify or just use the date field.
    onAddPayment(newPayment);
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Payment Ledger</h2>
          <p className="text-sm text-gray-500">Tracking weekly installments of R{weeklyTarget}</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <select 
            value={selectedMonth} 
            onChange={handleMonthChange}
            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
          </select>
          <select 
            value={selectedYear} 
            onChange={handleYearChange}
            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {[2023, 2024, 2025].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
          >
            {showForm ? 'Cancel' : '+ Log Payment'}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-md border border-blue-100 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Driver</label>
              <select 
                className="w-full border-gray-200 rounded-lg p-2 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
                value={newPayment.driverId}
                onChange={e => setNewPayment({...newPayment, driverId: e.target.value})}
              >
                {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date</label>
              <input 
                type="date"
                className="w-full border-gray-200 rounded-lg p-2 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
                value={newPayment.date}
                onChange={e => setNewPayment({...newPayment, date: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Amount (R)</label>
              <input 
                type="number"
                className="w-full border-gray-200 rounded-lg p-2 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
                value={newPayment.amount}
                onChange={e => setNewPayment({...newPayment, amount: Number(e.target.value)})}
              />
            </div>
            <div className="flex items-end">
              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold">Save Payment</button>
            </div>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600 sticky left-0 bg-gray-50 z-10">Driver</th>
              {[...Array(weeksInMonth)].map((_, i) => (
                <th key={i} className="px-4 py-4 text-sm font-semibold text-gray-600 text-center">Week {i + 1}</th>
              ))}
              <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Total Paid</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {drivers.map(driver => {
              const weeklyPaid = [...Array(weeksInMonth)].map((_, i) => getWeeklyPayment(driver.id, i));
              const monthlyTotal = weeklyPaid.reduce((a, b) => a + b, 0);
              const monthlyDue = weeksInMonth * weeklyTarget;
              const monthlyBalance = monthlyTotal - monthlyDue;

              return (
                <tr key={driver.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 sticky left-0 bg-white group-hover:bg-gray-50">
                    <div className="font-medium text-gray-800 whitespace-nowrap">{driver.name}</div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider">{driver.driverCode}</div>
                  </td>
                  
                  {weeklyPaid.map((amount, i) => (
                    <td key={i} className="px-4 py-4 text-center">
                      <div className={`inline-block px-3 py-1 rounded-md text-xs font-bold min-w-[60px] ${
                        amount >= weeklyTarget ? 'bg-green-100 text-green-700' :
                        amount > 0 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-400'
                      }`}>
                        {amount > 0 ? `R${amount}` : '-'}
                      </div>
                    </td>
                  ))}

                  <td className="px-6 py-4 text-sm font-bold text-gray-800 text-right">
                    R{monthlyTotal}
                  </td>
                  
                  <td className={`px-6 py-4 text-sm font-bold text-right ${monthlyBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {monthlyBalance >= 0 ? `+R${monthlyBalance}` : `R${monthlyBalance}`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="bg-blue-50 p-4 rounded-xl flex-1 border border-blue-100">
          <h4 className="text-blue-800 font-bold text-sm mb-1">Monthly Summary: {months[selectedMonth]}</h4>
          <div className="flex justify-between items-end">
             <div>
               <p className="text-blue-600 text-xs">Total Collected</p>
               <p className="text-xl font-black text-blue-900">R{filteredPayments.reduce((acc, p) => acc + p.amount, 0).toLocaleString()}</p>
             </div>
             <div className="text-right">
               <p className="text-blue-600 text-xs">Arrears Count</p>
               <p className="text-xl font-black text-red-600">
                 {drivers.filter(d => {
                   const total = filteredPayments.filter(p => p.driverId === d.id).reduce((a, b) => a + b.amount, 0);
                   return total < (weeksInMonth * weeklyTarget);
                 }).length}
               </p>
             </div>
          </div>
        </div>
        <div className="bg-gray-50 p-4 rounded-xl flex-1 border border-gray-200">
          <h4 className="text-gray-700 font-bold text-sm mb-2">Legend</h4>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center text-xs">
              <span className="w-3 h-3 bg-green-100 rounded mr-2 border border-green-200"></span> Fully Paid
            </div>
            <div className="flex items-center text-xs">
              <span className="w-3 h-3 bg-yellow-100 rounded mr-2 border border-yellow-200"></span> Partial
            </div>
            <div className="flex items-center text-xs">
              <span className="w-3 h-3 bg-gray-100 rounded mr-2 border border-gray-200"></span> Unpaid
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentTracking;
