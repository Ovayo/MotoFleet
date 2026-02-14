
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
  // Only display notifications for active drivers
  const activeNotifications = useMemo(() => {
    return notifications.filter(notif => {
      const driver = drivers.find(d => d.id === notif.recipientId);
      return driver && !driver.isArchived;
    });
  }, [notifications, drivers]);

  // Normalization helper for WhatsApp links
  const formatForWhatsApp = (phone: string) => {
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '27' + cleaned.substring(1);
    }
    return cleaned;
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Logistics Comms Hub</h2>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Automated WhatsApp & System Triggers</p>
        </div>
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <button 
            onClick={onClearNotifications}
            disabled={notifications.length === 0 || isSyncing}
            className="flex-1 md:flex-none px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all border border-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500 hover:border-red-100 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400"
          >
            Clear Comms Logs
          </button>
          <button 
            onClick={onTriggerAutomations}
            disabled={isSyncing}
            className={`flex-[2] md:flex-none bg-blue-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center space-x-3 ${isSyncing ? 'opacity-50' : 'hover:bg-blue-700'}`}
          >
            {isSyncing ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <span>🚀</span>
            )}
            <span>Run Automation Scan</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm text-center">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Queue Status</p>
          <h4 className="text-2xl font-black text-gray-800">{activeNotifications.filter(n => n.status === 'queued').length} Pending</h4>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm text-center">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Delivery Success</p>
          <h4 className="text-2xl font-black text-green-600">{activeNotifications.filter(n => n.status === 'sent').length} Dispatched</h4>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm text-center">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Last Sync</p>
          <h4 className="text-2xl font-black text-blue-600">Live Telemetry</h4>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
          <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Automation Audit Log</h3>
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Showing last {activeNotifications.length} active events</span>
        </div>
        <div className="divide-y divide-gray-50">
          {activeNotifications.length === 0 ? (
            <div className="py-24 text-center">
               <div className="text-4xl mb-4 text-gray-200">📡</div>
               <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">No active communication logs recorded.</p>
               <button 
                onClick={onTriggerAutomations}
                className="mt-4 text-blue-500 font-black text-[9px] uppercase tracking-widest hover:underline"
               >
                Initiate first scan
               </button>
            </div>
          ) : (
            activeNotifications.map(notif => {
              const driver = drivers.find(d => d.id === notif.recipientId);
              return (
                <div key={notif.id} className="p-6 md:p-8 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center space-x-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm ${
                      notif.type === 'arrears' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                    }`}>
                      {notif.type === 'arrears' ? '💸' : '📜'}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-black text-gray-800 text-sm uppercase tracking-tight">{driver?.name || 'Unknown Recipient'}</h4>
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${notif.status === 'sent' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                          {notif.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 max-w-md line-clamp-1 italic">"{notif.message}"</p>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1.5">{new Date(notif.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      const msg = encodeURIComponent(notif.message);
                      const normalizedPhone = formatForWhatsApp(driver?.contact || '');
                      window.open(`https://wa.me/${normalizedPhone}?text=${msg}`, '_blank');
                    }}
                    className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl hover:bg-green-600 hover:text-white transition-all shadow-sm flex items-center justify-center text-xl"
                    title="Send WhatsApp Reminder"
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
