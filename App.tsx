
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
  }, [fleetId, cloud]);

  useEffect(() => { if (isHydrated && fleetId) cloud.persist('bikes', bikes); }, [bikes, isHydrated, fleetId]);
  useEffect(() => { if (isHydrated && fleetId) cloud.persist('drivers', drivers); }, [drivers, isHydrated, fleetId]);
  useEffect(() => { if (isHydrated && fleetId) cloud.persist('payments', payments); }, [payments, isHydrated, fleetId]);
  useEffect(() => { if (isHydrated && fleetId) cloud.persist('maintenance', maintenance); }, [maintenance, isHydrated, fleetId]);
  useEffect(() => { if (isHydrated && fleetId) cloud.persist('fines', fines); }, [fines, isHydrated, fleetId]);
  useEffect(() => { if (isHydrated && fleetId) cloud.persist('workshops', workshops); }, [workshops, isHydrated, fleetId]);
  useEffect(() => { if (isHydrated && fleetId) cloud.persist('notifications', notifications); }, [notifications, isHydrated, fleetId]);

  const WEEKLY_TARGET = 650;

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
      const activeDriver = loggedDriver || (isAdminAuthenticated && (drivers?.length || 0) > 0 ? drivers[0] : null);
      if (activeDriver) {
        return (
          <DriverProfile 
            driver={activeDriver} 
            onUpdateDriver={handleUpdateDriver}