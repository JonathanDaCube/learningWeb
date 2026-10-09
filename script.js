/* script.js - 客戶端靜態實現：每天一次測驗，保存結果到 localStorage
   修正：簡體版本之前仍有大量繁體字，導致切換後看起來沒有明顯變化，現在改成真正的簡體中文內容 */

const QUIZ_KEY = 'chinese-daily-quiz-scores';
const TODAY = new Date().toISOString().slice(0,10); // YYYY-MM-DD
let currentLang = 'traditional'; // 'traditional' or 'simplified'

// 雙語內容：傳統與簡體各一份
const quiz = {
  traditional: {
    title: '短文：學習中文的好處',
    passage: `學習中文可以幫助我們更好地理解中華文化、歷史和思想。中文是世界上使用人數最多的語言之一，學習中文不僅能增強跨文化交流能力，還能為工作和學習帶來更多機會。透過閱讀和練習，我們能夠提高詞彙量、理解能力和表達能力。每天堅持一點點，會有很大進步。`,
    questions: [
      { q: '短文一開始說學習中文能幫助我們更好地理解什麼？', choices: ['數學和科學', '中華文化、歷史和思想', '音樂與藝術', '世界經濟'], a: 1 },
      { q: '根據短文，中文是世界上使用人數怎樣的語言？', choices: ['最少的', '較少的', '使用人數很多的', '只有在中國使用的'], a: 2 },
      { q: '學習中文帶來的好處不包括下面哪一項？', choices: ['增強跨文化交流能力', '為工作和學習帶來機會', '立即精通所有外語', '提高理解能力'], a: 2 },
      { q: '短文中提到透過什麼方法能提高詞彙量和表達能力？', choices: ['閱讀和練習', '不學習仍然提高', '只看電影', '只聽音樂'], a: 0 },
      { q: '短文建議學習應該怎樣進行？', choices: ['每天堅持一點點', '一次學完所有內容', '只在週末學習', '每天只學寫字'], a: 0 },
      { q: '短文強調學習中文能帶來什麼樣的交流能力？', choices: ['跨文化交流能力', '只和朋友交流', '運動能力', '烹飪能力'], a: 0 },
      { q: '下面哪項是短文沒有直接提到的？', choices: ['提高詞彙量', '提高數學成績', '提高表達能力', '理解中華文化'], a: 1 },
      { q: '文中說學習中文能為我們帶來更多什麼？', choices: ['機會', '疾病', '時間浪費', '負擔'], a: 0 },
      { q: '短文的語氣是怎樣的？', choices: ['勸導和積極', '悲傷', '冷漠', '憤怒'], a: 0 },
      { q: '短文最後一句的意思是？', choices: ['長期堅持會有很大進步', '放棄就更快', '學習很沒用', '只學一次就足夠了'], a: 0 }
    ]
  },
  simplified: {
    title: '短文：学习中文的好处',
    passage: `学习中文可以帮助我们更好地理解中华文化、历史和思想。中文是世界上使用人数最多的语言之一，学习中文不仅能增强跨文化交流能力，还能为工作和学习带来更多机会。通过阅读和练习，我们能够提高词汇量、理解能力和表达能力。每天坚持一点点，会有很大进步。`,
    questions: [
      { q: '短文一开始说学习中文能帮助我们更好地理解什么？', choices: ['数学和科学', '中华文化、历史和思想', '音乐与艺术', '世界经济'], a: 1 },
      { q: '根据短文，中文是世界上使用人数怎样的语言？', choices: ['最少的', '较少的', '使用人数很多的', '只有在中国使用的'], a: 2 },
      { q: '学习中文带来的好处不包括下面哪一项？', choices: ['增强跨文化交流能力', '为工作和学习带来机会', '立即精通所有外语', '提高理解能力'], a: 2 },
      { q: '短文中提到通过什么方法能提高词汇量和表达能力？', choices: ['阅读和练习', '不学习仍然提高', '只看电影', '只听音乐'], a: 0 },
      { q: '短文建议学习应该怎样进行？', choices: ['每天坚持一点点', '一次学完所有内容', '只在周末学习', '每天只学写字'], a: 0 },
      { q: '短文强调学习中文能带来什么样的交流能力？', choices: ['跨文化交流能力', '只和朋友交流', '运动能力', '烹饪能力'], a: 0 },
      { q: '下面哪项是短文没有直接提到的？', choices: ['提高词汇量', '提高数学成绩', '提高表达能力', '理解中华文化'], a: 1 },
      { q: '文中说学习中文能为我们带来更多什么？', choices: ['机会', '疾病', '时间浪费', '负担'], a: 0 },
      { q: '短文的语气是怎样的？', choices: ['劝导和积极', '悲伤', '冷漠', '愤怒'], a: 0 },
      { q: '短文最后一句的意思是？', choices: ['长期坚持会有很大进步', '放弃就更快', '学习很没用', '只学一次就足够了'], a: 0 }
    ]
  }
};

