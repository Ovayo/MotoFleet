
import React, { useState } from 'react';
import { View } from '../types';

interface SidebarProps {
  activeView: View;
  setView: (view: View) => void;
  isAdmin: boolean;
  onSwitchMode: () => void;
  hideSwitcher?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setView, isAdmin, onSwitchMode, hideSwitcher = false }) => {
  const [isOpen, setIsOpen] = useState(false);

  const adminItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'fleet', label: 'Fleet Management', icon: '🏍️' },
    { id: 'drivers', label: 'Drivers', icon: '👤' },
    { id: 'payments', label: 'Payments', icon: '💰' },
    { id: 'maintenance', label: 'Maintenance', icon: '🔧' },
  ];

  const driverItems = [
    { id: 'driver-profile', label: 'My Portfolio', icon: '👤' },
  ];

  const menuItems = isAdmin ? adminItems : driverItems;

  return (
    <>
      {/* Mobile Menu Toggle */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 bg-white p-2 rounded-lg shadow-md border border-gray-200"
      >
        {isOpen ? '✕' : '☰'}
      </button>

      <aside className={`w-64 bg-white border-r border-gray-200 fixed h-full z-40 transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6">
          <div className="flex items-center space-x-2 mb-8">
            <div className={`${isAdmin ? 'bg-blue-600' : 'bg-green-600'} p-2 rounded-lg`}>
               <span className="text-white text-xl font-bold">MF</span>
            </div>
            <h2 className="text-xl font-bold text-gray-800 tracking-tight">MotoFleet</h2>
          </div>
          
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setView(item.id as View);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  activeView === item.id
                    ? (isAdmin ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600') + ' font-semibold'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {!hideSwitcher && (
            <div className="mt-8 pt-8 border-t border-gray-100">
              <button
                onClick={onSwitchMode}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors group"
              >
                <div className="text-left">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Mode</p>
                  <p className="text-sm font-bold text-gray-700">{isAdmin ? 'Admin Portal' : 'Driver View'}</p>
                </div>
                <span className="text-gray-400 group-hover:text-blue-500 transition-colors">🔄</span>
              </button>
            </div>
          )}
        </div>
        
        <div className="absolute bottom-0 w-full p-6 border-t border-gray-100">
          <div className={`${isAdmin ? 'bg-blue-600' : 'bg-green-600'} rounded-xl p-4 text-white text-sm shadow-lg`}>
            <p className="font-semibold mb-1">{isAdmin ? 'Fleet Health' : 'Your Standing'}</p>
            <p className="text-white/80 text-xs">{isAdmin ? '7/8 Bikes Active' : 'Elite Status Active'}</p>
            <div className="w-full bg-black/10 rounded-full h-1.5 mt-2 overflow-hidden">
              <div className="bg-white h-1.5 rounded-full" style={{ width: isAdmin ? '87%' : '95%' }}></div>
            </div>
          </div>
        </div>
      </aside>
      
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-30"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </>
  );
};

export default Sidebar;
