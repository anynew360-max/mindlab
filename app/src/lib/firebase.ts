import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// นำ Config จาก Firebase Console มาวางตรงนี้
const firebaseConfig = {
  apiKey: "AIzaSyB988DJ14O5ttzP-bsUTQ75NiJPig3GKys",
  authDomain: "mindlab-77599.firebaseapp.com",
  projectId: "mindlab-77599",
  storageBucket: "mindlab-77599.firebasestorage.app",
  messagingSenderId: "729157081825",
  appId: "1:729157081825:web:f1cf01e251c83a100cf5a0",
  measurementId: "G-FKZQNT4FJY"
};

const hasPlaceholder = Object.values(firebaseConfig).some((value) =>
  typeof value === 'string' && value.includes('YOUR_')
);
export const isFirebaseConfigured = !hasPlaceholder;

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);