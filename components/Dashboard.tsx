
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

  const overdueDrivers = useMemo(() => {
    return activeDrivers.filter(driver => {
      const driverPayments = payments.filter(p => p.driverId === driver.id && p.weekNumber === currentWeek);
      const paidThisWeek = driverPayments.reduce((acc, p) => acc + (p?.amount || 0), 0);
      const target = driver.weeklyTarget || weeklyTarget;
      return paidThisWeek < target;
    });
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
            <h3 className="text-sm font-black text-gray-800 uppercase tracking-tight mb-8">Collection Performance</h3>
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
        </div>

        <div className="space-y-6">
           <div className="bg-white p-8 rounded-2xl md:rounded-[3rem] shadow-sm border border-gray-100">
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
          </div>
          
          <div className="bg-red-600 p-8 rounded-[2rem] md:rounded-[3rem] shadow-xl text-white flex flex-col items-center justify-center text-center">
             <div className="text-4xl mb-4">⚠️</div>
             <h3 className="text-lg font-black uppercase tracking-tight mb-2">Ops Risk Status</h3>
             <p className="text-white text-2xl font-black">{overdueDrivers.length} OVERDUE</p>
             <p className="text-white/60 text-[10px] uppercase font-bold tracking-widest mt-1">Pending Fleet Settlements</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
