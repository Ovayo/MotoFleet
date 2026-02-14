
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

interface MenuGroup {
  id: string;
  label: string;
  icon: string;
  children?: { id: string; label: string; icon: string }[];
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

  const groups = role === 'admin' ? adminGroups : role === 'mechanic' ? [
    { id: 'mechanic-portal', label: 'Technical', icon: '🛠️', viewId: 'mechanic-portal' },
    { id: 'maintenance', label: 'History', icon: '📋', viewId: 'maintenance' },
  ] : [
    { id: 'driver-profile', label: 'Portfolio', icon: '👤', viewId: 'driver-profile' },
  ];

  const themeColor = role === 'admin' ? 'blue' : role === 'mechanic' ? 'amber' : 'green';
  const colorMap: Record<string, string> = { blue: 'bg-blue-600', amber: 'bg-amber-600', green: 'bg-green-600' };
  const textActiveMap: Record<string, string> = { blue: 'text-blue-600', amber: 'text-amber-600', green: 'text-green-600' };

  return (
    <>
      <nav ref={mobileMenuRef} className={`md:hidden fixed bottom-0 left-0 right-0 z-[110] backdrop-blur-2xl border-t pb-safe shadow-[0_-15px_35px_rgba(0,0,0,0.08)] ${isDarkMode ? 'bg-black/90 border-white/5' : 'bg-white/90 border-gray-100'}`}>
        <div className="flex items-center justify-around h-20 px-2 relative">
          {groups.map((group) => (
            <button
              key={group.id}
              onClick={() => group.viewId ? setView(group.viewId) : setOpenGroup(openGroup === group.id ? null : group.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-all relative ${activeView === group.viewId ? textActiveMap[themeColor] : 'text-gray-400'}`}
            >
              <span className="text-2xl mb-0.5">{group.icon}</span>
              <span className="text-[8px] font-black uppercase tracking-tight">{group.label}</span>
              {activeView === group.viewId && <div className={`absolute top-0 w-8 h-1 rounded-b-full ${colorMap[themeColor]}`}></div>}
            </button>
          ))}
          <button onClick={toggleDarkMode} className="flex flex-col items-center justify-center flex-1 h-full text-gray-400">
            <span className="text-2xl mb-0.5">{isDarkMode ? '🌙' : '☀️'}</span>
            <span className="text-[8px] font-black uppercase tracking-tight">Mode</span>
          </button>
        </div>
      </nav>

      <aside className={`hidden md:flex w-64 fixed h-full z-50 flex-col backdrop-blur-3xl border-r transition-colors duration-500 ${isDarkMode ? 'bg-black/60 border-white/5' : 'bg-white/40 border-white/60'}`}>
        <div className="p-8 h-full flex flex-col">
          <div className="flex items-center space-x-4 mb-14 group cursor-pointer">
            <div className={`${colorMap[themeColor]} w-12 h-12 rounded-[1.2rem] flex items-center justify-center shadow-2xl transition-transform group-hover:rotate-12 duration-500`}>
               <span className="text-white text-xl font-black tracking-tighter">MF</span>
            </div>
            <h2 className={`text-xl font-black tracking-tighter uppercase leading-none ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>MotoFleet</h2>
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
              { id: 'mechanic-portal', label: 'Workshop', icon: '🛠️' },
              { id: 'maintenance', label: 'History', icon: '📋' },
            ] : [
              { id: 'driver-profile', label: 'Portfolio', icon: '👤' },
            ]).map((item) => (
              <button
                key={item.id}
                onClick={() => setView(item.id as View)}
                className={`w-full flex items-center space-x-4 px-6 py-4 rounded-[1.5rem] transition-all duration-300 relative ${activeView === item.id ? (isDarkMode ? 'bg-white text-black shadow-2xl scale-[1.02]' : 'bg-gray-900 text-white shadow-2xl scale-[1.02]') : (isDarkMode ? 'text-white/30 hover:bg-white/5 hover:text-white' : 'text-gray-400 hover:bg-white/60 hover:text-gray-900')}`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-8 border-t border-white/5 space-y-6">
            <div className={`flex items-center justify-between rounded-2xl p-4 border ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
              <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Ambient Mode</span>
              <button onClick={toggleDarkMode} className={`w-12 h-6 rounded-full relative transition-colors duration-500 flex items-center px-1 ${isDarkMode ? 'bg-blue-600' : 'bg-gray-200'}`}>
                <div className={`w-4 h-4 rounded-full shadow-lg transition-transform duration-500 transform ${isDarkMode ? 'translate-x-6 bg-white' : 'translate-x-0 bg-gray-500'}`}></div>
              </button>
            </div>
            {!hideSwitcher && isAdminAuthenticated && (
              <div className="grid grid-cols-1 gap-2">
                {['admin', 'mechanic', 'driver'].map(m => (
                  <button key={m} onClick={() => onSwitchMode(m as any)} className={`px-4 py-3 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all border ${role === m ? `${colorMap[m === 'admin' ? 'blue' : m === 'mechanic' ? 'amber' : 'green']} text-white border-transparent` : (isDarkMode ? 'bg-white/5 text-white/30 border-white/5' : 'bg-white/40 text-gray-400 border-white/60')}`}>
                    {m} hub
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
