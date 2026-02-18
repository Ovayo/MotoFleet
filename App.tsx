
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
import AccidentLog from './components/AccidentLog';
import DataManagement from './components/DataManagement';
import FleetOracle from './components/FleetOracle';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import { MotoFleetCloud } from './services/api';

const App: React.FC = () => {
  const params = new URLSearchParams(window.location.search);
  const isDedicatedDriverMode = params.get('portal') === 'driver';
  const isDedicatedMechanicMode = params.get('portal') === 'mechanic';
  const magicKey = params.get('access_key');

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    const isTrusted = localStorage.getItem('mf_trusted_env') === 'true';
    const hasFleet = !!localStorage.getItem('active_fleet_id');
    const hasAuth = localStorage.getItem('motofleet_admin_auth_v1') === 'true';
    return hasAuth || (isTrusted && hasFleet);
  });

  const [isSuperAdminAuthenticated, setIsSuperAdminAuthenticated] = useState<boolean>(() => {
    const isTrusted = localStorage.getItem('mf_trusted_env') === 'true';
    const hasAuth = localStorage.getItem('motofleet_super_admin_auth') === 'true';
    return hasAuth || isTrusted;
  });

  const [fleetId, setFleetId] = useState<string | null>(() => {
    const saved = localStorage.getItem('active_fleet_id');
    if (!saved && isAdminAuthenticated) return 'fleet_001';
    return saved;
  });
  
  const [fleetName, setFleetName] = useState<string>(() => localStorage.getItem('active_fleet_name') || 'Main Fleet');
  
  const [isHydrated, setIsHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);

  const cloud = useMemo(() => new MotoFleetCloud(fleetId || 'default'), [fleetId]);

  const [view, setView] = useState<View>(
    isSuperAdminAuthenticated ? 'super-admin' :
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

  // Defined activeDriver globally in the component to avoid Scope issues in the header and renderView
  const activeDriver = useMemo(() => {
    return loggedDriver || (isAdminAuthenticated && drivers.length > 0 ? drivers[0] : null);
  }, [loggedDriver, isAdminAuthenticated, drivers]);

  // Magic Access Key Recognition for "Work Environment"
  useEffect(() => {
    if (magicKey === 'MF-WORK-ENV-2026') {
      localStorage.setItem('mf_trusted_env', 'true');
      localStorage.setItem('active_fleet_id', 'fleet_001');
      localStorage.setItem('motofleet_admin_auth_v1', 'true');
      window.history.replaceState({}, document.title, window.location.pathname);
      setIsAdminAuthenticated(true);
    }
  }, [magicKey]);

  useEffect(() => {
    let isSubscribed = true;
    const hydrate = async () => {
      if (!fleetId && !isDedicatedDriverMode && !isDedicatedMechanicMode && !isSuperAdminAuthenticated) {
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
  }, [fleetId, cloud, isSuperAdminAuthenticated]);

  useEffect(() => { if (isHydrated && fleetId) cloud.persist('bikes', bikes); }, [bikes, isHydrated, fleetId]);
  useEffect(() => { if (isHydrated && fleetId) cloud.persist('drivers', drivers); }, [drivers, isHydrated, fleetId]);
  useEffect(() => { if (isHydrated && fleetId) cloud.persist('payments', payments); }, [payments, isHydrated, fleetId]);
  useEffect(() => { if (isHydrated && fleetId) cloud.persist('maintenance', maintenance); }, [maintenance, isHydrated, fleetId]);
  useEffect(() => { if (isHydrated && fleetId) cloud.persist('fines', fines); }, [fines, isHydrated, fleetId]);
  useEffect(() => { if (isHydrated && fleetId) cloud.persist('accidents', accidents); }, [accidents, isHydrated, fleetId]);
  useEffect(() => { if (isHydrated && fleetId) cloud.persist('workshops', workshops); }, [workshops, isHydrated, fleetId]);
  useEffect(() => { if (isHydrated && fleetId) cloud.persist('notifications', notifications); }, [notifications, isHydrated, fleetId]);

  const WEEKLY_TARGET = 650;

  const handleSetView = (newView: View) => {
    if (view === newView) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setView(newView);
      setIsTransitioning(false);
    }, 450);
  };

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

  const handleDeleteDriver = (id: string) => {
    const driver = drivers.find(d => d.id === id);
    if (!driver) return;
    
    if (window.confirm(`PERMANENT ACTION: Are you sure you want to delete ${driver.name}? All linked bike assignments will be cleared. History in ledgers will remain for accounting.`)) {
      setDrivers(prev => prev.filter(d => d.id !== id));
      setBikes(prev => prev.map(b => b.assignedDriverId === id ? { ...b, assignedDriverId: undefined, status: 'idle' as const } : b));
      
      if (loggedDriver?.id === id) {
        setLoggedDriver(null);
        if (role === 'driver') {
          setRole('admin');
          setView('dashboard');
        }
      }
    }
  };

  const handleAdminViewDriverHub = (driver: Driver) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setLoggedDriver(driver);
      setRole('driver');
      setView('driver-profile');
      setIsTransitioning(false);
    }, 450);
  };

  const handleDriverLogin = (contact: string) => {
    const normalizedInput = contact.replace(/\s/g, '');
    const driver = drivers.find(d => d.contact.replace(/\s/g, '') === normalizedInput);
    
    if (driver) {
      setIsTransitioning(true);
      setTimeout(() => {
        setLoggedDriver(driver);
        setRole('driver');
        setView('driver-profile');
        setIsTransitioning(false);
      }, 600);
      return true;
    }
    return false;
  };

  const handleAdminLogin = (passcode: string, fId: string, fName?: string) => {
    if (passcode === 'admin123') {
      setIsTransitioning(true);
      setTimeout(() => {
        const finalName = fName || `Fleet ${fId.toUpperCase()}`;
        setFleetId(fId);
        setFleetName(finalName);
        localStorage.setItem('active_fleet_id', fId);
        localStorage.setItem('active_fleet_name', finalName);
        localStorage.setItem('motofleet_admin_auth_v1', 'true');
        setIsAdminAuthenticated(true);
        setIsTransitioning(false);
      }, 800);
      return true;
    }
    return false;
  };

  const handleSuperAdminLogin = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setIsSuperAdminAuthenticated(true);
      localStorage.setItem('motofleet_super_admin_auth', 'true');
      setView('super-admin');
      setIsTransitioning(false);
    }, 800);
  };

  const handleImpersonateFleet = (fId: string, fName: string) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setFleetId(fId);
      setFleetName(fName);
      localStorage.setItem('active_fleet_id', fId);
      localStorage.setItem('active_fleet_name', fName);
      localStorage.setItem('motofleet_admin_auth_v1', 'true');
      setIsAdminAuthenticated(true);
      setRole('admin');
      setView('dashboard');
      setIsTransitioning(false);
    }, 600);
  };

  const handleLogout = () => {
    setLoading(true);
    setTimeout(() => {
      setLoggedDriver(null);
      setIsAdminAuthenticated(false);
      setIsSuperAdminAuthenticated(false);
      localStorage.removeItem('motofleet_admin_auth_v1');
      localStorage.removeItem('motofleet_super_admin_auth');
      localStorage.removeItem('active_fleet_id');
      localStorage.removeItem('active_fleet_name');
      localStorage.removeItem('mf_trusted_env'); // Revoke trust on explicit logout
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
      setLoading(false);
    }, 1200);
  };

  const switchPortalRole = (newRole: 'admin' | 'driver' | 'mechanic') => {
    setIsTransitioning(true);
    setTimeout(() => {
      setRole(newRole);
      if (newRole === 'admin') setView('dashboard');
      if (newRole === 'mechanic') setView('mechanic-portal');
      if (newRole === 'driver') {
        if (!loggedDriver && drivers.length > 0) {
          setLoggedDriver(drivers[0]);
        }
        setView('driver-profile');
      }
      setIsTransitioning(false);
    }, 500);
  };

  const renderView = () => {
    if (isSuperAdminAuthenticated && view === 'super-admin') {
      return <SuperAdminDashboard onImpersonate={handleImpersonateFleet} onLogout={handleLogout} />;
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

    if (!isAdminAuthenticated && role === 'admin' && !isSuperAdminAuthenticated) {
      return <AdminLogin onLogin={handleAdminLogin} onSuperAdminLogin={handleSuperAdminLogin} onSwitchRole={switchPortalRole} />;
    }

    if (role === 'driver') {
      // Use component-scoped activeDriver instead of local definition
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
            allDrivers={drivers}
            onAdminSwitchDriver={(d) => setLoggedDriver(d)}
            activeTab={
              view === 'driver-wallet' ? 'payments' :
              view === 'driver-vehicle' ? 'vehicle' :
              view === 'driver-safety' ? 'safety' : 
              view === 'driver-documents' ? 'documents' : 'overview'
            }
          />
        );
      }
      
      if (!isAdminAuthenticated) return <DriverLogin onLogin={handleDriverLogin} onSwitchRole={switchPortalRole} />;
      return <div className="p-20 text-center font-black text-gray-300 uppercase tracking-widest">No Active Operators Enrolled</div>;
    }

    switch (view) {
      case 'dashboard':
        return <Dashboard bikes={bikes} drivers={drivers} payments={payments} maintenance={maintenance} weeklyTarget={WEEKLY_TARGET} />;
      case 'fleet':
        return <FleetManagement bikes={bikes} setBikes={setBikes} drivers={drivers} maintenance={maintenance} payments={payments} weeklyTarget={WEEKLY_TARGET} workshops={workshops} onAdminViewHub={handleAdminViewDriverHub} />;
      case 'drivers':
        return <DriverManagement drivers={drivers} setDrivers={setDrivers} bikes={bikes} payments={payments} fines={fines} onAddFine={handleAddFine} weeklyTarget={WEEKLY_TARGET} onAdminViewHub={handleAdminViewDriverHub} onDeleteDriver={handleDeleteDriver} />;
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
      default:
        return <Dashboard bikes={bikes} drivers={drivers} payments={payments} maintenance={maintenance} weeklyTarget={WEEKLY_TARGET} />;
    }
  };

  const showSidebar = (isAdminAuthenticated || isSuperAdminAuthenticated) || (role === 'mechanic') || (role === 'driver' && (loggedDriver || isAdminAuthenticated));
  const isWorkEnv = localStorage.getItem('mf_trusted_env') === 'true';

  if (loading) return <LoadingScreen />;

  return (
    <div className="flex min-h-[100dvh] font-sans overflow-x-hidden bg-gray-50 text-gray-900">
      {isTransitioning && <LoadingScreen isFast />}
      
      {showSidebar && (
        <Sidebar 
          activeView={view} 
          setView={handleSetView} 
          role={role} 
          isAdminAuthenticated={isAdminAuthenticated || isSuperAdminAuthenticated}
          hideSwitcher={isDedicatedDriverMode || isDedicatedMechanicMode}
          onSwitchMode={switchPortalRole}
        />
      )}
      
      <main className={`flex-1 transition-all duration-300 w-full ${showSidebar ? 'md:ml-64 p-4 md:p-8 pt-6 md:pt-8 pb-32 md:pb-8' : ''}`}>
        {showSidebar && (
          <header className="mb-6 md:mb-10 flex flex-wrap justify-between items-center p-4 md:p-5 rounded-2xl md:rounded-[2rem] border sticky top-4 z-20 shadow-sm gap-3 transition-all bg-white/70 backdrop-blur-md border-gray-100">
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center space-x-2">
                <h1 className="text-lg md:text-2xl font-black tracking-tight capitalize truncate text-gray-800">
                  {isSuperAdminAuthenticated && view === 'super-admin' ? 'Master Control' : role === 'admin' ? view.replace('-', ' ') : role === 'mechanic' ? 'Workshop' : `Driver Hub`}
                </h1>
                <div className="flex items-center space-x-2 ml-4">
                  {isAdminAuthenticated && (
                    <span className="hidden sm:inline-block text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest border bg-blue-50 text-blue-500 border-blue-100">
                      {fleetName}
                    </span>
                  )}
                  {isWorkEnv && (
                    <div className="flex items-center bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full border border-emerald-100 animate-in fade-in duration-500">
                       <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
                       <span className="text-[9px] font-black uppercase tracking-widest">Work Terminal Active</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 md:space-x-4">
              <button onClick={handleLogout} className="text-[9px] md:text-[10px] font-black text-gray-400 hover:text-red-500 uppercase tracking-widest transition-colors">Sign Out</button>
              <div className={`w-9 h-9 md:w-11 md:h-11 rounded-xl md:rounded-2xl flex items-center justify-center text-white font-black shadow-lg text-sm md:text-base overflow-hidden ${
                isSuperAdminAuthenticated ? 'bg-indigo-600 shadow-indigo-100' :
                isAdminAuthenticated ? 'bg-blue-600 shadow-blue-100' : 
                role === 'mechanic' ? 'bg-amber-600 shadow-amber-100' : 
                'bg-green-600 shadow-green-100'
              }`}>
                {role === 'driver' && (activeDriver) ? (
                  activeDriver.profilePictureUrl ? (
                    <img src={activeDriver.profilePictureUrl} className="w-full h-full object-cover" />
                  ) : (
                    activeDriver.name.substring(0, 2).toUpperCase()
                  )
                ) : (
                  isSuperAdminAuthenticated ? 'MA' : isAdminAuthenticated ? 'AD' : role === 'mechanic' ? 'ME' : 'AS'
                )}
              </div>
            </div>
          </header>
        )}

        <div className={showSidebar ? "animate-in fade-in slide-in-from-bottom-3 duration-500" : ""}>
          {renderView()}
        </div>
      </main>

      {isAdminAuthenticated && (
        <FleetOracle data={{ bikes, drivers, payments, maintenance, fines, accidents }} />
      )}
    </div>
  );
};

export default App;
