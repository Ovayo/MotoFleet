
import React, { useState } from 'react';
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
        return (
          <FleetManagement 
            bikes={bikes} 
            setBikes={setBikes} 
            drivers={drivers} 
            maintenance={maintenance} 
          />
        );
      case 'drivers':
        return <DriverManagement drivers={drivers} setDrivers={setDrivers} bikes={bikes} />;
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
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar activeView={view} setView={setView} />
      <main className="flex-1 ml-64 p-8">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 capitalize">{view.replace('-', ' ')}</h1>
            <p className="text-gray-500">Fleet management system active and monitoring.</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-white p-2 rounded-full shadow-sm border border-gray-100">
               <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">JD</div>
            </div>
          </div>
        </header>
        {renderView()}
      </main>
    </div>
  );
};

export default App;
