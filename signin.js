// signin.js — handles Google sign-in and redirects back to index.html
import { signInWithGooglePopup } from './firebase-config.js';

const btn = document.getElementById('google-signin');
if (btn) {
  btn.addEventListener('click', async () => {
    try {
      await signInWithGooglePopup();
      // successful sign in, go to main page
      window.location.href = 'index.html';
    } catch (err) {
      console.error('Sign-in failed', err);
      alert('登入失敗，請在主控台查看錯誤 (Console)。');
    }
  });
}
