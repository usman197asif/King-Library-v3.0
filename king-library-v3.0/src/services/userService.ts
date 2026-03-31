import { db, auth } from "./firebase";
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, getDocs, query, where, orderBy, increment } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "./errorHandlers";

export async function getUserProfile(userId: string): Promise<any> {
  if (!db) throw new Error("Database not initialized");
  const userRef = doc(db, "users", userId);
  
  let userSnap;
  try {
    userSnap = await getDoc(userRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${userId}`);
  }
  
  if (!userSnap?.exists()) {
    // Create default profile
    const defaultProfile = {
      name: auth?.currentUser?.displayName || "Student King",
      email: auth?.currentUser?.email || "student@university.edu",
      isPremium: false,
      aiUsage: 0,
      earnings: 0,
      createdAt: new Date().toISOString()
    };
    try {
      await setDoc(userRef, defaultProfile);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${userId}`);
    }
    return { id: userId, ...defaultProfile };
  }
  
  return { id: userId, ...userSnap.data() };
}

export async function upgradeUser(userId: string) {
  if (!db) throw new Error("Database not initialized");
  const userRef = doc(db, "users", userId);
  try {
    await updateDoc(userRef, {
      isPremium: true,
      upgradedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
  }
}

export async function trackAiUsage(userId: string) {
  if (!db) throw new Error("Database not initialized");
  const userRef = doc(db, "users", userId);
  try {
    // Use increment for atomic updates
    await updateDoc(userRef, {
      aiUsage: increment(1),
      lastAiUsage: new Date().toISOString()
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    return false;
  }
}

export async function requestWithdrawal(userId: string, amount: number, method: string, details: string) {
  if (!db) throw new Error("Database not initialized");
  const userRef = doc(db, "users", userId);
  const withdrawalsRef = collection(db, "withdrawals");

  try {
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) throw new Error("User not found");
    
    const currentEarnings = userSnap.data().earnings || 0;
    if (currentEarnings < amount) throw new Error("Insufficient earnings");

    // Create withdrawal request
    await addDoc(withdrawalsRef, {
      userId,
      amount,
      method,
      details,
      status: "pending",
      createdAt: new Date().toISOString()
    });

    // Deduct from earnings
    await updateDoc(userRef, {
      earnings: currentEarnings - amount
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, "withdrawals");
  }
}

export async function getWithdrawals(userId: string) {
  if (!db) return [];
  const withdrawalsRef = collection(db, "withdrawals");
  const q = query(withdrawalsRef, where("userId", "==", userId), orderBy("createdAt", "desc"));
  
  try {
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, "withdrawals");
    return [];
  }
}
