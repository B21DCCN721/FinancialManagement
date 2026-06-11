import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBO_iy0QdB0E7O4toqmDVJdZzwHYVd0edM",
  authDomain: "financialmanagement-498504.firebaseapp.com",
  projectId: "financialmanagement-498504",
  storageBucket: "financialmanagement-498504.firebasestorage.app",
  messagingSenderId: "680792295793",
  appId: "1:680792295793:web:2873635b130ba97dbf0ed0",
  measurementId: "G-213CC1466B"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Force account selection screen every time
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export { app, auth, googleProvider };
