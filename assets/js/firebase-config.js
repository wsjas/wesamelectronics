// 1) افتح Firebase Console > Project settings > Your apps (Web)
// 2) انسخ config وضعه هنا.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyAV84R5Y64uW5sSDrmhMoMYnvQ3VDBp6NE",
  authDomain: "wsam-electronics.firebaseapp.com",
  projectId: "wsam-electronics",
  storageBucket: "wsam-electronics.firebasestorage.app",
  messagingSenderId: "702152412540",
  appId: "1:702152412540:web:fd22e8026229de04b728f9",
  measurementId: "G-ZW7C0YHKV1"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const analytics = getAnalytics(app);
