
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
  const [copied, setCopied] = useState(false);

  const totalRevenue = payments.reduce((acc, p) => acc + p.amount, 0);
  const totalExpenses = maintenance.reduce((acc, m) => acc + m.cost, 0);
  const netProfit = totalRevenue - totalExpenses;
  
  // Calculate overdue drivers
  const currentWeek = 4; // Assuming current week 4 for demo
  const overdueDrivers = useMemo(() => {
    return drivers.filter(driver => {
      const driverPayments = payments.filter(p => p.driverId === driver.id && p.weekNumber === currentWeek);
      const paidThisWeek = driverPayments.reduce((acc, p) => acc + p.amount, 0);
      return paidThisWeek < weeklyTarget;
    });
  }, [drivers, payments, weeklyTarget]);

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

  const handleCopyLink = () => {
    const url = new URL(window.location.origin);
    url.searchParams.set('portal', 'driver');
    navigator.clipboard.writeText(url.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendReminder = (driver: Driver) => {
    const message = `Hello ${driver.name}, this is a reminder from MotoFleet. Your rental payment of R${weeklyTarget} for Week ${currentWeek} is currently overdue. Please settle as soon as possible. Thank you!`;
    const encodedMsg = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${driver.contact.replace(/\s+/g, '')}?text=${encodedMsg}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Revenue" value={`R${totalRevenue.toLocaleString()}`} icon="💰" color="blue" />
        <StatCard title="Net Profit" value={`R${netProfit.toLocaleString()}`} icon="📈" color="green" />
        <StatCard title="Active Fleet" value={`${bikes.length} Bikes`} icon="🏍️" color="indigo" />
        <StatCard title="Total Expenses" value={`R${totalExpenses.toLocaleString()}`} icon="🔧" color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
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
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                   <span className="mr-2 text-red-500">🚨</span> Payment Alerts (Week {currentWeek})
                </h3>
                <span className="text-xs font-bold bg-red-100 text-red-600 px-2 py-1 rounded-full">{overdueDrivers.length} OVERDUE</span>
             </div>
             <div className="space-y-3">
               {overdueDrivers.length === 0 ? (
                 <p className="text-gray-400 text-sm text-center py-4">All accounts are up to date! 🎉</p>
               ) : (
                 overdueDrivers.map(driver => (
                   <div key={driver.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-red-200 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold">
                          {driver.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800 text-sm">{driver.name}</p>
                          <p className="text-xs text-gray-500">{driver.contact}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => sendReminder(driver)}
                        className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center shadow-sm"
                      >
                        <span className="mr-1">💬</span> Send Reminder
                      </button>
                   </div>
                 ))
               )}
             </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-6">Fleet Status Breakdown</h3>
            <div className="h-60">
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

          <div className="bg-gradient-to-br from-green-600 to-green-700 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-white/20 p-2 rounded-lg text-xl">📲</div>
              <h3 className="font-bold">Driver Portal</h3>
            </div>
            <p className="text-xs text-green-50 mb-6 leading-relaxed">
              Send this unique link to your drivers. They will only be able to see their own payments and bike status.
            </p>
            <button 
              onClick={handleCopyLink}
              className={`w-full py-3 rounded-lg font-bold transition-all flex items-center justify-center space-x-2 ${
                copied ? 'bg-white text-green-600' : 'bg-green-500 hover:bg-green-400 text-white'
              }`}
            >
              <span>{copied ? '✅ Link Copied!' : '🔗 Copy Driver Link'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
