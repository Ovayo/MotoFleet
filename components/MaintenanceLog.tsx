
import React, { useState } from 'react';
import { Bike, MaintenanceRecord } from '../types';

interface MaintenanceLogProps {
  bikes: Bike[];
  maintenance: MaintenanceRecord[];
  onAddMaintenance: (record: Omit<MaintenanceRecord, 'id'>) => void;
}

const MaintenanceLog: React.FC<MaintenanceLogProps> = ({ bikes, maintenance, onAddMaintenance }) => {
  const [showForm, setShowForm] = useState(false);
  const [newRecord, setNewRecord] = useState({
    bikeId: bikes[0]?.id || '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    cost: 0,
    serviceType: 'repair' as MaintenanceRecord['serviceType']
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddMaintenance(newRecord);
    setShowForm(false);
    setNewRecord({ ...newRecord, description: '', cost: 0 });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Maintenance History</h2>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors shadow-sm font-medium"
        >
          {showForm ? 'Cancel' : '+ Log Service'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-md border border-red-100">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Bike</label>
              <select 
                className="w-full border-gray-200 rounded-lg p-2 bg-gray-50"
                value={newRecord.bikeId}
                onChange={e => setNewRecord({...newRecord, bikeId: e.target.value})}
              >
                {bikes.map(b => <option key={b.id} value={b.id}>{b.licenseNumber} - {b.makeModel}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Type</label>
              <select 
                className="w-full border-gray-200 rounded-lg p-2 bg-gray-50"
                value={newRecord.serviceType}
                onChange={e => setNewRecord({...newRecord, serviceType: e.target.value as any})}
              >
                <option value="repair">Repair</option>
                <option value="routine">Routine Service</option>
                <option value="tyres">Tyres</option>
                <option value="oil">Oil Change</option>
              </select>
            </div>
            <div className="lg:col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
              <input 
                type="text"
                placeholder="e.g. Replaced brake pads"
                className="w-full border-gray-200 rounded-lg p-2 bg-gray-50"
                value={newRecord.description}
                onChange={e => setNewRecord({...newRecord, description: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cost (R)</label>
              <input 
                type="number"
                className="w-full border-gray-200 rounded-lg p-2 bg-gray-50"
                value={newRecord.cost}
                onChange={e => setNewRecord({...newRecord, cost: Number(e.target.value)})}
              />
            </div>
            <div className="lg:col-span-5 flex justify-end">
              <button type="submit" className="bg-red-600 text-white px-8 py-2 rounded-lg font-bold">Save Record</button>
            </div>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-4">
        {maintenance.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-dashed border-gray-300">
            <span className="text-4xl mb-4 block">🛠️</span>
            <p className="text-gray-500">No maintenance records logged yet.</p>
          </div>
        ) : (
          maintenance.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(record => {
            const bike = bikes.find(b => b.id === record.bikeId);
            return (
              <div key={record.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-lg ${
                    record.serviceType === 'repair' ? 'bg-red-50 text-red-600' :
                    record.serviceType === 'routine' ? 'bg-blue-50 text-blue-600' :
                    'bg-green-50 text-green-600'
                  }`}>
                    {record.serviceType === 'tyres' ? '🛞' : record.serviceType === 'oil' ? '🛢️' : '🔧'}
                  </div>
                  <div>
                    <div className="font-bold text-gray-800">{bike?.licenseNumber} - {record.description}</div>
                    <div className="text-xs text-gray-500">{new Date(record.date).toLocaleDateString()} • {record.serviceType.toUpperCase()}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-800">R{record.cost}</div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MaintenanceLog;
