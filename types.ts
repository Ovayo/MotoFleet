
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
  // Added tracker property to support live telemetry features in TrackingPortal
  tracker?: {
    lat: number;
    lng: number;
    status: 'moving' | 'parked' | 'ignited';
    battery: number;
    signalStrength: string;
    speed: number;
  };
}

export interface Driver {
  id: string;
  name: string;
  contact: string;
  passcode?: string; // Secure portal access key
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
  licenseImageUrl?: string; // Digital copy of license
  pdpImageUrl?: string;     // Digital copy of PDP
  idImageUrl?: string;      // Digital copy of ID/Passport
  weeklyTarget?: number; // Custom rental target (e.g. 600 or 650)
  isArchived?: boolean; // For operators no longer working
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

export interface AccidentReport {
  id: string;
  bikeId: string;
  driverId: string;
  date: string;
  location: string;
  description: string;
  status: 'reported' | 'insurance-pending' | 'resolved';
  thirdPartyDetails?: string;
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

export type View = 'dashboard' | 'fleet' | 'drivers' | 'payments' | 'maintenance' | 'driver-profile' | 'driver-wallet' | 'driver-vehicle' | 'driver-safety' | 'driver-documents' | 'mechanic-portal' | 'fines' | 'communications' | 'incidents' | 'system' | 'super-admin';
