// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyD8Sg8rBwkCS4BYwgVrb_V_KQ4eMd0PkZ0",
    authDomain: "g-network-community.firebaseapp.com",
    projectId: "g-network-community",
    storageBucket: "g-network-community.firebasestorage.app",
    messagingSenderId: "358032029950",
    appId: "1:358032029950:web:f48c4fd930ee8783240daf"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// Export Firebase instances
export { auth, db, provider };
