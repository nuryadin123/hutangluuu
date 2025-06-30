import { DebtRecord } from './types';

// This data is no longer used by the application but is kept for reference.
export const DUMMY_DATA: DebtRecord[] = [
  {
    id: '1',
    name: 'Budi Santoso',
    amount: 500000,
    currency: 'IDR',
    type: 'hutang',
    status: 'belum lunas',
    date: '2024-05-01',
    dueDate: '2024-06-15',
    description: 'Pinjaman untuk modal usaha kecil',
  },
  {
    id: '2',
    name: 'PT. Sejahtera Abadi',
    amount: 2500000,
    currency: 'IDR',
    type: 'piutang',
    status: 'belum lunas',
    date: '2024-05-05',
    dueDate: '2024-07-01',
    description: 'Invoice #INV-2024-001',
  },
];
