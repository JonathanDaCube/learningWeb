// firebase-config.js
// exports auth, realtime database and common helpers

import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';
import {
  getDatabase,
  ref,
  set,
  get,
  child,
  push,
  update
} from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js';

const firebaseConfig = {
  apiKey: "AIzaSyAGyk7X-koKRvLTk6bwPY79MzhUbgOICiA",
  authDomain: "learning-website-b66a9.firebaseapp.com",
  projectId: "learning-website-b66a9",
  storageBucket: "learning-website-b66a9.firebasestorage.app",
  messagingSenderId: "743462650006",
  appId: "1:743462650006:web:74d8a6ba7e4a215a0282b7",
  measurementId: "G-YMBY0GLM58",
  databaseURL: "https://learning-website-b66a9-default-rtdb.asia-southeast1.firebasedatabase.app"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const rtdb = getDatabase(app);

async function signInWithGooglePopup() {
  return signInWithPopup(auth, provider);
}

async function signOut() {
  return fbSignOut(auth);
}

export {
  auth,
  provider,
  signInWithGooglePopup,
  signOut,
  onAuthStateChanged,
  rtdb,
  ref,
  set,
  get,
  child,
  push,
  update
};