// DOM elements
const passageTitle = document.getElementById('passage-title');
const passageEl = document.getElementById('passage');
const form = document.getElementById('questions-form');
const submitBtn = document.getElementById('submit-btn');
const resetTodayBtn = document.getElementById('reset-today-btn');
const resultEl = document.getElementById('result');
const historyTableBody = document.querySelector('#history-table tbody');
const langSelect = document.getElementById('lang-select');

function getQuizForLang(lang) {
  return quiz[lang] || quiz.traditional;
}

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

function getStoredScores() {
  try {
    const raw = localStorage.getItem(QUIZ_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function saveScore(date, scoreObj) {
  const all = getStoredScores();
  all[date] = scoreObj;
  localStorage.setItem(QUIZ_KEY, JSON.stringify(all));
}

function renderHistory() {
  const all = getStoredScores();
  const dates = Object.keys(all).sort((a, b) => b.localeCompare(a));
  historyTableBody.innerHTML = '';
  dates.forEach(d => {
    const tr = document.createElement('tr');
    const tdDate = document.createElement('td'); tdDate.textContent = d;
    const tdScore = document.createElement('td'); tdScore.textContent = `${all[d].percentage}%`;
    const tdDetail = document.createElement('td'); tdDetail.textContent = `${all[d].correct}/${all[d].total}`;
    tr.appendChild(tdDate); tr.appendChild(tdScore); tr.appendChild(tdDetail);
    historyTableBody.appendChild(tr);
  });
}

function disableForm() {
  const inputs = form.querySelectorAll('input');
  inputs.forEach(i => i.disabled = true);
  submitBtn.disabled = true;
}

function enableForm() {
  const inputs = form.querySelectorAll('input');
  inputs.forEach(i => i.disabled = false);
  submitBtn.disabled = false;
}

function showResultFor(date) {
  const all = getStoredScores();
  if (all[date]) {
    const r = all[date];
    const message = (currentLang === 'simplified')
      ? `<strong>你已在 ${date} 完成测验。</strong> 得分： ${r.percentage}% （${r.correct}/${r.total}）`
      : `<strong>你已在 ${date} 完成測驗。</strong> 得分： ${r.percentage}% （${r.correct}/${r.total}）`;
    resultEl.innerHTML = message;
    disableForm();
    return;
  }

  resultEl.innerHTML = '';
  enableForm();
}

submitBtn.addEventListener('click', (e) => {
  e.preventDefault();

  const all = getStoredScores();
  if (all[TODAY]) {
    showResultFor(TODAY);
    return;
  }

  const q = getQuizForLang(currentLang);
  const answers = [];
  let unanswered = 0;
  q.questions.forEach((qItem, idx) => {
    const val = form.querySelector(`input[name="q${idx}"]:checked`);
    if (val) {
      answers.push(Number(val.value));
    } else {
      answers.push(null);
      unanswered++;
    }
  });

  if (unanswered > 0) {
    if (!confirm((currentLang === 'simplified') ? `你还有 ${unanswered} 道题未作答，确认提交并计分吗？` : `你還有 ${unanswered} 道題未作答，確認提交並計分嗎？`)) return;
  }

  let correct = 0;
  q.questions.forEach((qItem, idx) => {
    if (answers[idx] === qItem.a) correct++;
  });
  const total = q.questions.length;
  const percentage = Math.round((correct / total) * 100);
  const scoreObj = { correct, total, percentage, answers, finishedAt: new Date().toISOString(), lang: currentLang };
  saveScore(TODAY, scoreObj);

  resultEl.innerHTML = (currentLang === 'simplified')
    ? `<strong>完成！</strong> 你的得分： ${percentage}% （${correct}/${total}）`
    : `<strong>完成！</strong> 你的得分： ${percentage}% （${correct}/${total}）`;
  disableForm();
  renderHistory();
});

resetTodayBtn.addEventListener('click', () => {
  if (!confirm((currentLang === 'simplified') ? '确定要清除今日的记录，让今日可以重新答题吗？' : '確定要清除今日的記錄，讓今日可以重新答題嗎？')) return;

  const all = getStoredScores();
  delete all[TODAY];
  localStorage.setItem(QUIZ_KEY, JSON.stringify(all));
  resultEl.innerHTML = '';
  enableForm();
  renderHistory();
});

if (langSelect) {
  langSelect.addEventListener('change', (e) => {
    currentLang = e.target.value === 'traditional' ? 'traditional' : 'simplified';
    loadQuiz(currentLang);
    renderHistory();
    showResultFor(TODAY);
  });
}

// Initialize page
loadQuiz(currentLang);
renderHistory();
showResultFor(TODAY);
