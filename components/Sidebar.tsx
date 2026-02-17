
import React, { useState, useEffect, useRef } from 'react';
import { View } from '../types';

interface SidebarProps {
  activeView: View;
  setView: (view: View) => void;
  role: 'admin' | 'driver' | 'mechanic';
  isAdminAuthenticated: boolean;
  onSwitchMode: (role: 'admin' | 'driver' | 'mechanic') => void;
  hideSwitcher?: boolean;
}

interface MenuItem {
  id: View;
  label: string;
  icon: string;
}

interface MenuGroup {
  id: string;
  label: string;
  icon: string;
  children: MenuItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeView, 
  setView, 
  role, 
  isAdminAuthenticated, 
  onSwitchMode, 
  hideSwitcher = false 
}) => {
  const [openGroups, setOpenGroups] = useState<string[]>(['g-fleet', 'g-finance']);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const isSuperAdmin = localStorage.getItem('motofleet_super_admin_auth') === 'true';

  const menuStructure: (MenuGroup | MenuItem)[] = role === 'admin' ? [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { 
      id: 'g-fleet', 
      label: 'Fleet Assets', 
      icon: '🏍️', 
      children: [
        { id: 'fleet', label: 'Vehicle Registry', icon: '🏍️' },
        { id: 'drivers', label: 'Operators', icon: '👤' },
      ]
    },
    { 
      id: 'g-finance', 
      label: 'Financials', 
      icon: '💰', 
      children: [
        { id: 'payments', label: 'Payment Ledger', icon: '💰' },
        { id: 'fines', label: 'Traffic Fines', icon: '🚔' },
      ]
    },
    { 
      id: 'g-ops', 
      label: 'Operations', 
      icon: '⚙️', 
      children: [
        { id: 'maintenance', label: 'Service Log', icon: '🔧' },
        { id: 'incidents', label: 'Accidents', icon: '⚠️' },
        { id: 'communications', label: 'Comms Hub', icon: '📡' },
        { id: 'system', label: 'System Sync', icon: '🔄' },
      ]
    }
  ] : role === 'mechanic' ? [
    { id: 'mechanic-portal', label: 'Technical', icon: '🛠️' },
    { id: 'maintenance', label: 'History', icon: '📋' },
  ] : [
    { id: 'driver-profile', label: 'My Portfolio', icon: '👤' },
  ];

  const themeColor = isSuperAdmin ? 'indigo' : role === 'admin' ? 'blue' : role === 'mechanic' ? 'amber' : 'green';
  const colorMap: Record<string, string> = { blue: 'bg-blue-600', amber: 'bg-amber-600', green: 'bg-green-600', indigo: 'bg-indigo-600' };
  const textActiveMap: Record<string, string> = { blue: 'text-blue-600', amber: 'text-amber-600', green: 'text-green-600', indigo: 'text-indigo-600' };

  const toggleGroup = (groupId: string) => {
    setOpenGroups(prev => prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const renderSidebarItem = (item: MenuItem | MenuGroup, isNested = false) => {
    if ('children' in item) {
      const isOpen = openGroups.includes(item.id);
      const isAnyChildActive = item.children.some(child => child.id === activeView);
      
      return (
        <div key={item.id} className="space-y-1">
          <button
            onClick={() => toggleGroup(item.id)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all ${
              isAnyChildActive ? 'bg-gray-50' : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center space-x-3">
              <span className={`text-xl ${isAnyChildActive ? textActiveMap[themeColor] : 'text-gray-400'}`}>{item.icon}</span>
              <span className={`text-[11px] font-black uppercase tracking-widest ${isAnyChildActive ? 'text-gray-800' : 'text-gray-500'}`}>{item.label}</span>
            </div>
            <span className={`text-[10px] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
          </button>
          
          {isOpen && (
            <div className="ml-4 pl-4 border-l-2 border-gray-100 space-y-1 py-1">
              {item.children.map(child => renderSidebarItem(child, true))}
            </div>
          )}
        </div>
      );
    }

    const isActive = activeView === item.id;
    return (
      <button
        key={item.id}
        onClick={() => { setView(item.id); setShowMoreMenu(false); }}
        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all ${
          isActive 
            ? `${colorMap[themeColor]} text-white shadow-lg shadow-gray-100` 
            : 'text-gray-500 hover:bg-gray-50'
        }`}
      >
        <span className={`text-xl ${isActive ? 'text-white' : 'text-gray-400'}`}>{item.icon}</span>
        <span className={`text-[11px] font-bold uppercase tracking-wider ${isActive ? 'text-white' : ''}`}>{item.label}</span>
      </button>
    );
  };

  return (
    <>
      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-gray-100 px-2 py-3 safe-area-bottom shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-around">
          <MobileNavItem icon="📊" label="Hub" isActive={activeView === 'dashboard'} onClick={() => setView('dashboard')} themeColor={themeColor} />
          <MobileNavItem icon="🏍️" label="Fleet" isActive={activeView === 'fleet'} onClick={() => setView('fleet')} themeColor={themeColor} />
          <MobileNavItem icon="👤" label="Staff" isActive={activeView === 'drivers'} onClick={() => setView('drivers')} themeColor={themeColor} />
          <MobileNavItem icon="💰" label="Pay" isActive={activeView === 'payments'} onClick={() => setView('payments')} themeColor={themeColor} />
          <MobileNavItem 
            icon="⚓" 
            label="More" 
            isActive={showMoreMenu} 
            onClick={() => setShowMoreMenu(!showMoreMenu)} 
            themeColor={themeColor} 
          />
        </div>

        {/* Mobile More Menu - Parent/Child Structure */}
        {showMoreMenu && (
          <div ref={moreMenuRef} className="absolute bottom-[calc(100%+12px)] left-4 right-4 bg-white/95 backdrop-blur-3xl rounded-[2.5rem] p-6 shadow-[0_-20px_50px_rgba(0,0,0,0.15)] border border-white/20 animate-in slide-in-from-bottom-10 duration-300 max-h-[70vh] overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-center mb-6 border-b border-gray-50 pb-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Full Application Menu</p>
              <button onClick={() => setShowMoreMenu(false)} className="text-gray-400 text-3xl">&times;</button>
            </div>
            <div className="space-y-2">
              {menuStructure.map(item => renderSidebarItem(item))}
            </div>
            
            {!hideSwitcher && isAdminAuthenticated && (
              <div className="mt-8 pt-6 border-t border-gray-100 grid grid-cols-3 gap-2">
                <button onClick={() => onSwitchMode('admin')} className={`py-3 rounded-xl text-[8px] font-black uppercase tracking-tighter ${role === 'admin' ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-400'}`}>Admin</button>
                <button onClick={() => onSwitchMode('mechanic')} className={`py-3 rounded-xl text-[8px] font-black uppercase tracking-tighter ${role === 'mechanic' ? 'bg-amber-600 text-white' : 'bg-gray-50 text-gray-400'}`}>Mechanic</button>
                <button onClick={() => onSwitchMode('driver')} className={`py-3 rounded-xl text-[8px] font-black uppercase tracking-tighter ${role === 'driver' ? 'bg-green-600 text-white' : 'bg-gray-50 text-gray-400'}`}>Driver</button>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-white border-r border-gray-100 fixed h-full z-50 flex-col shadow-sm">
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center space-x-3 mb-10">
            <div className={`${colorMap[themeColor]} p-2.5 rounded-2xl flex items-center justify-center shadow-lg shadow-gray-100`}>
               <span className="text-white text-lg font-black tracking-tighter">MF</span>
            </div>
            <h2 className="text-lg font-black text-gray-800 tracking-tight uppercase">MotoFleet</h2>
          </div>
          
          <nav className="space-y-2 flex-1 overflow-y-auto pr-2 no-scrollbar">
            {menuStructure.map(item => renderSidebarItem(item))}
          </nav>

          {!hideSwitcher && isAdminAuthenticated && (
            <div className="mt-auto pt-6 border-t border-gray-50">
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-4 text-center">Interface Switcher</p>
              <div className="grid grid-cols-1 gap-2">
                <button onClick={() => onSwitchMode('admin')} className={`px-4 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${role === 'admin' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-gray-50 text-gray-400 hover:text-gray-600'}`}>Admin Hub</button>
                <button onClick={() => onSwitchMode('mechanic')} className={`px-4 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${role === 'mechanic' ? 'bg-amber-600 text-white shadow-lg shadow-amber-100' : 'bg-gray-50 text-gray-400 hover:text-gray-600'}`}>Mechanic Hub</button>
                <button onClick={() => onSwitchMode('driver')} className={`px-4 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${role === 'driver' ? 'bg-green-600 text-white shadow-lg shadow-green-100' : 'bg-gray-50 text-gray-400 hover:text-gray-600'}`}>Driver Hub</button>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

const MobileNavItem: React.FC<{ icon: string, label: string, isActive: boolean, onClick: () => void, themeColor: string }> = ({ icon, label, isActive, onClick, themeColor }) => {
  const textActiveMap: Record<string, string> = { blue: 'text-blue-600', amber: 'text-amber-600', green: 'text-green-600', indigo: 'text-indigo-600' };
  const bgActiveMap: Record<string, string> = { blue: 'bg-blue-50', amber: 'bg-amber-50', green: 'bg-green-50', indigo: 'bg-indigo-50' };

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all duration-300 ${
        isActive ? `${bgActiveMap[themeColor]} scale-110` : 'text-gray-400'
      }`}
    >
      <span className={`text-xl mb-0.5 ${isActive ? 'animate-bounce-short' : ''}`}>{icon}</span>
      <span className={`text-[8px] font-black uppercase tracking-tighter ${isActive ? textActiveMap[themeColor] : 'opacity-60'}`}>
        {label}
      </span>
    </button>
  );
};

export default Sidebar;
