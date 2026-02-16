
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
    amber: 'bg-amber-50 text-amber-600',
  };
  return (
    <div className="bg-white p-5 md:p-6 rounded-2xl md:rounded-[2rem] shadow-sm border border-gray-100 flex items-center space-x-4">
      <div className={`p-3.5 rounded-xl md:rounded-2xl ${colorClasses[color] || 'bg-gray-50'} shrink-0`}>
        <span className="text-xl md:text-2xl">{icon}</span>
      </div>
      <div>
        <h3 className="text-gray-400 text-[9px] md:text-[11px] font-black uppercase tracking-widest">{title}</h3>
        <p className="text-lg md:text-2xl font-black text-gray-800 leading-none mt-1">{value}</p>
      </div>
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ bikes, drivers, payments, maintenance, weeklyTarget }) => {
  const totalRevenue = payments.reduce((acc, p) => acc + p.amount, 0);
  const totalExpenses = maintenance.reduce((acc, m) => acc + m.cost, 0);
  const netProfit = totalRevenue - totalExpenses;
  const currentWeek = 4;
  
  const activeDrivers = useMemo(() => drivers.filter(d => !d.isArchived), [drivers]);

  const leaderboardData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return activeDrivers.map(driver => {
      const monthPayments = payments.filter(p => {
        const d = new Date(p.date);
        return p.driverId === driver.id && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });
      const totalPaid = monthPayments.reduce((sum, p) => sum + p.amount, 0);
      const monthlyTarget = (driver.weeklyTarget || weeklyTarget) * 4; // Simplified 4-week basis
      const performance = Math.round((totalPaid / monthlyTarget) * 100);
      
      return {
        id: driver.id,
        name: driver.name,
        performance,
        totalPaid,
        initials: driver.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
        pic: driver.profilePictureUrl
      };
    }).sort((a, b) => b.performance - a.performance);
  }, [activeDrivers, payments, weeklyTarget]);

  const bikeStatusData = [
    { name: 'Active', value: bikes.filter(b => b.status === 'active').length, color: '#3B82F6' },
    { name: 'Workshop', value: bikes.filter(b => b.status === 'maintenance').length, color: '#EF4444' },
    { name: 'Idle', value: bikes.filter(b => b.status === 'idle').length, color: '#94A3B8' },
  ];

  const weeklyData = [1, 2, 3, 4].map(week => {
    const weekPayments = payments.filter(p => p.weekNumber === week);
    const revenue = weekPayments.reduce((acc, p) => acc + p.amount, 0);
    const target = activeDrivers.reduce((acc, d) => acc + (d.weeklyTarget || weeklyTarget), 0);
    return { name: `W${week}`, revenue, target };
  });

  return (
    <div className="space-y-6 md:space-y-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard title="Total Operator Payments" value={`R${totalRevenue.toLocaleString()}`} icon="💰" color="blue" />
        <StatCard title="Net Profit" value={`R${netProfit.toLocaleString()}`} icon="📊" color="green" />
        <StatCard title="Fleet Strength" value={`${bikes.length} Units`} icon="🏍️" color="indigo" />
        <StatCard title="Active Maintenance" value={`R${totalExpenses.toLocaleString()}`} icon="🔧" color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10">
        <div className="lg:col-span-2 space-y-6 md:space-y-10">
          <div className="bg-white p-5 md:p-10 rounded-2xl md:rounded-[3rem] shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-sm font-black text-gray-800 uppercase tracking-tight">Collection Performance</h3>
              <div className="bg-indigo-50 px-4 py-1.5 rounded-full border border-indigo-100 animate-pulse">
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Fleet Rhythm Active</span>
              </div>
            </div>
            <div className="h-64 md:h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Actual Collected" />
                  <Bar dataKey="target" fill="#F1F5F9" radius={[4, 4, 0, 0]} name="Fleet Target" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Fleet Leaderboard */}
          <div className="bg-gray-900 p-8 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full"></div>
            <div className="relative z-10">
               <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-tight">Fleet Elite Leaderboard</h3>
                    <p className="text-blue-400 text-[9px] font-black uppercase tracking-[0.3em] mt-1">Monthly Payment Performance Rank</p>
                  </div>
                  <span className="text-2xl">🏆</span>
               </div>
               
               <div className="space-y-4">
                  {leaderboardData.slice(0, 5).map((entry, index) => (
                    <div key={entry.id} className="bg-white/5 border border-white/5 hover:bg-white/10 p-4 rounded-2xl flex items-center justify-between transition-all group">
                       <div className="flex items-center space-x-4">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${index === 0 ? 'bg-amber-400 text-black' : index === 1 ? 'bg-gray-300 text-black' : index === 2 ? 'bg-orange-400 text-black' : 'bg-white/10 text-white/40'}`}>
                            {index + 1}
                          </div>
                          <div className="w-10 h-10 rounded-xl bg-white/10 overflow-hidden flex items-center justify-center font-black text-[10px] text-white/40 border border-white/10">
                            {entry.pic ? <img src={entry.pic} className="w-full h-full object-cover" /> : entry.initials}
                          </div>
                          <div>
                            <p className="text-sm font-black uppercase tracking-tight group-hover:text-blue-400 transition-colors">{entry.name}</p>
                            <p className="text-[8px] font-bold text-white/30 uppercase tracking-widest">R{entry.totalPaid.toLocaleString()} Settled</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className={`text-lg font-black ${entry.performance >= 100 ? 'text-emerald-400' : entry.performance >= 80 ? 'text-blue-400' : 'text-red-400'}`}>
                            {entry.performance}%
                          </p>
                          <div className="w-20 bg-white/5 h-1 rounded-full mt-1 overflow-hidden">
                             <div className={`h-full ${entry.performance >= 100 ? 'bg-emerald-400' : entry.performance >= 80 ? 'bg-blue-400' : 'bg-red-400'}`} style={{ width: `${Math.min(100, entry.performance)}%` }}></div>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
               
               {leaderboardData.length > 5 && (
                 <p className="text-center mt-6 text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Viewing Top 5 of {leaderboardData.length} Operators</p>
               )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
           <div className="bg-white p-8 rounded-2xl md:rounded-[3rem] shadow-sm border border-gray-100 h-full">
            <h3 className="text-[11px] font-black text-gray-800 uppercase tracking-tight mb-8 text-center">Asset Distribution</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={bikeStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={10} dataKey="value">
                    {bikeStatusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Legend verticalAlign="bottom" align="center" iconSize={8} formatter={(val) => <span className="text-[10px] font-black text-gray-400 uppercase ml-2">{val}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-10 space-y-3 pt-6 border-t border-gray-50">
               <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest text-center mb-4">Operational Status Alerts</p>
               {bikes.filter(b => b.status === 'maintenance').slice(0, 3).map(b => (
                 <div key={b.id} className="flex items-center space-x-3 p-3 bg-red-50 rounded-xl border border-red-100">
                    <span className="text-xs">🔧</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] font-black text-red-700 uppercase truncate">{b.licenseNumber}</p>
                      <p className="text-[7px] font-bold text-red-400 uppercase">In Workshop</p>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
