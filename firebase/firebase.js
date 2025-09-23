import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  // your Config from Firebase
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export default app;
