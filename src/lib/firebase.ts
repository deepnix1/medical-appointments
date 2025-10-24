'use client';

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAQp0b1CtWwt_skPlynTCaoV91o6QgzUUk",
  authDomain: "hospital-494bf.firebaseapp.com",
  projectId: "hospital-494bf",
  storageBucket: "hospital-494bf.firebasestorage.app",
  messagingSenderId: "737679142169",
  appId: "1:737679142169:web:232444d01075d7a1942988",
  measurementId: "G-6H239QBKCE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };