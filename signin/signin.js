// signin/signin.js — handles Google sign-in and redirects to signup if new user
import { signInWithPopup, auth, db, provider, getDoc, doc } from '../firebase-config.js';

const btn = document.getElementById('google-signin');
if (btn) {
  btn.addEventListener('click', async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      // check if profile exists
      try {
        const profileRef = doc(db, 'users', user.uid, 'profile', 'meta');
        const snap = await getDoc(profileRef);
        if (snap && snap.exists && snap.exists()) {
          // profile exists -> go to main
          window.location.href = '../index.html';
        } else {
          // new user -> go to signup
          window.location.href = './signup.html';
        }
      } catch (err) {
        console.error('Error checking profile', err);
        // fallback: go to signup
        window.location.href = './signup.html';
      }
    } catch (err) {
      console.error('Sign-in failed', err);
      alert('登入失敗，請在主控台查看錯誤 (Console)。');
    }
  });
}
