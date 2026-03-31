import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  User
} from "firebase/auth";
import { initializeApp } from "firebase/app";

// Placeholder config - will be replaced by real config from firebase-applet-config.json
let auth: any = null;

export function initAuth(config: any) {
  const app = initializeApp(config);
  auth = getAuth(app);
  return auth;
}

export const loginWithGoogle = async () => {
  if (!auth) throw new Error("Auth not initialized");
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Login failed:", error);
    throw error;
  }
};

export const logout = async () => {
  if (!auth) throw new Error("Auth not initialized");
  await signOut(auth);
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  if (!auth) return () => {};
  return onAuthStateChanged(auth, callback);
};
