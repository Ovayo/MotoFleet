
import React, { useMemo } from 'react';
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

const StatCard = ({ title, value, icon, color, subtitle }: { title: string, value: string, icon: string, color: string, subtitle?: string }) => {
  const colorMap: Record<string, string> = {
    blue: 'text-blue-600',
    green: 'text-emerald-600',
    indigo: 'text-indigo-600',
    red: 'text-red-600',
    amber: 'text-amber-500',
  };
  
  return (
    <div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-2xl p-8 rounded-[3rem] shadow-sm border border-white/60 dark:border-white/5 flex items-center justify-between group hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 relative overflow-hidden">
      <div className="relative z-10">
        <h3 className="text-gray-400 dark:text-white/30 text-[10px] font-black uppercase tracking-[0.3em] mb-3">{title}</h3>
        <p className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white leading-none tracking-tighter">{value}</p>
        {subtitle && <p className="text-[9px] font-black text-blue-500 dark:text-blue-400 uppercase tracking-widest mt-2">{subtitle}</p>}
      </div>
      <div className={`w-16 h-16 rounded-[1.8rem] flex items-center justify-center text-3xl shadow-inner border border-gray-50 dark:border-white/5 transition-transform group-hover:scale-110 duration-500 ${colorMap[color]} bg-white dark:bg-gray-800`}>
        {icon}
      </div>
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ bikes, drivers, payments, maintenance, weeklyTarget }) => {
  const totalPaidByOperators = useMemo(() => payments.reduce((acc, p) => acc + p.amount, 0), [payments]);
  const totalExpenses = useMemo(() => maintenance.reduce((acc, m) => acc + m.cost, 0), [maintenance]);
  const netProfit = totalPaidByOperators - totalExpenses;
  const currentWeek = 4;
  
  const activeDrivers = useMemo(() => drivers.filter(d => !d.isArchived), [drivers]);

  const overdueDrivers = useMemo(() => {
    return activeDrivers.filter(driver => {
      const driverPayments = payments.filter(p => p.driverId === driver.id && p.weekNumber === currentWeek);
      const paidThisWeek = driverPayments.reduce((acc, p) => acc + (p?.amount || 0), 0);
      const target = driver.weeklyTarget || weeklyTarget;
      return paidThisWeek < target;
    });
  }, [activeDrivers, payments, weeklyTarget]);

  const weeklyData = [1, 2, 3, 4].map(week => {
    const weekPayments = payments.filter(p => p.weekNumber === week);
    const revenue = weekPayments.reduce((acc, p) => acc + p.amount, 0);
    const target = activeDrivers.reduce((acc, d) => acc + (d.weeklyTarget || weeklyTarget), 0);
    return { name: `WEEK ${week}`, revenue, target };
  });

  const bikeStatusData = [
    { name: 'DEPLOYED', value: bikes.filter(b => b.status === 'active').length, color: '#3B82F6' },
    { name: 'WORKSHOP', value: bikes.filter(b => b.status === 'maintenance').length, color: '#EF4444' },
    { name: 'IDLE', value: bikes.filter(b => b.status === 'idle').length, color: '#94A3B8' },
  ];

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Operator Payments" value={`R${totalPaidByOperators.toLocaleString()}`} icon="💰" color="blue" subtitle="Gross Revenue" />
        <StatCard title="Net Fleet Yield" value={`R${netProfit.toLocaleString()}`} icon="📊" color="green" subtitle="Post-Maintenance" />
        <StatCard title="Grid Strength" value={`${bikes.length} UNITS`} icon="🏍️" color="indigo" subtitle="Active Assets" />
        <StatCard title="Tech Expenses" value={`R${totalExpenses.toLocaleString()}`} icon="🔧" color="red" subtitle="Workshop Burn" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        <div className="xl:col-span-2 space-y-10">
          <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-3xl p-10 rounded-[4rem] shadow-sm border border-white/60 dark:border-white/5">
            <div className="flex justify-between items-center mb-10">
               <h3 className="text-xs font-black text-gray-900 dark:text-white/80 uppercase tracking-[0.4em]">Revenue Telemetry</h3>
               <span className="text-[9px] font-bold text-blue-500 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-400/10 px-3 py-1 rounded-full border border-blue-100/50 dark:border-blue-400/20">Fiscal Velocity</span>
            </div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.1)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 'bold', fill: '#94A3B8'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 'bold', fill: '#94A3B8'}} />
                  <Tooltip 
                    cursor={{fill: 'rgba(148, 163, 184, 0.05)'}} 
                    contentStyle={{ 
                      borderRadius: '24px', 
                      border: 'none', 
                      boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.5)', 
                      backdropFilter: 'blur(16px)', 
                      background: 'rgba(0,0,0,0.8)',
                      color: '#fff'
                    }} 
                  />
                  <Bar dataKey="revenue" fill="#3B82F6" radius={[6, 6, 0, 0]} name="Actual Paid" />
                  <Bar dataKey="target" fill="rgba(148, 163, 184, 0.1)" radius={[6, 6, 0, 0]} name="Expected Target" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-3xl p-10 rounded-[3.5rem] shadow-sm border border-white/60 dark:border-white/5">
               <div className="flex justify-between items-center mb-8">
                  <h3 className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-[0.3em]">Critical Arrears (Week 4)</h3>
                  <div className="w-8 h-8 bg-red-50 dark:bg-red-400/10 rounded-full flex items-center justify-center text-red-500 dark:text-red-400 font-black text-[10px] border border-red-100 dark:border-red-400/20">{overdueDrivers.length}</div>
               </div>
               <div className="space-y-4">
                 {overdueDrivers.slice(0, 4).map(driver => (
                   <div key={driver.id} className="flex items-center justify-between p-5 bg-white/50 dark:bg-white/5 rounded-[2rem] border border-white/60 dark:border-white/5 hover:shadow-xl transition-all duration-500 group">
                      <div className="flex items-center space-x-4 min-w-0">
                        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-white/20 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 overflow-hidden border border-white dark:border-white/10 group-hover:scale-110 transition-transform">
                          {driver.profilePictureUrl ? <img src={driver.profilePictureUrl} className="w-full h-full object-cover" /> : driver.name[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-gray-900 dark:text-white text-xs uppercase tracking-tight truncate leading-none">{driver.name}</p>
                          <p className="text-[9px] text-gray-400 dark:text-white/30 font-bold uppercase tracking-widest mt-1.5">{driver.city}</p>
                        </div>
                      </div>
                      <div className="text-right">
                         <span className="text-[10px] font-black text-red-500 dark:text-red-400 uppercase tracking-widest">Deficit</span>
                      </div>
                   </div>
                 ))}
                 {overdueDrivers.length === 0 && (
                   <div className="py-20 text-center opacity-40 grayscale">
                     <p className="text-[10px] font-black uppercase tracking-[0.4em] dark:text-white">Zero Latency Status ✨</p>
                   </div>
                 )}
               </div>
            </div>

            <div className="bg-gray-900 p-10 rounded-[3.5rem] shadow-2xl text-white relative overflow-hidden group border border-white/5">
               <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
               <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-8">Operator Dynamics</h3>
               <div className="space-y-6">
                  <div className="flex items-end justify-between">
                     <div>
                       <p className="text-5xl font-black text-white">{activeDrivers.length}</p>
                       <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] mt-2">Active Logistics Pilots</p>
                     </div>
                     <span className="text-4xl opacity-20">👥</span>
                  </div>
                  <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                     <div className="bg-blue-500 h-full w-[85%]"></div>
                  </div>
               </div>
            </div>
          </div>
        </div>

        <div className="space-y-10">
          <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-3xl p-10 rounded-[3.5rem] shadow-sm border border-white/60 dark:border-white/5">
            <h3 className="text-[10px] font-black text-gray-900 dark:text-white/80 uppercase tracking-[0.3em] mb-10 text-center">Asset Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={bikeStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={8} dataKey="value">
                    {bikeStatusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Legend verticalAlign="bottom" align="center" iconSize={8} formatter={(val) => <span className="text-[9px] font-black text-gray-400 dark:text-white/30 uppercase tracking-widest ml-3">{val}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
