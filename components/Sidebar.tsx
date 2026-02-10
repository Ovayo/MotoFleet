
import React, { useState } from 'react';
import { View } from '../types';

interface SidebarProps {
  activeView: View;
  setView: (view: View) => void;
  role: 'admin' | 'driver' | 'mechanic';
  onSwitchMode: (role: 'admin' | 'driver' | 'mechanic') => void;
  hideSwitcher?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setView, role, onSwitchMode, hideSwitcher = false }) => {
  const [isOpen, setIsOpen] = useState(false);

  const adminItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'fleet', label: 'Fleet Management', icon: '🏍️' },
    { id: 'drivers', label: 'Drivers', icon: '👤' },
    { id: 'payments', label: 'Payments', icon: '💰' },
    { id: 'maintenance', label: 'Maintenance', icon: '🔧' },
  ];

  const mechanicItems = [
    { id: 'mechanic-portal', label: 'Workshop Overview', icon: '🛠️' },
    { id: 'maintenance', label: 'Service Logs', icon: '📋' },
  ];

  const driverItems = [
    { id: 'driver-profile', label: 'My Portfolio', icon: '👤' },
  ];

  const menuItems = role === 'admin' ? adminItems : role === 'mechanic' ? mechanicItems : driverItems;
  const themeColor = role === 'admin' ? 'blue' : role === 'mechanic' ? 'amber' : 'green';

  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 bg-white p-2 rounded-lg shadow-md border border-gray-200"
      >
        {isOpen ? '✕' : '☰'}
      </button>

      <aside className={`w-64 bg-white border-r border-gray-200 fixed h-full z-40 transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center space-x-2 mb-8">
            <div className={`bg-${themeColor}-600 p-2 rounded-lg`}>
               <span className="text-white text-xl font-bold">MF</span>
            </div>
            <h2 className="text-xl font-bold text-gray-800 tracking-tight">MotoFleet</h2>
          </div>
          
          <nav className="space-y-1 flex-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setView(item.id as View);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  activeView === item.id
                    ? `bg-${themeColor}-50 text-${themeColor}-600 font-semibold`
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {!hideSwitcher && (
            <div className="mt-auto pt-8 border-t border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 text-center">Switch Portal</p>
              <div className="flex flex-col gap-2">
                <button onClick={() => onSwitchMode('admin')} className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${role === 'admin' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>Admin</button>
                <button onClick={() => onSwitchMode('mechanic')} className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${role === 'mechanic' ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>Mechanic</button>
                <button onClick={() => onSwitchMode('driver')} className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${role === 'driver' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>Driver</button>
              </div>
            </div>
          )}
        </div>
      </aside>
      
      {isOpen && (
        <div className="md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-30" onClick={() => setIsOpen(false)}></div>
      )}
    </>
  );
};

export default Sidebar;
