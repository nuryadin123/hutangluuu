import { auth, db } from '@/lib/firebase';
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
  where,
} from 'firebase/firestore';

type DebtRecordInput = Omit<DebtRecord, 'id' | 'date' | 'dueDate'> & {
  date: Date;
  dueDate: Date;
};

type AddPaymentInput = Omit<Payment, 'date'> & { date: Date };

const debtCollectionRef = collection(db, 'debt-records');

export async function getDebtRecords(): Promise<DebtRecord[]> {
  const user = auth.currentUser;
  if (!user) {
    return []; // No user logged in, return no records
  }

  // The orderBy clause was moved to client-side sorting to avoid needing a composite index.
  const q = query(debtCollectionRef, where('userId', '==', user.uid));
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

  // Sort records by date in descending order (newest first) on the client side.
  records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return records;
}

export async function addDebtRecord(record: DebtRecordInput): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User must be logged in to add a record.');
  }

  // Handle payments during import, converting string dates to Date objects
  const paymentsWithTimestamps = record.payments?.map(p => ({
      ...p,
      date: new Date(p.date), 
  })) || [];


  const docRef = await addDoc(debtCollectionRef, {
    ...record,
    userId: user.uid, // Associate record with the logged-in user
    payments: paymentsWithTimestamps,
  });
  return docRef.id;
}

export async function updateDebtRecord(
  id: string,
  updates: Partial<DebtRecord>
) {
  const recordDoc = doc(db, 'debt-records', id);
  // TODO: Add security rule to ensure only the owner can update
  await updateDoc(recordDoc, updates);
}

export async function deleteDebtRecord(id: string) {
  const recordDoc = doc(db, 'debt-records', id);
  // TODO: Add security rule to ensure only the owner can delete
  await deleteDoc(recordDoc);
}

export async function addPayment(recordId: string, payment: AddPaymentInput): Promise<DebtRecord> {
  const recordRef = doc(db, 'debt-records', recordId);
  const recordSnap = await getDoc(recordRef);

  if (!recordSnap.exists()) {
    throw new Error('Record not found');
  }

  // TODO: Add security rule to ensure only the owner can add payments
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
