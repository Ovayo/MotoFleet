
import React from 'react';
import { View } from '../types';

interface SidebarProps {
  activeView: View;
  setView: (view: View) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setView }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'fleet', label: 'Fleet Management', icon: '🏍️' },
    { id: 'drivers', label: 'Drivers', icon: '👤' },
    { id: 'payments', label: 'Payments', icon: '💰' },
    { id: 'maintenance', label: 'Maintenance', icon: '🔧' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 fixed h-full z-10">
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-8">
          <div className="bg-blue-600 p-2 rounded-lg">
             <span className="text-white text-xl font-bold">MF</span>
          </div>
          <h2 className="text-xl font-bold text-gray-800 tracking-tight">MotoFleet</h2>
        </div>
        
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id as View)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                activeView === item.id
                  ? 'bg-blue-50 text-blue-600 font-semibold'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
      
      <div className="absolute bottom-0 w-full p-6 border-t border-gray-100">
        <div className="bg-blue-600 rounded-xl p-4 text-white text-sm">
          <p className="font-semibold mb-1">Fleet Plan: Basic</p>
          <p className="text-blue-100 text-xs">7/10 Bikes Active</p>
          <div className="w-full bg-blue-700 rounded-full h-1.5 mt-2">
            <div className="bg-blue-300 h-1.5 rounded-full" style={{ width: '70%' }}></div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
