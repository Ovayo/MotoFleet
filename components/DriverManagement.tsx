
import React, { useState } from 'react';
import { Driver, Bike, Payment } from '../types';

interface DriverManagementProps {
  drivers: Driver[];
  setDrivers: React.Dispatch<React.SetStateAction<Driver[]>>;
  bikes: Bike[];
  payments: Payment[];
  weeklyTarget: number;
}

const DriverManagement: React.FC<DriverManagementProps> = ({ drivers, setDrivers, bikes, payments, weeklyTarget }) => {
  const [editingDriverId, setEditingDriverId] = useState<string | null>(null);
  const [isAddingDriver, setIsAddingDriver] = useState(false);
  const [formData, setFormData] = useState<Omit<Driver, 'id'>>({
    name: '',
    contact: '',
    nationality: '',
    address: '',
    idNumber: '',
    driverCode: '',
    city: '',
    notes: ''
  });

  const getPaymentStatus = (driverId: string) => {
    const currentWeek = 4;
    const paid = payments
      .filter(p => p.driverId === driverId && p.weekNumber === currentWeek)
      .reduce((sum, p) => sum + p.amount, 0);
    return paid >= weeklyTarget ? 'paid' : 'overdue';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDriverId) {
      setDrivers(prev => prev.map(d => d.id === editingDriverId ? { ...formData, id: editingDriverId } : d));
      setEditingDriverId(null);
    } else if (isAddingDriver) {
      const newDriver: Driver = { ...formData, id: `d-${Date.now()}` };
      setDrivers(prev => [...prev, newDriver]);
      setIsAddingDriver(false);
    }
  };

  const sendReminder = (driver: Driver) => {
    const message = `Hello ${driver.name}, your account is currently being reviewed. Please ensure your R${weeklyTarget} weekly rental is up to date.`;
    const encodedMsg = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${driver.contact.replace(/\s+/g, '')}?text=${encodedMsg}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Fleet Drivers</h2>
        <button 
          onClick={() => setIsAddingDriver(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          + Add Driver
        </button>
      </div>

      {(isAddingDriver || editingDriverId) && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-md border border-blue-100">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <input name="name" value={formData.name} onChange={handleInputChange} required className="border-gray-200 rounded-lg p-2 bg-gray-50" placeholder="Full Name" />
            <input name="contact" value={formData.contact} onChange={handleInputChange} required className="border-gray-200 rounded-lg p-2 bg-gray-50" placeholder="Contact Number" />
            <input name="driverCode" value={formData.driverCode} onChange={handleInputChange} required className="border-gray-200 rounded-lg p-2 bg-gray-50" placeholder="Driver Code" />
            <div className="flex space-x-2">
              <button type="submit" className="flex-1 bg-blue-600 text-white rounded-lg font-bold">Save</button>
              <button type="button" onClick={() => { setIsAddingDriver(false); setEditingDriverId(null); }} className="px-4 bg-gray-200 rounded-lg font-bold">Cancel</button>
            </div>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {drivers.map(driver => {
          const assignedBike = bikes.find(b => b.assignedDriverId === driver.id);
          const status = getPaymentStatus(driver.id);

          return (
            <div key={driver.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 group relative">
              <button 
                onClick={() => { setEditingDriverId(driver.id); setFormData(driver); }}
                className="absolute top-4 right-4 text-blue-500 opacity-0 group-hover:opacity-100 text-xs font-bold"
              >
                Edit
              </button>
              <div className="flex items-center space-x-3 mb-4">
                <div 
                  className={`w-3 h-3 rounded-full animate-pulse ${status === 'paid' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'}`}
                  title={status === 'paid' ? 'Paid' : 'Overdue'}
                ></div>
                <div>
                  <h3 className="font-bold text-gray-800 text-lg leading-tight">{driver.name}</h3>
                  <p className="text-sm text-gray-500">{driver.driverCode}</p>
                </div>
              </div>
              
              <div className="space-y-2 mb-6 text-sm text-gray-600">
                <p>📞 {driver.contact}</p>
                <p>📍 {driver.address}</p>
                {assignedBike ? (
                  <p className="text-blue-600 font-bold">🏍️ {assignedBike.licenseNumber}</p>
                ) : (
                  <p className="text-gray-400 italic">No bike assigned</p>
                )}
              </div>

              <button 
                onClick={() => sendReminder(driver)}
                className="w-full bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2 rounded-lg transition-colors"
              >
                Send WhatsApp Reminder
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DriverManagement;
