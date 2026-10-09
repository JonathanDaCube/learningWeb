// signin/signup.js — collects extra profile details and saves to Firestore
import { auth, onAuthStateChanged, db, doc, setDoc } from '../firebase-config.js';

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

async function hashPassword(password) {
  const enc = new TextEncoder();
  const data = enc.encode(password);
  const hashBuf = await crypto.subtle.digest('SHA-256', data);
  return toHex(hashBuf);
}

document.addEventListener('DOMContentLoaded', ()=>{
  const form = document.getElementById('signup-form');
  onAuthStateChanged(auth, async (user)=>{
    if (!user) {
      // require login
      window.location.href = './index.html';
      return;
    }
    // check if profile already exists; if so, redirect to main
    // (optional check omitted here for brevity)
  });

  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const grade = document.getElementById('grade').value;
    const classLetter = document.getElementById('class-letter').value;
    const classNumber = document.getElementById('class-number').value;
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    if (!grade || !classLetter || !classNumber || !username || !password) {
      alert('請完整填寫所有欄位');
      return;
    }

    const pwHash = await hashPassword(password);

    const user = auth.currentUser;
    if (!user) {
      alert('未登入或登入已過期，請重新登入');
      window.location.href = './index.html';
      return;
    }

    const profile = {
      grade,
      classLetter,
      classNumber: Number(classNumber),
      username,
      passwordHash: pwHash,
      createdAt: new Date().toISOString()
    };

    try {
      const profileRef = doc(db, 'users', user.uid, 'profile', 'meta');
      await setDoc(profileRef, profile);
      // redirect to main
      window.location.href = '../index.html';
    } catch (err) {
      console.error('Failed to save profile', err);
      alert('儲存失敗，請查看主控台錯誤資訊');
    }
  });
});
