
import React from 'react';
import { Bike } from '../types';

interface FleetManagementProps {
  bikes: Bike[];
  setBikes: React.Dispatch<React.SetStateAction<Bike[]>>;
}

const FleetManagement: React.FC<FleetManagementProps> = ({ bikes, setBikes }) => {
  const toggleStatus = (id: string) => {
    setBikes(prev => prev.map(bike => {
      if (bike.id === id) {
        const nextStatus: Bike['status'] = bike.status === 'active' ? 'maintenance' : (bike.status === 'maintenance' ? 'idle' : 'active');
        return { ...bike, status: nextStatus };
      }
      return bike;
    }));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="px-6 py-4 text-sm font-semibold text-gray-600">Bike Details</th>
            <th className="px-6 py-4 text-sm font-semibold text-gray-600">Registration</th>
            <th className="px-6 py-4 text-sm font-semibold text-gray-600">Location</th>
            <th className="px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
            <th className="px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {bikes.map((bike) => (
            <tr key={bike.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4">
                <div className="font-medium text-gray-800">{bike.makeModel}</div>
                <div className="text-xs text-gray-500">Year: {bike.year} | {bike.dealer}</div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">{bike.licenseNumber}</td>
              <td className="px-6 py-4 text-sm text-gray-600">
                <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">{bike.city}</span>
              </td>
              <td className="px-6 py-4">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  bike.status === 'active' ? 'bg-green-100 text-green-700' :
                  bike.status === 'maintenance' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {bike.status}
                </span>
              </td>
              <td className="px-6 py-4">
                <button 
                  onClick={() => toggleStatus(bike.id)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Change Status
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FleetManagement;
