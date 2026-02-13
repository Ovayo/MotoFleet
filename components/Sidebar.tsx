
import React, { useState } from 'react';
import { View } from '../types';

interface SidebarProps {
  activeView: View;
  setView: (view: View) => void;
  role: 'admin' | 'driver' | 'mechanic';
  isAdminAuthenticated: boolean;
  onSwitchMode: (role: 'admin' | 'driver' | 'mechanic') => void;
  hideSwitcher?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeView, 
  setView, 
  role, 
  isAdminAuthenticated, 
  onSwitchMode, 
  hideSwitcher = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const adminItems = [
    { id: 'dashboard', label: 'Overview', icon: '📊' },
    { id: 'fleet', label: 'Fleet Hub', icon: '🏍️' },
    { id: 'drivers', label: 'Operators', icon: '👤' },
    { id: 'payments', label: 'Payments', icon: '💰' },
    { id: 'maintenance', label: 'Service', icon: '🔧' },
    { id: 'fines', label: 'Fines', icon: '🚔' },
    { id: 'communications', label: 'Comms', icon: '📡' },
    { id: 'tracking', label: 'Tracking', icon: '📍' },
  ];

  const mechanicItems = [
    { id: 'mechanic-portal', label: 'Technical', icon: '🛠️' },
    { id: 'maintenance', label: 'History', icon: '📋' },
  ];

  const driverItems = [
    { id: 'driver-profile', label: 'Portfolio', icon: '👤' },
  ];

  const menuItems = role === 'admin' ? adminItems : role === 'mechanic' ? mechanicItems : driverItems;
  const themeColor = role === 'admin' ? 'blue' : role === 'mechanic' ? 'amber' : 'green';

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-600 shadow-blue-100',
    amber: 'bg-amber-600 shadow-amber-100',
    green: 'bg-green-600 shadow-green-100'
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-5 left-4 z-[60] bg-white w-10 h-10 rounded-xl shadow-lg border border-gray-100 flex items-center justify-center transition-transform active:scale-95"
      >
        <span className="text-xl">{isOpen ? '✕' : '☰'}</span>
      </button>

      <aside className={`w-64 bg-white border-r border-gray-100 fixed h-full z-50 transition-all duration-300 ease-in-out ${
        isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center space-x-3 mb-10">
            <div className={`${colorMap[themeColor]} p-2.5 rounded-xl flex items-center justify-center`}>
               <span className="text-white text-lg font-black tracking-tight">MF</span>
            </div>
            <h2 className="text-lg font-black text-gray-800 tracking-tight uppercase">MotoFleet</h2>
          </div>
          
          <nav className="space-y-1.5 flex-1 overflow-y-auto pr-2 no-scrollbar">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setView(item.id as View);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-5 py-3.5 rounded-2xl transition-all ${
                  activeView === item.id
                    ? `${colorMap[themeColor]} text-white font-bold translate-x-1`
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
      
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40 animate-in fade-in duration-300" 
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </>
  );
};

export default Sidebar;
