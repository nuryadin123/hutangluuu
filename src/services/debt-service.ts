import { db } from '@/lib/firebase';
import type { DebtRecord, Payment } from '@/lib/types';
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
  getDoc,
  arrayUnion,
} from 'firebase/firestore';

type DebtRecordInput = Omit<DebtRecord, 'id' | 'date' | 'dueDate' | 'payments'> & {
  date: Date;
  dueDate: Date;
};

type AddPaymentInput = Omit<Payment, 'date'> & { date: Date };

const debtCollectionRef = collection(db, 'debt-records');

export async function getDebtRecords(): Promise<DebtRecord[]> {
  const q = query(debtCollectionRef, orderBy('date', 'desc'));
  const querySnapshot = await getDocs(q);
  const records = querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      amount: data.amount,
      currency: data.currency,
      type: data.type,
      status: data.status,
      description: data.description,
      date: (data.date as Timestamp).toDate().toISOString().split('T')[0],
      dueDate: (data.dueDate as Timestamp).toDate().toISOString().split('T')[0],
      payments:
        data.payments?.map((p: any) => ({
          ...p,
          date: (p.date as Timestamp).toDate().toISOString().split('T')[0],
        })) || [],
    } as DebtRecord;
  });
  return records;
}

export async function addDebtRecord(record: DebtRecordInput): Promise<string> {
  const docRef = await addDoc(debtCollectionRef, {
    ...record,
    payments: []
  });
  return docRef.id;
}

export async function updateDebtRecord(
  id: string,
  updates: Partial<DebtRecord>
) {
  const recordDoc = doc(db, 'debt-records', id);
  await updateDoc(recordDoc, updates);
}

export async function deleteDebtRecord(id: string) {
  const recordDoc = doc(db, 'debt-records', id);
  await deleteDoc(recordDoc);
}

export async function addPayment(recordId: string, payment: AddPaymentInput): Promise<DebtRecord> {
  const recordRef = doc(db, 'debt-records', recordId);
  const recordSnap = await getDoc(recordRef);

  if (!recordSnap.exists()) {
    throw new Error('Record not found');
  }

  const recordData = recordSnap.data();
  // Ensure payments is an array before reducing
  const existingPayments = recordData.payments || [];
  const totalPaid = existingPayments.reduce((sum: number, p: Payment) => sum + p.amount, 0) + payment.amount;

  const updates: any = {
    payments: arrayUnion(payment),
  };

  if (totalPaid >= recordData.amount) {
    updates.status = 'lunas';
  }

  await updateDoc(recordRef, updates);
  
  // Return the full updated record so the UI can update
  const updatedDocSnap = await getDoc(recordRef);
  const updatedData = updatedDocSnap.data()!;
  
  return {
    id: updatedDocSnap.id,
    ...updatedData,
    date: (updatedData.date as Timestamp).toDate().toISOString().split('T')[0],
    dueDate: (updatedData.dueDate as Timestamp).toDate().toISOString().split('T')[0],
    payments: updatedData.payments?.map((p: any) => ({
      ...p,
      date: (p.date as Timestamp).toDate().toISOString().split('T')[0],
    })) || [],
  } as DebtRecord;
}
