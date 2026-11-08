import { initializeApp } from
"https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";

import {
  getAuth,
  GoogleAuthProvider
} from
"https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

import {
  getFirestore
} from
"https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBvrDJHEqL4-FI9GPfw_4SgoabCkECmNIY",
  authDomain: "planora-8b267.firebaseapp.com",
  projectId: "planora-8b267",
  storageBucket: "planora-8b267.firebasestorage.app",
  messagingSenderId: "820345391265",
  appId: "1:820345391265:web:fa5efb625b17524e8f08e0"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const db = getFirestore(app);

export const googleProvider = new GoogleAuthProvider();