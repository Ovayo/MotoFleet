
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
    { id: 'dashboard', label: 'Dashboard', icon: '📈' },
    { 
      id: 'g-fleet', 
      label: 'Fleet Assets', 
      icon: '🏍️', 
      children: [
        { id: 'fleet', label: 'Vehicle Registry', icon: '📋' },
        { id: 'drivers', label: 'Operators', icon: '🆔' },
      ]
    },
    { 
      id: 'g-finance', 
      label: 'Financials', 
      icon: '💳', 
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
      ]
    }
  ] : role === 'mechanic' ? [
    { id: 'mechanic-portal', label: 'Technical', icon: '🛠️' },
    { id: 'maintenance', label: 'History', icon: '📜' },
  ] : [
    { id: 'driver-profile', label: 'My Portfolio', icon: '👤' },
  ];

  const themeColor = isSuperAdmin ? 'indigo' : role === 'admin' ? 'blue' : role === 'mechanic' ? 'amber' : 'green';
  
  const colorConfig: Record<string, { bg: string, text: string, lightBg: string, border: string, shadow: string }> = {
    blue: { bg: 'bg-blue-600', text: 'text-blue-600', lightBg: 'bg-blue-50', border: 'border-blue-100', shadow: 'shadow-blue-100' },
    amber: { bg: 'bg-amber-600', text: 'text-amber-600', lightBg: 'bg-amber-50', border: 'border-amber-100', shadow: 'shadow-amber-100' },
    green: { bg: 'bg-green-600', text: 'text-green-600', lightBg: 'bg-green-50', border: 'border-green-100', shadow: 'shadow-green-100' },
    indigo: { bg: 'bg-indigo-600', text: 'text-indigo-600', lightBg: 'bg-indigo-50', border: 'border-indigo-100', shadow: 'shadow-indigo-100' }
  };

  const currentTheme = colorConfig[themeColor];

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

  const NavIconTile = ({ icon, isActive, isNested = false }: { icon: string, isActive: boolean, isNested?: boolean }) => (
    <div className={`
      shrink-0 flex items-center justify-center transition-all duration-300
      ${isNested ? 'w-7 h-7 rounded-lg text-xs' : 'w-9 h-9 rounded-xl text-lg'}
      ${isActive 
        ? `${currentTheme.bg} text-white shadow-lg ${currentTheme.shadow} scale-110` 
        : `bg-gray-100/80 text-gray-400 group-hover:bg-gray-200 group-hover:text-gray-600`}
    `}>
      {icon}
    </div>
  );

  const renderSidebarItem = (item: MenuItem | MenuGroup, isNested = false) => {
    if ('children' in item) {
      const isOpen = openGroups.includes(item.id);
      const isAnyChildActive = item.children.some(child => child.id === activeView);
      
      return (
        <div key={item.id} className="space-y-1">
          <button
            onClick={() => toggleGroup(item.id)}
            className={`w-full group flex items-center justify-between px-3 py-2.5 rounded-2xl transition-all ${
              isAnyChildActive ? 'bg-gray-50/80' : 'hover:bg-gray-50/50'
            }`}
          >
            <div className="flex items-center space-x-3">
              <NavIconTile icon={item.icon} isActive={isAnyChildActive} isNested={false} />
              <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isAnyChildActive ? 'text-gray-800' : 'text-gray-400 group-hover:text-gray-600'}`}>{item.label}</span>
            </div>
            <span className={`text-[8px] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} text-gray-300`}>▼</span>
          </button>
          
          {isOpen && (
            <div className="ml-5 pl-4 border-l border-gray-100 space-y-1.5 py-1">
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
        className={`w-full group flex items-center space-x-3 px-3 py-2.5 rounded-2xl transition-all ${
          isActive 
            ? 'bg-white shadow-sm ring-1 ring-gray-100' 
            : 'hover:bg-gray-50/50'
        }`}
      >
        <NavIconTile icon={item.icon} isActive={isActive} isNested={isNested} />
        <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${isActive ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-600'}`}>{item.label}</span>
      </button>
    );
  };

  return (
    <>
      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white/90 backdrop-blur-xl border-t border-gray-100 px-3 py-3 safe-area-bottom shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
        <div className="flex items-center justify-around">
          <MobileNavItem icon="📈" label="Hub" isActive={activeView === 'dashboard'} onClick={() => setView('dashboard')} currentTheme={currentTheme} />
          <MobileNavItem icon="🏍️" label="Fleet" isActive={activeView === 'fleet'} onClick={() => setView('fleet')} currentTheme={currentTheme} />
          <MobileNavItem icon="🆔" label="Staff" isActive={activeView === 'drivers'} onClick={() => setView('drivers')} currentTheme={currentTheme} />
          <MobileNavItem icon="💰" label="Pay" isActive={activeView === 'payments'} onClick={() => setView('payments')} currentTheme={currentTheme} />
          <MobileNavItem 
            icon="🔮" 
            label="More" 
            isActive={showMoreMenu} 
            onClick={() => setShowMoreMenu(!showMoreMenu)} 
            currentTheme={currentTheme} 
          />
        </div>

        {/* Mobile More Menu - Parent/Child Structure */}
        {showMoreMenu && (
          <div ref={moreMenuRef} className="absolute bottom-[calc(100%+16px)] left-4 right-4 bg-white/98 backdrop-blur-2xl rounded-[2.5rem] p-6 shadow-[0_-20px_50px_rgba(0,0,0,0.1)] border border-gray-100 animate-in slide-in-from-bottom-6 duration-300 max-h-[70vh] overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-center mb-6 border-b border-gray-50 pb-4">
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Application Matrix</p>
              <button onClick={() => setShowMoreMenu(false)} className="text-gray-300 hover:text-gray-900 text-3xl transition-colors">&times;</button>
            </div>
            <div className="space-y-2">
              {menuStructure.map(item => renderSidebarItem(item))}
            </div>
            
            {!hideSwitcher && isAdminAuthenticated && (
              <div className="mt-8 pt-6 border-t border-gray-50 grid grid-cols-3 gap-2">
                <button onClick={() => onSwitchMode('admin')} className={`py-3 rounded-xl text-[8px] font-black uppercase tracking-tighter transition-all ${role === 'admin' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-50 text-gray-400'}`}>Admin</button>
                <button onClick={() => onSwitchMode('mechanic')} className={`py-3 rounded-xl text-[8px] font-black uppercase tracking-tighter transition-all ${role === 'mechanic' ? 'bg-amber-600 text-white shadow-lg' : 'bg-gray-50 text-gray-400'}`}>Mechanic</button>
                <button onClick={() => onSwitchMode('driver')} className={`py-3 rounded-xl text-[8px] font-black uppercase tracking-tighter transition-all ${role === 'driver' ? 'bg-green-600 text-white shadow-lg' : 'bg-gray-50 text-gray-400'}`}>Driver</button>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-white border-r border-gray-100 fixed h-full z-50 flex-col shadow-sm">
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center space-x-3 mb-12">
            <div className={`${currentTheme.bg} w-10 h-10 rounded-2xl flex items-center justify-center shadow-xl ${currentTheme.shadow} rotate-3`}>
               <span className="text-white text-lg font-black tracking-tighter">MF</span>
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-800 tracking-tight uppercase leading-none">MotoFleet</h2>
              <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest mt-1">Grid Management</p>
            </div>
          </div>
          
          <nav className="space-y-2 flex-1 overflow-y-auto pr-2 no-scrollbar">
            {menuStructure.map(item => renderSidebarItem(item))}
          </nav>

          {!hideSwitcher && isAdminAuthenticated && (
            <div className="mt-auto pt-6 border-t border-gray-50 space-y-4">
              <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.25em] text-center">System Switcher</p>
              <div className="grid grid-cols-1 gap-2">
                <button onClick={() => onSwitchMode('admin')} className={`px-4 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${role === 'admin' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 scale-[1.02]' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}>Admin Terminal</button>
                <button onClick={() => onSwitchMode('mechanic')} className={`px-4 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${role === 'mechanic' ? 'bg-amber-600 text-white shadow-lg shadow-amber-100 scale-[1.02]' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}>Technical Hub</button>
                <button onClick={() => onSwitchMode('driver')} className={`px-4 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${role === 'driver' ? 'bg-green-600 text-white shadow-lg shadow-green-100 scale-[1.02]' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}>Operator Portal</button>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

const MobileNavItem: React.FC<{ 
  icon: string, 
  label: string, 
  isActive: boolean, 
  onClick: () => void, 
  currentTheme: { bg: string, text: string, lightBg: string } 
}> = ({ icon, label, isActive, onClick, currentTheme }) => {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center py-1 group transition-all duration-300 ${isActive ? 'scale-110' : 'opacity-60 hover:opacity-100'}`}
    >
      <div className={`
        w-11 h-11 flex items-center justify-center rounded-2xl transition-all duration-500 mb-1.5
        ${isActive ? `${currentTheme.bg} text-white shadow-xl shadow-current-theme ring-4 ring-white` : 'bg-gray-100 text-gray-400 group-active:scale-90'}
      `}>
        <span className={`text-xl ${isActive ? 'animate-bounce-short' : ''}`}>{icon}</span>
      </div>
      <span className={`text-[8px] font-black uppercase tracking-tighter ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
        {label}
      </span>
    </button>
  );
};

export default Sidebar;
