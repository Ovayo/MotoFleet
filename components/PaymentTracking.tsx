
import React, { useState } from 'react';
import { Driver, Payment } from '../types';

interface PaymentTrackingProps {
  drivers: Driver[];
  payments: Payment[];
  onAddPayment: (payment: Omit<Payment, 'id'>) => void;
  weeklyTarget: number;
}

const PaymentTracking: React.FC<PaymentTrackingProps> = ({ drivers, payments, onAddPayment, weeklyTarget }) => {
  const [showForm, setShowForm] = useState(false);
  const [newPayment, setNewPayment] = useState({
    driverId: drivers[0]?.id || '',
    amount: 650,
    date: new Date().toISOString().split('T')[0],
    weekNumber: 1,
    type: 'rental' as const
  });

  const getBalance = (driverId: string) => {
    const totalPaid = payments
      .filter(p => p.driverId === driverId)
      .reduce((acc, p) => acc + p.amount, 0);
    
    // Simplification: Assume current week is week 4
    const totalDue = 4 * weeklyTarget;
    return totalPaid - totalDue;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddPayment(newPayment);
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Weekly Payment Ledger</h2>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
        >
          {showForm ? 'Cancel' : '+ Log Payment'}
        </button>
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
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Amount (R)</label>
              <input 
                type="number"
                className="w-full border-gray-200 rounded-lg p-2 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
                value={newPayment.amount}
                onChange={e => setNewPayment({...newPayment, amount: Number(e.target.value)})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Week #</label>
              <input 
                type="number"
                className="w-full border-gray-200 rounded-lg p-2 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
                value={newPayment.weekNumber}
                onChange={e => setNewPayment({...newPayment, weekNumber: Number(e.target.value)})}
              />
            </div>
            <div className="flex items-end">
              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold">Save Payment</button>
            </div>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Driver</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Weekly Target</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Total Paid</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Balance</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {drivers.map(driver => {
              const balance = getBalance(driver.id);
              const totalPaid = payments.filter(p => p.driverId === driver.id).reduce((acc, p) => acc + p.amount, 0);
              return (
                <tr key={driver.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-800">{driver.name}</div>
                    <div className="text-xs text-gray-500">{driver.driverCode}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">R{weeklyTarget}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-800">R{totalPaid}</td>
                  <td className={`px-6 py-4 text-sm font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {balance >= 0 ? `+R${balance}` : `R${balance}`}
                  </td>
                  <td className="px-6 py-4">
                    {balance >= 0 ? (
                      <span className="flex items-center text-green-600 text-xs font-bold">
                        <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span> PAID
                      </span>
                    ) : (
                      <span className="flex items-center text-red-600 text-xs font-bold">
                        <span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span> ARREARS
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PaymentTracking;
