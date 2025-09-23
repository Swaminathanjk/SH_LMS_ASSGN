import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDvGx8m__9y9cEy3x7aDkrhAGUMnUzAPhQ",
  authDomain: "lms-assgn.firebaseapp.com",
  projectId: "lms-assgn",
  storageBucket: "lms-assgn.firebasestorage.app",
  messagingSenderId: "548810883263",
  appId: "1:548810883263:web:513d4860578db11c10860a",
  measurementId: "G-7K1DW2VJM6",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export default app;
