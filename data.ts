
import { Bike, Driver, Payment, Workshop } from './types';

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
    enatisVerified: true
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
    enatisVerified: true
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
    enatisVerified: true
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
    licenseDiskExpiry: '2025-03-30'
  },
  { id: 'b5', makeModel: 'Big Boy Velocity Cargo 15', licenseNumber: 'CAA 642 635', vin: 'BBV1522', year: '2025', dealer: 'Webuycars', price: 'R15,800', city: 'CTN', status: 'active', assignedDriverId: 'd5', licenseDiskExpiry: '2026-02-14' },
  { id: 'b6', makeModel: '2024 Lifan Lifan 125', licenseNumber: 'KHN393EC', vin: 'LIF00921', year: '2024', dealer: 'Webuycars', price: 'N/A', city: 'EL', status: 'active', assignedDriverId: 'd6', licenseDiskExpiry: '2025-11-11' },
  { id: 'b7', makeModel: 'Big Boy 150, Velocity Cargo', licenseNumber: 'JZN233EC', vin: 'BBV991', year: 'N/A', dealer: 'Ronald Muzenda', price: 'R5,000', city: 'EL', status: 'active', assignedDriverId: 'd7', licenseDiskExpiry: '2025-05-01' },
  { id: 'b8', makeModel: 'Big Boy 150, Velocity Cargo', licenseNumber: 'KGT424EC', vin: 'BBV100', year: 'N/A', dealer: 'Ronald Muzenda', price: 'R8,000', city: 'EL', status: 'active', assignedDriverId: 'd8', licenseDiskExpiry: '2024-11-20' },
];

export const INITIAL_DRIVERS: Driver[] = [
  { id: 'd1', name: 'Barton Nyalugwe', contact: '0718398532', nationality: 'Malawi', address: 'Joburg', idNumber: 'MWA309918', city: 'JHB', licenseExpiry: '2026-05-10', pdpExpiry: '2025-05-10', enatisVerified: true, contactVerified: true },
  { id: 'd2', name: 'Kishani Alex', contact: '0817997139', nationality: 'Malawi', address: 'Joburg', idNumber: '6758843/2', city: 'JHB', licenseExpiry: '2025-12-01', pdpExpiry: '2025-12-01', enatisVerified: true, contactVerified: true },
  { id: 'd3', name: 'Mutema Nassan', contact: '0694699361', nationality: 'DRC', address: 'Cape Town', idNumber: 'N/A', city: 'CTN', licenseExpiry: '2025-03-15' },
  { id: 'd4', name: 'Ngqaza Ncube', contact: '0688818095', nationality: 'Zim', address: 'Joburg', idNumber: '0688818095', city: 'JHB', licenseExpiry: '2025-08-20', pdpExpiry: '2025-02-15' },
  { id: 'd5', name: 'Shamusi Safali', contact: '076 175 0843', nationality: 'Malawi', address: 'Cape Town', idNumber: 'MB1111093', city: 'CTN', licenseExpiry: '2026-01-10', pdpExpiry: '2026-01-10', enatisVerified: true, contactVerified: true },
  { id: 'd6', name: 'Asanda Mtebele', contact: '065 562 6701', nationality: 'SA', address: 'Southenwood', idNumber: '9405216136087', city: 'EL', licenseExpiry: '2027-09-22', pdpExpiry: '2025-09-22', enatisVerified: true },
  { id: 'd7', name: 'Josefe Alex', contact: '063 223 9854', nationality: 'Malawi', address: 'Southenwood', idNumber: '5518845/2', city: 'EL', licenseExpiry: '2025-11-30' },
  { id: 'd8', name: 'Lico', contact: '078 708 0024', nationality: 'South African', address: 'N/A', idNumber: 'N/A', city: 'EL', licenseExpiry: '2025-04-12' },
];

export const INITIAL_PAYMENTS: Payment[] = [
  { id: 'p1', driverId: 'd1', amount: 650, date: '2023-10-01', weekNumber: 1, type: 'rental' },
  { id: 'p2', driverId: 'd1', amount: 0, date: '2023-10-08', weekNumber: 2, type: 'rental' },
  { id: 'p3', driverId: 'd1', amount: -400, date: '2023-10-15', weekNumber: 3, type: 'rental' },
  { id: 'p4', driverId: 'd1', amount: 1700, date: '2023-10-22', weekNumber: 4, type: 'rental' },
  { id: 'p5', driverId: 'd5', amount: 650, date: '2023-10-01', weekNumber: 1, type: 'rental' },
  { id: 'p6', driverId: 'd5', amount: 1000, date: '2023-10-15', weekNumber: 3, type: 'rental' },
];

export const INITIAL_WORKSHOPS: Workshop[] = [
  { id: 'w1', name: 'Elite Moto JHB', city: 'JHB', location: 'Wynberg Main Rd', contact: '0114401234', specialization: ['Hero', 'Engine Rebuilds'], rating: 4.8 },
  { id: 'w2', name: 'The Bike Doctor', city: 'CTN', location: 'Salt River Circle', contact: '0214475588', specialization: ['Honda', 'General Service'], rating: 4.5 },
  { id: 'w3', name: 'FastLane Spares', city: 'EL', location: 'Berea, Pearce St', contact: '0437229900', specialization: ['Tyres', 'Chain & Sprocket'], rating: 4.2 },
  { id: 'w4', name: 'MotoMaster Sandton', city: 'JHB', location: 'Kramerville', contact: '0825559988', specialization: ['Big Boy Specialist', 'Electronics'], rating: 4.7 },
];
