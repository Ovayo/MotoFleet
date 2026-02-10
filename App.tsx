
import React, { useState, useEffect } from 'react';
import { INITIAL_BIKES, INITIAL_DRIVERS, INITIAL_PAYMENTS } from './data';
import { Bike, Driver, Payment, MaintenanceRecord, View } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import FleetManagement from './components/FleetManagement';
import DriverManagement from './components/DriverManagement';
import PaymentTracking from './components/PaymentTracking';
import MaintenanceLog from './components/MaintenanceLog';
import DriverProfile from './components/DriverProfile';
import DriverLogin from './components/DriverLogin';

const App: React.FC = () => {
  const [view, setView] = useState<View>('dashboard');
  const [isAdmin, setIsAdmin] = useState<boolean>(true);
  const [loggedDriver, setLoggedDriver] = useState<Driver | null>(null);
  
  const [bikes, setBikes] = useState<Bike[]>(INITIAL_BIKES);
  const [drivers, setDrivers] = useState<Driver[]>(INITIAL_DRIVERS);
  const [payments, setPayments] = useState<Payment[]>(INITIAL_PAYMENTS);
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>([]);

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

  const handleDriverLogin = (contact: string) => {
    const normalizedInput = contact.replace(/\s/g, '');
    const driver = drivers.find(d => d.contact.replace(/\s/g, '') === normalizedInput);
    if (driver) {
      setLoggedDriver(driver);
      setIsAdmin(false);
      setView('driver-profile');
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setLoggedDriver(null);
    setIsAdmin(true);
    setView('dashboard');
  };

  const renderView = () => {
    if (!isAdmin && loggedDriver) {
      return (
        <DriverProfile 
          driver={loggedDriver} 
          payments={payments} 
          bike={bikes.find(b => b.assignedDriverId === loggedDriver.id)} 
          maintenance={maintenance}
          weeklyTarget={WEEKLY_TARGET}
        />
      );
    }

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

  if (!isAdmin && !loggedDriver) {
    return <DriverLogin onLogin={handleDriverLogin} onBackToAdmin={() => setIsAdmin(true)} />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar 
        activeView={view} 
        setView={setView} 
        isAdmin={isAdmin} 
        onSwitchMode={() => {
          if (isAdmin) setIsAdmin(false);
          else handleLogout();
        }}
      />
      <main className={`flex-1 ${isAdmin ? 'ml-64' : 'ml-0 md:ml-64'} p-4 md:p-8`}>
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 capitalize">
              {isAdmin ? view.replace('-', ' ') : `Welcome, ${loggedDriver?.name.split(' ')[0]} 😊`}
            </h1>
            <p className="text-gray-500 text-sm md:text-base">
              {isAdmin ? "Fleet management system active." : "Your personal rental portfolio and status."}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-white p-1 rounded-full shadow-sm border border-gray-100">
               <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full ${isAdmin ? 'bg-blue-600' : 'bg-green-600'} flex items-center justify-center text-white font-bold text-sm`}>
                 {isAdmin ? 'AD' : loggedDriver?.name.substring(0, 2).toUpperCase()}
               </div>
            </div>
          </div>
        </header>
        {renderView()}
      </main>
    </div>
  );
};

export default App;
