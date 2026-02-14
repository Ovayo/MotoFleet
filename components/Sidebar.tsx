
import React, { useState, useEffect, useRef } from 'react';
import { View } from '../types';

interface SidebarProps {
  activeView: View;
  setView: (view: View) => void;
  role: 'admin' | 'driver' | 'mechanic';
  isAdminAuthenticated: boolean;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
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
  isDarkMode,
  toggleDarkMode,
  onSwitchMode, 
  hideSwitcher = false 
}) => {
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const adminGroups: MenuGroup[] = [
    { id: 'g-hub', label: 'Hub', icon: '📊', viewId: 'dashboard' },
    { 
      id: 'g-assets', 
      label: 'Fleet', 
      icon: '🏍️', 
      children: [
        { id: 'fleet', label: 'Asset Registry', icon: '🏍️' },
        { id: 'drivers', label: 'Operator Hub', icon: '👤' },
        { id: 'tracking', label: 'Live Telemetry', icon: '📍' },
      ]
    },
    { 
      id: 'g-finance', 
      label: 'Ledger', 
      icon: '💰', 
      children: [
        { id: 'payments', label: 'Revenue Streams', icon: '💰' },
        { id: 'fines', label: 'Compliance Fines', icon: '🚔' },
      ]
    },
    { 
      id: 'g-ops', 
      label: 'Ops', 
      icon: '📡', 
      children: [
        { id: 'maintenance', label: 'Technical Log', icon: '🔧' },
        { id: 'communications', label: 'Comms Grid', icon: '📡' },
      ]
    }
  ];

  const mechanicGroups: MenuGroup[] = [
    { id: 'mechanic-portal', label: 'Workshop', icon: '🛠️', viewId: 'mechanic-portal' },
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
      {/* MOBILE PREMIUM NAVIGATION */}
      <nav ref={mobileMenuRef} className={`md:hidden fixed bottom-6 left-6 right-6 z-[110] backdrop-blur-3xl border rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-visible ${isDarkMode ? 'bg-gray-900/80 border-white/10' : 'bg-white/70 border-white/60'}`}>
        {groups.map(group => group.children && openGroup === group.id && (
          <div key={`sub-${group.id}`} className={`absolute bottom-24 left-0 right-0 backdrop-blur-3xl rounded-[2.5rem] p-4 shadow-2xl border animate-in slide-in-from-bottom-10 duration-500 ease-out ${isDarkMode ? 'bg-black/90 border-white/10' : 'bg-white/90 border-white/60'}`}>
            <div className={`p-3 border-b mb-2 ${isDarkMode ? 'border-white/5' : 'border-gray-100/50'}`}>
              <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${isDarkMode ? 'text-white/30' : 'text-gray-400'}`}>{group.label} Operations</p>
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {group.children.map(child => (
                <button
                  key={child.id}
                  onClick={() => {
                    setView(child.id as View);
                    setOpenGroup(null);
                  }}
                  className={`flex items-center space-x-5 p-5 rounded-[1.8rem] transition-all duration-300 ${
                    activeView === child.id 
                      ? (isDarkMode ? 'bg-white text-black shadow-xl scale-[1.02]' : 'bg-gray-900 text-white shadow-xl scale-[1.02]') 
                      : (isDarkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50')
                  }`}
                >
                  <span className="text-2xl">{child.icon}</span>
                  <span className={`block text-xs font-black uppercase tracking-[0.1em] ${activeView === child.id ? (isDarkMode ? 'text-black' : 'text-white') : (isDarkMode ? 'text-white/80' : 'text-gray-800')}`}>
                    {child.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}

        <div className="flex items-center justify-around h-20 px-4">
          {groups.map((group) => {
            const isAnyChildActive = group.children?.some(c => c.id === activeView);
            const isActive = activeView === group.viewId || isAnyChildActive;
            const isOpen = openGroup === group.id;

            return (
              <button
                key={group.id}
                onClick={() => handleGroupClick(group)}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-all duration-500 relative ${
                  isActive || isOpen ? textActiveMap[themeColor] : (isDarkMode ? 'text-white/20' : 'text-gray-400')
                }`}
              >
                <div className={`transition-transform duration-500 ${isOpen ? 'scale-125 -translate-y-1' : ''}`}>
                  <span className={`text-2xl mb-1 block transition-transform ${isActive ? 'scale-110' : 'opacity-60 grayscale group-hover:grayscale-0'}`}>
                    {group.icon}
                  </span>
                </div>
                <span className={`text-[8px] font-black uppercase tracking-[0.2em] transition-all ${isActive ? 'opacity-100' : 'opacity-40'}`}>
                  {group.label}
                </span>
                {isActive && (
                  <div className={`absolute -bottom-1 w-8 h-1 rounded-full ${colorMap[themeColor]} animate-in fade-in duration-500`}></div>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* DESKTOP SIDEBAR - WHITE LABEL READY */}
      <aside className={`hidden md:flex w-64 fixed h-full z-50 flex-col backdrop-blur-3xl border-r transition-colors duration-500 ${isDarkMode ? 'bg-black/60 border-white/5' : 'bg-white/40 border-white/60'}`}>
        <div className="p-8 h-full flex flex-col">
          <div className="flex items-center space-x-4 mb-14 group cursor-pointer">
            <div className={`${colorMap[themeColor]} w-12 h-12 rounded-[1.2rem] flex items-center justify-center shadow-2xl transition-transform group-hover:rotate-12 duration-500 ${isDarkMode ? 'shadow-black' : 'shadow-gray-200'}`}>
               <span className="text-white text-xl font-black tracking-tighter">MF</span>
            </div>
            <div className="min-w-0">
              <h2 className={`text-xl font-black tracking-tighter uppercase leading-none ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>MotoFleet</h2>
              <p className={`text-[8px] font-black uppercase tracking-[0.4em] mt-1 ${isDarkMode ? 'text-white/30' : 'text-gray-400'}`}>Grid Command</p>
            </div>
          </div>
          
          <nav className="space-y-2 flex-1 overflow-y-auto pr-3 no-scrollbar">
            {(role === 'admin' ? [
              { id: 'dashboard', label: 'Overview', icon: '📊' },
              { id: 'fleet', label: 'Asset Grid', icon: '🏍️' },
              { id: 'drivers', label: 'Operations', icon: '👤' },
              { id: 'payments', label: 'Ledger', icon: '💰' },
              { id: 'maintenance', label: 'Technical', icon: '🔧' },
              { id: 'fines', label: 'Compliance', icon: '🚔' },
              { id: 'communications', label: 'Comms Hub', icon: '📡' },
              { id: 'tracking', label: 'Telemetry', icon: '📍' },
            ] : role === 'mechanic' ? [
              { id: 'mechanic-portal', label: 'Technical Portal', icon: '🛠️' },
              { id: 'maintenance', label: 'Event Logs', icon: '📋' },
            ] : [
              { id: 'driver-profile', label: 'Portfolio', icon: '👤' },
            ]).map((item) => (
              <button
                key={item.id}
                onClick={() => setView(item.id as View)}
                className={`w-full flex items-center space-x-4 px-6 py-4 rounded-[1.5rem] transition-all duration-300 relative group/item ${
                  activeView === item.id
                    ? (isDarkMode ? 'bg-white text-black shadow-2xl scale-[1.02]' : 'bg-gray-900 text-white shadow-2xl shadow-gray-200 translate-x-1 scale-[1.02]')
                    : (isDarkMode ? 'text-white/30 hover:bg-white/5 hover:text-white' : 'text-gray-400 hover:bg-white/60 hover:text-gray-900')
                }`}
              >
                <span className={`text-xl transition-transform group-hover/item:scale-110 duration-300 ${activeView === item.id ? '' : 'grayscale group-hover/item:grayscale-0 opacity-60 group-hover/item:opacity-100'}`}>{item.icon}</span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">{item.label}</span>
                {activeView === item.id && (
                  <div className={`absolute right-4 w-1.5 h-1.5 rounded-full animate-pulse ${isDarkMode ? 'bg-blue-600' : 'bg-blue-400'}`}></div>
                )}
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-8 border-t border-white/5 space-y-8">
            {/* Dark Mode Toggle */}
            <div className="flex items-center justify-between bg-white/5 rounded-2xl p-4 border border-white/5">
              <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Ambient Mode</span>
              <button 
                onClick={toggleDarkMode}
                className={`w-12 h-6 rounded-full relative transition-colors duration-500 flex items-center px-1 ${isDarkMode ? 'bg-blue-600' : 'bg-gray-200'}`}
              >
                <div className={`w-4 h-4 rounded-full shadow-lg transition-transform duration-500 transform ${isDarkMode ? 'translate-x-6 bg-white' : 'translate-x-0 bg-gray-500'}`}></div>
              </button>
            </div>

            {!hideSwitcher && isAdminAuthenticated && (
              <div className="space-y-4">
                <p className={`text-[9px] font-black uppercase tracking-[0.3em] text-center ${isDarkMode ? 'text-white/20' : 'text-gray-300'}`}>Context Matrix</p>
                <div className="grid grid-cols-1 gap-2.5">
                  {[
                    { r: 'admin', label: 'Admin Hub', color: 'bg-blue-600' },
                    { r: 'mechanic', label: 'Workshop', color: 'bg-amber-600' },
                    { r: 'driver', label: 'Operator', color: 'bg-green-600' }
                  ].map(mode => (
                    <button 
                      key={mode.r}
                      onClick={() => onSwitchMode(mode.r as any)} 
                      className={`px-4 py-3 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-500 border ${role === mode.r ? `${mode.color} text-white border-transparent shadow-xl ${isDarkMode ? 'shadow-black' : 'shadow-gray-200'}` : (isDarkMode ? 'bg-white/5 text-white/30 border-white/5 hover:text-white' : 'bg-white/40 text-gray-400 border-white/60 hover:border-gray-300 hover:text-gray-600')}`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
