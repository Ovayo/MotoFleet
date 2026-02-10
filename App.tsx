
import React, { useState, useEffect, useMemo } from 'react';
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
import MechanicPortal from './components/MechanicPortal';

const STORAGE_KEYS = {
  BIKES: 'motofleet_bikes_v1',
  DRIVERS: 'motofleet_drivers_v1',
  PAYMENTS: 'motofleet_payments_v1',
  MAINTENANCE: 'motofleet_maintenance_v1',
};

const App: React.FC = () => {
  const params = new URLSearchParams(window.location.search);
  const isDedicatedDriverMode = params.get('portal') === 'driver';
  const isDedicatedMechanicMode = params.get('portal') === 'mechanic';

  const [view, setView] = useState<View>(
    isDedicatedDriverMode ? 'driver-profile' : 
    isDedicatedMechanicMode ? 'mechanic-portal' : 'dashboard'
  );
  
  const [role, setRole] = useState<'admin' | 'driver' | 'mechanic'>(
    isDedicatedDriverMode ? 'driver' : 
    isDedicatedMechanicMode ? 'mechanic' : 'admin'
  );

  const [loggedDriver, setLoggedDriver] = useState<Driver | null>(null);
  
  const [bikes, setBikes] = useState<Bike[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BIKES);
    return saved ? JSON.parse(saved) : INITIAL_BIKES;
  });

  const [drivers, setDrivers] = useState<Driver[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DRIVERS);
    return saved ? JSON.parse(saved) : INITIAL_DRIVERS;
  });

  const [payments, setPayments] = useState<Payment[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
    return saved ? JSON.parse(saved) : INITIAL_PAYMENTS;
  });

  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MAINTENANCE);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => { localStorage.setItem(STORAGE_KEYS.BIKES, JSON.stringify(bikes)); }, [bikes]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.DRIVERS, JSON.stringify(drivers)); }, [drivers]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments)); }, [payments]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.MAINTENANCE, JSON.stringify(maintenance)); }, [maintenance]);

  const WEEKLY_TARGET = 650;

  const handleAddPayment = (payment: Omit<Payment, 'id'>) => {
    setPayments(prev => [...prev, { ...payment, id: `p-${Date.now()}` }]);
  };

  const handleAddMaintenance = (record: Omit<MaintenanceRecord, 'id'>) => {
    setMaintenance(prev => [...prev, { ...record, id: `m-${Date.now()}` }]);
  };

  const handleDriverLogin = (contact: string) => {
    const normalizedInput = contact.replace(/\s/g, '');
    const driver = drivers.find(d => d.contact.replace(/\s/g, '') === normalizedInput);
    if (driver) {
      setLoggedDriver(driver);
      setRole('driver');
      setView('driver-profile');
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setLoggedDriver(null);
    if (isDedicatedDriverMode) {
      setRole('driver');
    } else if (isDedicatedMechanicMode) {
      setRole('mechanic');
    } else {
      setRole('admin');
      setView('dashboard');
    }
  };

  const renderView = () => {
    if (role === 'driver' && loggedDriver) {
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

    if (role === 'mechanic') {
      return (
        <MechanicPortal 
          bikes={bikes} 
          setBikes={setBikes}
          maintenance={maintenance} 
          onAddMaintenance={handleAddMaintenance} 
        />
      );
    }

    switch (view) {
      case 'dashboard':
        return <Dashboard bikes={bikes} drivers={drivers} payments={payments} maintenance={maintenance} weeklyTarget={WEEKLY_TARGET} />;
      case 'fleet':
        return <FleetManagement bikes={bikes} setBikes={setBikes} drivers={drivers} maintenance={maintenance} />;
      case 'drivers':
        return <DriverManagement drivers={drivers} setDrivers={setDrivers} bikes={bikes} payments={payments} weeklyTarget={WEEKLY_TARGET} />;
      case 'payments':
        return <PaymentTracking drivers={drivers} payments={payments} onAddPayment={handleAddPayment} weeklyTarget={WEEKLY_TARGET} />;
      case 'maintenance':
        return <MaintenanceLog bikes={bikes} maintenance={maintenance} onAddMaintenance={handleAddMaintenance} />;
      case 'mechanic-portal':
        return <MechanicPortal bikes={bikes} setBikes={setBikes} maintenance={maintenance} onAddMaintenance={handleAddMaintenance} />;
      default:
        return <Dashboard bikes={bikes} drivers={drivers} payments={payments} maintenance={maintenance} weeklyTarget={WEEKLY_TARGET} />;
    }
  };

  if (role === 'driver' && !loggedDriver) {
    return <DriverLogin onLogin={handleDriverLogin} onBackToAdmin={() => setRole('admin')} />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar 
        activeView={view} 
        setView={setView} 
        role={role} 
        hideSwitcher={isDedicatedDriverMode || isDedicatedMechanicMode}
        onSwitchMode={(newRole) => {
          setRole(newRole);
          if (newRole === 'admin') setView('dashboard');
          if (newRole === 'mechanic') setView('mechanic-portal');
          if (newRole === 'driver') setLoggedDriver(null); // Triggers login
        }}
      />
      <main className={`flex-1 ${(isDedicatedDriverMode || isDedicatedMechanicMode) ? 'ml-0 md:ml-64' : 'ml-64'} p-4 md:p-8`}>
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 capitalize">
              {role === 'admin' ? view.replace('-', ' ') : role === 'mechanic' ? 'Mechanic Workshop' : `Welcome, ${loggedDriver?.name.split(' ')[0]}`}
            </h1>
            <p className="text-gray-500 text-sm">
              {role === 'admin' ? "System Administrator" : role === 'mechanic' ? "Auto Mechanics Dashboard" : "Driver Portfolio"}
            </p>
          </div>
          <div className="flex items-center space-x-4">
             {role !== 'admin' && (
               <button onClick={handleLogout} className="text-xs font-bold text-gray-400 hover:text-red-500 uppercase tracking-widest">Logout</button>
             )}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${role === 'admin' ? 'bg-blue-600' : role === 'mechanic' ? 'bg-amber-600' : 'bg-green-600'}`}>
              {role === 'admin' ? 'AD' : role === 'mechanic' ? 'ME' : loggedDriver?.name.substring(0, 2).toUpperCase()}
            </div>
          </div>
        </header>
        {renderView()}
      </main>
    </div>
  );
};

export default App;
