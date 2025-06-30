
export type Payment = {
  amount: number;
  date: string;
  notes?: string;
};

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
  payments?: Payment[];
  userId: string;
};
