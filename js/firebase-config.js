// ============================================
// FIREBASE CONFIGURATION
// ============================================

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyACloITMwu5cABEIiNB1fmDBhBbLZa205o",
  authDomain: "web-per.firebaseapp.com",
  databaseURL: "https://web-per-default-rtdb.firebaseio.com",
  projectId: "web-per",
  storageBucket: "web-per.firebasestorage.app",
  messagingSenderId: "561947571420",
  appId: "1:561947571420:web:932c5d40f381253af03019",
  measurementId: "G-6J0ZGB22CR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);        // Realtime Database
const db = getFirestore(app);             // Firestore
const analytics = getAnalytics(app);

// Exportar para usar en otros archivos
export { app, database, db, analytics };
