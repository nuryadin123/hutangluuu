import { db } from '@/lib/firebase';
import type { DebtRecord } from '@/lib/types';
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
} from 'firebase/firestore';

type DebtRecordInput = Omit<DebtRecord, 'id' | 'date' | 'dueDate'> & {
  date: Date;
  dueDate: Date;
};

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
    } as DebtRecord;
  });
  return records;
}

export async function addDebtRecord(record: DebtRecordInput): Promise<string> {
  const docRef = await addDoc(debtCollectionRef, record);
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
