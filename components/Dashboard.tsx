import React, { useState, useMemo } from 'react';
import { Bike, Driver, Payment, MaintenanceRecord } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';

interface DashboardProps {
  bikes: Bike[];
  drivers: Driver[];
  payments: Payment[];
  maintenance: MaintenanceRecord[];
  weeklyTarget: number;
}

const StatCard = ({ title, value, icon, color }: { title: string, value: string, icon: string, color: string }) => {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    red: 'bg-red-50 text-red-600',
  };
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-2xl ${colorClasses[color] || 'bg-gray-50'}`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
      <h3 className="text-gray-400 text-[11px] font-black uppercase tracking-widest">{title}</h3>
      <p className="text-2xl font-black text-gray-800">{value}</p>
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ bikes, drivers, payments, maintenance, weeklyTarget }) => {
  const [driverLinkCopied, setDriverLinkCopied] = useState(false);

  const totalRevenue = payments.reduce((acc, p) => acc + p.amount, 0);
  const totalExpenses = maintenance.reduce((acc, m) => acc + m.cost, 0);
  const netProfit = totalRevenue - totalExpenses;
  
  const currentWeek = 4;
  
  const overdueDrivers = useMemo(() => {
    return drivers.filter(driver => {
      const driverPayments = payments.filter(p => p.driverId === driver.id && p.weekNumber === currentWeek);
      const paidThisWeek = driverPayments.reduce((acc, p) => acc + p.amount, 0);
      return paidThisWeek < weeklyTarget;
    });
  }, [drivers, payments, weeklyTarget]);

  const fleetAlerts = useMemo(() => {
    const alerts: { id: string; type: 'license' | 'service'; label: string; bike: Bike }[] = [];
    const now = new Date();

    bikes.forEach(bike => {
      // License Alerts
      if (bike.licenseDiskExpiry) {
        const expiry = new Date(bike.licenseDiskExpiry);
        if (expiry < now) {
          alerts.push({ id: `lic-${bike.id}`, type: 'license', label: 'Expired License', bike });
        } else if ((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24) < 14) {
          alerts.push({ id: `lic-soon-${bike.id}`, type: 'license', label: 'License Expiring', bike });
        }
      }

      // Maintenance Alerts
      const records = maintenance.filter(m => m.bikeId === bike.id && (m.serviceType === 'routine' || m.serviceType === 'oil'));
      if (records.length === 0) {
        alerts.push({ id: `serv-never-${bike.id}`, type: 'service', label: 'Service Never Logged', bike });
      } else {
        const latest = records.reduce((a, b) => new Date(a.date) > new Date(b.date) ? a : b);
        const diff = Math.floor((now.getTime() - new Date(latest.date).getTime()) / (1000 * 60 * 60 * 24));
        if (diff > 90) {
          alerts.push({ id: `serv-over-${bike.id}`, type: 'service', label: 'Service Overdue', bike });
        }
      }
    });

    return alerts;
  }, [bikes, maintenance]);

  const weeklyData = [1, 2, 3, 4].map(week => ({
    name: `Week ${week}`,
    revenue: payments.filter(p => p.weekNumber === week).reduce((acc, p) => acc + p.amount, 0),
    target: bikes.length * weeklyTarget
  }));

  const bikeStatusData = [
    { name: 'Active', value: bikes.filter(b => b.status === 'active').length, color: '#3B82F6' },
    { name: 'Maintenance', value: bikes.filter(b => b.status === 'maintenance').length, color: '#EF4444' },
    { name: 'Idle', value: bikes.filter(b => b.status === 'idle').length, color: '#94A3B8' },
  ];

  const handleCopyLink = () => {
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set('portal', 'driver');
    navigator.clipboard.writeText(url.toString());
    setDriverLinkCopied(true);
    setTimeout(() => setDriverLinkCopied(false), 2000);
  };

  const sendReminder = (driver: Driver) => {
    const message = `Hello ${driver.name}, this is a reminder from MotoFleet. Your rental payment for Week ${currentWeek} is currently overdue. Please settle as soon as possible. Thank you!`;
    const encodedMsg = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${driver.contact.replace(/\s+/g, '')}?text=${encodedMsg}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Monthly Revenue" value={`R${totalRevenue.toLocaleString()}`} icon="💰" color="blue" />
        <StatCard title="Profit/Loss" value={`R${netProfit.toLocaleString()}`} icon="📊" color="green" />
        <StatCard title="Active Fleet" value={`${bikes.length} Bikes`} icon="🏍️" color="indigo" />
        <StatCard title="Maintenance Cost" value={`R${totalExpenses.toLocaleString()}`} icon="🔧" color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Revenue Chart */}
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight">Revenue Performance</h3>
              <div className="flex items-center space-x-4">
                 <div className="flex items-center space-x-1.5"><span className="w-2 h-2 rounded-full bg-blue-500"></span><span className="text-[10px] font-bold text-gray-400 uppercase">Actual</span></div>
                 <div className="flex items-center space-x-1.5"><span className="w-2 h-2 rounded-full bg-gray-200"></span><span className="text-[10px] font-bold text-gray-400 uppercase">Target</span></div>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 'bold'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 'bold'}} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="revenue" fill="#3B82F6" radius={[6, 6, 0, 0]} name="Revenue" />
                  <Bar dataKey="target" fill="#F1F5F9" radius={[6, 6, 0, 0]} name="Target" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Payment Alerts */}
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-black text-gray-800 uppercase tracking-tight">Payment Alerts</h3>
                  <span className="text-[10px] font-black bg-red-100 text-red-600 px-2.5 py-1 rounded-full">{overdueDrivers.length} ARREARS</span>
               </div>
               <div className="space-y-4">
                 {overdueDrivers.length === 0 ? (
                   <p className="text-gray-400 text-xs text-center py-10 font-bold uppercase tracking-widest italic opacity-50">Zero Overdue Accounts 🎉</p>
                 ) : (
                   overdueDrivers.map(driver => {
                     // Calculate payStatus to fix the missing name error in line 162
                     const driverPayments = payments.filter(p => p.driverId === driver.id && p.weekNumber === currentWeek);
                     const paidThisWeek = driverPayments.reduce((acc, p) => acc + p.amount, 0);
                     const payStatus = paidThisWeek >= weeklyTarget ? 'paid' : 'overdue';

                     return (
                       <div key={driver.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-red-200 transition-all">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black overflow-hidden ${payStatus === 'paid' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                              {driver.profilePictureUrl ? (
                                <img src={driver.profilePictureUrl} alt={driver.name} className="w-full h-full object-cover" />
                              ) : (
                                driver.name.charAt(0)
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-gray-800 text-xs">{driver.name}</p>
                              <p className="text-[10px] text-gray-400 font-bold">{driver.contact}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => sendReminder(driver)}
                            className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center hover:bg-green-600 hover:text-white transition-all shadow-sm"
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

            {/* Fleet Health Alerts */}
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-black text-gray-800 uppercase tracking-tight">Fleet Health</h3>
                  <span className="text-[10px] font-black bg-orange-100 text-orange-600 px-2.5 py-1 rounded-full">{fleetAlerts.length} WARNINGS</span>
               </div>
               <div className="space-y-4">
                 {fleetAlerts.length === 0 ? (
                   <p className="text-gray-400 text-xs text-center py-10 font-bold uppercase tracking-widest italic opacity-50">Fleet Fully Compliant 🏍️</p>
                 ) : (
                   fleetAlerts.slice(0, 4).map(alert => (
                     <div key={alert.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-orange-200 transition-all">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${alert.type === 'license' ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'}`}>
                            {alert.type === 'license' ? '📜' : '🔧'}
                          </div>
                          <div>
                            <p className="font-bold text-gray-800 text-xs">{alert.bike.licenseNumber}</p>
                            <p className={`text-[9px] font-black uppercase ${alert.type === 'license' ? 'text-orange-500' : 'text-red-500'}`}>{alert.label}</p>
                          </div>
                        </div>
                     </div>
                   ))
                 )}
               </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Live Tracking Status */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden group">
             <div className="absolute top-[-20px] right-[-20px] text-9xl opacity-10 pointer-events-none transition-transform group-hover:rotate-12 duration-500">📍</div>
             <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                   <div className="bg-white/20 p-3 rounded-2xl text-2xl">🛰️</div>
                   <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">Live Tracking</span>
                </div>
                <h3 className="text-xl font-black mb-1 uppercase tracking-tight">MotoTrack Dashboard</h3>
                <p className="text-blue-100 text-xs mb-8 opacity-80 font-medium">Monitoring movement and ignition states.</p>
                
                <div className="grid grid-cols-2 gap-6 mb-8">
                   <div>
                      <p className="text-4xl font-black">{bikes.filter(b => b.tracker?.status === 'moving').length}</p>
                      <p className="text-[9px] font-black uppercase opacity-60 tracking-widest">In Motion</p>
                   </div>
                   <div className="border-l border-white/20 pl-6">
                      <p className="text-4xl font-black">{bikes.length}</p>
                      <p className="text-[9px] font-black uppercase opacity-60 tracking-widest">Tracked Units</p>
                   </div>
                </div>
                <button className="w-full py-4 bg-white text-blue-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-50 transition-all shadow-lg shadow-blue-900/20 active:scale-95">
                   Enter Tracking Portal
                </button>
             </div>
          </div>

          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
            <h3 className="text-sm font-black text-gray-800 uppercase tracking-tight mb-8 text-center">Operational Breakdown</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={bikeStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {bikeStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none' }} />
                  <Legend verticalAlign="bottom" align="center" iconType="circle" iconSize={8} formatter={(value) => <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Access Portal */}
          <div className="bg-gradient-to-br from-green-600 to-emerald-700 p-8 rounded-[2rem] shadow-lg text-white">
            <div className="flex items-center space-x-4 mb-6">
              <div className="bg-white/20 p-3 rounded-2xl text-2xl">👤</div>
              <div>
                <h3 className="font-black uppercase tracking-tight text-sm">Driver Terminal</h3>
                <p className="text-green-100 text-[10px] font-bold opacity-80 uppercase tracking-widest">Secure Profile Access</p>
              </div>
            </div>
            <button onClick={handleCopyLink} className="w-full py-4 rounded-2xl font-black text-[10px] bg-green-500 hover:bg-green-400 text-white shadow-xl uppercase tracking-widest transition-all active:scale-95">
              {driverLinkCopied ? '✅ Link Secured' : '🔗 Copy Access Link'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;