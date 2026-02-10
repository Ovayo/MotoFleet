
import React from 'react';
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
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color] || 'bg-gray-50'}`}>
          <span className="text-xl">{icon}</span>
        </div>
      </div>
      <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ bikes, drivers, payments, maintenance, weeklyTarget }) => {
  const totalRevenue = payments.reduce((acc, p) => acc + p.amount, 0);
  const totalExpenses = maintenance.reduce((acc, m) => acc + m.cost, 0);
  const netProfit = totalRevenue - totalExpenses;
  
  const weeklyData = [1, 2, 3, 4].map(week => ({
    name: `Week ${week}`,
    revenue: payments.filter(p => p.weekNumber === week).reduce((acc, p) => acc + p.amount, 0),
    target: bikes.length * weeklyTarget
  }));

  const bikeStatusData = [
    { name: 'Active', value: bikes.filter(b => b.status === 'active').length, color: '#10B981' },
    { name: 'Maintenance', value: bikes.filter(b => b.status === 'maintenance').length, color: '#EF4444' },
    { name: 'Idle', value: bikes.filter(b => b.status === 'idle').length, color: '#F59E0B' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Revenue" value={`R${totalRevenue.toLocaleString()}`} icon="💰" color="blue" />
        <StatCard title="Net Profit" value={`R${netProfit.toLocaleString()}`} icon="📈" color="green" />
        <StatCard title="Active Fleet" value={`${bikes.length} Bikes`} icon="🏍️" color="indigo" />
        <StatCard title="Total Expenses" value={`R${totalExpenses.toLocaleString()}`} icon="🔧" color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Revenue Performance vs Target</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend />
                <Bar dataKey="revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Actual Revenue" />
                <Bar dataKey="target" fill="#E2E8F0" radius={[4, 4, 0, 0]} name="Target" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Fleet Status Breakdown</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={bikeStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {bikeStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
