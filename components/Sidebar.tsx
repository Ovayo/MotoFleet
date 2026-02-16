
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
  const isSuperAdmin = localStorage.getItem('motofleet_super_admin_auth') === 'true';

  const adminGroups: MenuGroup[] = [
    ...(isSuperAdmin ? [{ id: 'g-master', label: 'Master', icon: '👑', viewId: 'super-admin' as View }] : []),
    { id: 'g-singularity', label: 'Singularity', icon: '🌀', viewId: 'singularity' as View },
    { id: 'g-hub', label: 'Hub', icon: '📊', viewId: 'dashboard' },
    { 
      id: 'g-assets', 
      label: 'Fleet', 
      icon: '🏍️', 
      children: [
        { id: 'fleet', label: 'Registry', icon: '🏍️' },
        { id: 'drivers', label: 'Operators', icon: '👤' },
      ]
    },
    { 
      id: 'g-finance', 
      label: 'Money', 
      icon: '💰', 
      children: [
        { id: 'payments', label: 'Ledger', icon: '💰' },
        { id: 'fines', label: 'Fines', icon: '🚔' },
      ]
    },
    { 
      id: 'g-ops', 
      label: 'More', 
      icon: '⚙️', 
      children: [
        { id: 'maintenance', label: 'Service Log', icon: '🔧' },
        { id: 'incidents', label: 'Accidents', icon: '⚠️' },
        { id: 'communications', label: 'Comms Hub', icon: '📡' },
        { id: 'system', label: 'Sync & Cloud', icon: '🔄' },
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
  const themeColor = isSuperAdmin ? 'indigo' : role === 'admin' ? 'blue' : role === 'mechanic' ? 'amber' : 'green';

  const colorMap: Record<string, string> = { blue: 'bg-blue-600', amber: 'bg-amber-600', green: 'bg-green-600', indigo: 'bg-indigo-600' };
  const textActiveMap: Record<string, string> = { blue: 'text-blue-600', amber: 'text-amber-600', green: 'text-green-600', indigo: 'text-indigo-600' };

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
      {/* Mobile Navigation Overhaul */}
      <nav ref={mobileMenuRef} className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[110] w-[92%] max-w-md">
        {/* Animated Bottom Sheet (Submenu) */}
        {groups.map(group => group.children && openGroup === group.id && (
          <div key={`sub-${group.id}`} className="absolute bottom-[calc(100%+12px)] left-0 right-0 bg-white/95 backdrop-blur-3xl rounded-[2.5rem] p-5 shadow-[0_-20px_50px_rgba(0,0,0,0.15)] border border-white/20 animate-in slide-in-from-bottom-10 fade-in duration-300">
            <div className="flex justify-between items-center px-4 mb-4 border-b border-gray-50 pb-3">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{group.label} Actions</p>
              <button onClick={() => setOpenGroup(null)} className="text-gray-300 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {group.children.map(child => (
                <button
                  key={child.id}
                  onClick={() => { setView(child.id as View); setOpenGroup(null); }}
                  className={`flex items-center space-x-4 p-4 rounded-2xl transition-all active:scale-[0.98] ${activeView === child.id ? 'bg-gray-50 border border-gray-100 shadow-inner' : 'hover:bg-gray-50/50'}`}
                >
                  <span className="text-2xl filter drop-shadow-sm">{child.icon}</span>
                  <div className="text-left">
                    <span className={`block text-xs font-black uppercase tracking-tight ${activeView === child.id ? textActiveMap[themeColor] : 'text-gray-800'}`}>{child.label}</span>
                  </div>
                  {activeView === child.id && <div className={`ml-auto w-1.5 h-1.5 rounded-full ${colorMap[themeColor]}`}></div>}
                </button>
              ))}
            </div>
            {/* Action Sheet Tip */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white/95 rotate-45 border-r border-b border-white/20 -z-10"></div>
          </div>
        ))}

        {/* The Floating Action Capsule */}
        <div className="bg-white/80 backdrop-blur-2xl border border-white/40 rounded-[2.5rem] h-20 shadow-[0_15px_40px_rgba(0,0,0,0.12)] flex items-center justify-around px-2 relative overflow-hidden">
          {groups.map((group) => {
            const isAnyChildActive = group.children?.some(c => c.id === activeView);
            const isActive = activeView === group.viewId || isAnyChildActive;
            const isOpen = openGroup === group.id;
            return (
              <button
                key={group.id}
                onClick={() => handleGroupClick(group)}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-all relative z-10 ${isActive || isOpen ? textActiveMap[themeColor] : 'text-gray-400'} ${group.id === 'g-singularity' ? 'animate-pulse' : ''}`}
              >
                <div className={`relative transition-all duration-300 ${isOpen || isActive ? 'scale-110 -translate-y-1' : 'scale-100 opacity-60'}`}>
                   <span className="text-2xl mb-0.5">{group.icon}</span>
                   {group.children && !isActive && !isOpen && (
                    <div className="absolute -top-1 -right-1.5 w-2 h-2 bg-gray-200 rounded-full border border-white"></div>
                   )}
                </div>
                <span className={`text-[8px] font-black uppercase tracking-tighter transition-all ${isActive ? 'opacity-100' : 'opacity-40'}`}>{group.label}</span>
                
                {/* Active Indicator Glow */}
                {(isActive || isOpen) && (
                  <div className={`absolute inset-x-2 inset-y-2 rounded-2xl opacity-10 blur-md ${colorMap[themeColor]}`}></div>
                )}
              </button>
            );
          })}

          {/* Integrated Role Switcher in Mobile Nav */}
          {!hideSwitcher && isAdminAuthenticated && (
            <div className="w-[1px] h-8 bg-gray-100 mx-1"></div>
          )}
          {!hideSwitcher && isAdminAuthenticated && (
            <button 
              onClick={() => {
                const roles: ('admin' | 'mechanic' | 'driver')[] = ['admin', 'mechanic', 'driver'];
                onSwitchMode(roles[(roles.indexOf(role) + 1) % roles.length]);
                setOpenGroup(null);
              }}
              className="flex flex-col items-center justify-center flex-1 h-full text-gray-400 group relative z-10"
            >
              <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-lg shadow-inner group-active:scale-90 transition-transform">🔄</div>
              <span className="text-[7px] font-black uppercase tracking-widest mt-1 opacity-40">Role</span>
            </button>
          )}
        </div>
      </nav>

      {/* Desktop Sidebar (Unchanged as it is already optimized) */}
      <aside className="hidden md:flex w-64 bg-white border-r border-gray-100 fixed h-full z-50 flex-col">
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center space-x-3 mb-10">
            <div className={`${colorMap[themeColor]} p-2.5 rounded-xl flex items-center justify-center shadow-lg shadow-gray-100`}>
               <span className="text-white text-lg font-black tracking-tight">MF</span>
            </div>
            <h2 className="text-lg font-black text-gray-800 tracking-tight uppercase">MotoFleet</h2>
          </div>
          
          <nav className="space-y-1.5 flex-1 overflow-y-auto pr-2 no-scrollbar">
            {(role === 'admin' ? [
              ...(isSuperAdmin ? [{ id: 'super-admin', label: 'Provisioning', icon: '👑' }] : []),
              { id: 'singularity', label: 'Singularity', icon: '🌀' },
              { id: 'dashboard', label: 'Overview', icon: '📊' },
              { id: 'fleet', label: 'Fleet', icon: '🏍️' },
              { id: 'drivers', label: 'Operators', icon: '👤' },
              { id: 'payments', label: 'Payments', icon: '💰' },
              { id: 'maintenance', label: 'Service', icon: '🔧' },
              { id: 'incidents', label: 'Incidents', icon: '⚠️' },
              { id: 'fines', label: 'Fines', icon: '🚔' },
              { id: 'communications', label: 'Comms', icon: '📡' },
              { id: 'system', label: 'System', icon: '⚙️' },
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
                  activeView === item.id ? `${colorMap[themeColor]} text-white font-bold translate-x-1 shadow-lg shadow-gray-100` : 'text-gray-500 hover:bg-gray-50'
                } ${item.id === 'singularity' ? 'hover:bg-indigo-50 border-l-4 border-transparent hover:border-indigo-500' : ''}`}
              >
                <span className={`text-xl opacity-80 ${item.id === 'singularity' ? 'animate-spin-slow' : ''}`}>{item.icon}</span>
                <span className="text-sm font-bold uppercase tracking-wider text-[11px]">{item.label}</span>
              </button>
            ))}
          </nav>

          {!hideSwitcher && isAdminAuthenticated && (
            <div className="mt-auto pt-6 border-t border-gray-50">
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-4 text-center">Identity Terminal</p>
              <div className="grid grid-cols-1 gap-2">
                <button onClick={() => onSwitchMode('admin')} className={`px-3 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${role === 'admin' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-gray-50 text-gray-400 hover:text-gray-600'}`}>Admin Hub</button>
                <button onClick={() => onSwitchMode('mechanic')} className={`px-3 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${role === 'mechanic' ? 'bg-amber-600 text-white shadow-lg shadow-amber-100' : 'bg-gray-50 text-gray-400 hover:text-gray-600'}`}>Mechanic Hub</button>
                <button onClick={() => onSwitchMode('driver')} className={`px-3 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${role === 'driver' ? 'bg-green-600 text-white shadow-lg shadow-green-100' : 'bg-gray-50 text-gray-400 hover:text-gray-600'}`}>Driver Hub</button>
              </div>
            </div>
          )}
        </div>
      </aside>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 10s linear infinite;
        }
      `}</style>
    </>
  );
};

export default Sidebar;
