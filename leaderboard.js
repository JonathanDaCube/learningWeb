import { auth, onAuthStateChanged, rtdb, ref, get } from './firebase-config.js';
import { syncLeaderboard } from './leaderboard-data.js';
import { rankLeaderboard } from './leaderboard-math.mjs';

const period = document.getElementById('leaderboard-period');
const status = document.getElementById('leaderboard-status');
const table = document.getElementById('leaderboard-table');
const body = table.querySelector('tbody');
let users = {};
let syncFailed = false;

function render() {
  const rows = rankLeaderboard(users, period.value);
  body.replaceChildren();
  rows.forEach((row, index) => {
    const tr = document.createElement('tr');
    [index + 1, row.name, row.total, `${row.average.toFixed(1)}%`, row.dailyStreak, row.weeklyStreak].forEach(value => {
      const td = document.createElement('td');
      td.textContent = value;
      tr.appendChild(td);
    });
    body.appendChild(tr);
  });
  table.hidden = rows.length === 0;
  status.textContent = (rows.length ? '' : '此時段尚無成績。') +
    (syncFailed ? ' 無法更新你的排行榜成績，請稍後重試。' : '');
}

period.addEventListener('change', render);
onAuthStateChanged(auth, async user => {
  if (!user) {
    window.location.href = 'signin/index.html';
    return;
  }
  try {
    await syncLeaderboard(user);
  } catch (err) {
    console.error('Failed to sync leaderboard', err);
    syncFailed = true;
  }
  try {
    const snapshot = await get(ref(rtdb, 'leaderboard'));
    users = snapshot.val() || {};
    period.disabled = false;
    render();
  } catch (err) {
    console.error('Failed to load leaderboard', err);
    status.textContent = '無法載入排行榜，請稍後再試。';
  }
});
