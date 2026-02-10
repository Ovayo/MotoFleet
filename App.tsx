
import React, { useState, useEffect } from 'react';
import { INITIAL_BIKES, INITIAL_DRIVERS, INITIAL_PAYMENTS } from './data';
import { Bike, Driver, Payment, MaintenanceRecord, View } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import FleetManagement from './components/FleetManagement';
import DriverManagement from './components/DriverManagement';
import PaymentTracking from './components/PaymentTracking';
import MaintenanceLog from './components/MaintenanceLog';

const App: React.FC = () => {
  const [view, setView] = useState<View>('dashboard');
  const [bikes, setBikes] = useState<Bike[]>(INITIAL_BIKES);
  const [drivers, setDrivers] = useState<Driver[]>(INITIAL_DRIVERS);
  const [payments, setPayments] = useState<Payment[]>(INITIAL_PAYMENTS);
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>([]);

  // Weekly target per bike
  const WEEKLY_TARGET = 650;

  const handleAddPayment = (payment: Omit<Payment, 'id'>) => {
    const newPayment: Payment = {
      ...payment,
      id: `p-${Date.now()}`
    };
    setPayments([...payments, newPayment]);
  };

  const handleAddMaintenance = (record: Omit<MaintenanceRecord, 'id'>) => {
    const newRecord: MaintenanceRecord = {
      ...record,
      id: `m-${Date.now()}`
    };
    setMaintenance([...maintenance, newRecord]);
  };

  const renderView = () => {
    switch (view) {
      case 'dashboard':
        return (
          <Dashboard 
            bikes={bikes} 
            drivers={drivers} 
            payments={payments} 
            maintenance={maintenance}
            weeklyTarget={WEEKLY_TARGET}
          />
        );
      case 'fleet':
        return <FleetManagement bikes={bikes} setBikes={setBikes} />;
      case 'drivers':
        return <DriverManagement drivers={drivers} bikes={bikes} />;
      case 'payments':
        return (
          <PaymentTracking 
            drivers={drivers} 
            payments={payments} 
            onAddPayment={handleAddPayment} 
            weeklyTarget={WEEKLY_TARGET}
          />
        );
      case 'maintenance':
        return (
          <MaintenanceLog 
            bikes={bikes} 
            maintenance={maintenance} 
            onAddMaintenance={handleAddMaintenance} 
          />
        );
      default:
        return <Dashboard bikes={bikes} drivers={drivers} payments={payments} maintenance={maintenance} weeklyTarget={WEEKLY_TARGET} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar activeView={view} setView={setView} />
      <main className="flex-1 ml-64 p-8">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 capitalize">{view}</h1>
            <p className="text-gray-500">Welcome back! Here's what's happening today.</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-white p-2 rounded-full shadow-sm border border-gray-100">
               <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">A</div>
            </div>
          </div>
        </header>
        {renderView()}
      </main>
    </div>
  );
};

export default App;
