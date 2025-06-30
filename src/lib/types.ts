export type DebtRecord = {
  id: string;
  name: string;
  amount: number;
  currency: 'IDR' | 'USD';
  type: 'hutang' | 'piutang';
  status: 'lunas' | 'belum lunas';
  date: string;
  dueDate: string;
  description: string;
};
