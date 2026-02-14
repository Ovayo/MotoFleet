
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
  id: string;
  label: string;
  icon: string;
}

interface MenuGroup {
  id: string;
  label: string;
  icon: string;
  children?: MenuItem[];
  viewId?: View;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeView, 
  setView, 
  role, 
  isAdminAuthenticated, 
  onSwitchMode, 
  hideSwitcher = false 
}) => {
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Grouping logic for Admin role to fit on mobile without scroll
  const adminGroups: MenuGroup[] = [
    { id: 'g-hub', label: 'Hub', icon: '📊', viewId: 'dashboard' },
    { 
      id: 'g-assets', 
      label: 'Assets', 
      icon: '🏍️', 
      children: [
        { id: 'fleet', label: 'Fleet Registry', icon: '🏍️' },
        { id: 'drivers', label: 'Operator Hub', icon: '👤' },
        { id: 'tracking', label: 'Live Track', icon: '📍' },
      ]
    },
    { 
      id: 'g-finance', 
      label: 'Money', 
      icon: '💰', 
      children: [
        { id: 'payments', label: 'Ledger', icon: '💰' },
        { id: 'fines', label: 'Traffic Fines', icon: '🚔' },
      ]
    },
    { 
      id: 'g-ops', 
      label: 'Ops', 
      icon: '📡', 
      children: [
        { id: 'maintenance', label: 'Service Log', icon: '🔧' },
        { id: 'communications', label: 'Comms Hub', icon: '📡' },
      ]
    }
  ];

  const mechanicGroups: MenuGroup[] = [
    { id: 'mechanic-portal', label: 'Technical', icon: '🛠️', viewId: 'mechanic-portal' },
    { id: 'maintenance', label: 'History', icon: '📋', viewId: 'maintenance' },
  ];

  const driverGroups: MenuGroup[] = [
    { id: 'driver-profile', label: 'Portfolio', icon: '👤', viewId: 'driver-profile' },
  ];

  const groups = role === 'admin' ? adminGroups : role === 'mechanic' ? mechanicGroups : driverGroups;
  const themeColor = role === 'admin' ? 'blue' : role === 'mechanic' ? 'amber' : 'green';

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-600',
    amber: 'bg-amber-600',
    green: 'bg-green-600'
  };

  const textActiveMap: Record<string, string> = {
    blue: 'text-blue-600',
    amber: 'text-amber-600',
    green: 'text-green-600'
  };

  const handleGroupClick = (group: MenuGroup) => {
    if (group.viewId) {
      setView(group.viewId);
      setOpenGroup(null);
    } else {
      setOpenGroup(openGroup === group.id ? null : group.id);
    }
  };

  // Close sub-menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setOpenGroup(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      {/* MOBILE HIERARCHICAL NAVIGATION */}
      <nav ref={mobileMenuRef} className="md:hidden fixed bottom-0 left-0 right-0 z-[110] bg-white/90 backdrop-blur-2xl border-t border-gray-100 pb-safe shadow-[0_-15px_35px_rgba(0,0,0,0.08)]">
        
        {/* SUB-MENU OVERLAY */}
        {groups.map(group => group.children && openGroup === group.id && (
          <div key={`sub-${group.id}`} className="absolute bottom-20 left-4 right-4 bg-white/95 backdrop-blur-3xl rounded-[2.5rem] p-4 shadow-2xl border border-gray-100 animate-in slide-in-from-bottom-6 duration-300">
            <div className="p-3 border-b border-gray-50 mb-2">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{group.label} Operations</p>
            </div>
            <div className="grid grid-cols-1 gap-1">
              {group.children.map(child => (
                <button
                  key={child.id}
                  onClick={() => {
                    setView(child.id as View);
                    setOpenGroup(null);
                  }}
                  className={`flex items-center space-x-4 p-4 rounded-2xl transition-all ${
                    activeView === child.id ? 'bg-gray-50 border-gray-100 shadow-inner' : 'hover:bg-gray-50/50'
                  }`}
                >
                  <span className="text-2xl">{child.icon}</span>
                  <div className="text-left">
                    <span className={`block text-xs font-black uppercase tracking-tight ${activeView === child.id ? textActiveMap[themeColor] : 'text-gray-800'}`}>
                      {child.label}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* MAIN DOCK */}
        <div className="flex items-center justify-around h-20 px-2 relative">
          {groups.map((group) => {
            const isAnyChildActive = group.children?.some(c => c.id === activeView);
            const isActive = activeView === group.viewId || isAnyChildActive;
            const isOpen = openGroup === group.id;

            return (
              <button
                key={group.id}
                onClick={() => handleGroupClick(group)}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-all relative ${
                  isActive || isOpen ? textActiveMap[themeColor] : 'text-gray-400'
                }`}
              >
                <div className={`relative transition-transform duration-300 ${isOpen ? 'scale-125' : ''}`}>
                  <span className={`text-2xl mb-0.5 transition-transform ${isActive ? 'scale-110' : 'opacity-70'}`}>
                    {group.icon}
                  </span>
                  {group.children && (
                    <div className="absolute -top-1 -right-2 w-3.5 h-3.5 bg-gray-100 rounded-full border border-white flex items-center justify-center">
                      <span className="text-[7px] font-black text-gray-500">{group.children.length}</span>
                    </div>
                  )}
                </div>
                <span className={`text-[8px] font-black uppercase tracking-tight transition-all ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                  {group.label}
                </span>
                {isActive && (
                  <div className={`absolute top-0 w-8 h-1 rounded-b-full ${colorMap[themeColor]}`}></div>
                )}
              </button>
            );
          })}
          
          {/* Identity Switcher Slot */}
          {!hideSwitcher && isAdminAuthenticated && (
            <button 
              onClick={() => {
                const roles: ('admin' | 'mechanic' | 'driver')[] = ['admin', 'mechanic', 'driver'];
                const nextIndex = (roles.indexOf(role) + 1) % roles.length;
                onSwitchMode(roles[nextIndex]);
                setOpenGroup(null);
              }}
              className="flex flex-col items-center justify-center flex-1 h-full text-gray-400 group"
            >
              <div className="w-9 h-9 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-lg shadow-inner group-active:scale-90 transition-transform">
                🔄
              </div>
              <span className="text-[8px] font-black uppercase tracking-tight mt-0.5 opacity-60">Mode</span>
            </button>
          )}
        </div>
      </nav>

      {/* DESKTOP SIDEBAR (Unchanged for high-productivity horizontal space) */}
      <aside className="hidden md:flex w-64 bg-white border-r border-gray-100 fixed h-full z-50 flex-col">
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center space-x-3 mb-10">
            <div className={`${colorMap[themeColor]} p-2.5 rounded-xl flex items-center justify-center shadow-lg shadow-gray-100`}>
               <span className="text-white text-lg font-black tracking-tight">MF</span>
            </div>
            <h2 className="text-lg font-black text-gray-800 tracking-tight uppercase">MotoFleet</h2>
          </div>
          
          <nav className="space-y-1.5 flex-1 overflow-y-auto pr-2 no-scrollbar">
            {/* Desktop Flattened View for quick access */}
            {(role === 'admin' ? [
              { id: 'dashboard', label: 'Overview', icon: '📊' },
              { id: 'fleet', label: 'Fleet', icon: '🏍️' },
              { id: 'drivers', label: 'Operators', icon: '👤' },
              { id: 'payments', label: 'Payments', icon: '💰' },
              { id: 'maintenance', label: 'Service', icon: '🔧' },
              { id: 'fines', label: 'Fines', icon: '🚔' },
              { id: 'communications', label: 'Comms', icon: '📡' },
              { id: 'tracking', label: 'Track', icon: '📍' },
            ] : role === 'mechanic' ? [
              { id: 'mechanic-portal', label: 'Technical', icon: '🛠️' },
              { id: 'maintenance', label: 'History', icon: '📋' },
            ] : [
              { id: 'driver-profile', label: 'Portfolio', icon: '👤' },
            ]).map((item) => (
              <button
                key={item.id}
                onClick={() => setView(item.id as View)}
                className={`w-full flex items-center space-x-3 px-5 py-3.5 rounded-2xl transition-all ${
                  activeView === item.id
                    ? `${colorMap[themeColor]} text-white font-bold translate-x-1 shadow-lg shadow-gray-100`
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <span className="text-xl opacity-80">{item.icon}</span>
                <span className="text-sm font-bold uppercase tracking-wider text-[11px]">{item.label}</span>
              </button>
            ))}
          </nav>

          {!hideSwitcher && isAdminAuthenticated && (
            <div className="mt-auto pt-6 border-t border-gray-50">
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-4 text-center">Identity Terminal</p>
              <div className="grid grid-cols-1 gap-2">
                <button 
                  onClick={() => onSwitchMode('admin')} 
                  className={`px-3 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${role === 'admin' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-gray-50 text-gray-400 hover:text-gray-600'}`}
                >
                  Admin Hub
                </button>
                <button 
                  onClick={() => onSwitchMode('mechanic')} 
                  className={`px-3 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${role === 'mechanic' ? 'bg-amber-600 text-white shadow-lg shadow-amber-100' : 'bg-gray-50 text-gray-400 hover:text-gray-600'}`}
                >
                  Mechanic Hub
                </button>
                <button 
                  onClick={() => onSwitchMode('driver')} 
                  className={`px-3 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${role === 'driver' ? 'bg-green-600 text-white shadow-lg shadow-green-100' : 'bg-gray-50 text-gray-400 hover:text-gray-600'}`}
                >
                  Driver Hub
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
