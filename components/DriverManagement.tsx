
import React from 'react';
import { Driver, Bike } from '../types';

interface DriverManagementProps {
  drivers: Driver[];
  bikes: Bike[];
}

const DriverManagement: React.FC<DriverManagementProps> = ({ drivers, bikes }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {drivers.map(driver => {
        const assignedBike = bikes.find(b => b.assignedDriverId === driver.id);
        return (
          <div key={driver.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
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
  );
};

export default DriverManagement;
