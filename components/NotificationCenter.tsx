
import React, { useMemo } from 'react';
import { AutomatedNotification, Driver, Bike } from '../types';

interface NotificationCenterProps {
  notifications: AutomatedNotification[];
  drivers: Driver[];
  bikes: Bike[];
  onTriggerAutomations: () => void;
  onClearNotifications: () => void;
  isSyncing: boolean;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ 
  notifications, 
  drivers, 
  bikes, 
  onTriggerAutomations, 
  onClearNotifications,
  isSyncing 
}) => {
  const activeNotifications = useMemo(() => {
    return notifications.filter(notif => {
      const driver = drivers.find(d => d.id === notif.recipientId);
      return driver && !driver.isArchived;
    });
  }, [notifications, drivers]);

  return (
    <div className="space-y-10 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 bg-white/70 backdrop-blur-3xl p-10 rounded-[4rem] border border-white/60 shadow-sm">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase leading-none">Comms Grid</h2>
          <p className="text-[11px] text-gray-400 font-black uppercase tracking-[0.3em] mt-3">Automated Logistics Notification Protocols</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button 
            onClick={onClearNotifications}
            className="px-8 py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.2em] transition-all border border-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500"
          >
            Purge Logs
          </button>
          <button 
            onClick={onTriggerAutomations}
            disabled={isSyncing}
            className="flex-1 bg-blue-600 text-white px-10 py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.25em] shadow-2xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center space-x-3"
          >
            {isSyncing ? 'Scanning Grid...' : 'Run Grid Sync'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { l: 'Pending dispatch', v: activeNotifications.filter(n => n.status === 'queued').length, c: 'amber' },
          { l: 'Confirmed Deliveries', v: activeNotifications.filter(n => n.status === 'sent').length, c: 'green' },
          { l: 'System Health', v: 'Optimum', c: 'blue' }
        ].map((stat, i) => (
          <div key={i} className="bg-white/80 backdrop-blur-2xl p-8 rounded-[3rem] border border-white/60 text-center shadow-sm">
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-1">{stat.l}</p>
             <h4 className={`text-3xl font-black text-${stat.c}-500 tracking-tighter`}>{stat.v}</h4>
          </div>
        ))}
      </div>

      <div className="bg-white/80 backdrop-blur-3xl rounded-[4rem] border border-white/60 shadow-sm overflow-hidden">
        <div className="p-10 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.3em]">Protocol Log</h3>
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{activeNotifications.length} Active Events</span>
        </div>
        <div className="divide-y divide-gray-50">
          {activeNotifications.length === 0 ? (
            <div className="py-32 text-center opacity-40">
               <p className="text-[10px] font-black uppercase tracking-[0.3em]">Communications Grid Idle — Awaiting Trigger</p>
            </div>
          ) : (
            activeNotifications.map(notif => {
              const driver = drivers.find(d => d.id === notif.recipientId);
              return (
                <div key={notif.id} className="p-8 md:p-10 flex items-center justify-between hover:bg-gray-50/50 transition-colors group">
                  <div className="flex items-center space-x-8">
                    <div className="w-16 h-16 rounded-[2rem] bg-gray-900 text-white flex items-center justify-center text-2xl shadow-2xl group-hover:rotate-12 transition-transform">📡</div>
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-black text-gray-900 text-xl uppercase tracking-tighter leading-none">{driver?.name}</h4>
                        <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-500 border border-blue-100">Arrears Alert</span>
                      </div>
                      <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">{new Date(notif.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {}}
                    className="w-14 h-14 bg-green-500 text-white rounded-[1.5rem] shadow-xl shadow-green-100 hover:scale-110 transition-all flex items-center justify-center text-2xl"
                  >
                    💬
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;
