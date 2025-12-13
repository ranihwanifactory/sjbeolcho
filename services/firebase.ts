// @ts-ignore
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCKl9cgeVwFopXDBjBZ10Qw2s2_uFO5d58",
  authDomain: "beolcho-25793.firebaseapp.com",
  projectId: "beolcho-25793",
  storageBucket: "beolcho-25793.firebasestorage.app",
  messagingSenderId: "987038985119",
  appId: "1:987038985119:web:4dc77a262b038c5ba72baa"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);

export const ADMIN_EMAIL = "acehwan69@gmail.com";

export { createUserWithEmailAndPassword, signInWithEmailAndPassword };