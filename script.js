/* script.js - main page logic (module)
   - switched from Firestore to Realtime Database for profiles and scores
*/

import {
  auth,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  rtdb,
  ref,
  set,
  get,
  child
} from './firebase-config.js';
import { syncLeaderboard } from './leaderboard-data.js';
import { getDailyQuiz } from './daily-quiz-data.js';

const QUIZ_KEY = 'chinese-daily-quiz-scores';
const LANG_KEY = 'chinese-quiz-lang';
const TODAY = new Date().toISOString().slice(0,10); // YYYY-MM-DD

let currentLang = localStorage.getItem(LANG_KEY) || 'traditional';
let currentUser = null; // firebase user

let quiz = null;

// DOM elements (queried after DOMContentLoaded)
document.addEventListener('DOMContentLoaded', () => {
  const passageTitle = document.getElementById('passage-title');
  const passageEl = document.getElementById('passage');
  const form = document.getElementById('questions-form');
  const submitBtn = document.getElementById('submit-btn');
  const resetTodayBtn = document.getElementById('reset-today-btn');
  const resultEl = document.getElementById('result');
  const historyTableBody = document.querySelector('#history-table tbody');
  const langSelect = document.getElementById('lang-select');
  const signoutBtn = document.getElementById('signout-btn');
  const userNameSpan = document.getElementById('user-name');
  const quizStatus = document.getElementById('quiz-status');

  // auth guard: redirect to signin if not signed in
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      // not signed in -> force to signin page
      window.location.href = 'signin/index.html';
      return;
    }

    // signed in
    currentUser = user;
    userNameSpan.textContent = user.displayName || user.email || '';
    signoutBtn.style.display = 'inline-block';
    // render UI after auth
    if (langSelect) {
      langSelect.value = currentLang;
      langSelect.addEventListener('change', (e) => {
        currentLang = e.target.value;
        localStorage.setItem(LANG_KEY, currentLang);
        if (quiz) loadQuiz(currentLang);
        renderHistory();
        if (quiz) showResultFor(TODAY);
      });
    }

    signoutBtn.addEventListener('click', async () => {
      try {
        await firebaseSignOut(auth);
        window.location.href = 'signin/index.html';
      } catch (err) {
        console.error('Sign out failed', err);
      }
    });

    try {
      quiz = (await getDailyQuiz(TODAY)).quiz;
      if (new Date().toISOString().slice(0, 10) !== TODAY) {
        quiz = null;
        throw new Error('UTC date changed while loading the quiz');
      }
      loadQuiz(currentLang);
      quizStatus.textContent = '';
      resetTodayBtn.disabled = false;
      await showResultFor(TODAY);
    } catch (err) {
      console.error('Failed to load daily quiz', err);
      quizStatus.textContent = '無法載入今日測驗，請檢查網絡連線或稍後重新載入。';
    }
    await renderHistory();
    try {
      await syncLeaderboard(user);
    } catch (err) {
      console.error('Failed to sync leaderboard', err);
      document.getElementById('leaderboard-sync-status').textContent = '無法更新排行榜，請稍後再試。';
    }
  });

  function getQuizForLang(lang) { return quiz[lang] || quiz.traditional; }

  function loadQuiz(lang = currentLang) {
    currentLang = lang;
    const q = getQuizForLang(lang);
    passageTitle.textContent = q.title;
    passageEl.textContent = q.passage;

    // remember previous selections to preserve when switching
    const prevAnswers = {};
    const inputs = form.querySelectorAll('input[type=radio]:checked');
    inputs.forEach(i => { prevAnswers[i.name] = i.value; });

    form.innerHTML = '';
    q.questions.forEach((item, idx) => {
      const qDiv = document.createElement('div');
      qDiv.className = 'question';
      const qLabel = document.createElement('div');
      qLabel.textContent = `${idx + 1}. ${item.q}`;
      qDiv.appendChild(qLabel);

      const choicesDiv = document.createElement('div');
      choicesDiv.className = 'choices';

      item.choices.forEach((choice, cidx) => {
        const id = `q${idx}_c${cidx}`;
        const label = document.createElement('label');
        const input = document.createElement('input');
        input.type = 'radio';
        input.name = `q${idx}`;
        input.id = id;
        input.value = cidx;
        if (prevAnswers[`q${idx}`] !== undefined && String(prevAnswers[`q${idx}`]) === String(cidx)) {
          input.checked = true;
        }
        label.appendChild(input);
        const span = document.createElement('span');
        span.textContent = choice;
        label.appendChild(span);
        choicesDiv.appendChild(label);
      });

      qDiv.appendChild(choicesDiv);
      form.appendChild(qDiv);
    });

    submitBtn.textContent = (lang === 'simplified') ? '提交并评分' : '提交並評分';
    resetTodayBtn.textContent = (lang === 'simplified') ? '重置今日尝试' : '重置今日嘗試';

    if (langSelect) langSelect.value = currentLang;
  }

  function getStoredScoresLocal() { try { const raw = localStorage.getItem(QUIZ_KEY); return raw ? JSON.parse(raw) : {}; } catch (e) { return {}; } }
  function saveScoreLocal(date, scoreObj) { const all = getStoredScoresLocal(); all[date] = scoreObj; localStorage.setItem(QUIZ_KEY, JSON.stringify(all)); }

  async function saveScoreCloud(date, scoreObj) {
    if (!currentUser) return;
    try {
      const scoreRef = ref(rtdb, `users/${currentUser.uid}/scores/${date}`);
      await set(scoreRef, scoreObj);
      return true;
    } catch (err) {
      console.error('Failed to save score to Realtime DB', err);
      return false;
    }
  }

  async function renderHistory() {
    // prefer cloud history, fallback to local
    historyTableBody.innerHTML = '';
    if (!currentUser) return;
    try {
      const scoresRef = ref(rtdb, `users/${currentUser.uid}/scores`);
      const snap = await get(scoresRef);
      if (snap.exists()) {
        const data = snap.val();
        // data is an object keyed by date — sort keys descending
        const dates = Object.keys(data).sort((a,b)=>b.localeCompare(a));
        dates.forEach(d=>{
          const entry = data[d];
          const tr = document.createElement('tr');
          const tdDate = document.createElement('td'); tdDate.textContent = d;
          const tdScore = document.createElement('td'); tdScore.textContent = `${entry.percentage}%`;
          const tdDetail = document.createElement('td'); tdDetail.textContent = `${entry.correct}/${entry.total}`;
          tr.appendChild(tdDate); tr.appendChild(tdScore); tr.appendChild(tdDetail);
          historyTableBody.appendChild(tr);
        });
        return;
      }
    } catch (err) {
      console.warn('Could not load cloud history, falling back to local', err);
    }

    // fallback: localStorage
    const all = getStoredScoresLocal();
    const dates = Object.keys(all).sort((a,b)=>b.localeCompare(a));
    dates.forEach(d=>{
      const tr = document.createElement('tr');
      const tdDate = document.createElement('td'); tdDate.textContent = d;
      const tdScore = document.createElement('td'); tdScore.textContent = `${all[d].percentage}%`;
      const tdDetail = document.createElement('td'); tdDetail.textContent = `${all[d].correct}/${all[d].total}`;
      tr.appendChild(tdDate); tr.appendChild(tdScore); tr.appendChild(tdDetail);
      historyTableBody.appendChild(tr);
    });
  }

  function disableForm() { const inputs = form.querySelectorAll('input'); inputs.forEach(i => i.disabled = true); submitBtn.disabled = true; }
  function enableForm() { const inputs = form.querySelectorAll('input'); inputs.forEach(i => i.disabled = false); submitBtn.disabled = false; }

  async function showResultFor(date) {
    if (!currentUser) return;
    try {
      const cloudRef = ref(rtdb, `users/${currentUser.uid}/scores/${date}`);
      const snap = await get(cloudRef);
      if (snap.exists()) {
        const r = snap.val();
        resultEl.innerHTML = `<strong>你已在 ${date} 完成測驗。</strong> 得分： ${r.percentage}% （${r.correct}/${r.total}）`;
        disableForm();
        return;
      }
    } catch (err) {
      // ignore and fallback to local
    }

    const localAll = getStoredScoresLocal();
    if (localAll[date]) {
      const r = localAll[date];
      resultEl.innerHTML = `<strong>你已在 ${date} 完成測驗。</strong> 得分： ${r.percentage}% （${r.correct}/${r.total}）`;
      disableForm();
      return;
    }

    resultEl.innerHTML = '';
    enableForm();
  }

  submitBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    if (!currentUser) {
      window.location.href = 'signin/index.html';
      return;
    }
    if (!quiz) return;
    if (new Date().toISOString().slice(0, 10) !== TODAY) {
      quizStatus.textContent = '日期已變更，請重新載入頁面以取得今日測驗。';
      disableForm();
      resetTodayBtn.disabled = true;
      return;
    }

    const qObj = getQuizForLang(currentLang);
    const answers = [];
    let unanswered = 0;
    qObj.questions.forEach((qItem, idx)=>{
      const val = form.querySelector(`input[name="q${idx}"]:checked`);
      if (val) answers.push(Number(val.value)); else { answers.push(null); unanswered++; }
    });

    if (unanswered > 0) {
      if (!confirm((currentLang === 'simplified') ? `你还有 ${unanswered} 道题未作答，确认提交并计分吗？` : `你還有 ${unanswered} 道題未作答，確認提交並計分嗎？`)) return;
    }

    let correct = 0;
    qObj.questions.forEach((qItem, idx)=>{ if (answers[idx] === qItem.a) correct++; });
    const total = qObj.questions.length;
    const percentage = Math.round((correct/total)*100);
    const scoreObj = {correct, total, percentage, answers, finishedAt:new Date().toISOString(), lang: currentLang};

    // save local and cloud
    saveScoreLocal(TODAY, scoreObj);
    const cloudOk = await saveScoreCloud(TODAY, scoreObj);
    if (cloudOk) {
      try {
        await syncLeaderboard(currentUser);
        document.getElementById('leaderboard-sync-status').textContent = '';
      } catch (err) {
        console.error('Failed to sync leaderboard', err);
        document.getElementById('leaderboard-sync-status').textContent = '成績已儲存，但無法更新排行榜，請稍後再試。';
      }
    } else {
      document.getElementById('leaderboard-sync-status').textContent = '成績只儲存在此瀏覽器，無法更新排行榜。';
    }

    resultEl.innerHTML = (currentLang === 'simplified') ? `<strong>完成！</strong> 你的得分： ${percentage}% （${correct}/${total}）` : `<strong>完成！</strong> 你的得分： ${percentage}% （${correct}/${total}）`;
    disableForm();
    await renderHistory();
  });

  resetTodayBtn.addEventListener('click', async ()=>{
    if (!quiz || new Date().toISOString().slice(0, 10) !== TODAY) {
      quizStatus.textContent = '日期已變更，請重新載入頁面以取得今日測驗。';
      disableForm();
      resetTodayBtn.disabled = true;
      return;
    }
    if (!confirm((currentLang === 'simplified') ? '确定要清除今日的记录，让今日可以重新答题吗？' : '確定要清除今日的記錄，讓今日可以重新答題嗎？')) return;
    // remove local
    const all = getStoredScoresLocal();
    delete all[TODAY];
    localStorage.setItem(QUIZ_KEY, JSON.stringify(all));
    // remove cloud (optional) - skipping deletion for safety
    resultEl.innerHTML = '';
    enableForm();
    await renderHistory();
  });

});
