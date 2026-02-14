
import React, { useState, useEffect, useMemo } from 'react';
import { INITIAL_BIKES, INITIAL_DRIVERS, INITIAL_PAYMENTS, INITIAL_WORKSHOPS } from './data';
import { Bike, Driver, Payment, MaintenanceRecord, View, TrafficFine, Workshop, AutomatedNotification } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import FleetManagement from './components/FleetManagement';
import DriverManagement from './components/DriverManagement';
import PaymentTracking from './components/PaymentTracking';
import MaintenanceLog from './components/MaintenanceLog';
import DriverProfile from './components/DriverProfile';
import DriverLogin from './components/DriverLogin';
import AdminLogin from './components/AdminLogin';
import MechanicPortal from './components/MechanicPortal';
import TrafficFines from './components/TrafficFines';
import LoadingScreen from './components/LoadingScreen';
import NotificationCenter from './components/NotificationCenter';
import TrackingPortal from './components/TrackingPortal';
import { MotoFleetCloud } from './services/api';

const App: React.FC = () => {
  const params = new URLSearchParams(window.location.search);
  const isDedicatedDriverMode = params.get('portal') === 'driver';
  const isDedicatedMechanicMode = params.get('portal') === 'mechanic';

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('motofleet_admin_auth_v1') === 'true';
  });

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('motofleet_dark_mode') === 'true';
  });

  const [fleetId, setFleetId] = useState<string | null>(() => {
    const saved = localStorage.getItem('active_fleet_id');
    if (!saved && isAdminAuthenticated) return 'fleet_001';
    return saved;
  });
  
  const [fleetName, setFleetName] = useState<string>(() => localStorage.getItem('active_fleet_name') || 'Main Fleet');
  
  const [isHydrated, setIsHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);

  const cloud = useMemo(() => new MotoFleetCloud(fleetId || 'default'), [fleetId]);

  const [view, setView] = useState<View>(
    isDedicatedDriverMode ? 'driver-profile' : 
    isDedicatedMechanicMode ? 'mechanic-portal' : 'dashboard'
  );
  
  const [role, setRole] = useState<'admin' | 'driver' | 'mechanic'>(
    isDedicatedDriverMode ? 'driver' : 
    isDedicatedMechanicMode ? 'mechanic' : 'admin'
  );

  const [loggedDriver, setLoggedDriver] = useState<Driver | null>(null);
  
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>([]);
  const [fines, setFines] = useState<TrafficFine[]>([]);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [notifications, setNotifications] = useState<AutomatedNotification[]>([]);

  useEffect(() => {
    localStorage.setItem('motofleet_dark_mode', isDarkMode.toString());
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    let isSubscribed = true;
    const hydrate = async () => {
      if (!fleetId && !isDedicatedDriverMode && !isDedicatedMechanicMode) {
        setLoading(false);
        setIsHydrated(false);
        return;
      }
      
      setLoading(true);
      setIsCloudSyncing(true);

      try {
        const [cBikes, cDrivers, cPayments, cMaint, cFines, cWorkshops, cNotifs] = await Promise.all([
          cloud.fetch<Bike[]>('bikes', INITIAL_BIKES),
          cloud.fetch<Driver[]>('drivers', INITIAL_DRIVERS),
          cloud.fetch<Payment[]>('payments', INITIAL_PAYMENTS),
          cloud.fetch<MaintenanceRecord[]>('maintenance', []),
          cloud.fetch<TrafficFine[]>('fines', []),
          cloud.fetch<Workshop[]>('workshops', INITIAL_WORKSHOPS),
          cloud.fetch<AutomatedNotification[]>('notifications', [])
        ]);

        if (isSubscribed) {
          setBikes(cBikes || []);
          setDrivers(cDrivers || []);
          setPayments(cPayments || []);
          setMaintenance(cMaint || []);
          setFines(cFines || []);
          setWorkshops(cWorkshops || []);
          setNotifications(cNotifs || []);
          
          setIsHydrated(true); 
          setLoading(false);
          setIsCloudSyncing(false);
        }
      } catch (err) {
        console.error("Hydration Critical Error:", err);
        setLoading(false); 
      }
    };

    hydrate();
    return () => { isSubscribed = false; };
  }, [fleetId, cloud, isDedicatedDriverMode, isDedicatedMechanicMode]);

  useEffect(() => { if (isHydrated && fleetId) cloud.persist('bikes', bikes); }, [bikes, isHydrated, fleetId, cloud]);
  useEffect(() => { if (isHydrated && fleetId) cloud.persist('drivers', drivers); }, [drivers, isHydrated, fleetId, cloud]);
  useEffect(() => { if (isHydrated && fleetId) cloud.persist('payments', payments); }, [payments, isHydrated, fleetId, cloud]);
  useEffect(() => { if (isHydrated && fleetId) cloud.persist('maintenance', maintenance); }, [maintenance, isHydrated, fleetId, cloud]);
  useEffect(() => { if (isHydrated && fleetId) cloud.persist('fines', fines); }, [fines, isHydrated, fleetId, cloud]);
  useEffect(() => { if (isHydrated && fleetId) cloud.persist('workshops', workshops); }, [workshops, isHydrated, fleetId, cloud]);
  useEffect(() => { if (isHydrated && fleetId) cloud.persist('notifications', notifications); }, [notifications, isHydrated, fleetId, cloud]);

  const WEEKLY_TARGET = 650;

  const triggerAutomations = async () => {
    setIsCloudSyncing(true);
    const newNotifs = await cloud.triggerAutomationCheck({ drivers, payments, weeklyTarget: WEEKLY_TARGET });
    setNotifications(prev => [...newNotifs, ...prev].slice(0, 100));
    setIsCloudSyncing(false);
  };

  const handleClearNotifications = () => {
    if (window.confirm("Clear all logs?")) setNotifications([]);
  };

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

  const handleUpdateMaintenance = (record: MaintenanceRecord) => {
    setMaintenance(prev => prev.map(m => m.id === record.id ? record : m));
  };

  const handleDeleteMaintenance = (id: string) => {
    setMaintenance(prev => prev.filter(m => m.id !== id));
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

  const handleUpdateWorkshop = (id: string, updated: Omit<Workshop, 'id'>) => {
    setWorkshops(prev => prev.map(w => w.id === id ? { ...updated, id } : w));
  };

  const handleDeleteWorkshop = (id: string) => {
    setWorkshops(prev => prev.filter(w => w.id !== id));
  };

  const handleUpdateDriver = (updated: Driver) => {
    setDrivers(prev => prev.map(d => d.id === updated.id ? updated : d));
    if (loggedDriver?.id === updated.id) setLoggedDriver(updated);
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

  const handleAdminLogin = (passcode: string, fId: string, fName?: string) => {
    if (passcode === 'admin123') {
      const finalName = fName || `Fleet ${fId.toUpperCase()}`;
      setFleetId(fId);
      setFleetName(finalName);
      localStorage.setItem('active_fleet_id', fId);
      localStorage.setItem('active_fleet_name', finalName);
      localStorage.setItem('motofleet_admin_auth_v1', 'true');
      setIsAdminAuthenticated(true);
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setLoggedDriver(null);
    setIsAdminAuthenticated(false);
    localStorage.removeItem('motofleet_admin_auth_v1');
    localStorage.removeItem('active_fleet_id');
    localStorage.removeItem('active_fleet_name');
    setFleetId(null);
    setIsHydrated(false);
    if (isDedicatedDriverMode) setRole('driver');
    else if (isDedicatedMechanicMode) setRole('mechanic');
    else { setRole('admin'); setView('dashboard'); }
  };

  const renderView = () => {
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

    if (!isAdminAuthenticated && !isDedicatedDriverMode) {
      return <AdminLogin onLogin={handleAdminLogin} />;
    }

    if (role === 'driver') {
      const activeDriver = loggedDriver || (isAdminAuthenticated && drivers.length > 0 ? drivers[0] : null);
      if (activeDriver) {
        return (
          <DriverProfile 
            driver={activeDriver} 
            onUpdateDriver={handleUpdateDriver}
            payments={payments} 
            fines={fines}
            onAddFine={handleAddFine}
            bike={bikes.find(b => b.assignedDriverId === activeDriver.id)} 
            maintenance={maintenance}
            onAddMaintenance={handleAddMaintenance}
            workshops={workshops}
            weeklyTarget={WEEKLY_TARGET}
            isAdminViewing={isAdminAuthenticated}
          />
        );
      }
      return <DriverLogin onLogin={handleDriverLogin} />;
    }

    switch (view) {
      case 'dashboard':
        return <Dashboard bikes={bikes} drivers={drivers} payments={payments} maintenance={maintenance} weeklyTarget={WEEKLY_TARGET} />;
      case 'fleet':
        return <FleetManagement bikes={bikes} setBikes={setBikes} drivers={drivers} maintenance={maintenance} payments={payments} weeklyTarget={WEEKLY_TARGET} workshops={workshops} />;
      case 'drivers':
        return <DriverManagement drivers={drivers} setDrivers={setDrivers} bikes={bikes} payments={payments} fines={fines} onAddFine={handleAddFine} weeklyTarget={WEEKLY_TARGET} />;
      case 'payments':
        return <PaymentTracking drivers={drivers} payments={payments} onAddPayment={handleAddPayment} onUpdatePayment={handleUpdatePayment} onDeletePayment={handleDeletePayment} onUpdateDriver={handleUpdateDriver} weeklyTarget={WEEKLY_TARGET} />;
      case 'maintenance':
        return <MaintenanceLog bikes={bikes} maintenance={maintenance} onAddMaintenance={handleAddMaintenance} onUpdateMaintenance={handleUpdateMaintenance} onDeleteMaintenance={handleDeleteMaintenance} workshops={workshops} />;
      case 'fines':
        return <TrafficFines bikes={bikes} drivers={drivers} fines={fines} onAddFine={handleAddFine} onUpdateStatus={handleUpdateFineStatus} />;
      case 'communications':
        return <NotificationCenter notifications={notifications} drivers={drivers} bikes={bikes} onTriggerAutomations={triggerAutomations} onClearNotifications={handleClearNotifications} isSyncing={isCloudSyncing} />;
      case 'tracking':
        return <TrackingPortal bikes={bikes} />;
      default:
        return <Dashboard bikes={bikes} drivers={drivers} payments={payments} maintenance={maintenance} weeklyTarget={WEEKLY_TARGET} />;
    }
  };

  const showSidebar = isAdminAuthenticated || (role === 'mechanic') || (role === 'driver' && (loggedDriver || isAdminAuthenticated));

  if (loading) return <LoadingScreen />;

  return (
    <div className={`flex min-h-screen font-sans overflow-x-hidden relative transition-colors duration-500 ${isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className={`fixed top-[-10%] right-[-5%] w-[40vw] h-[40vw] blur-[120px] rounded-full pointer-events-none -z-10 animate-pulse ${isDarkMode ? 'bg-blue-600/10' : 'bg-blue-500/5'}`}></div>
      <div className={`fixed bottom-[-10%] left-[-5%] w-[35vw] h-[35vw] blur-[120px] rounded-full pointer-events-none -z-10 animate-pulse delay-700 ${isDarkMode ? 'bg-amber-600/10' : 'bg-amber-500/5'}`}></div>

      {showSidebar && (
        <Sidebar 
          activeView={view} 
          setView={setView} 
          role={role} 
          isAdminAuthenticated={isAdminAuthenticated}
          isDarkMode={isDarkMode}
          toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
          onSwitchMode={(newRole) => {
            setRole(newRole);
            if (newRole === 'admin') setView('dashboard');
            if (newRole === 'mechanic') setView('mechanic-portal');
            if (newRole === 'driver') setView('driver-profile');
          }}
          hideSwitcher={isDedicatedDriverMode || isDedicatedMechanicMode}
        />
      )}
      
      <main className={`flex-1 transition-all duration-300 w-full ${showSidebar ? 'md:ml-64 p-4 md:p-10 pb-24 md:pb-10' : ''}`}>
        {showSidebar && (
          <header className={`mb-8 md:mb-12 flex flex-wrap justify-between items-center backdrop-blur-3xl p-5 md:p-6 rounded-[2.5rem] sticky top-6 z-[60] shadow-2xl gap-4 border ${isDarkMode ? 'bg-gray-900/60 border-white/5 shadow-black' : 'bg-white/40 border-white/60 shadow-gray-100/50'}`}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3">
                <h1 className="text-xl md:text-3xl font-black tracking-tighter capitalize truncate">
                  {role === 'admin' ? view.replace('-', ' ') : role === 'mechanic' ? 'Workshop Terminal' : `Operator Hub`}
                </h1>
                {isAdminAuthenticated && (
                  <span className={`hidden sm:inline-block text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em] border ${isDarkMode ? 'text-blue-400 bg-blue-400/10 border-blue-400/20' : 'text-blue-600 bg-blue-50/50 border-blue-100/50'}`}>
                    {fleetName}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3 md:space-x-6">
              <button onClick={handleLogout} className={`hidden sm:block text-[10px] font-black uppercase tracking-[0.2em] transition-all ${isDarkMode ? 'text-white/40 hover:text-red-400' : 'text-gray-400 hover:text-red-500'}`}>Terminate Session</button>
              <div className={`w-12 h-12 md:w-16 md:h-16 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center text-white font-black shadow-2xl border-4 ${isDarkMode ? 'border-white/10' : 'border-white/80'} ${isAdminAuthenticated ? 'bg-gray-900' : role === 'mechanic' ? 'bg-amber-600' : 'bg-green-600'}`}>
                {role === 'driver' && loggedDriver?.profilePictureUrl ? (
                  <img src={loggedDriver.profilePictureUrl} className="w-full h-full object-cover rounded-[1.2rem] md:rounded-[1.6rem]" />
                ) : (
                  <span>{isAdminAuthenticated ? 'AD' : role === 'mechanic' ? 'ME' : (loggedDriver?.name.substring(0, 2).toUpperCase() || 'AS')}</span>
                )}
              </div>
            </div>
          </header>
        )}
        {renderView()}
      </main>
    </div>
  );
};

export default App;
