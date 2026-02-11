
import React, { useState, useEffect, useMemo } from 'react';
import { INITIAL_BIKES, INITIAL_DRIVERS, INITIAL_PAYMENTS } from './data';
import { Bike, Driver, Payment, MaintenanceRecord, View } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import FleetManagement from './components/FleetManagement';
import DriverManagement from './components/DriverManagement';
import PaymentTracking from './components/PaymentTracking';
import MaintenanceLog from './components/MaintenanceLog';
import TrackingPortal from './components/TrackingPortal';
import DriverProfile from './components/DriverProfile';
import DriverLogin from './components/DriverLogin';
import MechanicPortal from './components/MechanicPortal';

const STORAGE_KEYS = {
  BIKES: 'motofleet_bikes_v3',
  DRIVERS: 'motofleet_drivers_v3',
  PAYMENTS: 'motofleet_payments_v3',
  MAINTENANCE: 'motofleet_maintenance_v3',
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

  // Explicit persistence watchers
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BIKES, JSON.stringify(bikes));
  }, [bikes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DRIVERS, JSON.stringify(drivers));
  }, [drivers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MAINTENANCE, JSON.stringify(maintenance));
  }, [maintenance]);

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
        return <FleetManagement bikes={bikes} setBikes={setBikes} drivers={drivers} maintenance={maintenance} payments={payments} weeklyTarget={WEEKLY_TARGET} />;
      case 'tracking':
        return <TrackingPortal bikes={bikes} />;
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
    <div className="flex min-h-screen bg-gray-50 text-gray-900 font-sans">
      <Sidebar 
        activeView={view} 
        setView={setView} 
        role={role} 
        hideSwitcher={isDedicatedDriverMode || isDedicatedMechanicMode}
        onSwitchMode={(newRole) => {
          setRole(newRole);
          if (newRole === 'admin') setView('dashboard');
          if (newRole === 'mechanic') setView('mechanic-portal');
          if (newRole === 'driver') setLoggedDriver(null);
        }}
      />
      <main className={`flex-1 transition-all duration-300 ${(isDedicatedDriverMode || isDedicatedMechanicMode) ? 'ml-0 md:ml-64' : 'ml-64'} p-4 md:p-8`}>
        <header className="mb-8 flex justify-between items-center bg-white/50 backdrop-blur-sm p-4 rounded-3xl border border-gray-100 sticky top-4 z-20">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-black text-gray-800 tracking-tight capitalize">
                {role === 'admin' ? view.replace('-', ' ') : role === 'mechanic' ? 'Workshop Monitoring' : `Driver Profile`}
              </h1>
              {role === 'admin' && <span className="text-[10px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-widest">eNaTIS & GPS Linked</span>}
            </div>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">
              {role === 'admin' ? "System Master Terminal" : role === 'mechanic' ? "Mechanical Maintenance Portal" : `${loggedDriver?.name}`}
            </p>
          </div>
          <div className="flex items-center space-x-4">
             {role !== 'admin' && (
               <button onClick={handleLogout} className="text-[10px] font-black text-gray-400 hover:text-red-500 uppercase tracking-widest transition-colors">Logout Session</button>
             )}
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black shadow-lg ${role === 'admin' ? 'bg-blue-600 shadow-blue-100' : role === 'mechanic' ? 'bg-amber-600 shadow-amber-100' : 'bg-green-600 shadow-green-100'}`}>
              {role === 'admin' ? 'AD' : role === 'mechanic' ? 'ME' : loggedDriver?.name.substring(0, 2).toUpperCase()}
            </div>
          </div>
        </header>
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          {renderView()}
        </div>
      </main>
    </div>
  );
};

export default App;
