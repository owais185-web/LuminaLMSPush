
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// NOTE: In a real production app, these values come from process.env
// For this demo, you must replace these with your actual Firebase Config keys
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "YOUR_API_KEY_HERE",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "your-app.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "your-app-id",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "your-app.appspot.com",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.FIREBASE_APP_ID || "1:123456789:web:abc123def456"
};

// Check if config is valid (not default placeholders)
const isConfigValid = firebaseConfig.apiKey && !firebaseConfig.apiKey.includes("YOUR_API_KEY");

let app;
let auth = null;
let googleProvider = null;
let db_firestore = null;

if (isConfigValid) {
    try {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        googleProvider = new GoogleAuthProvider();
        db_firestore = getFirestore(app);
        console.log("Firebase initialized successfully");
    } catch (e) {
        console.error("Firebase Initialization Failed:", e);
    }
} else {
    console.warn("Lumina LMS: Firebase keys are missing or invalid. Google SSO and Cloud Storage will be disabled. Please update firebaseConfig.ts.");
}

export { auth, googleProvider, db_firestore };
