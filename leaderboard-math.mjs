const DAY = 24 * 60 * 60 * 1000;

function dateNumber(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return NaN;
  const value = Date.parse(`${date}T00:00:00Z`);
  return Number.isFinite(value) && new Date(value).toISOString().slice(0, 10) === date ? value : NaN;
}

function weekStart(day) {
  return day - ((new Date(day).getUTCDay() + 6) % 7) * DAY;
}

function streak(periods, current, step) {
  let cursor = periods.has(current) ? current : current - step;
  let count = 0;
  while (periods.has(cursor)) {
    count++;
    cursor -= step;
  }
  return count;
}

export function validScores(scores) {
  return Object.entries(scores || {}).filter(([date, score]) =>
    Number.isFinite(dateNumber(date)) && score &&
    Number.isInteger(score.correct) && Number.isInteger(score.total) &&
    score.total > 0 && score.correct >= 0 && score.correct <= score.total
  );
}

export function rankLeaderboard(users, period, today = new Date().toISOString().slice(0, 10)) {
  const day = dateNumber(today);
  if (!Number.isFinite(day) || !['daily', 'weekly'].includes(period)) {
    throw new Error('Invalid leaderboard period or date');
  }
  const start = period === 'daily' ? day : weekStart(day);
  return Object.entries(users || {}).flatMap(([uid, user]) => {
    const scores = validScores(user && user.scores).filter(([date]) => dateNumber(date) <= day);
    const inPeriod = scores.filter(([date]) => dateNumber(date) >= start);
    if (!inPeriod.length) return [];
    const days = new Set(scores.map(([date]) => dateNumber(date)));
    const weeks = new Set([...days].map(weekStart));
    const total = inPeriod.reduce((sum, [, score]) => sum + score.correct, 0);
    const average = inPeriod.reduce((sum, [, score]) => sum + score.correct / score.total * 100, 0) / inPeriod.length;
    return [{
      uid,
      name: typeof user.displayName === 'string' && user.displayName.trim() ? user.displayName : '學習者',
      total,
      average,
      dailyStreak: streak(days, day, DAY),
      weeklyStreak: streak(weeks, weekStart(day), 7 * DAY)
    }];
  }).sort((a, b) => b.total - a.total || b.average - a.average || a.name.localeCompare(b.name) || a.uid.localeCompare(b.uid));
}
