import { db } from "./firebase";
import { collection, addDoc, getDocs, query, where, doc, getDoc, updateDoc } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "./errorHandlers";

export async function getGigs(category?: string) {
  if (!db) return [];
  const gigsRef = collection(db, "gigs");
  const q = category ? query(gigsRef, where("category", "==", category)) : gigsRef;
  try {
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, "gigs");
    return [];
  }
}

export async function claimGig(gigId: string, userId: string) {
  if (!db) throw new Error("Database not initialized");
  const gigRef = doc(db, "gigs", gigId);
  
  let gigSnap;
  try {
    gigSnap = await getDoc(gigRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `gigs/${gigId}`);
  }
  
  if (!gigSnap?.exists()) throw new Error("Gig not found");
  if (gigSnap.data().claimedBy) throw new Error("Gig already claimed");
  
  try {
    await updateDoc(gigRef, {
      claimedBy: userId,
      claimedAt: new Date().toISOString(),
      status: "claimed"
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `gigs/${gigId}`);
  }
}

export async function createGig(gigData: any, userId: string) {
  if (!db) throw new Error("Database not initialized");
  const gigsRef = collection(db, "gigs");
  
  // Extract numeric value from payout string (e.g., "$50" -> 50)
  const payoutValue = parseFloat(gigData.payout.replace(/[^0-9.]/g, '')) || 0;
  const commissionRate = 0.10; // 10%
  const commission = payoutValue * commissionRate;

  try {
    await addDoc(gigsRef, {
      ...gigData,
      postedBy: userId,
      commission,
      commissionRate: commissionRate * 100,
      createdAt: new Date().toISOString(),
      status: "open"
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, "gigs");
  }
}

export async function submitGig(gigId: string) {
  if (!db) throw new Error("Database not initialized");
  const gigRef = doc(db, "gigs", gigId);
  try {
    await updateDoc(gigRef, {
      status: "submitted",
      submittedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `gigs/${gigId}`);
  }
}

export async function completeGig(gigId: string, workerId: string, payout: string, commission: number) {
  if (!db) throw new Error("Database not initialized");
  const gigRef = doc(db, "gigs", gigId);
  const userRef = doc(db, "users", workerId);
  
  const payoutValue = parseFloat(payout.replace(/[^0-9.]/g, '')) || 0;
  const netPayout = payoutValue - commission;

  try {
    // Update gig status
    await updateDoc(gigRef, {
      status: "completed",
      completedAt: new Date().toISOString()
    });

    // Update worker earnings
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const currentEarnings = userSnap.data().earnings || 0;
      await updateDoc(userRef, {
        earnings: currentEarnings + netPayout
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `gigs/${gigId}`);
  }
}
