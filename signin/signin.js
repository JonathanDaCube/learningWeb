// signin/signin.js — handles Google sign-in and redirects appropriately
import { signInWithGooglePopup, rtdb, ref, get } from '../firebase-config.js';

const btn = document.getElementById('google-signin');
if (btn) {
  btn.addEventListener('click', async () => {
    try {
      const result = await signInWithGooglePopup();
      const user = result.user;
      // check if profile exists in Realtime Database under /profiles/{uid}
      const profileRef = ref(rtdb, `profiles/${user.uid}`);
      const profileSnap = await get(profileRef);
      if (profileSnap.exists()) {
        // profile exists -> go to main
        window.location.href = '../index.html';
      } else {
        // no profile -> go to signup page
        window.location.href = 'signup.html';
      }
    } catch (err) {
      console.error('Sign-in failed', err);
      alert('登入失敗，請在主控台查看錯誤 (Console)。');
    }
  });
}
