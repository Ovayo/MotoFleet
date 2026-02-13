
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
  assignedWorkshopId?: string;
  notes?: string;
  licenseDiskExpiry?: string;
  enatisVerified?: boolean;
}

export interface Driver {
  id: string;
  name: string;
  contact: string;
  nationality: string;
  address: string;
  idNumber: string;
  city: string;
  notes?: string;
  licenseExpiry?: string;
  pdpExpiry?: string;
  enatisVerified?: boolean;
  contactVerified?: boolean;
  profilePictureUrl?: string;
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
  attachmentUrl?: string;
}

export interface TrafficFine {
  id: string;
  bikeId: string;
  driverId: string;
  amount: number;
  date: string;
  noticeNumber: string;
  description: string;
  status: 'unpaid' | 'paid' | 'contested';
  attachmentUrl?: string;
}

export interface Workshop {
  id: string;
  name: string;
  location: string;
  city: string;
  contact: string;
  specialization: string[];
  rating: number;
}

export interface AutomatedNotification {
  id: string;
  type: 'arrears' | 'maintenance' | 'license';
  recipientId: string;
  status: 'queued' | 'sent' | 'failed';
  timestamp: string;
  message: string;
}

export interface FleetContext {
  fleetId: string;
  fleetName: string;
  isCloudSyncing: boolean;
}

export type View = 'dashboard' | 'fleet' | 'drivers' | 'payments' | 'maintenance' | 'driver-profile' | 'mechanic-portal' | 'fines' | 'communications';
