
import { Bike, Driver, Payment } from './types';

export const INITIAL_BIKES: Bike[] = [
  { id: 'b1', makeModel: 'Hero ECO 150', licenseNumber: 'LG4 9WY GP', vin: 'N/A', year: '2023', dealer: 'Fireitup Bryanston', price: 'R26,899', city: 'JHB', status: 'active', assignedDriverId: 'd1' },
  { id: 'b2', makeModel: 'Lifan 125, Machete', licenseNumber: 'CA 001 0059', vin: 'MF51DZGP', year: '2025', dealer: 'Webuycars', price: 'N/A', city: 'JHB', status: 'active', assignedDriverId: 'd2' },
  { id: 'b3', makeModel: 'Honda Ace', licenseNumber: 'LC6 7WB GP', vin: 'N/A', year: '2022', dealer: 'Owner CTN', price: 'R10,000', city: 'CTN', status: 'active', assignedDriverId: 'd3' },
  { id: 'b4', makeModel: 'Big Boy 150, Velocity Cargo', licenseNumber: 'JX7 9YF GP', vin: 'N/A', year: '2021', dealer: 'Webuycars', price: 'R9,400', city: 'JHB', status: 'active', assignedDriverId: 'd4' },
  { id: 'b5', makeModel: 'Big Boy Velocity Cargo 15', licenseNumber: 'CAA 642 635', vin: 'N/A', year: '2025', dealer: 'Webuycars', price: 'R15,800', city: 'CTN', status: 'active', assignedDriverId: 'd5' },
  { id: 'b6', makeModel: '2024 Lifan Lifan 125', licenseNumber: 'KHN393EC', vin: 'N/A', year: '2024', dealer: 'Webuycars', price: 'N/A', city: 'EL', status: 'active', assignedDriverId: 'd6' },
  { id: 'b7', makeModel: 'Big Boy 150, Velocity Cargo', licenseNumber: 'JZN233EC', vin: 'N/A', year: 'N/A', dealer: 'Ronald Muzenda', price: 'R5,000', city: 'EL', status: 'active', assignedDriverId: 'd7' },
  { id: 'b8', makeModel: 'Big Boy 150, Velocity Cargo', licenseNumber: 'KGT424EC', vin: 'N/A', year: 'N/A', dealer: 'Ronald Muzenda', price: 'R8,000', city: 'EL', status: 'active', assignedDriverId: 'd8' },
];

export const INITIAL_DRIVERS: Driver[] = [
  { id: 'd1', name: 'Barton Nyalugwe', contact: '0718398532', nationality: 'Malawi', address: 'Joburg', idNumber: 'MWA309918', driverCode: 'B1-D1', city: 'JHB' },
  { id: 'd2', name: 'Kishani Alex', contact: '0817997139', nationality: 'Malawi', address: 'Joburg', idNumber: '6758843/2', driverCode: 'B2-D2', city: 'JHB' },
  { id: 'd3', name: 'Mutema Nassan', contact: '0694699361', nationality: 'DRC', address: 'Cape Town', idNumber: 'N/A', driverCode: 'B3-D3', city: 'CTN' },
  { id: 'd4', name: 'Ngqaza Ncube', contact: '0688818095', nationality: 'Zim', address: 'Joburg', idNumber: '0688818095', driverCode: 'B4-D4', city: 'JHB' },
  { id: 'd5', name: 'Shamusi Safali', contact: '076 175 0843', nationality: 'Malawi', address: 'Cape Town', idNumber: 'MB1111093', driverCode: 'B5-D5', city: 'CTN' },
  { id: 'd6', name: 'Asanda Mtebele', contact: '065 562 6701', nationality: 'SA', address: 'Southenwood', idNumber: '9405216136087', driverCode: 'B6-D6', city: 'EL' },
  { id: 'd7', name: 'Josefe Alex', contact: '063 223 9854', nationality: 'Malawi', address: 'Southenwood', idNumber: '5518845/2', driverCode: 'B7-D7', city: 'EL' },
  { id: 'd8', name: 'Lico', contact: '078 708 0024', nationality: 'South African', address: 'N/A', idNumber: 'N/A', driverCode: 'B8-D8', city: 'EL' },
];

// Based on Spreadsheet pages 3 & 4
export const INITIAL_PAYMENTS: Payment[] = [
  { id: 'p1', driverId: 'd1', amount: 650, date: '2023-10-01', weekNumber: 1, type: 'rental' },
  { id: 'p2', driverId: 'd1', amount: 0, date: '2023-10-08', weekNumber: 2, type: 'rental' },
  { id: 'p3', driverId: 'd1', amount: -400, date: '2023-10-15', weekNumber: 3, type: 'rental' },
  { id: 'p4', driverId: 'd1', amount: 1700, date: '2023-10-22', weekNumber: 4, type: 'rental' },
  { id: 'p5', driverId: 'd5', amount: 650, date: '2023-10-01', weekNumber: 1, type: 'rental' },
  { id: 'p6', driverId: 'd5', amount: 1000, date: '2023-10-15', weekNumber: 3, type: 'rental' },
];
