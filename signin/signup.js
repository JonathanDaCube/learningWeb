// signin/signup.js — collects extra profile info for new users and saves to Realtime Database
import { auth, rtdb, ref, set, onAuthStateChanged } from '../firebase-config.js';

const form = document.getElementById('signup-form');
const cancelBtn = document.getElementById('cancel-btn');

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    // if not signed-in, go back to signin
    window.location.href = 'index.html';
    return;
  }

  // proceed, user must be the just-signed-in Google user
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const grade = document.getElementById('grade').value;
    const classLetter = document.getElementById('class-letter').value;
    const classNumber = document.getElementById('class-number').value;
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value; // note: storing plaintext password is insecure

    if (!username || !password) {
      alert('請填寫使用者名稱與密碼');
      return;
    }

    const profile = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || '',
      grade,
      classLetter,
      classNumber: Number(classNumber),
      username,
      // DO NOT store plaintext passwords in production; this is for the requested demo only.
      password,
      createdAt: new Date().toISOString()
    };

    try {
      const profileRef = ref(rtdb, `profiles/${user.uid}`);
      await set(profileRef, profile);
      // redirect to main
      window.location.href = '../index.html';
    } catch (err) {
      console.error('Failed to save profile', err);
      alert('儲存失敗，請查看 Console。');
    }
  });

  cancelBtn.addEventListener('click', async () => {
    try {
      await auth.signOut();
    } catch (e) { /* ignore */ }
    window.location.href = 'index.html';
  });
});
