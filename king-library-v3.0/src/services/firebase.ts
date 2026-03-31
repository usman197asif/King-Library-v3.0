import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, query, where, onSnapshot, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

let db: any = null;
let auth: any = null;

export function initFirebase(config: any) {
  const app = initializeApp(config);
  db = getFirestore(app, config.firestoreDatabaseId);
  auth = getAuth(app);
  return { db, auth };
}

export { db, auth };
