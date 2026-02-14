
import React, { useState, useEffect, useMemo } from 'react';
import { INITIAL_BIKES, INITIAL_DRIVERS, INITIAL_PAYMENTS, INITIAL_WORKSHOPS } from './data';
import { Bike, Driver, Payment, MaintenanceRecord, View, TrafficFine, Workshop, AutomatedNotification, AccidentReport } from './types';
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
import AccidentLog from './components/AccidentLog';
import { MotoFleetCloud } from './services/api';

const App: React.FC = () => {
  const params = new URLSearchParams(window.location.search);
  const isDedicatedDriverMode = params.get('portal') === 'driver';
  const isDedicatedMechanicMode = params.get('portal') === 'mechanic';

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('motofleet_admin_auth_v1') === 'true';
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
  const [accidents, setAccidents] = useState<AccidentReport[]>([]);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [notifications, setNotifications] = useState<AutomatedNotification[]>([]);

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
        const [cBikes, cDrivers, cPayments, cMaint, cFines, cAccidents, cWorkshops, cNotifs] = await Promise.all([
          cloud.fetch<Bike[]>('bikes', INITIAL_BIKES),
          cloud.fetch<Driver[]>('drivers', INITIAL_DRIVERS),
          cloud.fetch<Payment[]>('payments', INITIAL_PAYMENTS),
          cloud.fetch<MaintenanceRecord[]>('maintenance', []),
          cloud.fetch<TrafficFine[]>('fines', []),
          cloud.fetch<AccidentReport[]>('accidents', []),
          cloud.fetch<Workshop[]>('workshops', INITIAL_WORKSHOPS),
          cloud.fetch<AutomatedNotification[]>('notifications', [])
        ]);

        if (isSubscribed) {
          setBikes(cBikes || []);
          setDrivers(cDrivers || []);
          setPayments(cPayments || []);
          setMaintenance(cMaint || []);
          setFines(cFines || []);
          setAccidents(cAccidents || []);
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
  }, [fleetId, cloud]);

  useEffect(() => { if (isHydrated && fleetId) cloud.persist('bikes', bikes); }, [bikes, isHydrated, fleetId]);
  useEffect(() => { if (isHydrated && fleetId) cloud.persist('drivers', drivers); }, [drivers, isHydrated, fleetId]);
  useEffect(() => { if (isHydrated && fleetId) cloud.persist('payments', payments); }, [payments, isHydrated, fleetId]);
  useEffect(() => { if (isHydrated && fleetId) cloud.persist('maintenance', maintenance); }, [maintenance, isHydrated, fleetId]);
  useEffect(() => { if (isHydrated && fleetId) cloud.persist('fines', fines); }, [fines, isHydrated, fleetId]);
  useEffect(() => { if (isHydrated && fleetId) cloud.persist('accidents', accidents); }, [accidents, isHydrated, fleetId]);
  useEffect(() => { if (isHydrated && fleetId) cloud.persist('workshops', workshops); }, [workshops, isHydrated, fleetId]);
  useEffect(() => { if (isHydrated && fleetId) cloud.persist('notifications', notifications); }, [notifications, isHydrated, fleetId]);

  const WEEKLY_TARGET = 650;

  const handleAddAccident = (report: Omit<AccidentReport, 'id'>) => {
    setAccidents(prev => [...prev, { ...report, id: `acc-${Date.now()}` }]);
  };

  const handleUpdateAccident = (updatedReport: AccidentReport) => {
    setAccidents(prev => prev.map(a => a.id === updatedReport.id ? updatedReport : a));
  };

  const handleUpdateAccidentStatus = (id: string, status: AccidentReport['status']) => {
    setAccidents(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  };

  const triggerAutomations = async () => {
    setIsCloudSyncing(true);
    const newNotifs = await cloud.triggerAutomationCheck({ drivers, payments, weeklyTarget: WEEKLY_TARGET });
    setNotifications(prev => [...newNotifs, ...prev].slice(0, 100));
    setIsCloudSyncing(false);
  };

  const handleClearNotifications = () => {
    if (window.confirm("Are you sure you want to wipe the communication logs? This action cannot be undone.")) {
      setNotifications([]);
    }
  };

  const handleAddPayment = (payment: Omit<Payment, 'id'>) => {
    setPayments(prev => [...(prev || []), { ...payment, id: `p-${Date.now()}` }]);
  };

  const handleUpdatePayment = (id: string, amount: number) => {
    setPayments(prev => (prev || []).map(p => p.id === id ? { ...p, amount } : p));
  };

  const handleDeletePayment = (id: string) => {
    setPayments(prev => (prev || []).filter(p => p.id !== id));
  };

  const handleAddMaintenance = (record: Omit<MaintenanceRecord, 'id'>) => {
    setMaintenance(prev => [...(prev || []), { ...record, id: `m-${Date.now()}` }]);
  };

  const handleUpdateMaintenance = (updatedRecord: MaintenanceRecord) => {
    setMaintenance(prev => (prev || []).map(m => m.id === updatedRecord.id ? updatedRecord : m));
  };

  const handleDeleteMaintenance = (id: string) => {
    if (window.confirm("Confirm deletion of this expense record?")) {
      setMaintenance(prev => (prev || []).filter(m => m.id !== id));
    }
  };

  const handleAddFine = (fine: Omit<TrafficFine, 'id'>) => {
    setFines(prev => [...(prev || []), { ...fine, id: `f-${Date.now()}` }]);
  };

  const handleUpdateFineStatus = (id: string, status: TrafficFine['status']) => {
    setFines(prev => (prev || []).map(f => f.id === id ? { ...f, status } : f));
  };

  const handleAddWorkshop = (workshop: Omit<Workshop, 'id'>) => {
    setWorkshops(prev => [...(prev || []), { ...workshop, id: `w-${Date.now()}` }]);
  };

  const handleUpdateWorkshop = (id: string, updatedWorkshop: Omit<Workshop, 'id'>) => {
    setWorkshops(prev => (prev || []).map(w => w.id === id ? { ...updatedWorkshop, id } : w));
  };

  const handleDeleteWorkshop = (id: string) => {
    if (window.confirm("Confirm removal of this workshop partner?")) {
      setWorkshops(prev => (prev || []).filter(w => w.id !== id));
    }
  };

  const handleUpdateDriver = (updatedDriver: Driver) => {
    setDrivers(prev => (prev || []).map(d => d.id === updatedDriver.id ? updatedDriver : d));
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
      const activeDriver = loggedDriver || (isAdminAuthenticated && (drivers?.length || 0) > 0 ? drivers[0] : null);
      if (activeDriver) {
        return (
          <DriverProfile 
            driver={activeDriver} 
            onUpdateDriver={handleUpdateDriver}
            payments={payments} 
            fines={fines}
            accidents={accidents}
            onAddFine={handleAddFine}
            onAddAccident={handleAddAccident}
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
      case 'incidents':
        return <AccidentLog bikes={bikes} drivers={drivers} accidents={accidents} onAddAccident={handleAddAccident} onUpdateAccident={handleUpdateAccident} onUpdateStatus={handleUpdateAccidentStatus} />;
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
    <div className="flex min-h-screen bg-gray-50 text-gray-900 font-sans overflow-x-hidden">
      {showSidebar && (
        <Sidebar 
          activeView={view} 
          setView={setView} 
          role={role} 
          isAdminAuthenticated={isAdminAuthenticated}
          hideSwitcher={isDedicatedDriverMode || isDedicatedMechanicMode}
          onSwitchMode={(newRole) => {
            setRole(newRole);
            if (newRole === 'admin') setView('dashboard');
            if (newRole === 'mechanic') setView('mechanic-portal');
            if (newRole === 'driver') setView('driver-profile');
          }}
        />
      )}
      
      <main className={`flex-1 transition-all duration-300 w-full ${showSidebar ? 'md:ml-64 p-4 md:p-8 pt-6 md:pt-8 pb-24 md:pb-8' : ''}`}>
        {showSidebar && (
          <header className="mb-6 md:mb-10 flex flex-wrap justify-between items-center bg-white/70 backdrop-blur-md p-4 md:p-5 rounded-2xl md:rounded-[2rem] border border-gray-100 sticky top-4 z-20 shadow-sm gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h1 className="text-lg md:text-2xl font-black text-gray-800 tracking-tight capitalize truncate">
                  {role === 'admin' ? view.replace('-', ' ') : role === 'mechanic' ? 'Workshop' : `Driver Hub`}
                </h1>
                {isAdminAuthenticated && (
                  <div className="flex items-center space-x-2 ml-4">
                    <span className="hidden sm:inline-block text-[10px] font-black text-blue-500 bg-blue-50 px-2 py-1 rounded-full uppercase tracking-widest border border-blue-100">
                      {fleetName}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2 md:space-x-4">
              <button onClick={handleLogout} className="text-[9px] md:text-[10px] font-black text-gray-400 hover:text-red-500 uppercase tracking-widest transition-colors">Sign Out</button>
              <div className={`w-9 h-9 md:w-11 md:h-11 rounded-xl md:rounded-2xl flex items-center justify-center text-white font-black shadow-lg text-sm md:text-base overflow-hidden ${
                isAdminAuthenticated ? 'bg-blue-600 shadow-blue-100' : 
                role === 'mechanic' ? 'bg-amber-600 shadow-amber-100' : 
                'bg-green-600 shadow-green-100'
              }`}>
                {role === 'driver' && loggedDriver?.profilePictureUrl ? (
                  <img src={loggedDriver.profilePictureUrl} className="w-full h-full object-cover" />
                ) : (
                  isAdminAuthenticated ? 'AD' : role === 'mechanic' ? 'ME' : (loggedDriver?.name.substring(0, 2).toUpperCase() || 'AS')
                )}
              </div>
            </div>
          </header>
        )}

        <div className={showSidebar ? "animate-in fade-in slide-in-from-bottom-3 duration-500" : ""}>
          {renderView()}
        </div>
      </main>
    </div>
  );
};

export default App;
