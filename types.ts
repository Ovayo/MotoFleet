
export interface TrackerInfo {
  imei: string;
  signalStrength: 'excellent' | 'good' | 'poor' | 'offline';
  battery: number;
  status: 'moving' | 'parked' | 'idle' | 'ignited';
  lastSeen: string;
  lat: number;
  lng: number;
  speed?: number;
}

export interface Bike {
  id: string;
  makeModel: string;
  licenseNumber: string;
  vin: string;
  year: string;
  dealer: string;
  price: string;
  city: string;
  status: 'active' | 'maintenance' | 'idle';
  assignedDriverId?: string;
  notes?: string;
  licenseDiskExpiry?: string;
  enatisVerified?: boolean;
  tracker?: TrackerInfo;
}

export interface Driver {
  id: string;
  name: string;
  contact: string;
  nationality: string;
  address: string;
  idNumber: string;
  driverCode: string;
  city: string;
  notes?: string;
  licenseExpiry?: string;
  pdpExpiry?: string;
  enatisVerified?: boolean;
}

export interface Payment {
  id: string;
  driverId: string;
  amount: number;
  date: string;
  weekNumber: number;
  type: 'rental' | 'deposit' | 'fine';
}

export interface MaintenanceRecord {
  id: string;
  bikeId: string;
  date: string;
  description: string;
  cost: number;
  serviceType: 'repair' | 'routine' | 'tyres' | 'oil' | 'fuel' | 'parts' | 'other';
  warrantyMonths?: number;
  performedBy?: string;
}

export type View = 'dashboard' | 'fleet' | 'drivers' | 'payments' | 'maintenance' | 'tracking' | 'driver-profile' | 'mechanic-portal';
