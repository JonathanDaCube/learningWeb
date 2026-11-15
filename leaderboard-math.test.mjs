import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { rankLeaderboard, validScores } from './leaderboard-math.mjs';

const score = (correct, total = 10) => ({ correct, total });
const users = {
  a: { displayName: 'Ada', scores: {
    '2026-11-15': score(8), '2026-11-14': score(6),
    '2026-11-09': score(4), '2026-11-08': score(10)
  } },
  b: { displayName: 'Bo', scores: {
    '2026-11-15': score(9), '2026-11-10': score(7)
  } },
  c: { displayName: 'Yesterday', scores: { '2026-11-14': score(10) } }
};

test('daily and weekly rankings use the selected UTC period and score averages', () => {
  const daily = rankLeaderboard(users, 'daily', '2026-11-15');
  assert.deepEqual(daily.map(row => [row.name, row.total, row.average]), [['Bo', 9, 90], ['Ada', 8, 80]]);
  const weekly = rankLeaderboard(users, 'weekly', '2026-11-15');
  assert.deepEqual(weekly.map(row => [row.name, row.total, row.average]), [
    ['Ada', 18, 60], ['Bo', 16, 80], ['Yesterday', 10, 100]
  ]);
  assert.deepEqual([weekly[0].dailyStreak, weekly[0].weeklyStreak], [2, 2]);
  assert.deepEqual([weekly[2].dailyStreak, weekly[2].weeklyStreak], [1, 1]);
});

test('streaks expire after a missed period and ignore future dates', () => {
  const result = rankLeaderboard({
    a: { scores: { '2026-11-09': score(5), '2026-11-16': score(10), '2026-10-25': score(5) } }
  }, 'weekly', '2026-11-15');
  assert.equal(result[0].dailyStreak, 0);
  assert.equal(result[0].weeklyStreak, 1);
  assert.equal(result[0].total, 5);
  assert.deepEqual(rankLeaderboard({}, 'daily', '2026-11-15'), []);
});

test('ignores malformed dates and invalid score values', () => {
  const scores = {
    '2026-02-30': score(1), '2026-11-15': score(0),
    '2026-11-14': score(11), '2026-11-13': score(1, 0)
  };
  assert.deepEqual(validScores(scores).map(([date]) => date), ['2026-11-15']);
  assert.throws(() => rankLeaderboard({}, 'monthly', '2026-11-15'));
});

test('weeks cross year boundaries and tied totals use average score', () => {
  const rows = rankLeaderboard({
    a: { displayName: 'Ada', scores: { '2026-12-31': score(5, 10), '2027-01-03': score(5, 10), '2026-12-27': score(1) } },
    b: { displayName: 'Bo', scores: { '2027-01-01': score(10, 10) } }
  }, 'weekly', '2027-01-03');
  assert.deepEqual(rows.map(row => row.name), ['Bo', 'Ada']);
  assert.equal(rows[1].weeklyStreak, 2);
  assert.equal(rows[1].dailyStreak, 1);
});

test('a missed week breaks the weekly streak', () => {
  const rows = rankLeaderboard({
    a: { scores: { '2026-11-15': score(5), '2026-11-08': score(6) } }
  }, 'daily', '2026-11-16');
  assert.deepEqual(rows, []);
  const weekly = rankLeaderboard({
    a: { scores: { '2026-11-16': score(5), '2026-11-08': score(6) } }
  }, 'weekly', '2026-11-16');
  assert.equal(weekly[0].weeklyStreak, 1);
});
