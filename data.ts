
import { Bike, Driver, Payment } from './types';

export const INITIAL_BIKES: Bike[] = [
  { 
    id: 'b1', 
    makeModel: 'Hero ECO 150', 
    licenseNumber: 'LG4 9WY GP', 
    vin: 'Z001HERO992', 
    year: '2023', 
    dealer: 'Fireitup Bryanston', 
    price: 'R26,899', 
    city: 'JHB', 
    status: 'active', 
    assignedDriverId: 'd1', 
    licenseDiskExpiry: '2025-06-15', 
    enatisVerified: true,
    tracker: { imei: '862001004921', signalStrength: 'excellent', battery: 98, status: 'moving', lastSeen: new Date().toISOString(), lat: -26.2041, lng: 28.0473, speed: 45 }
  },
  { 
    id: 'b2', 
    makeModel: 'Lifan 125, Machete', 
    licenseNumber: 'CA 001 0059', 
    vin: 'MF51DZGP', 
    year: '2025', 
    dealer: 'Webuycars', 
    price: 'N/A', 
    city: 'JHB', 
    status: 'active', 
    assignedDriverId: 'd2', 
    licenseDiskExpiry: '2026-01-20', 
    enatisVerified: true,
    tracker: { imei: '862001004922', signalStrength: 'good', battery: 85, status: 'parked', lastSeen: new Date().toISOString(), lat: -26.1952, lng: 28.0340 }
  },
  { 
    id: 'b3', 
    makeModel: 'Honda Ace', 
    licenseNumber: 'LC6 7WB GP', 
    vin: 'HOND77261', 
    year: '2022', 
    dealer: 'Owner CTN', 
    price: 'R10,000', 
    city: 'CTN', 
    status: 'active', 
    assignedDriverId: 'd3', 
    licenseDiskExpiry: '2024-12-10', 
    enatisVerified: true,
    tracker: { imei: '862001004923', signalStrength: 'excellent', battery: 100, status: 'moving', lastSeen: new Date().toISOString(), lat: -33.9249, lng: 18.4241, speed: 60 }
  },
  { 
    id: 'b4', 
    makeModel: 'Big Boy 150, Velocity Cargo', 
    licenseNumber: 'JX7 9YF GP', 
    vin: 'BB002931', 
    year: '2021', 
    dealer: 'Webuycars', 
    price: 'R9,400', 
    city: 'JHB', 
    status: 'active', 
    assignedDriverId: 'd4', 
    licenseDiskExpiry: '2025-03-30',
    tracker: { imei: '862001004924', signalStrength: 'poor', battery: 12, status: 'idle', lastSeen: new Date().toISOString(), lat: -26.1800, lng: 28.0500 }
  },
  { id: 'b5', makeModel: 'Big Boy Velocity Cargo 15', licenseNumber: 'CAA 642 635', vin: 'BBV1522', year: '2025', dealer: 'Webuycars', price: 'R15,800', city: 'CTN', status: 'active', assignedDriverId: 'd5', licenseDiskExpiry: '2026-02-14', tracker: { imei: '862001004925', signalStrength: 'excellent', battery: 94, status: 'moving', lastSeen: new Date().toISOString(), lat: -33.9350, lng: 18.4350, speed: 32 } },
  { id: 'b6', makeModel: '2024 Lifan Lifan 125', licenseNumber: 'KHN393EC', vin: 'LIF00921', year: '2024', dealer: 'Webuycars', price: 'N/A', city: 'EL', status: 'active', assignedDriverId: 'd6', licenseDiskExpiry: '2025-11-11', tracker: { imei: '862001004926', signalStrength: 'good', battery: 72, status: 'parked', lastSeen: new Date().toISOString(), lat: -32.9977, lng: 27.8960 } },
  { id: 'b7', makeModel: 'Big Boy 150, Velocity Cargo', licenseNumber: 'JZN233EC', vin: 'BBV991', year: 'N/A', dealer: 'Ronald Muzenda', price: 'R5,000', city: 'EL', status: 'active', assignedDriverId: 'd7', licenseDiskExpiry: '2025-05-01', tracker: { imei: '862001004927', signalStrength: 'excellent', battery: 88, status: 'ignited', lastSeen: new Date().toISOString(), lat: -32.9800, lng: 27.9000 } },
  { id: 'b8', makeModel: 'Big Boy 150, Velocity Cargo', licenseNumber: 'KGT424EC', vin: 'BBV100', year: 'N/A', dealer: 'Ronald Muzenda', price: 'R8,000', city: 'EL', status: 'active', assignedDriverId: 'd8', licenseDiskExpiry: '2024-11-20', tracker: { imei: '862001004928', signalStrength: 'offline', battery: 0, status: 'parked', lastSeen: '2 hours ago', lat: -32.9900, lng: 27.9100 } },
];

