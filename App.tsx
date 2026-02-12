
import React, { useState, useEffect, useMemo } from 'react';
import { INITIAL_BIKES, INITIAL_DRIVERS, INITIAL_PAYMENTS, INITIAL_WORKSHOPS } from './data';
import { Bike, Driver, Payment, MaintenanceRecord, View, TrafficFine, Workshop } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import FleetManagement from './components/FleetManagement';
import DriverManagement from './components/DriverManagement';
import PaymentTracking from './components/PaymentTracking';
import MaintenanceLog from './components/MaintenanceLog';
import DriverProfile from './components/DriverProfile';
import DriverLogin from './components/DriverLogin';
import MechanicPortal from './components/MechanicPortal';
import TrafficFines from './components/TrafficFines';

const STORAGE_KEYS = {
  BIKES: 'motofleet_bikes_v3',
  DRIVERS: 'motofleet_drivers_v3',
  PAYMENTS: 'motofleet_payments_v3',
  MAINTENANCE: 'motofleet_maintenance_v3',
  FINES: 'motofleet_fines_v3',
  WORKSHOPS: 'motofleet_workshops_v3',
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

  const [fines, setFines] = useState<TrafficFine[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.FINES);
    return saved ? JSON.parse(saved) : [];
  });

  const [workshops, setWorkshops] = useState<Workshop[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.WORKSHOPS);
    return saved ? JSON.parse(saved) : INITIAL_WORKSHOPS;
  });

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

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FINES, JSON.stringify(fines));
  }, [fines]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WORKSHOPS, JSON.stringify(workshops));
  }, [workshops]);

  const WEEKLY_TARGET = 650;

  const handleAddPayment = (payment: Omit<Payment, 'id'>) => {
    setPayments(prev => [...prev, { ...payment, id: `p-${Date.now()}` }]);
  };

  const handleUpdatePayment = (id: string, amount: number) => {
    setPayments(prev => prev.map(p => p.id === id ? { ...p, amount } : p));
  };

  const handleDeletePayment = (id: string) => {
    setPayments(prev => prev.filter(p => p.id !== id));
  };

  const handleAddMaintenance = (record: Omit<MaintenanceRecord, 'id'>) => {
    setMaintenance(prev => [...prev, { ...record, id: `m-${Date.now()}` }]);
  };

  const handleUpdateMaintenance = (updatedRecord: MaintenanceRecord) => {
    setMaintenance(prev => prev.map(m => m.id === updatedRecord.id ? updatedRecord : m));
  };

  const handleDeleteMaintenance = (id: string) => {
    if (window.confirm("Confirm deletion of this expense record?")) {
      setMaintenance(prev => prev.filter(m => m.id !== id));
    }
  };

  const handleAddFine = (fine: Omit<TrafficFine, 'id'>) => {
    setFines(prev => [...prev, { ...fine, id: `f-${Date.now()}` }]);
  };

  const handleUpdateFineStatus = (id: string, status: TrafficFine['status']) => {
    setFines(prev => prev.map(f => f.id === id ? { ...f, status } : f));
  };

  const handleAddWorkshop = (workshop: Omit<Workshop, 'id'>) => {
    setWorkshops(prev => [...prev, { ...workshop, id: `w-${Date.now()}` }]);
  };

  const handleUpdateWorkshop = (id: string, updatedWorkshop: Omit<Workshop, 'id'>) => {
    setWorkshops(prev => prev.map(w => w.id === id ? { ...updatedWorkshop, id } : w));
  };

  const handleDeleteWorkshop = (id: string) => {
    if (window.confirm('Are you sure you want to remove this partner workshop?')) {
      setWorkshops(prev => prev.filter(w => w.id !== id));
    }
  };

  const handleUpdateDriver = (updatedDriver: Driver) => {
    setDrivers(prev => prev.map(d => d.id === updatedDriver.id ? updatedDriver : d));
    if (loggedDriver && loggedDriver.id === updatedDriver.id) {
      setLoggedDriver(updatedDriver);
    }
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
          onUpdateDriver={handleUpdateDriver}
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
          workshops={workshops}
          onAddWorkshop={handleAddWorkshop}
          onUpdateWorkshop={handleUpdateWorkshop}
          onDeleteWorkshop={handleDeleteWorkshop}
        />
      );
    }

    switch (view) {
      case 'dashboard':
        return <Dashboard bikes={bikes} drivers={drivers} payments={payments} maintenance={maintenance} weeklyTarget={WEEKLY_TARGET} />;
      case 'fleet':
        return <FleetManagement bikes={bikes} setBikes={setBikes} drivers={drivers} maintenance={maintenance} payments={payments} weeklyTarget={WEEKLY_TARGET} workshops={workshops} />;
      case 'drivers':
        return <DriverManagement drivers={drivers} setDrivers={setDrivers} bikes={bikes} payments={payments} weeklyTarget={WEEKLY_TARGET} />;
      case 'payments':
        return (
          <PaymentTracking 
            drivers={drivers} 
            payments={payments} 
            onAddPayment={handleAddPayment} 
            onUpdatePayment={handleUpdatePayment}
            onDeletePayment={handleDeletePayment}
            weeklyTarget={WEEKLY_TARGET} 
          />
        );
      case 'maintenance':
        return <MaintenanceLog bikes={bikes} maintenance={maintenance} onAddMaintenance={handleAddMaintenance} onUpdateMaintenance={handleUpdateMaintenance} onDeleteMaintenance={handleDeleteMaintenance} workshops={workshops} />;
      case 'fines':
        return <TrafficFines bikes={bikes} drivers={drivers} fines={fines} onAddFine={handleAddFine} onUpdateStatus={handleUpdateFineStatus} />;
      case 'mechanic-portal':
        return (
          <MechanicPortal 
            bikes={bikes} 
            setBikes={setBikes} 
            maintenance={maintenance} 
            onAddMaintenance={handleAddMaintenance} 
            workshops={workshops} 
            onAddWorkshop={handleAddWorkshop}
            onUpdateWorkshop={handleUpdateWorkshop}
            onDeleteWorkshop={handleDeleteWorkshop}
          />
        );
      default:
        return <Dashboard bikes={bikes} drivers={drivers} payments={payments} maintenance={maintenance} weeklyTarget={WEEKLY_TARGET} />;
    }
  };

  if (role === 'driver' && !loggedDriver) {
    return <DriverLogin onLogin={handleDriverLogin} onBackToAdmin={() => setRole('admin')} />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900 font-sans overflow-x-hidden">
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
      
      <main className={`flex-1 transition-all duration-300 w-full md:ml-64 p-4 md:p-8 pt-20 md:pt-8`}>
        <header className="mb-6 md:mb-10 flex flex-wrap justify-between items-center bg-white/70 backdrop-blur-md p-4 md:p-5 rounded-2xl md:rounded-[2rem] border border-gray-100 sticky top-4 z-20 shadow-sm gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h1 className="text-lg md:text-2xl font-black text-gray-800 tracking-tight capitalize truncate">
                {role === 'admin' ? view.replace('-', ' ') : role === 'mechanic' ? 'Workshop' : `My Portfolio`}
              </h1>
              {role === 'admin' && (
                <span className="hidden sm:inline-block text-[8px] md:text-[10px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-widest">
                  Live Terminal
                </span>
              )}
            </div>
            <p className="text-gray-400 text-[9px] md:text-[10px] font-bold uppercase tracking-widest truncate">
              {role === 'admin' ? "Asset & Logistics Monitoring" : role === 'mechanic' ? "Technical Hub" : `${loggedDriver?.name}`}
            </p>
          </div>
          
          <div className="flex items-center space-x-2 md:space-x-4">
             {role !== 'admin' && (
               <button 
                onClick={handleLogout} 
                className="text-[9px] md:text-[10px] font-black text-gray-400 hover:text-red-500 uppercase tracking-widest transition-colors"
               >
                 Sign Out
               </button>
             )}
            <div className={`w-9 h-9 md:w-11 md:h-11 rounded-xl md:rounded-2xl flex items-center justify-center text-white font-black shadow-lg text-sm md:text-base overflow-hidden ${
              role === 'admin' ? 'bg-blue-600 shadow-blue-100' : 
              role === 'mechanic' ? 'bg-amber-600 shadow-amber-100' : 
              'bg-green-600 shadow-green-100'
            }`}>
              {role === 'driver' && loggedDriver?.profilePictureUrl ? (
                <img src={loggedDriver.profilePictureUrl} className="w-full h-full object-cover" />
              ) : (
                role === 'admin' ? 'AD' : role === 'mechanic' ? 'ME' : loggedDriver?.name.substring(0, 2).toUpperCase()
              )}
            </div>
          </div>
        </header>

        <div className="animate-in fade-in slide-in-from-bottom-3 duration-500">
          {renderView()}
        </div>
      </main>
    </div>
  );
};

export default App;
