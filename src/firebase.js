// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Paste your config from Firebase console here
const firebaseConfig = {
  apiKey: "AIzaSyCJrluh2SoZdObqFNcyxNYbtuwP_Myon4E",
  authDomain: "safesip-f0c5c.firebaseapp.com",
  projectId: "safesip-f0c5c",
  storageBucket: "safesip-f0c5c.firebasestorage.app",
  messagingSenderId: "745962355442",
  appId: "1:745962355442:web:6803f4d2d882c6e8bb6e6b",
  measurementId: "G-5708XTKXN8"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
