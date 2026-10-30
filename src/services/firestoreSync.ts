import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  getDocs, 
  writeBatch 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Transaction, BudgetConfig } from '../types';

/**
 * Real-time listener for user transactions from Firestore
 */
export function subscribeToUserTransactions(
  userId: string,
  onUpdate: (transactions: Transaction[]) => void
) {
  const path = `users/${userId}/transactions`;
  const txCollectionRef = collection(db, 'users', userId, 'transactions');

  return onSnapshot(
    txCollectionRef,
    (snapshot) => {
      const items: Transaction[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: data.id || docSnap.id,
          date: data.date,
          description: data.description,
          amount: Number(data.amount) || 0,
          category: data.category,
          source: data.source,
          notes: data.notes || undefined,
        });
      });
      // Sort newest first
      items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      onUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

/**
 * Save or update a single transaction in Firestore
 */
export async function saveTransactionToCloud(userId: string, tx: Transaction): Promise<void> {
  const path = `users/${userId}/transactions/${tx.id}`;
  try {
    const docRef = doc(db, 'users', userId, 'transactions', tx.id);
    const payload = {
      id: tx.id,
      userId,
      date: tx.date,
      description: tx.description,
      amount: tx.amount,
      category: tx.category,
      source: tx.source,
      notes: tx.notes || '',
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Delete a transaction from Firestore
 */
export async function deleteTransactionFromCloud(userId: string, txId: string): Promise<void> {
  const path = `users/${userId}/transactions/${txId}`;
  try {
    const docRef = doc(db, 'users', userId, 'transactions', txId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Batch upload multiple transactions to Firestore
 */
export async function batchSaveTransactionsToCloud(userId: string, transactions: Transaction[]): Promise<void> {
  const path = `users/${userId}/transactions`;
  try {
    const batch = writeBatch(db);
    transactions.forEach((tx) => {
      const docRef = doc(db, 'users', userId, 'transactions', tx.id);
      batch.set(docRef, {
        id: tx.id,
        userId,
        date: tx.date,
        description: tx.description,
        amount: tx.amount,
        category: tx.category,
        source: tx.source,
        notes: tx.notes || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Clear all transactions from cloud
 */
export async function clearAllTransactionsFromCloud(userId: string): Promise<void> {
  const path = `users/${userId}/transactions`;
  try {
    const txCollectionRef = collection(db, 'users', userId, 'transactions');
    const snap = await getDocs(txCollectionRef);
    const batch = writeBatch(db);
    snap.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Subscribe to budget configuration
 */
export function subscribeToUserBudget(
  userId: string,
  onUpdate: (budget: BudgetConfig) => void
) {
  const path = `users/${userId}/budget/current`;
  const docRef = doc(db, 'users', userId, 'budget', 'current');

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        onUpdate({
          monthlyBudget: Number(data.monthlyBudget) || 1200,
          currency: data.currency || '$',
          categoryBudgets: data.categoryBudgets || {},
        });
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

/**
 * Save budget configuration to Firestore
 */
export async function saveBudgetToCloud(userId: string, budget: BudgetConfig): Promise<void> {
  const path = `users/${userId}/budget/current`;
  try {
    const docRef = doc(db, 'users', userId, 'budget', 'current');
    await setDoc(docRef, {
      userId,
      monthlyBudget: budget.monthlyBudget,
      currency: budget.currency,
      categoryBudgets: budget.categoryBudgets || {},
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Subscribe to Savings Goal
 */
export function subscribeToUserSavingsGoal(
  userId: string,
  onUpdate: (goal: { name: string; savedAmount: number; targetAmount: number }) => void
) {
  const path = `users/${userId}/savingsGoal/current`;
  const docRef = doc(db, 'users', userId, 'savingsGoal', 'current');

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        onUpdate({
          name: data.name || 'MacBook Pro for College',
          savedAmount: Number(data.savedAmount) || 0,
          targetAmount: Number(data.targetAmount) || 1200,
        });
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

/**
 * Save Savings Goal to Firestore
 */
export async function saveSavingsGoalToCloud(
  userId: string,
  goal: { name: string; savedAmount: number; targetAmount: number }
): Promise<void> {
  const path = `users/${userId}/savingsGoal/current`;
  try {
    const docRef = doc(db, 'users', userId, 'savingsGoal', 'current');
    await setDoc(docRef, {
      userId,
      name: goal.name,
      savedAmount: goal.savedAmount,
      targetAmount: goal.targetAmount,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
