
import React, { useState } from 'react';
import { Driver, Bike } from '../types';

interface DriverManagementProps {
  drivers: Driver[];
  setDrivers: React.Dispatch<React.SetStateAction<Driver[]>>;
  bikes: Bike[];
}

const DriverManagement: React.FC<DriverManagementProps> = ({ drivers, setDrivers, bikes }) => {
  const [editingDriverId, setEditingDriverId] = useState<string | null>(null);
  const [isAddingDriver, setIsAddingDriver] = useState(false);
  const [formData, setFormData] = useState<Omit<Driver, 'id'>>({
    name: '',
    contact: '',
    nationality: '',
    address: '',
    idNumber: '',
    driverCode: '',
    city: ''
  });

  const handleEditClick = (driver: Driver) => {
    setEditingDriverId(driver.id);
    setFormData({
      name: driver.name,
      contact: driver.contact,
      nationality: driver.nationality,
      address: driver.address,
      idNumber: driver.idNumber,
      driverCode: driver.driverCode,
      city: driver.city
    });
    setIsAddingDriver(false);
  };

  const handleAddClick = () => {
    setEditingDriverId(null);
    setFormData({
      name: '',
      contact: '',
      nationality: '',
      address: '',
      idNumber: '',
      driverCode: '',
      city: ''
    });
    setIsAddingDriver(true);
  };

  const handleCancel = () => {
    setEditingDriverId(null);
    setIsAddingDriver(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDriverId) {
      setDrivers(prev => prev.map(d => d.id === editingDriverId ? { ...formData, id: editingDriverId } : d));
      setEditingDriverId(null);
    } else if (isAddingDriver) {
      const newDriver: Driver = {
        ...formData,
        id: `d-${Date.now()}`
      };
      setDrivers(prev => [...prev, newDriver]);
      setIsAddingDriver(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Fix: Add optional key prop to the props definition to resolve list rendering TS error
  const DriverForm = ({ title }: { title: string, key?: string }) => (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-md border border-blue-100 col-span-full mb-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label>
          <input name="name" value={formData.name} onChange={handleInputChange} required className="w-full border-gray-200 rounded-lg p-2 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Contact Number</label>
          <input name="contact" value={formData.contact} onChange={handleInputChange} required className="w-full border-gray-200 rounded-lg p-2 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Driver Code</label>
          <input name="driverCode" value={formData.driverCode} onChange={handleInputChange} required className="w-full border-gray-200 rounded-lg p-2 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nationality</label>
          <input name="nationality" value={formData.nationality} onChange={handleInputChange} required className="w-full border-gray-200 rounded-lg p-2 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">ID Number</label>
          <input name="idNumber" value={formData.idNumber} onChange={handleInputChange} required className="w-full border-gray-200 rounded-lg p-2 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">City</label>
          <input name="city" value={formData.city} onChange={handleInputChange} required className="w-full border-gray-200 rounded-lg p-2 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <div className="md:col-span-2 lg:col-span-3">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Address</label>
          <input name="address" value={formData.address} onChange={handleInputChange} required className="w-full border-gray-200 rounded-lg p-2 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
      </div>
      <div className="flex justify-end space-x-3 mt-6">
        <button type="button" onClick={handleCancel} className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium">Cancel</button>
        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors">Save Driver</button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Fleet Drivers</h2>
        <button 
          onClick={handleAddClick}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
        >
          + Add Driver
        </button>
      </div>

      {isAddingDriver && <DriverForm title="Register New Driver" />}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {drivers.map(driver => {
          const assignedBike = bikes.find(b => b.assignedDriverId === driver.id);
          const isEditing = editingDriverId === driver.id;

          if (isEditing) {
            return <DriverForm key={driver.id} title={`Edit ${driver.name}`} />;
          }

          return (
            <div key={driver.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 group relative">
              <button 
                onClick={() => handleEditClick(driver)}
                className="absolute top-4 right-4 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity hover:underline text-sm font-medium"
              >
                Edit
              </button>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">{driver.name}</h3>
                  <p className="text-sm text-gray-500">{driver.driverCode}</p>
                </div>
                <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-bold uppercase">
                  {driver.nationality}
                </span>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-gray-600">
                  <span className="w-6 text-lg">📞</span>
                  <span>{driver.contact}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="w-6 text-lg">📍</span>
                  <span>{driver.address}, {driver.city}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="w-6 text-lg">🪪</span>
                  <span>ID: {driver.idNumber}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-50">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Assigned Vehicle</div>
                {assignedBike ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{assignedBike.makeModel}</span>
                    <span className="text-xs text-gray-500 font-mono">{assignedBike.licenseNumber}</span>
                  </div>
                ) : (
                  <span className="text-sm text-red-400 italic">No bike assigned</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DriverManagement;