export const INITIAL_DRIVERS: Driver[] = [
  { id: 'd1', name: 'Barton Nyalugwe', contact: '0718398532', nationality: 'Malawi', address: 'Joburg', idNumber: 'MWA309918', driverCode: 'B1-D1', city: 'JHB', licenseExpiry: '2026-05-10', pdpExpiry: '2025-05-10', enatisVerified: true },
  { id: 'd2', name: 'Kishani Alex', contact: '0817997139', nationality: 'Malawi', address: 'Joburg', idNumber: '6758843/2', driverCode: 'B2-D2', city: 'JHB', licenseExpiry: '2025-12-01', pdpExpiry: '2025-12-01', enatisVerified: true },
  { id: 'd3', name: 'Mutema Nassan', contact: '0694699361', nationality: 'DRC', address: 'Cape Town', idNumber: 'N/A', driverCode: 'B3-D3', city: 'CTN', licenseExpiry: '2025-03-15' },
  { id: 'd4', name: 'Ngqaza Ncube', contact: '0688818095', nationality: 'Zim', address: 'Joburg', idNumber: '0688818095', driverCode: 'B4-D4', city: 'JHB', licenseExpiry: '2025-08-20', pdpExpiry: '2025-02-15' },
  { id: 'd5', name: 'Shamusi Safali', contact: '076 175 0843', nationality: 'Malawi', address: 'Cape Town', idNumber: 'MB1111093', driverCode: 'B5-D5', city: 'CTN', licenseExpiry: '2026-01-10', pdpExpiry: '2026-01-10', enatisVerified: true },
  { id: 'd6', name: 'Asanda Mtebele', contact: '065 562 6701', nationality: 'SA', address: 'Southenwood', idNumber: '9405216136087', driverCode: 'B6-D6', city: 'EL', licenseExpiry: '2027-09-22', pdpExpiry: '2025-09-22', enatisVerified: true },
  { id: 'd7', name: 'Josefe Alex', contact: '063 223 9854', nationality: 'Malawi', address: 'Southenwood', idNumber: '5518845/2', driverCode: 'B7-D7', city: 'EL', licenseExpiry: '2025-11-30' },
  { id: 'd8', name: 'Lico', contact: '078 708 0024', nationality: 'South African', address: 'N/A', idNumber: 'N/A', driverCode: 'B8-D8', city: 'EL', licenseExpiry: '2025-04-12' },
];

export const INITIAL_PAYMENTS: Payment[] = [
  { id: 'p1', driverId: 'd1', amount: 650, date: '2023-10-01', weekNumber: 1, type: 'rental' },
  { id: 'p2', driverId: 'd1', amount: 0, date: '2023-10-08', weekNumber: 2, type: 'rental' },
  { id: 'p3', driverId: 'd1', amount: -400, date: '2023-10-15', weekNumber: 3, type: 'rental' },
  { id: 'p4', driverId: 'd1', amount: 1700, date: '2023-10-22', weekNumber: 4, type: 'rental' },
  { id: 'p5', driverId: 'd5', amount: 650, date: '2023-10-01', weekNumber: 1, type: 'rental' },
  { id: 'p6', driverId: 'd5', amount: 1000, date: '2023-10-15', weekNumber: 3, type: 'rental' },
];
